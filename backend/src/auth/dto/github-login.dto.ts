import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GithubLoginDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}
