export class ChatResponseDto {
  /**
   * 会话ID
   */
  sessionId!: string;

  /**
   * AI助手的回答
   */
  answer!: string;

  /**
   * 引用的知识库文档
   */
  sources!: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
    source?: string;
  }>;

  /**
   * 对话消息总数
   */
  messageCount!: number;

  /**
   * 创建时间
   */
  timestamp!: Date;
}
