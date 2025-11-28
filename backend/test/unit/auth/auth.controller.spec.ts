import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { SendCodeDto } from '../../../src/auth/dto/send-code.dto';
import { LoginDto } from '../../../src/auth/dto/login.dto';

// 模拟AuthService
const mockAuthService = {
  sendVerificationCode: jest.fn(),
  verifyLogin: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendVerificationCode', () => {
    it('should call authService.sendVerificationCode with correct phone number', async () => {
      const sendCodeDto: SendCodeDto = { phoneNumber: '13800138000' };
      
      await controller.sendVerificationCode(sendCodeDto);
      
      expect(authService.sendVerificationCode).toHaveBeenCalledWith('13800138000');
    });

    it('should return success message', async () => {
      const sendCodeDto: SendCodeDto = { phoneNumber: '13800138000' };
      
      const result = await controller.sendVerificationCode(sendCodeDto);
      
      expect(result).toEqual({
        success: true,
        message: 'Verification code sent successfully',
      });
    });
  });

  describe('login', () => {
    it('should call authService.verifyLogin with correct credentials', async () => {
      const loginDto: LoginDto = { phoneNumber: '13800138000', code: '123456' };
      const mockTokenResponse = { token: 'mock-jwt-token' };
      
      mockAuthService.verifyLogin.mockResolvedValue(mockTokenResponse);
      
      await controller.login(loginDto);
      
      expect(authService.verifyLogin).toHaveBeenCalledWith('13800138000', '123456');
    });

    it('should return token on successful login', async () => {
      const loginDto: LoginDto = { phoneNumber: '13800138000', code: '123456' };
      const mockTokenResponse = { token: 'mock-jwt-token' };
      
      mockAuthService.verifyLogin.mockResolvedValue(mockTokenResponse);
      
      const result = await controller.login(loginDto);
      
      expect(result).toEqual({
        success: true,
        token: mockTokenResponse.token,
      });
    });
  });
});