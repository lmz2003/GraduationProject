import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import { MilvusService } from './services/milvus.service';
import { LangChainService } from './services/langchain.service';
import { LLMIntegrationService } from './services/llm-integration.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeDocument]),
    UsersModule,
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    MilvusService,
    LangChainService,
    LLMIntegrationService,
  ],
  exports: [
    KnowledgeBaseService,
    MilvusService,
    LangChainService,
    LLMIntegrationService,
  ],
})
export class KnowledgeBaseModule {}