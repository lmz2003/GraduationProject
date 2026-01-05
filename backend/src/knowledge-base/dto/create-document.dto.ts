import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  documentType?: string; // 默认为 'text'

  @IsOptional()
  metadata?: Record<string, any>;
}