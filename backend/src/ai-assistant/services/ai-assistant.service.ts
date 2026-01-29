import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HumanMessage } from '@langchain/core/messages';
import { ChatSession, ChatMessage } from '../entities/chat-session.entity';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
import { GetSessionDto } from '../dto/get-session.dto';
import { KnowledgeBaseService } from '../../knowledge-base/services/knowledge-base.service';
import { LLMIntegrationService } from '../../knowledge-base/services/llm-integration.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);

  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    private knowledgeBaseService: KnowledgeBaseService,
    private llmService: LLMIntegrationService,
  ) {}

  /**
   * 发送消息并获取AI响应
   */
  async sendMessage(
    dto: SendMessageDto,
    userId: string,
  ): Promise<ChatResponseDto> {
    try {
      if (!dto.message || dto.message.trim().length === 0) {
        throw new BadRequestException('消息内容不能为空');
      }

      // 1. 获取或创建会话
      let session: ChatSession;
      if (dto.sessionId) {
        const foundSession = await this.getSession(dto.sessionId, userId);
        if (!foundSession) {
          throw new NotFoundException('会话不存在');
        }
        session = foundSession;
      } else {
        session = await this.createSession(userId, dto.title, dto.topic);
      }

      // 2. 保存用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: dto.message.trim(),
        timestamp: new Date(),
      };
      session.messages.push(userMessage);
      await this.chatSessionRepository.save(session);

      // 3. 执行RAG查询和LLM生成
      const topK = dto.topK ?? 5;
      const threshold = dto.threshold ?? 0.5;
      const useRAG = dto.useRAG !== false;

      let assistantContent: string;
      let sources: Array<{ id: string; title: string; content: string; score: number; source?: string }> = [];

      if (useRAG) {
        try {
          // RAG增强查询
          this.logger.log(`执行RAG查询: ${dto.message}`);
          
          const ragResult = await this.knowledgeBaseService.ragQuery(
            {
              query: dto.message,
              topK,
              threshold,
            },
            userId,
          );

          // 获取源文档信息
          sources = ragResult.contexts || [];

          // 调用LLM生成答案
          const llmResponse = await this.llmService.generateRAGAnswer({
            query: dto.message,
            contexts: ragResult.contexts || [],
            ragPrompt: ragResult.ragPrompt,
          });

          assistantContent = llmResponse.answer;
        } catch (error) {
          this.logger.warn(`RAG查询失败，使用纯LLM模式: ${error}`);
          // 降级处理：如果RAG失败，直接调用LLM
          assistantContent = await this.generatePlainLLMResponse(dto.message);
        }
      } else {
        // 不使用RAG，直接调用LLM
        assistantContent = await this.generatePlainLLMResponse(dto.message);
      }

      // 4. 保存AI回复并获取源文档信息
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        sources: sources.map((s) => ({
          title: s.title,
          score: s.score,
        })),
      };
      session.messages.push(assistantMessage);

      // 5. 如果标题为空，用第一条消息自动生成标题
      if (!session.title && session.messages.length === 2) {
        session.title = dto.message.substring(0, 50);
      }

      await this.chatSessionRepository.save(session);

      this.logger.log(`消息处理完成，会话ID: ${session.id}`);

      // 6. 返回响应
      return {
        sessionId: session.id,
        answer: assistantContent,
        sources,
        messageCount: session.messages.length,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('发送消息失败:', error);
      throw error;
    }
  }

  /**
   * 生成纯LLM响应（不使用RAG）
   */
  private async generatePlainLLMResponse(message: string): Promise<string> {
    try {
      // 这里可以调用LLM的通用接口
      const response = await this.llmService.getLLM().invoke([
        new HumanMessage(message),
      ]);

      return response.content as string;
    } catch (error) {
      this.logger.error('LLM调用失败:', error);
      throw new BadRequestException('AI助手暂时无法回答');
    }
  }

  /**
   * 创建新会话
   */
  async createSession(
    userId: string,
    title?: string,
    topic?: string,
  ): Promise<ChatSession> {
    try {
      const session = this.chatSessionRepository.create({
        ownerId: userId,
        title: title || `对话 ${new Date().toLocaleString('zh-CN')}`,
        topic,
        messages: [],
      });

      const savedSession = await this.chatSessionRepository.save(session);
      this.logger.log(`创建新会话: ${savedSession.id}`);
      return savedSession;
    } catch (error) {
      this.logger.error('创建会话失败:', error);
      throw new BadRequestException('创建会话失败');
    }
  }

  /**
   * 获取会话
   */
  async getSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    try {
      const session = await this.chatSessionRepository.findOne({
        where: {
          id: sessionId,
          ownerId: userId,
        },
      });

      return session || null;
    } catch (error) {
      this.logger.error('获取会话失败:', error);
      return null;
    }
  }

  /**
   * 获取会话详情（DTO格式）
   */
  async getSessionDetails(sessionId: string, userId: string): Promise<GetSessionDto> {
    try {
      const session = await this.getSession(sessionId, userId);

      if (!session) {
        throw new NotFoundException('会话不存在');
      }

      return {
        id: session.id,
        title: session.title,
        topic: session.topic,
        messages: session.messages,
        messageCount: session.messages.length,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    } catch (error) {
      this.logger.error('获取会话详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有会话
   */
  async getUserSessions(userId: string): Promise<Array<{
    id: string;
    title?: string;
    topic?: string;
    messageCount: number;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    try {
      const sessions = await this.chatSessionRepository.find({
        where: { ownerId: userId },
        order: { updatedAt: 'DESC' },
      });

      return sessions.map((session) => ({
        id: session.id,
        title: session.title,
        topic: session.topic,
        messageCount: session.messages.length,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));
    } catch (error) {
      this.logger.error('获取会话列表失败:', error);
      throw new BadRequestException('获取会话列表失败');
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId, userId);

      if (!session) {
        throw new NotFoundException('会话不存在');
      }

      await this.chatSessionRepository.remove(session);
      this.logger.log(`删除会话: ${sessionId}`);
    } catch (error) {
      this.logger.error('删除会话失败:', error);
      throw error;
    }
  }

  /**
   * 清空会话消息（重置对话）
   */
  async resetSession(sessionId: string, userId: string): Promise<ChatSession> {
    try {
      const session = await this.getSession(sessionId, userId);

      if (!session) {
        throw new NotFoundException('会话不存在');
      }

      session.messages = [];
      const updated = await this.chatSessionRepository.save(session);
      this.logger.log(`重置会话: ${sessionId}`);
      return updated;
    } catch (error) {
      this.logger.error('重置会话失败:', error);
      throw error;
    }
  }

  /**
   * 更新会话标题或主题
   */
  async updateSession(
    sessionId: string,
    userId: string,
    updates: { title?: string; topic?: string },
  ): Promise<ChatSession> {
    try {
      const session = await this.getSession(sessionId, userId);

      if (!session) {
        throw new NotFoundException('会话不存在');
      }

      if (updates.title !== undefined) {
        session.title = updates.title;
      }
      if (updates.topic !== undefined) {
        session.topic = updates.topic;
      }

      const updated = await this.chatSessionRepository.save(session);
      this.logger.log(`更新会话: ${sessionId}`);
      return updated;
    } catch (error) {
      this.logger.error('更新会话失败:', error);
      throw error;
    }
  }
}
