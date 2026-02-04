import { Injectable } from '@nestjs/common';
import { JwtAuthService } from './services/jwt-auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtAuthService: JwtAuthService,
    private readonly configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  /**
   * GitHub OAuth 登录
   */
  async loginWithGithub(code: string, redirectUri?: string): Promise<{ token: string; user: Partial<User> }> {
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
    }, '7d');

    return {
      token,
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