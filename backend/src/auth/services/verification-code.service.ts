import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface VerificationCode {
  code: string;
  expiresAt: number;
}

@Injectable()
export class VerificationCodeService implements OnModuleInit, OnModuleDestroy {
  private verificationCodes: Map<string, VerificationCode>;
  private expirationTime: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    this.verificationCodes = new Map<string, VerificationCode>();
    this.expirationTime = parseInt(
      this.configService.get<string>('VERIFICATION_CODE_EXPIRATION') || '300',
    ); // 默认5分钟
  }

  /**
   * 当模块初始化时启动清理过期验证码的定时任务
   */
  onModuleInit() {
    // 每分钟清理一次过期的验证码
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCodes();
    }, 60000);
  }

  /**
   * 当模块销毁时清理定时任务
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * 清理过期的验证码
   */
  private cleanupExpiredCodes(): void {
    const now = Date.now();
    this.verificationCodes.forEach((code, phoneNumber) => {
      if (code.expiresAt < now) {
        this.verificationCodes.delete(phoneNumber);
      }
    });
  }

  /**
   * 存储验证码
   * @param phoneNumber 手机号码
   * @param code 验证码
   */
  storeVerificationCode(phoneNumber: string, code: string): void {
    const expiresAt = Date.now() + this.expirationTime * 1000;
    this.verificationCodes.set(phoneNumber, { code, expiresAt });
  }

  /**
   * 验证验证码
   * @param phoneNumber 手机号码
   * @param code 验证码
   * @returns 验证码是否有效
   */
  checkVerificationCode(phoneNumber: string, code: string): boolean {
    if (!this.verificationCodes.has(phoneNumber)) {
      return false;
    }

    const verificationCode = this.verificationCodes.get(phoneNumber) as VerificationCode;
    const now = Date.now();

    // 检查验证码是否过期
    if (verificationCode.expiresAt < now) {
      this.verificationCodes.delete(phoneNumber);
      return false;
    }

    // 检查验证码是否匹配
    return verificationCode.code === code;
  }

  /**
   * 删除验证码
   * @param phoneNumber 手机号码
   */
  removeVerificationCode(phoneNumber: string): void {
    this.verificationCodes.delete(phoneNumber);
  }
}