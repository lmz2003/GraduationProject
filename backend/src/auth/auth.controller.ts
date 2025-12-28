import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendCodeDto } from './dto/send-code.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async sendVerificationCode(@Body() sendCodeDto: SendCodeDto) {
    try {
      await this.authService.sendVerificationCode(sendCodeDto.phoneNumber);
      return {
        success: true,
        message: 'Verification code sent successfully',
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid phone number format') {
        throw new HttpException(
          { message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const { token, isFirstLogin } = await this.authService.verifyLogin(loginDto.phoneNumber, loginDto.code);
      return {
        success: true,
        token,
        isFirstLogin,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid phone number format') {
          throw new HttpException(
            { message: error.message },
            HttpStatus.BAD_REQUEST,
          );
        } else if (error.message === 'Invalid or expired verification code') {
          throw new HttpException(
            { message: error.message },
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
      throw error;
    }
  }
}