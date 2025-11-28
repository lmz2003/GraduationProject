import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { VerificationCodeService } from '../../../src/auth/services/verification-code.service';
import { JwtAuthService } from '../../../src/auth/services/jwt-auth.service';

// 模拟VerificationCodeService
const mockVerificationCodeService = {
  storeVerificationCode: jest.fn(),
  checkVerificationCode: jest.fn(),
  removeVerificationCode: jest.fn(),
};

// 模拟JwtAuthService
const mockJwtAuthService = {
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;
  let verificationCodeService: VerificationCodeService;
  let jwtAuthService: JwtAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: VerificationCodeService,
          useValue: mockVerificationCodeService,
        },
        {
          provide: JwtAuthService,
          useValue: mockJwtAuthService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    verificationCodeService = module.get<VerificationCodeService>(VerificationCodeService);
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationCode', () => {
    it('should throw an error for invalid phone number format', async () => {
      const invalidPhoneNumber = '1234567890'; // 无效的手机号码
      
      await expect(service.sendVerificationCode(invalidPhoneNumber))
        .rejects.toThrow('Invalid phone number format');
    });

    it('should generate and store verification code for valid phone number', async () => {
      const validPhoneNumber = '13800138000'; // 有效的手机号码
      
      // 捕获console.log输出以验证验证码生成
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.sendVerificationCode(validPhoneNumber);
      
      // 验证storeVerificationCode被调用
      expect(verificationCodeService.storeVerificationCode).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(validPhoneNumber));
      
      consoleSpy.mockRestore();
    });
  });

  describe('verifyLogin', () => {
    it('should throw an error for invalid phone number format', async () => {
      const invalidPhoneNumber = '1234567890';
      
      await expect(service.verifyLogin(invalidPhoneNumber, '123456'))
        .rejects.toThrow('Invalid phone number format');
    });

    it('should throw an error for invalid verification code', async () => {
      const validPhoneNumber = '13800138000';
      const code = '123456';
      
      // 设置checkVerificationCode返回false
      mockVerificationCodeService.checkVerificationCode.mockReturnValue(false);
      
      await expect(service.verifyLogin(validPhoneNumber, code))
        .rejects.toThrow('Invalid or expired verification code');
    });

    it('should return JWT token for valid credentials', async () => {
      const validPhoneNumber = '13800138000';
      const code = '123456';
      
      // 设置checkVerificationCode返回true
      mockVerificationCodeService.checkVerificationCode.mockReturnValue(true);
      
      const result = await service.verifyLogin(validPhoneNumber, code);
      
      // 验证所有方法都被正确调用
      expect(verificationCodeService.checkVerificationCode).toHaveBeenCalledWith(validPhoneNumber, code);
      expect(verificationCodeService.removeVerificationCode).toHaveBeenCalledWith(validPhoneNumber);
      expect(jwtAuthService.generateToken).toHaveBeenCalledWith({ phoneNumber: validPhoneNumber });
      
      // 验证返回结果
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
    });
  });
});