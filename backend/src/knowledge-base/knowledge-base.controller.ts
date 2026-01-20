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
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryKnowledgeDto } from './dto/query-knowledge.dto';

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

@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  /**
   * 添加文档
   */
  @Post('documents')
  async addDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id || 'test-user-id';
      const document = await this.knowledgeBaseService.addDocument(createDocumentDto, userId);
      return {
        success: true,
        message: '文档已添加',
        data: document,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '添加文档失败',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 查询知识库
   */
  @Post('query')
  async queryKnowledge(
    @Body() queryDto: QueryKnowledgeDto,
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id || 'test-user-id';
      const results = await this.knowledgeBaseService.queryKnowledge(queryDto, userId);
      return {
        success: true,
        message: '查询成功',
        data: results,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '查询失败',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * RAG 查询 - 返回增强提示词
   */
  @Post('rag-query')
  async ragQuery(
    @Body() queryDto: QueryKnowledgeDto,
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id || 'test-user-id';
      const result = await this.knowledgeBaseService.ragQuery(queryDto, userId);
      return {
        success: true,
        message: 'RAG 查询成功',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'RAG 查询失败',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 获取用户的所有文档
   */
  @Get('documents')
  async getUserDocuments(@Request() req: AuthRequest) {
    try {
      const userId = req.user?.id || 'test-user-id';
      const documents = await this.knowledgeBaseService.getUserDocuments(userId);
      return {
        success: true,
        message: '获取成功',
        data: documents,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取文档失败',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 获取单个文档
   */
  @Get('documents/:id')
  async getDocument(@Param('id') documentId: string, @Request() req: AuthRequest) {
    try {
      const userId = req.user?.id || 'test-user-id';
      const document = await this.knowledgeBaseService.getDocument(documentId, userId);
      return {
        success: true,
        message: '获取成功',
        data: document,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取文档失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 更新文档
   */
  @Put('documents/:id')
  async updateDocument(
    @Param('id') documentId: string,
    @Body() updateData: Partial<CreateDocumentDto>,
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id || 'test-user-id';
      const document = await this.knowledgeBaseService.updateDocument(
        documentId,
        updateData,
        userId
      );
      return {
        success: true,
        message: '文档已更新',
        data: document,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '更新文档失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 删除文档
   */
  @Delete('documents/:id')
  async deleteDocument(@Param('id') documentId: string, @Request() req: AuthRequest) {
    try {
      const userId = req.user?.id || 'test-user-id';
      await this.knowledgeBaseService.deleteDocument(documentId, userId);
      return {
        success: true,
        message: '文档已删除',
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '删除文档失败',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 获取知识库统计信息
   */
  @Get('statistics')
  async getStatistics(@Request() req: AuthRequest) {
    try {
      const userId = req.user?.id || 'test-user-id';
      const stats = await this.knowledgeBaseService.getStatistics(userId);
      return {
        success: true,
        message: '获取成功',
        data: stats,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取统计信息失败',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}