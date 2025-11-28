import { Injectable } from '@nestjs/common';
import { VerificationCodeService } from './services/verification-code.service';
import { JwtAuthService } from './services/jwt-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly verificationCodeService: VerificationCodeService,
    private readonly jwtAuthService: JwtAuthService,
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
  async verifyLogin(phoneNumber: string, code: string): Promise<{ token: string }> {
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

    // 生成JWT token
    const token = this.jwtAuthService.generateToken({ phoneNumber });

    return { token };
  }
}