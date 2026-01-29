import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIAssistantController } from './ai-assistant.controller';
import { AIAssistantService } from './services/ai-assistant.service';
import { ChatSession } from './entities/chat-session.entity';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession]),
    KnowledgeBaseModule,
  ],
  controllers: [AIAssistantController],
  providers: [AIAssistantService],
  exports: [AIAssistantService],
})
export class AIAssistantModule {}
