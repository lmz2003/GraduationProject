export class GetSessionDto {
  /**
   * 会话ID
   */
  id!: string;

  /**
   * 会话标题
   */
  title?: string;

  /**
   * 会话主题
   */
  topic?: string;

  /**
   * 对话消息列表
   */
  messages!: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: Array<{ title: string; score: number }>;
  }>;

  /**
   * 消息总数
   */
  messageCount!: number;

  /**
   * 创建时间
   */
  createdAt!: Date;

  /**
   * 更新时间
   */
  updatedAt!: Date;
}
