"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const verification_code_service_1 = require("./services/verification-code.service");
const jwt_auth_service_1 = require("./services/jwt-auth.service");
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
    let service;
    let verificationCodeService;
    let jwtAuthService;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const module = yield testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: verification_code_service_1.VerificationCodeService,
                    useValue: mockVerificationCodeService,
                },
                {
                    provide: jwt_auth_service_1.JwtAuthService,
                    useValue: mockJwtAuthService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        verificationCodeService = module.get(verification_code_service_1.VerificationCodeService);
        jwtAuthService = module.get(jwt_auth_service_1.JwtAuthService);
    }));
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('sendVerificationCode', () => {
        it('should throw an error for invalid phone number format', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidPhoneNumber = '1234567890'; // 无效的手机号码
            yield expect(service.sendVerificationCode(invalidPhoneNumber))
                .rejects.toThrow('Invalid phone number format');
        }));
        it('should generate and store verification code for valid phone number', () => __awaiter(void 0, void 0, void 0, function* () {
            const validPhoneNumber = '13800138000'; // 有效的手机号码
            // 捕获console.log输出以验证验证码生成
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            yield service.sendVerificationCode(validPhoneNumber);
            // 验证storeVerificationCode被调用
            expect(verificationCodeService.storeVerificationCode).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(validPhoneNumber));
            consoleSpy.mockRestore();
        }));
    });
    describe('verifyLogin', () => {
        it('should throw an error for invalid phone number format', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidPhoneNumber = '1234567890';
            yield expect(service.verifyLogin(invalidPhoneNumber, '123456'))
                .rejects.toThrow('Invalid phone number format');
        }));
        it('should throw an error for invalid verification code', () => __awaiter(void 0, void 0, void 0, function* () {
            const validPhoneNumber = '13800138000';
            const code = '123456';
            // 设置checkVerificationCode返回false
            mockVerificationCodeService.checkVerificationCode.mockReturnValue(false);
            yield expect(service.verifyLogin(validPhoneNumber, code))
                .rejects.toThrow('Invalid or expired verification code');
        }));
        it('should return JWT token for valid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            const validPhoneNumber = '13800138000';
            const code = '123456';
            // 设置checkVerificationCode返回true
            mockVerificationCodeService.checkVerificationCode.mockReturnValue(true);
            const result = yield service.verifyLogin(validPhoneNumber, code);
            // 验证所有方法都被正确调用
            expect(verificationCodeService.checkVerificationCode).toHaveBeenCalledWith(validPhoneNumber, code);
            expect(verificationCodeService.removeVerificationCode).toHaveBeenCalledWith(validPhoneNumber);
            expect(jwtAuthService.generateToken).toHaveBeenCalledWith({ phoneNumber: validPhoneNumber });
            // 验证返回结果
            expect(result).toBeDefined();
            expect(result.token).toBe('mock-jwt-token');
        }));
    });
});
