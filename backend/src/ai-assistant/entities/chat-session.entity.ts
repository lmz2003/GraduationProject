import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; score: number }>; // 引用的知识库来源
}

@Entity('chat_sessions')
@Index(['ownerId', 'createdAt'])
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  ownerId!: string; // 用户ID

  @Column({ nullable: true })
  title?: string; // 会话标题

  @Column({ type: 'jsonb', default: [] })
  messages!: ChatMessage[]; // 对话消息列表

  @Column({ type: 'text', nullable: true })
  topic?: string; // 对话主题

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // 元数据（关联知识库ID等）

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
