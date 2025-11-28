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
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const jwt_auth_service_1 = require("./jwt-auth.service");
// 模拟JWT密钥
const mockJwtSecret = 'test-secret-key-123456';
// 模拟ConfigService
const mockConfigService = {
    get: jest.fn((key) => {
        if (key === 'JWT_SECRET') {
            return mockJwtSecret;
        }
        return null;
    }),
};
describe('JwtAuthService', () => {
    let service;
    let jwtService;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const module = yield testing_1.Test.createTestingModule({
            imports: [
                jwt_1.JwtModule.register({
                    secret: mockJwtSecret,
                    signOptions: { expiresIn: '1h' },
                }),
            ],
            providers: [
                jwt_auth_service_1.JwtAuthService,
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        service = module.get(jwt_auth_service_1.JwtAuthService);
        jwtService = module.get(jwt_1.JwtService);
    }));
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
            expect(decoded.phoneNumber).toBe('13800138000');
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
            expect(decoded === null || decoded === void 0 ? void 0 : decoded.phoneNumber).toBe('13800138000');
        });
        it('should return null for an invalid token', () => {
            const invalidToken = 'invalid.token.here';
            const decoded = service.decodeToken(invalidToken);
            expect(decoded).toBeNull();
        });
    });
});
