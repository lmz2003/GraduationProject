import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorMessage = exception.message;
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '数据库操作失败';
    let error = 'Database Error';

    if (errorMessage.includes('violates not-null constraint')) {
      statusCode = HttpStatus.BAD_REQUEST;
      const match = errorMessage.match(/column "(\w+)"/);
      const column = match ? match[1] : 'unknown';
      message = `必填字段 ${column} 不能为空`;
      error = 'NotNullConstraintViolation';
    } else if (errorMessage.includes('violates foreign key constraint')) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = '关联数据不存在或已被删除';
      error = 'ForeignKeyConstraintViolation';
    } else if (errorMessage.includes('violates unique constraint')) {
      statusCode = HttpStatus.CONFLICT;
      message = '数据已存在，请勿重复提交';
      error = 'UniqueConstraintViolation';
    } else if (errorMessage.includes('violates check constraint')) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = '数据格式不符合要求';
      error = 'CheckConstraintViolation';
    } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '数据库表不存在，请联系管理员';
      error = 'TableNotFound';
    }

    this.logger.error({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: errorMessage,
      stack: exception.stack,
    });

    response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
