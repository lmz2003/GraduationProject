import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AIAssistantSession } from './ai-assistant-session.entity';

@Entity('ai_assistant_messages')
export class AIAssistantMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  sessionId!: string;

  @Column('uuid')
  userId!: string;

  @Column('varchar', { length: 10 })
  role!: 'user' | 'assistant';

  @Column('text')
  content!: string;

  @Column('json', { nullable: true })
  sources!: Array<{ title: string; score: number }> | null;

  @CreateDateColumn()
  timestamp!: Date;

  @ManyToOne(() => User, (user) => user.aiAssistantMessages)
  user!: User;

  @ManyToOne(() => AIAssistantSession, (session) => session.messages)
  session!: AIAssistantSession;
}
