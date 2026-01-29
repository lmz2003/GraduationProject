import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AIAssistantService } from './services/ai-assistant.service';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthRequest extends Request {
  user?: {
    id: string;
    githubId: string;
    githubUsername?: string;
    name?: string;
    avatar?: string;
    email?: string;
  };
}

@Controller('ai-assistant')
@UseGuards(AuthGuard('jwt'))
export class AIAssistantController {
  constructor(private readonly aiAssistantService: AIAssistantService) {}

  /**
   * 发送消息（单轮或多轮对话）
   */
  @Post('message')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const response = await this.aiAssistantService.sendMessage(
        sendMessageDto,
        userId,
      );

      return {
        success: true,
        message: '消息处理成功',
        data: response,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '消息处理失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 创建新会话
   */
  @Post('sessions')
  async createSession(
    @Body() dto: { title?: string; topic?: string },
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const session = await this.aiAssistantService.createSession(
        userId,
        dto.title,
        dto.topic,
      );

      return {
        success: true,
        message: '会话创建成功',
        data: {
          id: session.id,
          title: session.title,
          topic: session.topic,
          createdAt: session.createdAt,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '创建会话失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取用户的所有会话
   */
  @Get('sessions')
  async getUserSessions(@Request() req: AuthRequest) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const sessions = await this.aiAssistantService.getUserSessions(userId);

      return {
        success: true,
        message: '获取会话列表成功',
        data: sessions,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取会话列表失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取会话详情
   */
  @Get('sessions/:sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const session = await this.aiAssistantService.getSessionDetails(
        sessionId,
        userId,
      );

      return {
        success: true,
        message: '获取会话成功',
        data: session,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取会话失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 更新会话（标题、主题）
   */
  @Put('sessions/:sessionId')
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: { title?: string; topic?: string },
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const session = await this.aiAssistantService.updateSession(
        sessionId,
        userId,
        dto,
      );

      return {
        success: true,
        message: '会话更新成功',
        data: {
          id: session.id,
          title: session.title,
          topic: session.topic,
          updatedAt: session.updatedAt,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '更新会话失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 重置会话（清空消息）
   */
  @Post('sessions/:sessionId/reset')
  async resetSession(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.aiAssistantService.resetSession(sessionId, userId);

      return {
        success: true,
        message: '会话已重置',
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '重置会话失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 删除会话
   */
  @Delete('sessions/:sessionId')
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.aiAssistantService.deleteSession(sessionId, userId);

      return {
        success: true,
        message: '会话已删除',
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '删除会话失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }
}
