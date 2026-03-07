import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Interview } from './entities/interview.entity';
import { InterviewSession } from './entities/interview-session.entity';
import { InterviewMessage } from './entities/interview-message.entity';
import { InterviewReport } from './entities/interview-report.entity';
import { InterviewController } from './interview.controller';
import { SceneService } from './services/scene.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewMessageService } from './services/interview-message.service';
import { InterviewLLMService } from './services/interview-llm.service';
import { InterviewEvaluatorService } from './services/interview-evaluator.service';
import { InterviewReportService } from './services/interview-report.service';
import { SpeechRecognitionService } from './services/speech-recognition.service';
import { SpeechSynthesisService } from './services/speech-synthesis.service';
import { VideoAnalysisService } from './services/video-analysis.service';
import { ResumeAnalysisModule } from '../resume-analysis/resume-analysis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Interview,
      InterviewSession,
      InterviewMessage,
      InterviewReport,
    ]),
    MulterModule.register({
      // 使用内存存储，音频文件直接处理，不保存到磁盘
      limits: {
        fileSize: 10 * 1024 * 1024, // 最大 10MB
      },
    }),
    ResumeAnalysisModule,
  ],
  controllers: [InterviewController],
  providers: [
    SceneService,
    InterviewSessionService,
    InterviewMessageService,
    InterviewLLMService,
    InterviewEvaluatorService,
    InterviewReportService,
    SpeechRecognitionService,
    SpeechSynthesisService,
    VideoAnalysisService,
  ],
  exports: [
    SceneService,
    InterviewSessionService,
    InterviewMessageService,
    InterviewLLMService,
    InterviewEvaluatorService,
    InterviewReportService,
    SpeechRecognitionService,
    SpeechSynthesisService,
    VideoAnalysisService,
  ],
})
export class InterviewModule {}
