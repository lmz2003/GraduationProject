"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let LoggerInterceptor = class LoggerInterceptor {
    intercept(context, next) {
        const now = Date.now();
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();
        const { method, url, ip } = request;
        // 记录请求开始
        console.log(`${new Date().toISOString()} - REQUEST - ${method} ${url} - IP: ${ip}`);
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            const responseTime = Date.now() - now;
            const statusCode = response.statusCode;
            // 记录请求结束和响应信息
            console.log(`${new Date().toISOString()} - RESPONSE - ${method} ${url} - Status: ${statusCode} - Time: ${responseTime}ms`);
        }));
    }
};
exports.LoggerInterceptor = LoggerInterceptor;
exports.LoggerInterceptor = LoggerInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggerInterceptor);
