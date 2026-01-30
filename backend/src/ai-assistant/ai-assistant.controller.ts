import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AIAssistantService } from './services/ai-assistant.service';
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

@Controller('ai-assistant')
export class AIAssistantController {
  private readonly logger = new Logger(AIAssistantController.name);

  constructor(
    private aiAssistantService: AIAssistantService,
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

      // 使用服务处理消息
      const result = await this.aiAssistantService.processMessage(
        userId,
        message,
        sessionId,
        useRAG,
        topK,
        threshold,
      );

      return {
        success: true,
        data: {
          answer: result.answer,
          sessionId: result.sessionId,
          sources: result.sources,
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
