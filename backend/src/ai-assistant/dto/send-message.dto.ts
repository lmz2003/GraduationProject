export class SendMessageDto {
  /**
   * 消息内容
   */
  message!: string;

  /**
   * 会话ID（可选，如果为空则创建新会话）
   */
  sessionId?: string;

  /**
   * 是否使用知识库进行RAG增强（默认true）
   */
  useRAG?: boolean;

  /**
   * 知识库查询的top-k（默认5）
   */
  topK?: number;

  /**
   * 相似度阈值（默认0.5）
   */
  threshold?: number;

  /**
   * 会话标题（创建新会话时使用）
   */
  title?: string;

  /**
   * 会话主题（创建新会话时使用）
   */
  topic?: string;
}
