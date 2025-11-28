import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 15 * 60 * 1000, // 15 minutes
      limit: process.env.MAX_REQUESTS_PER_15MIN ? parseInt(process.env.MAX_REQUESTS_PER_15MIN) : 5,
    }]),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}