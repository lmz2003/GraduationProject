import { IsString, IsOptional, IsNotEmpty, MaxLength, MinLength, IsNumber } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  source?: string;

  @IsString()
  @IsOptional()
  documentType?: string; // 默认为 'text'

  @IsOptional()
  metadata?: Record<string, any>;

  // 文件上传相关字段
  @IsString()
  @IsOptional()
  fileName?: string; // 原始文件名

  @IsNumber()
  @IsOptional()
  fileSize?: number; // 文件大小（字节）

  @IsString()
  @IsOptional()
  fileMimeType?: string; // 文件 MIME 类型

  @IsString()
  @IsOptional()
  fileUrl?: string; // 服务器上保存的文件 URL

  @IsString()
  @IsOptional()
  uploadType?: string; // input（文本输入）或 file（文件上传），默认为 'input'
}