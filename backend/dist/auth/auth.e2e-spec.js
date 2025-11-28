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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../app.module");
const config_1 = require("@nestjs/config");
describe('AuthController (e2e)', () => {
    let app;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const moduleFixture = yield testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),
                app_module_1.AppModule,
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        yield app.init();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield app.close();
    }));
    describe('/api/auth/send-code (POST)', () => {
        it('should return 200 and send verification code for valid phone number', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/send-code')
                .send({ phoneNumber: '13800138000' })
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Verification code sent successfully',
            });
        }));
        it('should return 400 for invalid phone number format', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/send-code')
                .send({ phoneNumber: 'invalid-phone' })
                .expect(400);
            expect(response.body).toHaveProperty('message');
        }));
        it('should return 429 when rate limit exceeded', () => __awaiter(void 0, void 0, void 0, function* () {
            // Send multiple requests quickly to trigger rate limit
            const requests = Array(6)
                .fill(0)
                .map(() => (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/send-code')
                .send({ phoneNumber: '13800138000' }));
            const responses = yield Promise.all(requests);
            // Check if at least one request returned 429
            const has429 = responses.some(res => res.status === 429);
            expect(has429).toBe(true);
        }));
    });
    describe('/api/auth/login (POST)', () => {
        it('should return 400 for invalid login request', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/login')
                .send({ phoneNumber: '13800138000', code: 'invalid' })
                .expect(400);
            expect(response.body).toHaveProperty('message');
        }));
        it('should return 401 for incorrect verification code', () => __awaiter(void 0, void 0, void 0, function* () {
            // First send a code
            yield (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/send-code')
                .send({ phoneNumber: '13800138000' })
                .expect(200);
            // Then try to login with wrong code
            const response = yield (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/login')
                .send({ phoneNumber: '13800138000', code: '999999' })
                .expect(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Invalid verification code',
            });
        }));
    });
});
