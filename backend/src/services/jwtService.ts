import jwt, { Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class JwtService {
  private static instance: JwtService;
  private secretKey: Secret;

  private constructor() {
    this.secretKey = process.env.JWT_SECRET || 'mysecretjwtkey12345678901234567890';
  }

  public static getInstance(): JwtService {
    if (!JwtService.instance) {
      JwtService.instance = new JwtService();
    }
    return JwtService.instance;
  }

  /**
   * Generate a JWT token with the given payload
   * @param payload - The payload to include in the token
   * @param expiresIn - The expiration time for the token (default: '1h')
   * @returns The generated JWT token
   */
  public generateToken(payload: object | string | Buffer, expiresIn: any = '1h'): string {
    return jwt.sign(payload, this.secretKey, { expiresIn } as any);
  }

  /**
   * Verify a JWT token and return the decoded payload
   * @param token - The JWT token to verify
   * @returns The decoded payload if the token is valid, otherwise null
   */
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }
}

export default JwtService.getInstance();