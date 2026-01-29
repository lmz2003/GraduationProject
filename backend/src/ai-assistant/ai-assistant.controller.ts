import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AIAssistantService } from './services/ai-assistant.service';
import { KnowledgeBaseService } from '../knowledge-base/services/knowledge-base.service';
import { QueryKnowledgeDto } from '../knowledge-base/dto/query-knowledge.dto';

interface CreateSessionBody {
  initialMessage?: string;
}

interface SendMessageBody {
  message: string;
  sessionId?: string;
  useRAG?: boolean;
  topK?: number;
  threshold?: number;
}

@Controller('api/ai-assistant')
export class AIAssistantController {
  private readonly logger = new Logger(AIAssistantController.name);

  constructor(
    private aiAssistantService: AIAssistantService,
    private knowledgeBaseService: KnowledgeBaseService,
  ) {}

  // 获取会话列表
  @UseGuards(AuthGuard('jwt'))
  @Get('sessions')
  async getSessions(@Request() req: any) {
    try {
      const userId = req.user.id;
      const sessions = await this.aiAssistantService.getSessions(userId);

      return {
        success: true,
        data: sessions,
      };
    } catch (error: any) {
      this.logger.error('获取会话列表失败:', error);
      return {
        success: false,
        message: error.message || '获取会话列表失败',
      };
    }
  }

  // 创建新会话
  @UseGuards(AuthGuard('jwt'))
  @Post('sessions')
  async createSession(@Request() req: any, @Body() body: CreateSessionBody) {
    try {
      const userId = req.user.id;
      const initialMessage = body.initialMessage || '';

      const session = await this.aiAssistantService.createSession(userId, initialMessage);

      return {
        success: true,
        data: session,
      };
    } catch (error: any) {
      this.logger.error('创建会话失败:', error);
      return {
        success: false,
        message: error.message || '创建会话失败',
      };
    }
  }

  // 获取会话详情和消息
  @UseGuards(AuthGuard('jwt'))
  @Get('sessions/:id')
  async getSession(@Request() req: any, @Param('id') sessionId: string) {
    try {
      const userId = req.user.id;
      const { session, messages } = await this.aiAssistantService.getSession(sessionId, userId);

      // 转换消息格式以匹配前端期望
      const formattedMessages = messages.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        sources: message.sources,
      }));

      return {
        success: true,
        data: {
          session,
          messages: formattedMessages,
        },
      };
    } catch (error: any) {
      this.logger.error('获取会话详情失败:', error);
      return {
        success: false,
        message: error.message || '获取会话详情失败',
      };
    }
  }

  // 删除会话
  @UseGuards(AuthGuard('jwt'))
  @Delete('sessions/:id')
  async deleteSession(@Request() req: any, @Param('id') sessionId: string) {
    try {
      const userId = req.user.id;
      await this.aiAssistantService.deleteSession(sessionId, userId);

      return {
        success: true,
        message: '会话删除成功',
      };
    } catch (error: any) {
      this.logger.error('删除会话失败:', error);
      return {
        success: false,
        message: error.message || '删除会话失败',
      };
    }
  }

  // 发送消息
  @UseGuards(AuthGuard('jwt'))
  @Post('message')
  async sendMessage(@Request() req: any, @Body() body: SendMessageBody) {
    try {
      const userId = req.user.id;
      const { message, sessionId, useRAG = true, topK = 5, threshold = 0.5 } = body;

      if (!message || message.trim().length === 0) {
        throw new Error('消息内容不能为空');
      }

      let currentSessionId = sessionId;

      // 如果没有会话ID，创建新会话
      if (!currentSessionId) {
        const session = await this.aiAssistantService.createSession(userId, message);
        currentSessionId = session.id;
      }

      // 存储用户消息
      await this.aiAssistantService.addMessage(
        currentSessionId,
        userId,
        message,
        'user',
      );

      // 处理AI回复
      let answer = '';
      let sources: Array<{ title: string; score: number }> = [];

      if (useRAG) {
        // 使用知识库增强
        const ragResult = await this.knowledgeBaseService.ragQuery(
          { query: message, topK, threshold },
          userId,
        );

        // 这里应该调用LLM生成答案
        // 为了演示，我们使用一个简单的回复
        answer = `我收到了你的消息: ${message}\n\n这是一个基于知识库的回复。`;
        sources = ragResult.contexts.map(ctx => ({
          title: ctx.title,
          score: ctx.score,
        }));
      } else {
        // 不使用知识库
        answer = `我收到了你的消息: ${message}\n\n这是一个普通回复。`;
      }

      // 存储AI回复
      await this.aiAssistantService.addMessage(
        currentSessionId,
        userId,
        answer,
        'assistant',
        sources,
      );

      return {
        success: true,
        data: {
          answer,
          sessionId: currentSessionId,
          sources,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      this.logger.error('发送消息失败:', error);
      return {
        success: false,
        message: error.message || '发送消息失败',
      };
    }
  }
}
