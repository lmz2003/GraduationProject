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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationCodeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let VerificationCodeService = class VerificationCodeService {
    constructor(configService) {
        this.configService = configService;
        this.cleanupInterval = null;
        this.verificationCodes = new Map();
        this.expirationTime = parseInt(this.configService.get('VERIFICATION_CODE_EXPIRATION') || '300'); // 默认5分钟
    }
    /**
     * 当模块初始化时启动清理过期验证码的定时任务
     */
    onModuleInit() {
        // 每分钟清理一次过期的验证码
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredCodes();
        }, 60000);
    }
    /**
     * 当模块销毁时清理定时任务
     */
    onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
    /**
     * 清理过期的验证码
     */
    cleanupExpiredCodes() {
        const now = Date.now();
        this.verificationCodes.forEach((code, phoneNumber) => {
            if (code.expiresAt < now) {
                this.verificationCodes.delete(phoneNumber);
            }
        });
    }
    /**
     * 存储验证码
     * @param phoneNumber 手机号码
     * @param code 验证码
     */
    storeVerificationCode(phoneNumber, code) {
        const expiresAt = Date.now() + this.expirationTime * 1000;
        this.verificationCodes.set(phoneNumber, { code, expiresAt });
    }
    /**
     * 验证验证码
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @returns 验证码是否有效
     */
    checkVerificationCode(phoneNumber, code) {
        if (!this.verificationCodes.has(phoneNumber)) {
            return false;
        }
        const verificationCode = this.verificationCodes.get(phoneNumber);
        const now = Date.now();
        // 检查验证码是否过期
        if (verificationCode.expiresAt < now) {
            this.verificationCodes.delete(phoneNumber);
            return false;
        }
        // 检查验证码是否匹配
        return verificationCode.code === code;
    }
    /**
     * 删除验证码
     * @param phoneNumber 手机号码
     */
    removeVerificationCode(phoneNumber) {
        this.verificationCodes.delete(phoneNumber);
    }
};
exports.VerificationCodeService = VerificationCodeService;
exports.VerificationCodeService = VerificationCodeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VerificationCodeService);
