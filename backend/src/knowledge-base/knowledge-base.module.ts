import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import { MilvusService } from './services/milvus.service';
import { LangChainService } from './services/langchain.service';
import { LLMIntegrationService } from './services/llm-integration.service';
import { FileParserService } from './services/file-parser.service';
import { DocumentUploadService } from './services/document-upload.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeDocument]),
    UsersModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    MilvusService,
    LangChainService,
    LLMIntegrationService,
    FileParserService,
    DocumentUploadService,
  ],
  exports: [
    KnowledgeBaseService,
    MilvusService,
    LangChainService,
    LLMIntegrationService,
    FileParserService,
    DocumentUploadService,
  ],
})
export class KnowledgeBaseModule {}