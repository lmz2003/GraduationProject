import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeAnalysisController } from './resume-analysis.controller';
import { ResumeAnalysisService } from './services/resume-analysis.service';
import { ResumeParserService } from './services/resume-parser.service';
import { ResumeAnalyzerService } from './services/resume-analyzer.service';
import { ResumeLLMService } from './services/resume-llm.service';
import { Resume } from './entities/resume.entity';
import { ResumeAnalysis } from './entities/resume-analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resume, ResumeAnalysis])],
  controllers: [ResumeAnalysisController],
  providers: [
    ResumeAnalysisService,
    ResumeParserService,
    ResumeAnalyzerService,
    ResumeLLMService,
  ],
  exports: [ResumeAnalysisService],
})
export class ResumeAnalysisModule {}
