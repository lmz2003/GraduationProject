import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthService } from '../../../../src/auth/services/jwt-auth.service';

// 模拟JWT密钥
const mockJwtSecret = 'test-secret-key-123456';

// 模拟ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') {
      return mockJwtSecret;
    }
    return null;
  }),
};

describe('JwtAuthService', () => {
  let service: JwtAuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: mockJwtSecret,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        JwtAuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JwtAuthService>(JwtAuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate a JWT token with the given payload', () => {
      const payload = { phoneNumber: '13800138000' };
      
      const token = service.generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // 验证token可以被解码
      const decoded = jwtService.decode(token);
      expect(decoded).toBeDefined();
      expect((decoded as any).phoneNumber).toBe('13800138000');
    });

    it('should generate a token with custom expiration time', () => {
      const payload = { phoneNumber: '13800138000' };
      const expiresIn = '5m';
      
      const token = service.generateToken(payload, expiresIn);
      
      expect(token).toBeDefined();
      // 由于我们无法直接检查过期时间，我们只验证token可以被创建
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return the payload', () => {
      const payload = { phoneNumber: '13800138000' };
      const token = service.generateToken(payload);
      
      const decoded = service.verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.phoneNumber).toBe('13800138000');
    });

    it('should throw an error for an invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => service.verifyToken(invalidToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const payload = { phoneNumber: '13800138000' };
      const token = service.generateToken(payload);
      
      const decoded = service.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.phoneNumber).toBe('13800138000');
    });

    it('should return null for an invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      const decoded = service.decodeToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });
});