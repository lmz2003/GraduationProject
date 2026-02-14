import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UploadResumeDto {
  @IsNotEmpty()
  @IsString()
  title!: string; // 简历标题

  @IsOptional()
  @IsString()
  content?: string; // 文本内容（直接输入时使用）
}

export class UploadResumeWithFileDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
