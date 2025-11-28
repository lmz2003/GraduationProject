import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // 设置全局前缀，与main.ts保持一致
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/auth/send-code (POST)', () => {
    it('should return 201 and send verification code for valid phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/send-code')
        .send({ phoneNumber: '13800138000' })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Verification code sent successfully',
      });
    });

    it('should return 400 for invalid phone number format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/send-code')
        .send({ phoneNumber: 'invalid-phone' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle multiple requests without failing', async () => {
      // Send multiple requests quickly
      const requests = Array(3)
        .fill(0)
        .map(() =>
          request(app.getHttpServer())
            .post('/api/auth/send-code')
            .send({ phoneNumber: '13800138000' })
        );

      const responses = await Promise.all(requests);
      
      // Check if all requests returned 201 or 429 (but not 500)
      const allSuccessful = responses.every(res => 
        res.status === 201 || res.status === 429
      );
      expect(allSuccessful).toBe(true);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should return 401 for invalid login request', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phoneNumber: '13800138000', code: 'invalid' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for incorrect verification code', async () => {
      // First send a code
      await request(app.getHttpServer())
        .post('/api/auth/send-code')
        .send({ phoneNumber: '13800138000' })
        .expect(201);

      // Then try to login with wrong code
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phoneNumber: '13800138000', code: '999999' })
        .expect(401);

      expect(response.body).toEqual({
        message: 'Invalid or expired verification code',
      });
    });
  });
});