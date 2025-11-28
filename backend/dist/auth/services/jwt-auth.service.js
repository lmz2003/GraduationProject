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
exports.JwtAuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let JwtAuthService = class JwtAuthService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    /**
     * 生成JWT token
     * @param payload JWT载荷
     * @param expiresIn 过期时间
     * @returns 生成的JWT token
     */
    generateToken(payload, expiresIn = '1h') {
        return this.jwtService.sign(payload, { expiresIn });
    }
    /**
     * 验证JWT token
     * @param token JWT token
     * @returns 解码后的载荷，如果token无效则抛出异常
     */
    verifyToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            return payload;
        }
        catch (error) {
            console.error('JWT verification failed:', error);
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    /**
     * 解析JWT token但不验证签名
     * @param token JWT token
     * @returns 解码后的载荷
     */
    decodeToken(token) {
        try {
            return this.jwtService.decode(token);
        }
        catch (error) {
            console.error('JWT decoding failed:', error);
            return null;
        }
    }
};
exports.JwtAuthService = JwtAuthService;
exports.JwtAuthService = JwtAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtAuthService);
