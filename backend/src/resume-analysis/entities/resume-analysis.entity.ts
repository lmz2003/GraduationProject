import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resume } from './resume.entity';

@Entity('resume_analyses')
export class ResumeAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  resumeId!: string; // 关联的简历ID

  @ManyToOne(() => Resume, (resume) => resume.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resumeId' })
  resume!: Resume;

  // 各维度评分
  @Column({ type: 'float', default: 0 })
  overallScore!: number; // 总体评分 (0-100)

  @Column({ type: 'float', default: 0 })
  completenessScore!: number; // 完整性评分

  @Column({ type: 'float', default: 0 })
  keywordScore!: number; // 关键词覆盖度

  @Column({ type: 'float', default: 0 })
  formatScore!: number; // 格式规范性

  @Column({ type: 'float', default: 0 })
  experienceScore!: number; // 工作经验评分

  @Column({ type: 'float', default: 0 })
  skillsScore!: number; // 技能评分

  // 分析内容
  @Column({ type: 'text', nullable: true })
  strengths?: string; // 优势分析（JSON 字符串数组）

  @Column({ type: 'text', nullable: true })
  weaknesses?: string; // 劣势分析（JSON 字符串数组）

  @Column({ type: 'text', nullable: true })
  suggestions?: string; // 改进建议（JSON 格式对象）

  @Column({ type: 'text', nullable: true })
  keywordAnalysis?: string; // 关键词分析（JSON 格式）

  @Column({ type: 'text', nullable: true })
  structureAnalysis?: string; // 结构分析（JSON 格式）

  @Column({ type: 'text', nullable: true })
  contentAnalysis?: string; // 内容分析（JSON 格式）

  // 建议优化的各个部分
  @Column({ type: 'jsonb', nullable: true })
  personalInfoSuggestions?: {
    current?: string;
    suggestion?: string;
    reason?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  summaryOptimization?: {
    current?: string;
    optimized?: string;
    reason?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  experienceSuggestions?: Array<{
    index?: number;
    current?: string;
    suggestion?: string;
    improvement?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  skillsSuggestions?: {
    missing?: string[];
    shouldAdd?: string[];
    prioritize?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  formatIssues?: Array<{
    type?: string;
    issue?: string;
    suggestion?: string;
  }>;

  @CreateDateColumn()
  createdAt!: Date;
}
