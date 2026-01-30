import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Logger, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AIAssistantService } from './services/ai-assistant.service';
import { QueryKnowledgeDto } from '../knowledge-base/dto/query-knowledge.dto';
import { Response } from 'express';

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


  // 流式发送消息
  @UseGuards(AuthGuard('jwt'))
  @Post('message/stream')
  async sendMessageStream(@Request() req: any, @Body() body: SendMessageBody, @Res() res: Response) {
    try {
      const userId = req.user.id;
      const { message, sessionId, useRAG = true, topK = 5, threshold = 0.5 } = body;

      if (!message || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: '消息内容不能为空',
        });
        return;
      }

      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // 流式处理消息
      try {
        const result = await this.aiAssistantService.processMessageStream(
          userId,
          message,
          sessionId,
          useRAG,
          topK,
          threshold,
          (chunk: string) => {
            // 每次收到数据块时发送 SSE 事件
            res.write(`data: ${JSON.stringify({
              type: 'chunk',
              data: chunk,
            })}\n\n`);
          },
        );

        // 发送最终响应
        res.write(`data: ${JSON.stringify({
          type: 'done',
          data: {
            sessionId: result.sessionId,
            sources: result.sources,
          },
        })}\n\n`);

        res.end();
      } catch (error: any) {
        this.logger.error('流式处理消息失败:', error);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: error.message || '流式处理失败',
        })}\n\n`);
        res.end();
      }
    } catch (error: any) {
      this.logger.error('发送流式消息失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '发送流式消息失败',
      });
    }
  }
}
