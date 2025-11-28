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
const config_1 = require("@nestjs/config");
const verification_code_service_1 = require("./verification-code.service");
// 模拟ConfigService
const mockConfigService = {
    get: jest.fn((key) => {
        if (key === 'VERIFICATION_CODE_EXPIRATION') {
            return '60'; // 60秒用于测试
        }
        return null;
    }),
};
describe('VerificationCodeService', () => {
    let service;
    let configService;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const module = yield testing_1.Test.createTestingModule({
            providers: [
                verification_code_service_1.VerificationCodeService,
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        service = module.get(verification_code_service_1.VerificationCodeService);
        configService = module.get(config_1.ConfigService);
    }));
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
