import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAssistantSession } from '../entities/ai-assistant-session.entity';
import { AIAssistantMessage } from '../entities/ai-assistant-message.entity';
import { LLMIntegrationService } from '../../knowledge-base/services/llm-integration.service';

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);

  constructor(
    @InjectRepository(AIAssistantSession)
    private sessionRepository: Repository<AIAssistantSession>,
    @InjectRepository(AIAssistantMessage)
    private messageRepository: Repository<AIAssistantMessage>,
    private llmIntegrationService: LLMIntegrationService,
  ) {}

  // 获取用户的会话列表
  async getSessions(userId: string): Promise<AIAssistantSession[]> {
    try {
      return await this.sessionRepository.find({
        where: { userId },
        order: { updatedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('获取会话列表失败:', error);
      throw new BadRequestException('获取会话列表失败');
    }
  }

  // 创建新会话并生成标题
  async createSession(userId: string, initialMessage: string): Promise<AIAssistantSession> {
    try {
      // 生成会话标题
      const title = await this.generateSessionTitle(initialMessage);

      // 创建会话
      const session = this.sessionRepository.create({
        userId,
        title,
        messageCount: 0,
      });

      const savedSession = await this.sessionRepository.save(session);
      this.logger.log(`会话创建成功: ${savedSession.id}, 标题: ${title}`);

      return savedSession;
    } catch (error) {
      this.logger.error('创建会话失败:', error);
      throw new BadRequestException('创建会话失败');
    }
  }

  // 获取会话详情和消息
  async getSession(sessionId: string, userId: string): Promise<{
    session: AIAssistantSession;
    messages: AIAssistantMessage[];
  }> {
    try {
      // 查找会话
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundException('会话不存在');
      }

      // 查找会话的消息
      const messages = await this.messageRepository.find({
        where: { sessionId },
        order: { timestamp: 'ASC' },
      });

      return { session, messages };
    } catch (error) {
      this.logger.error('获取会话详情失败:', error);
      throw error;
    }
  }

  // 删除会话
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      // 查找会话
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundException('会话不存在');
      }

      // 删除会话的所有消息
      await this.messageRepository.delete({ sessionId });

      // 删除会话
      await this.sessionRepository.remove(session);

      this.logger.log(`会话删除成功: ${sessionId}`);
    } catch (error) {
      this.logger.error('删除会话失败:', error);
      throw error;
    }
  }

  // 添加消息
  async addMessage(
    sessionId: string,
    userId: string,
    content: string,
    role: 'user' | 'assistant',
    sources?: Array<{ title: string; score: number }>,
  ): Promise<AIAssistantMessage> {
    try {
      // 创建消息
      const message = this.messageRepository.create({
        sessionId,
        userId,
        content,
        role,
        sources: sources || null,
      });

      const savedMessage = await this.messageRepository.save(message);

      // 更新会话的消息数量
      await this.updateSessionMessageCount(sessionId);

      this.logger.log(`消息添加成功: ${savedMessage.id}, 角色: ${role}`);

      return savedMessage;
    } catch (error) {
      this.logger.error('添加消息失败:', error);
      throw new BadRequestException('添加消息失败');
    }
  }

  // 更新会话的消息数量
  private async updateSessionMessageCount(sessionId: string): Promise<void> {
    try {
      // 计算消息数量
      const messageCount = await this.messageRepository.count({
        where: { sessionId },
      });

      // 更新会话
      await this.sessionRepository.update(sessionId, {
        messageCount,
      });
    } catch (error) {
      this.logger.error('更新会话消息数量失败:', error);
    }
  }

  // 生成会话标题
  private async generateSessionTitle(message: string): Promise<string> {
    try {
      // 使用LLM生成标题
      const prompt = `请从以下消息中提炼出一个简洁的标题，不超过50个字符，用于AI助手的会话标识：\n\n${message}`;

      // 调用LLM服务
      const response = await this.llmIntegrationService.generateRAGAnswer({
        query: '生成会话标题',
        contexts: [],
        ragPrompt: prompt,
      });

      let title = response.answer.trim();

      // 清理标题
      title = title.replace(/^"|"$/g, ''); // 移除引号
      title = title.substring(0, 50); // 限制长度

      // 如果生成失败，使用默认标题
      if (!title || title.length === 0) {
        title = '新会话';
      }

      return title;
    } catch (error) {
      this.logger.warn('生成会话标题失败，使用默认标题:', error);
      return '新会话';
    }
  }
}
