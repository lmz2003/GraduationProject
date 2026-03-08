import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InterviewSession } from './interview-session.entity';

export interface MessageEvaluation {
  completeness: number;
  clarity: number;
  depth: number;
  expression: number;
  highlights: number;
  overall: number;
  suggestions: string[];
}

export interface MessageSource {
  documentId: string;
  content: string;
  score: number;
}

export interface VideoFrameAnalysis {
  timestamp: number;
  emotions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down';
  eyeContact: boolean;
  faceDetected: boolean;
  confidence: number;
}

export interface VideoAnalysisResult {
  frames: VideoFrameAnalysis[];
  summary: {
    totalFrames: number;
    averageEmotions: Record<string, number>;
    dominantEmotion: string;
    eyeContactRatio: number;
    gazeDistribution: Record<string, number>;
    faceDetectionRatio: number;
    overallScore: number;
    feedback: string[];
  };
}

@Entity('interview_messages')
export class InterviewMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  sessionId!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  questionType?: string;

  @Column({ type: 'jsonb', nullable: true })
  evaluation?: MessageEvaluation;

  @Column({ type: 'float', nullable: true })
  score?: number;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'jsonb', nullable: true })
  sources?: MessageSource[];

  @Column({ type: 'jsonb', nullable: true })
  videoAnalysis?: VideoAnalysisResult;

  @ManyToOne(() => InterviewSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session?: InterviewSession;
}
