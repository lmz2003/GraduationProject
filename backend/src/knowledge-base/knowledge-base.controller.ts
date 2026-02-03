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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { DocumentUploadService } from './services/document-upload.service';
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
@UseGuards(AuthGuard('jwt'))
export class KnowledgeBaseController {
  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly documentUploadService: DocumentUploadService,
  ) {}

  /**
   * 上传单个文档文件
   */
  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: any, @Request() req: AuthRequest) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      if (!file) {
        throw new HttpException(
          {
            success: false,
            message: '未收到文件',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // 上传并解析文件
      const uploadResult = await this.documentUploadService.uploadDocument(file);

      // 创建文档记录
      const createDocumentDto: CreateDocumentDto = {
        title: uploadResult.parsedDocument.title,
        content: uploadResult.parsedDocument.content,
        source: uploadResult.originalFileName,
        documentType: uploadResult.parsedDocument.documentType,
        metadata: uploadResult.parsedDocument.metadata,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileMimeType: uploadResult.fileMimeType,
        fileUrl: uploadResult.fileUrl,
        uploadType: 'file',
      };

      const document = await this.knowledgeBaseService.addDocument(createDocumentDto, userId);

      return {
        success: true,
        message: '文档已上传并处理',
        data: document,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '上传文档失败',
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 批量上传文档文件
   */
  @Post('upload-documents')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadDocuments(@UploadedFiles() files: any[], @Request() req: AuthRequest) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      if (!files || files.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: '未收到任何文件',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // 上传并解析文件
      const uploadResults = await this.documentUploadService.uploadDocuments(files);

      // 创建文档记录
      const documents = [];
      for (const uploadResult of uploadResults) {
        const createDocumentDto: CreateDocumentDto = {
          title: uploadResult.parsedDocument.title,
          content: uploadResult.parsedDocument.content,
          source: uploadResult.originalFileName,
          documentType: uploadResult.parsedDocument.documentType,
          metadata: uploadResult.parsedDocument.metadata,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          fileMimeType: uploadResult.fileMimeType,
          fileUrl: uploadResult.fileUrl,
          uploadType: 'file',
        };

        try {
          const document = await this.knowledgeBaseService.addDocument(createDocumentDto, userId);
          documents.push(document);
        } catch (error: any) {
          console.error(`文档 ${uploadResult.originalFileName} 添加失败:`, error.message);
        }
      }

      return {
        success: true,
        message: `成功处理 ${documents.length} 个文档`,
        data: documents,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '批量上传文档失败',
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 添加文档
   */
  @Post('documents')
  async addDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: '未授权的请求，请先登录',
          },
          HttpStatus.UNAUTHORIZED
        );
      }
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