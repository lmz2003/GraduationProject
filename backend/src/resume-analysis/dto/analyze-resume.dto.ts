import { IsString, IsOptional } from 'class-validator';

export class AnalyzeResumeDto {
  @IsString()
  resumeId!: string; // 简历ID

  @IsOptional()
  @IsString()
  jobDescription?: string; // 职位描述（可选，用于对标分析）
}

export class CompareResumeDto {
  @IsString()
  resumeId!: string;

  @IsString()
  jobDescription!: string; // 职位描述
}
