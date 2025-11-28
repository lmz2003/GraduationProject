import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VerificationCodeService } from '../../../../src/auth/services/verification-code.service';

// 模拟ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'VERIFICATION_CODE_EXPIRATION') {
      return '60'; // 60秒用于测试
    }
    return null;
  }),
};

describe('VerificationCodeService', () => {
  let service: VerificationCodeService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationCodeService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VerificationCodeService>(VerificationCodeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('storeVerificationCode', () => {
    it('should store a verification code with expiration time', () => {
      const phoneNumber = '13800138000';
      const code = '123456';
      
      service.storeVerificationCode(phoneNumber, code);
      
      // 验证验证码是否能被正确检查
      expect(service.checkVerificationCode(phoneNumber, code)).toBe(true);
    });
  });

  describe('checkVerificationCode', () => {
    it('should return false for non-existent phone number', () => {
      expect(service.checkVerificationCode('13800138000', '123456')).toBe(false);
    });

    it('should return false for incorrect code', () => {
      const phoneNumber = '13800138000';
      const code = '123456';
      
      service.storeVerificationCode(phoneNumber, code);
      
      expect(service.checkVerificationCode(phoneNumber, '654321')).toBe(false);
    });

    it('should return true for correct code', () => {
      const phoneNumber = '13800138000';
      const code = '123456';
      
      service.storeVerificationCode(phoneNumber, code);
      
      expect(service.checkVerificationCode(phoneNumber, code)).toBe(true);
    });
  });

  describe('removeVerificationCode', () => {
    it('should remove a verification code', () => {
      const phoneNumber = '13800138000';
      const code = '123456';
      
      service.storeVerificationCode(phoneNumber, code);
      expect(service.checkVerificationCode(phoneNumber, code)).toBe(true);
      
      service.removeVerificationCode(phoneNumber);
      expect(service.checkVerificationCode(phoneNumber, code)).toBe(false);
    });
  });
});