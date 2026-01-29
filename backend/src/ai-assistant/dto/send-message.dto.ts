import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class SendMessageDto {
  /**
   * 消息内容
   */
  @IsString()
  message!: string;

  /**
   * 会话ID（可选，如果为空则创建新会话）
   */
  @IsOptional()
  @IsString()
  sessionId?: string;

  /**
   * 是否使用知识库进行RAG增强（默认true）
   */
  @IsOptional()
  @IsBoolean()
  useRAG?: boolean;

  /**
   * 知识库查询的top-k（默认5）
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  topK?: number;

  /**
   * 相似度阈值（默认0.5）
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;

  /**
   * 会话标题（创建新会话时使用）
   */
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * 会话主题（创建新会话时使用）
   */
  @IsOptional()
  @IsString()
  topic?: string;
}
