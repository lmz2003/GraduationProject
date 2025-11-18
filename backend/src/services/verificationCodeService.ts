import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface VerificationCode {
  code: string;
  expiresAt: number;
}

class VerificationCodeService {
  private static instance: VerificationCodeService;
  private verificationCodes: Map<string, VerificationCode>;
  private expirationTime: number;

  private constructor() {
    this.verificationCodes = new Map<string, VerificationCode>();
    this.expirationTime = parseInt(process.env.VERIFICATION_CODE_EXPIRATION || '300'); // 5 minutes default

    // Clean up expired codes every minute
    setInterval(() => {
      const now = Date.now();
      this.verificationCodes.forEach((code, phoneNumber) => {
        if (code.expiresAt < now) {
          this.verificationCodes.delete(phoneNumber);
        }
      });
    }, 60000);
  }

  public static getInstance(): VerificationCodeService {
    if (!VerificationCodeService.instance) {
      VerificationCodeService.instance = new VerificationCodeService();
    }
    return VerificationCodeService.instance;
  }

  /**
   * Store a verification code for a phone number
   * @param phoneNumber - The phone number to store the code for
   * @param code - The verification code to store
   */
  public storeVerificationCode(phoneNumber: string, code: string): void {
    const expiresAt = Date.now() + this.expirationTime * 1000;
    this.verificationCodes.set(phoneNumber, { code, expiresAt });
  }

  /**
   * Check if a verification code is valid for a phone number
   * @param phoneNumber - The phone number to check
   * @param code - The verification code to check
   * @returns True if the code is valid, false otherwise
   */
  public checkVerificationCode(phoneNumber: string, code: string): boolean {
    if (!this.verificationCodes.has(phoneNumber)) {
      return false;
    }

    const verificationCode = this.verificationCodes.get(phoneNumber) as VerificationCode;
    const now = Date.now();

    // Check if code is expired
    if (verificationCode.expiresAt < now) {
      this.verificationCodes.delete(phoneNumber);
      return false;
    }

    // Check if code matches
    return verificationCode.code === code;
  }

  /**
   * Remove a verification code for a phone number
   * @param phoneNumber - The phone number to remove the code for
   */
  public removeVerificationCode(phoneNumber: string): void {
    this.verificationCodes.delete(phoneNumber);
  }
}

export default VerificationCodeService.getInstance();