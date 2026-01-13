import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GithubLoginDto } from './dto/github-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('github')
  async githubLogin(@Body() githubLoginDto: GithubLoginDto) {
    try {
      const { token, user } = await this.authService.loginWithGithub(
        githubLoginDto.code,
        githubLoginDto.redirectUri,
      );

      return {
        success: true,
        token,
        user,
      };
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message || 'GitHub login failed';
        throw new HttpException({ message }, HttpStatus.UNAUTHORIZED);
      }
      throw error;
    }
  }
}