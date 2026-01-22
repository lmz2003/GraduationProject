import { IsString, IsOptional, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

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
}