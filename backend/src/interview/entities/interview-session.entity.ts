import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { InterviewMessage } from './interview-message.entity';

@Entity('interview_sessions')
export class InterviewSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'interviewId' })
  interviewId!: string;

  @Column({ type: 'timestamp', name: 'startedAt' })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'endedAt' })
  endedAt?: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'integer', default: 0, name: 'questionCount' })
  questionCount!: number;

  @Column({ type: 'integer', default: 0, name: 'messageCount' })
  messageCount!: number;

  @OneToMany(() => InterviewMessage, (message) => message.session, {
    cascade: true,
  })
  messages?: InterviewMessage[];
}
