import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIAssistantSession } from './entities/ai-assistant-session.entity';
import { AIAssistantMessage } from './entities/ai-assistant-message.entity';
import { AIAssistantService } from './services/ai-assistant.service';
import { AIAssistantController } from './ai-assistant.controller';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIAssistantSession, AIAssistantMessage]),
    KnowledgeBaseModule,
  ],
  providers: [AIAssistantService],
  controllers: [AIAssistantController],
  exports: [AIAssistantService],
})
export class AIAssistantModule {}
