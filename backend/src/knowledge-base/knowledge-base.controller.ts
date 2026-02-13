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
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { DocumentUploadService } from './services/document-upload.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryKnowledgeDto } from './dto/query-knowledge.dto';
import * as path from 'path';
import * as iconv from 'iconv-lite';

const fixFileNameEncoding = (fileName: string): string => {
  try {
    const hasGarbledChars = /[\u00E4\u00E5\u00F6\u00FC\u00C4\u00C5\u00D6\u00DC]/.test(fileName);
    
    if (hasGarbledChars) {
      try {
        const decoded = iconv.decode(iconv.encode(fileName, 'latin1'), 'utf8');
        if (decoded && decoded.length > 0) {
          return decoded;
        }
      } catch (e) {
        return fileName;
      }
    }

    const hasChinese = /[\u4e00-\u9fa5]/.test(fileName);
    if (!hasChinese && fileName.length > 0) {
      try {
        const decoded = iconv.decode(iconv.encode(fileName, 'latin1'), 'utf8');
        if (decoded && /[\u4e00-\u9fa5]/.test(decoded)) {
          return decoded;
        }
      } catch (e) {
        return fileName;
      }
    }

    return fileName;
  } catch (error) {
    return fileName;
  }
};

const getMulterOptions = () => {
  return {
    storage: diskStorage({
      destination: path.join(process.cwd(), 'uploads', 'documents'),
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const originalBaseName = path.basename(file.originalname, ext);
        const fixedBaseName = fixFileNameEncoding(originalBaseName);
        cb(null, `${fixedBaseName}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req: any, file: any, cb: any) => {
      const supportedFormats = ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.md', '.json', '.txt'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (supportedFormats.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型: ${ext}`), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  };
};

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
  @UseInterceptors(FileInterceptor('file', getMulterOptions()))
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

      const uploadResult = await this.documentUploadService.uploadDocument(file);

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
  @UseInterceptors(FilesInterceptor('files', 10, getMulterOptions()))
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

      const uploadResults = await this.documentUploadService.uploadDocuments(files);

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
   * 重新处理文档
   */
  @Post('documents/:id/reprocess')
  async reprocessDocument(@Param('id') documentId: string, @Request() req: AuthRequest) {
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
      const document = await this.knowledgeBaseService.reprocessDocument(documentId, userId);
      return {
        success: true,
        message: '文档已重新处理',
        data: document,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '重新处理文档失败',
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