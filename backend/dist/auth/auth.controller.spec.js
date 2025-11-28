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
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
// 模拟AuthService
const mockAuthService = {
    sendVerificationCode: jest.fn(),
    verifyLogin: jest.fn(),
};
describe('AuthController', () => {
    let controller;
    let authService;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const module = yield testing_1.Test.createTestingModule({
            controllers: [auth_controller_1.AuthController],
            providers: [
                {
                    provide: auth_service_1.AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();
        controller = module.get(auth_controller_1.AuthController);
        authService = module.get(auth_service_1.AuthService);
    }));
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    describe('sendVerificationCode', () => {
        it('should call authService.sendVerificationCode with correct phone number', () => __awaiter(void 0, void 0, void 0, function* () {
            const sendCodeDto = { phoneNumber: '13800138000' };
            yield controller.sendVerificationCode(sendCodeDto);
            expect(authService.sendVerificationCode).toHaveBeenCalledWith('13800138000');
        }));
        it('should return success message', () => __awaiter(void 0, void 0, void 0, function* () {
            const sendCodeDto = { phoneNumber: '13800138000' };
            const result = yield controller.sendVerificationCode(sendCodeDto);
            expect(result).toEqual({
                success: true,
                message: 'Verification code sent successfully',
            });
        }));
    });
    describe('login', () => {
        it('should call authService.verifyLogin with correct credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            const loginDto = { phoneNumber: '13800138000', code: '123456' };
            const mockTokenResponse = { token: 'mock-jwt-token' };
            mockAuthService.verifyLogin.mockResolvedValue(mockTokenResponse);
            yield controller.login(loginDto);
            expect(authService.verifyLogin).toHaveBeenCalledWith('13800138000', '123456');
        }));
        it('should return token on successful login', () => __awaiter(void 0, void 0, void 0, function* () {
            const loginDto = { phoneNumber: '13800138000', code: '123456' };
            const mockTokenResponse = { token: 'mock-jwt-token' };
            mockAuthService.verifyLogin.mockResolvedValue(mockTokenResponse);
            const result = yield controller.login(loginDto);
            expect(result).toEqual({
                success: true,
                token: mockTokenResponse.token,
            });
        }));
    });
});
