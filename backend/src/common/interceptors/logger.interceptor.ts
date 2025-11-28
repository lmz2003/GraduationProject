import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url, ip } = request;

    // 记录请求开始
    console.log(
      `${new Date().toISOString()} - REQUEST - ${method} ${url} - IP: ${ip}`,
    );

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        const statusCode = response.statusCode;

        // 记录请求结束和响应信息
        console.log(
          `${new Date().toISOString()} - RESPONSE - ${method} ${url} - Status: ${statusCode} - Time: ${responseTime}ms`,
        );
      }),
    );
  }
}