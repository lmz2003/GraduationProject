import { IsString, IsNotEmpty, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export class QueryKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  query!: string; // 查询文本，最多 5000 字符

  @IsOptional()
  @Min(1)
  @Max(20)
  topK?: number; // 返回最相似的 K 个结果，默认 5

  @IsOptional()
  @Min(0)
  @Max(1)
  threshold?: number; // 相似度阈值，默认 0.5
}