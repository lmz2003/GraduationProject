import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeDocument } from '../entities/knowledge-document.entity';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { QueryKnowledgeDto } from '../dto/query-knowledge.dto';
import { MilvusService } from './milvus.service';
import { LangChainService } from './langchain.service';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    @InjectRepository(KnowledgeDocument)
    private documentRepository: Repository<KnowledgeDocument>,
    private milvusService: MilvusService,
    private langChainService: LangChainService
  ) {}

  /**
   * 添加文档到知识库
   */
  async addDocument(
    createDocumentDto: CreateDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    try {
      // 1. 保存文档到数据库
      const document = this.documentRepository.create({
        ...createDocumentDto,
        documentType: createDocumentDto.documentType || 'text',
        ownerId: userId,
      });

      const savedDocument = await this.documentRepository.save(document);
      this.logger.log(`文档已保存: ${savedDocument.id}`);

      // 2. 处理文档并生成嵌入
      try {
        const chunks = await this.langChainService.processDocument(
          createDocumentDto.content,
          createDocumentDto.title,
          {
            source: createDocumentDto.source,
            ...createDocumentDto.metadata,
          }
        );

        // 3. 将向量插入 Milvus
        for (const chunk of chunks) {
          await this.milvusService.insertVector(
            `${savedDocument.id}_${chunk.metadata.chunkIndex}`,
            chunk.embedding,
            chunk.metadata.title,
            chunk.chunk,
            chunk.metadata.source || null,
            userId
          );
        }

        // 4. 更新文档状态
        savedDocument.isProcessed = true;
        savedDocument.vectorId = savedDocument.id;
        await this.documentRepository.save(savedDocument);

        this.logger.log(`文档处理完成: ${savedDocument.id} (${chunks.length} 个向量)`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        this.logger.error(`文档向量处理失败: ${savedDocument.id} - ${errorMsg}`, error);
        
        // 记录详细的错误信息但继续保存文档
        // 用户可以稍后重新处理该文档
        savedDocument.isProcessed = false;
        await this.documentRepository.save(savedDocument);
        
        this.logger.warn(`文档已保存但未处理向量: ${savedDocument.id}。错误: ${errorMsg}`);
      }

      return savedDocument;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error('添加文档失败:', error);
      throw new BadRequestException(`添加文档失败: ${errorMsg}`);
    }
  }

  /**
   * 查询知识库
   */
  async queryKnowledge(
    queryDto: QueryKnowledgeDto,
    userId: string
  ): Promise<Array<{ id: string; title: string; content: string; source?: string; score: number }>> {
    try {
      const topK = queryDto.topK || 5;
      const threshold = queryDto.threshold ?? 0.5;

      // 1. 生成查询的嵌入
      const queryEmbedding = await this.langChainService.generateEmbedding(queryDto.query);

      // 2. 在 Milvus 中搜索相似向量
      const results = await this.milvusService.searchSimilar(
        queryEmbedding,
        userId,
        topK,
        threshold
      );

      this.logger.log(`查询完成: 找到 ${results.length} 个相关文档`);
      return results;
    } catch (error) {
      this.logger.error('查询失败:', error);
      throw new BadRequestException('查询失败');
    }
  }

  /**
   * 使用 RAG 进行增强查询
   */
  async ragQuery(
    queryDto: QueryKnowledgeDto,
    userId: string
  ): Promise<{ query: string; contexts: any[]; ragPrompt: string }> {
    try {
      // 1. 检索相关文档
      const contexts = await this.queryKnowledge(queryDto, userId);

      // 2. 构建 RAG 提示词
      const ragPrompt = this.langChainService.buildRAGPrompt(
        queryDto.query,
        contexts.map((c) => ({
          content: c.content,
          title: c.title,
          score: c.score,
        }))
      );

      return {
        query: queryDto.query,
        contexts,
        ragPrompt,
      };
    } catch (error) {
      this.logger.error('RAG 查询失败:', error);
      throw new BadRequestException('RAG 查询失败');
    }
  }

  /**
   * 获取用户的所有文档
   */
  async getUserDocuments(userId: string): Promise<KnowledgeDocument[]> {
    try {
      return await this.documentRepository.find({
        where: { ownerId: userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('获取文档列表失败:', error);
      throw new BadRequestException('获取文档列表失败');
    }
  }

  /**
   * 获取单个文档
   */
  async getDocument(documentId: string, userId: string): Promise<KnowledgeDocument> {
    try {
      const document = await this.documentRepository.findOne({
        where: {
          id: documentId,
          ownerId: userId,
        },
      });

      if (!document) {
        throw new NotFoundException('文档不存在');
      }

      return document;
    } catch (error) {
      this.logger.error('获取文档失败:', error);
      throw error;
    }
  }

  /**
   * 更新文档
   */
  async updateDocument(
    documentId: string,
    updateData: Partial<CreateDocumentDto>,
    userId: string
  ): Promise<KnowledgeDocument> {
    try {
      const document = await this.getDocument(documentId, userId);

      // 如果内容更新，需要重新处理
      if (updateData.content && updateData.content !== document.content) {
        // 删除旧向量
        await this.milvusService.deleteVector(documentId);

        // 处理新内容
        const chunks = await this.langChainService.processDocument(
          updateData.content,
          updateData.title || document.title,
          {
            source: updateData.source || document.source,
            ...updateData.metadata,
          }
        );

        // 插入新向量
        for (const chunk of chunks) {
          await this.milvusService.insertVector(
            `${documentId}_${chunk.metadata.chunkIndex}`,
            chunk.embedding,
            chunk.metadata.title,
            chunk.chunk,
            chunk.metadata.source || null,
            userId
          );
        }

        document.isProcessed = true;
      }

      // 更新文档字段
      Object.assign(document, updateData);
      const updated = await this.documentRepository.save(document);

      this.logger.log(`文档已更新: ${documentId}`);
      return updated;
    } catch (error) {
      this.logger.error('更新文档失败:', error);
      throw error;
    }
  }

  /**
   * 重新处理文档
   */
  async reprocessDocument(documentId: string, userId: string): Promise<KnowledgeDocument> {
    try {
      const document = await this.getDocument(documentId, userId);

      if (!document.content) {
        throw new BadRequestException('文档内容为空，无法处理');
      }

      try {
        // 1. 删除旧向量
        await this.milvusService.deleteVector(documentId);
      } catch (error) {
        this.logger.warn(`删除旧向量失败: ${documentId}`, error);
        // 继续处理，不中断流程
      }

      try {
        // 2. 处理文档内容并生成新的向量
        const chunks = await this.langChainService.processDocument(
          document.content,
          document.title,
          {
            source: document.source,
            ...document.metadata,
          }
        );

        // 3. 将新向量插入 Milvus
        for (const chunk of chunks) {
          await this.milvusService.insertVector(
            `${documentId}_${chunk.metadata.chunkIndex}`,
            chunk.embedding,
            chunk.metadata.title,
            chunk.chunk,
            chunk.metadata.source || null,
            userId
          );
        }

        // 4. 更新文档状态为已处理
        document.isProcessed = true;
        document.vectorId = documentId;
        const updated = await this.documentRepository.save(document);

        this.logger.log(`文档已重新处理: ${documentId} (${chunks.length} 个向量)`);
        return updated;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        this.logger.error(`文档向量处理失败: ${documentId} - ${errorMsg}`, error);

        // 标记为未处理状态，但保存文档
        document.isProcessed = false;
        await this.documentRepository.save(document);

        throw new BadRequestException(`文档处理失败: ${errorMsg}`);
      }
    } catch (error) {
      this.logger.error('重新处理文档失败:', error);
      throw error;
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      const document = await this.getDocument(documentId, userId);

      // 从 Milvus 删除向量
      await this.milvusService.deleteVector(documentId);

      // 从数据库删除文档
      await this.documentRepository.remove(document);

      this.logger.log(`文档已删除: ${documentId}`);
    } catch (error) {
      this.logger.error('删除文档失败:', error);
      throw error;
    }
  }

  /**
   * 获取知识库统计信息
   */
  async getStatistics(userId: string): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    pendingDocuments: number;
  }> {
    try {
      const documents = await this.getUserDocuments(userId);

      return {
        totalDocuments: documents.length,
        processedDocuments: documents.filter((d) => d.isProcessed).length,
        pendingDocuments: documents.filter((d) => !d.isProcessed).length,
      };
    } catch (error) {
      this.logger.error('获取统计信息失败:', error);
      throw new BadRequestException('获取统计信息失败');
    }
  }
}