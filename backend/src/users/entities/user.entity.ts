import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AIAssistantSession } from '../../ai-assistant/entities/ai-assistant-session.entity';
import { AIAssistantMessage } from '../../ai-assistant/entities/ai-assistant-message.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  githubId!: string;

  @Column({ nullable: true })
  githubUsername?: string;

  @Column({ nullable: true })
  githubProfileUrl?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar?: string;

  @OneToMany('Note', (note: any) => note.owner)
  notes!: any[];

  @OneToMany(() => AIAssistantSession, (session) => session.user)
  aiAssistantSessions!: AIAssistantSession[];

  @OneToMany(() => AIAssistantMessage, (message) => message.user)
  aiAssistantMessages!: AIAssistantMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}