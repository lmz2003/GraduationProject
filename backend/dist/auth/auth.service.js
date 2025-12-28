"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const verification_code_service_1 = require("./services/verification-code.service");
const jwt_auth_service_1 = require("./services/jwt-auth.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
let AuthService = class AuthService {
    constructor(verificationCodeService, jwtAuthService, userRepository) {
        this.verificationCodeService = verificationCodeService;
        this.jwtAuthService = jwtAuthService;
        this.userRepository = userRepository;
    }
    /**
     * 发送验证码
     * @param phoneNumber 手机号码
     */
    sendVerificationCode(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            // 验证手机号格式
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phoneNumber)) {
                throw new Error('Invalid phone number format');
            }
            // 生成6位验证码
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            // 存储验证码
            this.verificationCodeService.storeVerificationCode(phoneNumber, verificationCode);
            // TODO: 实际项目中这里应该集成短信发送服务
            console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);
        });
    }
    /**
     * 验证登录凭证
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @returns 包含JWT token的对象
     */
    verifyLogin(phoneNumber, code) {
        return __awaiter(this, void 0, void 0, function* () {
            // 验证手机号格式
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phoneNumber)) {
                throw new Error('Invalid phone number format');
            }
            // 验证验证码
            const isCodeValid = this.verificationCodeService.checkVerificationCode(phoneNumber, code);
            if (!isCodeValid) {
                throw new Error('Invalid or expired verification code');
            }
            // 删除已使用的验证码
            this.verificationCodeService.removeVerificationCode(phoneNumber);
            // 检查用户是否存在
            let user = yield this.userRepository.findOneBy({ phoneNumber });
            let isFirstLogin = false;
            // 如果用户不存在，创建新用户
            if (!user) {
                user = this.userRepository.create({ phoneNumber });
                yield this.userRepository.save(user);
                isFirstLogin = true;
            }
            // 生成JWT token
            const token = this.jwtAuthService.generateToken({ phoneNumber, userId: user.id });
            return { token, isFirstLogin };
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [verification_code_service_1.VerificationCodeService,
        jwt_auth_service_1.JwtAuthService,
        typeorm_2.Repository])
], AuthService);
