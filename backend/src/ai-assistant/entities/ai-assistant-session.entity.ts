import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AIAssistantMessage } from './ai-assistant-message.entity';

@Entity('ai_assistant_sessions')
export class AIAssistantSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('varchar', { length: 255 })
  title!: string;

  @Column('integer', { default: 0 })
  messageCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.aiAssistantSessions)
  user!: User;

  @OneToMany(() => AIAssistantMessage, (message) => message.session)
  messages!: AIAssistantMessage[];
}
