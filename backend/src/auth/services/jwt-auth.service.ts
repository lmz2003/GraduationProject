import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  userId?: string;
  phoneNumber?: string;
  githubId?: string;
  username?: string;
  [key: string]: any;
}

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 生成JWT token
   * @param payload JWT载荷
   * @param expiresIn 过期时间
   * @returns 生成的JWT token
   */
  generateToken(payload: JwtPayload | object, expiresIn: string = '1h'): string {
    return this.jwtService.sign(payload, { expiresIn });
  }

  /**
   * 验证JWT token
   * @param token JWT token
   * @returns 解码后的载荷，如果token无效则抛出异常
   */
  verifyToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * 解析JWT token但不验证签名
   * @param token JWT token
   * @returns 解码后的载荷
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      console.error('JWT decoding failed:', error);
      return null;
    }
  }
}