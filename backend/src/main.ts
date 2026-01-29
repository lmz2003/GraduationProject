import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cors from 'cors';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  
  // 配置CORS
  app.use(cors());
  
  // 增加body-parser请求体大小限制，解决头像上传问题
  app.use(bodyParser.json({ limit: '5mb' })); // 增加JSON请求体大小限制到5MB
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true })); // 增加URL编码请求体大小限制到5MB
  
  // 配置静态文件服务
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 应用全局过滤器、拦截器和管道
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggerInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false, // 改为false，允许额外属性但会忽略它们
  }));
  
  // 获取端口配置
  const port = configService.get<number>('PORT') || 3001;
  
  await app.listen(3001);
  console.log(`Server is running on http://localhost:3001`);
}
bootstrap();