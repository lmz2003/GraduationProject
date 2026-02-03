import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAssistantSession } from '../entities/ai-assistant-session.entity';
import { AIAssistantMessage } from '../entities/ai-assistant-message.entity';
import { LLMIntegrationService } from '../../knowledge-base/services/llm-integration.service';
import { KnowledgeBaseService } from '../../knowledge-base/services/knowledge-base.service';

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);
  
  // 存储用于中止流式生成的 AbortSignal，key 为 `${userId}:${sessionId}`
  private abortSignals: Map<string, AbortController> = new Map();

  constructor(
    @InjectRepository(AIAssistantSession)
    private sessionRepository: Repository<AIAssistantSession>,
    @InjectRepository(AIAssistantMessage)
    private messageRepository: Repository<AIAssistantMessage>,
    private llmIntegrationService: LLMIntegrationService,
    private knowledgeBaseService: KnowledgeBaseService,
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

  /**
   * 注册一个请求的中止控制器
   */
  registerAbortController(userId: string, requestId: string): AbortController {
    const key = `${userId}:${requestId}`;
    const controller = new AbortController();
    this.abortSignals.set(key, controller);
    this.logger.log(`[中止管理] 注册请求: ${key}`);
    return controller;
  }

  /**
   * 中止一个请求
   */
  abortRequest(userId: string, requestId: string): boolean {
    const key = `${userId}:${requestId}`;
    const controller = this.abortSignals.get(key);
    if (controller) {
      this.logger.log(`[中止管理] 中止请求: ${key}`);
      controller.abort();
      return true;
    }
    this.logger.warn(`[中止管理] 未找到请求: ${key}`);
    return false;
  }

  /**
   * 清理一个请求的资源
   */
  cleanupAbortController(userId: string, requestId: string): void {
    const key = `${userId}:${requestId}`;
    this.abortSignals.delete(key);
    this.logger.debug(`[中止管理] 清理请求: ${key}`);
  }

  /**
   * 检查一个请求是否已中止
   */
  isAborted(userId: string, requestId: string): boolean {
    const key = `${userId}:${requestId}`;
    const controller = this.abortSignals.get(key);
    return controller?.signal.aborted ?? false;
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


  /**
   * 流式生成 AI 答案
   */
  async generateAnswerStream(
    message: string,
    userId: string,
    useRAG: boolean = true,
    topK: number = 5,
    threshold: number = 0.5,
    onChunk: (chunk: string) => void,
    sessionId?: string,
    requestId?: string,
  ): Promise<{
    answer: string;
    sources: Array<{ title: string; score: number }>;
  }> {
    let sources: Array<{ title: string; score: number }> = [];

    this.logger.log(`[流式生成] 开始生成答案 - 用户: ${userId}, 会话: ${sessionId || '无'}, RAG: ${useRAG}`);

    try {
      // 获取会话历史（如果存在会话 ID）
      let conversationHistory = '';
      if (sessionId) {
        try {
          this.logger.log('[流式生成] 获取会话历史...');
          const { messages: sessionMessages } = await this.getSession(sessionId, userId);
          
          // 构建对话历史（只保留用户和助手的消息，排除当前消息）
          if (sessionMessages && sessionMessages.length > 0) {
            // 排除最后一条（当前用户消息）
            const historyMessages = sessionMessages.slice(0, -1);
            
            if (historyMessages.length > 0) {
              conversationHistory = '以前的对话记录如下：\n\n';
              historyMessages.forEach((msg, index) => {
                const role = msg.role === 'user' ? '用户' : 'AI助手';
                // 限制每条消息的长度，避免过长的历史影响生成效率
                const content = msg.content.length > 500 
                  ? msg.content.substring(0, 500) + '...' 
                  : msg.content;
                conversationHistory += `${role}：${content}\n\n`;
              });
              conversationHistory += '---\n\n当前用户的新问题：\n';
              this.logger.log(`[流式生成] 获取了 ${historyMessages.length} 条历史消息`);
            }
          }
        } catch (error) {
          this.logger.warn('获取会话历史失败，继续不使用历史:', error);
        }
      }

      if (useRAG) {
        // 使用知识库增强
        let ragResult: any = null;
        let hasRagError = false;

        try {
          this.logger.log('[流式生成] 开始 RAG 查询...');
          ragResult = await this.knowledgeBaseService.ragQuery(
            { query: message, topK, threshold },
            userId,
          );
          this.logger.log(`[流式生成] RAG 查询完成，找到 ${ragResult?.contexts?.length || 0} 个相关文档`);
        } catch (ragError) {
          this.logger.warn('RAG 查询失败，自动降级到直接调用 LLM:', ragError);
          hasRagError = true;
        }

        // 构建 RAG 提示词
        let ragPrompt = '';
        
        if (!hasRagError && ragResult?.contexts && ragResult.contexts.length > 0) {
          const contextsText = ragResult.contexts
            .map((ctx: any, idx: number) => `[${idx + 1}] ${ctx.title}:\n${ctx.content}`)
            .join('\n\n');

          ragPrompt = `你是一个有帮助的AI助手。

${conversationHistory}

用户问题：${message}

以下是一些可能相关的参考资料（作为补充信息）：
${contextsText}

请使用你的知识和上述参考资料来回答用户的问题。如果参考资料有帮助，可以参考；如果没有相关资料或参考资料不够准确，可以基于你的通用知识直接回答。生成回答时不用提到基于参考资料类似的话术。`;

          sources = ragResult.contexts.map((ctx: any) => ({
            title: ctx.title,
            score: ctx.score,
          }));
          this.logger.log(`[流式生成] RAG 提示词构建完成，使用 ${sources.length} 个来源`);
        } else {
          if (hasRagError) {
            this.logger.log('知识库查询失败，使用 LLM 通用知识回答');
          }
          ragPrompt = `${conversationHistory}${message}\n\n请直接回答上述问题。`;
          sources = [];
          this.logger.log('[流式生成] 使用通用知识模式回答');
        }

        // 调用 LLM 进行流式生成
        try {
          this.logger.log('[流式生成] 开始调用 LLM 流式生成...');
          
          const response = await this.llmIntegrationService.generateRAGAnswerStream(
            {
              query: message,
              contexts: ragResult?.contexts || [],
              ragPrompt,
            },
            onChunk,
            // 中止检查函数：在 LLM 流中直接检查中止状态
            requestId ? () => this.isAborted(userId, requestId) : undefined,
          );
          this.logger.log(`[流式生成] LLM 流式生成完成，答案长度: ${response.answer.length}`);
          return { answer: response.answer, sources };
        } catch (error) {
          // 检查是否是由中止导致的错误
          if (requestId && this.isAborted(userId, requestId)) {
            this.logger.log('[流式生成] 请求已中止，不返回错误消息');
            return { answer: '', sources };
          }
          
          this.logger.warn('LLM 流式调用失败，错误信息:', error);
          const errorMessage = `我收到了你的问题："${message}"，但暂时无法给出回答。`;
          onChunk(errorMessage);
          return { answer: errorMessage, sources };
        }
      } else {
        // 不使用知识库，直接调用LLM
        this.logger.log('[流式生成] 不使用知识库，直接调用 LLM...');
        try {
          const response = await this.llmIntegrationService.generateRAGAnswerStream(
            {
              query: message,
              contexts: [],
              ragPrompt: `${conversationHistory}${message}\n\n请直接回答上述问题。`,
            },
            onChunk,
            // 中止检查函数：在 LLM 流中直接检查中止状态
            requestId ? () => this.isAborted(userId, requestId) : undefined,
          );
          this.logger.log(`[流式生成] LLM 流式生成完成，答案长度: ${response.answer.length}`);
          return { answer: response.answer, sources };
        } catch (error) {
          // 检查是否是由中止导致的错误
          if (requestId && this.isAborted(userId, requestId)) {
            this.logger.log('[流式生成] 请求已中止，不返回错误消息');
            return { answer: '', sources };
          }
          
          this.logger.warn('LLM 流式调用失败，错误信息:', error);
          const errorMessage = `我收到了你的问题："${message}"，但暂时无法给出回答。`;
          onChunk(errorMessage);
          return { answer: errorMessage, sources };
        }
      }
    } catch (error) {
      this.logger.error('流式生成答案失败:', error);
      throw new BadRequestException('流式生成答案失败');
    }
  }

  /**
   * 处理流式用户消息
   */
  async processMessageStream(
    userId: string,
    message: string,
    sessionId?: string,
    useRAG: boolean = true,
    topK: number = 5,
    threshold: number = 0.5,
    onChunk?: (chunk: string) => void,
    requestId?: string,
  ): Promise<{
    answer: string;
    sources: Array<{ title: string; score: number }>;
    sessionId: string;
  }> {
    this.logger.log(`[流式处理] 开始处理消息 - 用户: ${userId}, 消息: "${message.substring(0, 50)}..."`);
    
    try {
      // 创建或获取会话
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        this.logger.log('[流式处理] 创建新会话...');
        const session = await this.createSession(userId, message);
        currentSessionId = session.id;
        this.logger.log(`[流式处理] 新会话创建成功: ${currentSessionId}`);
      } else {
        this.logger.log(`[流式处理] 使用现有会话: ${currentSessionId}`);
      }

      // 存储用户消息
      this.logger.log('[流式处理] 存储用户消息...');
      await this.addMessage(currentSessionId, userId, message, 'user');

      // 流式生成 AI 回复
      const { answer, sources } = await this.generateAnswerStream(
        message,
        userId,
        useRAG,
        topK,
        threshold,
        (chunk: string) => {
          // 确保只发送非空字符串
          if (chunk && chunk.trim().length > 0) {
            if (onChunk) {
              onChunk(chunk);
            }
          }
        },
        currentSessionId, // 传递会话 ID，以便获取历史对话
        requestId, // 传递请求 ID，用于中止
      );

      // 只有当有实际内容时才存储 AI 回复
      if (answer && answer.trim().length > 0) {
        // 存储 AI 回复
        this.logger.log('[流式处理] 存储 AI 回复...');
        await this.addMessage(currentSessionId, userId, answer, 'assistant', sources);
        this.logger.log('[流式处理] AI 回复存储成功');
      } else if (requestId && this.isAborted(userId, requestId)) {
        this.logger.log('[流式处理] 请求已被中止，跳过存储空消息');
      }

      return {
        answer,
        sources,
        sessionId: currentSessionId,
      };
    } catch (error) {
      this.logger.error('流式处理消息失败:', error);
      throw error;
    }
  }
}
