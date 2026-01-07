import { Injectable } from '@nestjs/common';
import { VerificationCodeService } from './services/verification-code.service';
import { JwtAuthService } from './services/jwt-auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly verificationCodeService: VerificationCodeService,
    private readonly jwtAuthService: JwtAuthService,
    private readonly configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  /**
   * 发送验证码
   * @param phoneNumber 手机号码
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // 生成6位验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码
    this.verificationCodeService.storeVerificationCode(phoneNumber, verificationCode);

    // TODO: 实际项目中这里应该集成短信发送服务
    console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);
  }

  /**
   * 验证登录凭证
   * @param phoneNumber 手机号码
   * @param code 验证码
   * @returns 包含JWT token的对象
   */
  async verifyLogin(phoneNumber: string, code: string): Promise<{ token: string; isFirstLogin: boolean }> {
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // 验证验证码
    const isCodeValid = this.verificationCodeService.checkVerificationCode(phoneNumber, code);
    if (!isCodeValid) {
      throw new Error('Invalid or expired verification code');
    }

    // 删除已使用的验证码
    this.verificationCodeService.removeVerificationCode(phoneNumber);

    // 检查用户是否存在
    let user = await this.userRepository.findOneBy({ phoneNumber });
    let isFirstLogin = false;

    // 如果用户不存在，创建新用户
    if (!user) {
      user = this.userRepository.create({ phoneNumber });
      await this.userRepository.save(user);
      isFirstLogin = true;
    }

    // 生成JWT token
    const token = this.jwtAuthService.generateToken({ phoneNumber, userId: user.id });

    return { token, isFirstLogin };
  }

  /**
   * GitHub OAuth 登录
   */
  async loginWithGithub(code: string, redirectUri?: string): Promise<{ token: string; isFirstLogin: boolean; user: Partial<User> }> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
    const configuredRedirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI');
    const finalRedirectUri = redirectUri || configuredRedirectUri;

    if (!clientId || !clientSecret || !finalRedirectUri) {
      throw new Error('GitHub OAuth is not configured');
    }

    // 1) 使用授权码换取 GitHub Access Token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: finalRedirectUri,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const accessToken = tokenResponse.data?.access_token as string | undefined;
    if (!accessToken) {
      throw new Error('Failed to exchange GitHub code for access token');
    }

    // 2) 拉取 GitHub 用户信息
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const { id, login, avatar_url, name, html_url } = userResponse.data;
    let primaryEmail: string | undefined;

    try {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      });

      const emails = emailResponse.data as Array<{ email: string; primary: boolean; verified: boolean }>;
      primaryEmail = emails?.find((item) => item.primary)?.email || emails?.[0]?.email;
    } catch (error) {
      // 邮箱权限非必需，获取失败则跳过
      console.warn('Unable to fetch GitHub email:', error);
    }

    // 3) 查找或创建用户
    let user = await this.userRepository.findOne({ where: { githubId: id.toString() } });
    let isFirstLogin = false;

    if (!user) {
      user = this.userRepository.create({
        githubId: id.toString(),
        githubUsername: login,
        name: name || login,
        avatar: avatar_url,
        email: primaryEmail,
        githubProfileUrl: html_url,
      });
      user = await this.userRepository.save(user);
      isFirstLogin = true;
    } else {
      user.githubUsername = login;
      user.name = name || user.name || login;
      user.avatar = avatar_url;
      user.email = primaryEmail || user.email;
      user.githubProfileUrl = html_url;
      await this.userRepository.save(user);
    }

    // 4) 生成 JWT
    const token = this.jwtAuthService.generateToken({
      userId: user.id,
      githubId: user.githubId,
      username: user.githubUsername,
    });

    return {
      token,
      isFirstLogin,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        githubUsername: user.githubUsername,
        githubProfileUrl: user.githubProfileUrl,
      },
    };
  }
}