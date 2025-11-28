import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cors from 'cors';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // 配置CORS
  app.use(cors());
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 应用全局过滤器、拦截器和管道
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggerInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // 获取端口配置
  const port = configService.get<number>('PORT') || 3001;
  
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();