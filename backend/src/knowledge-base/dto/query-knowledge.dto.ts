import { IsString, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class QueryKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @Min(1)
  @Max(20)
  topK?: number; // 返回最相似的 K 个结果，默认 5

  @IsOptional()
  @Min(0)
  @Max(1)
  threshold?: number; // 相似度阈值，默认 0.5
}