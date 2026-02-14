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
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  BadRequestException,
  Response,
  StreamableFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { ResumeAnalysisService } from './services/resume-analysis.service';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { AnalyzeResumeDto, CompareResumeDto } from './dto/analyze-resume.dto';
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
      destination: path.join(process.cwd(), 'uploads', 'resumes'),
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const originalBaseName = path.basename(file.originalname, ext);
        const fixedBaseName = fixFileNameEncoding(originalBaseName);
        cb(null, `${fixedBaseName}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req: any, file: any, cb: any) => {
      const supportedFormats = ['.pdf', '.docx', '.doc', '.txt'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (supportedFormats.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${ext}`), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
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

@Controller('resume-analysis')
@UseGuards(AuthGuard('jwt'))
export class ResumeAnalysisController {
  private readonly logger = new Logger('ResumeAnalysisController');

  constructor(private readonly resumeAnalysisService: ResumeAnalysisService) {}

  /**
   * 上传简历（文本或文件）
   * 必须在 GET :id 之前定义
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', getMulterOptions()))
  async uploadResume(
    @Body() dto: UploadResumeDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req: AuthRequest
  ) {
    const userId = req.user?.id as string;

    try {
      let resume;

      if (file) {
        // 文件上传
        this.logger.log(`[Upload] File upload started: ${file.originalname} (${file.size} bytes) by user ${userId}`);
        this.logger.log(`[Upload] File path: ${file.path}`);
        this.logger.log(`[Upload] Resume title: ${dto.title}`);
        
        resume = await this.resumeAnalysisService.uploadResumeFile(
          dto.title,
          file.path,
          file.originalname,
          path.extname(file.originalname),
          file.size,
          userId
        );
        
        this.logger.log(`[Upload] Resume file uploaded successfully. Resume ID: ${resume.id}`);
      } else {
        // 文本上传
        if (!dto.content || dto.content.trim().length === 0) {
          throw new BadRequestException('Resume content is required');
        }
        this.logger.log(`[Upload] Text resume upload started: ${dto.title} by user ${userId}`);
        
        resume = await this.resumeAnalysisService.uploadResume(dto, userId);
        
        this.logger.log(`[Upload] Resume text uploaded successfully. Resume ID: ${resume.id}`);
      }

      return {
        code: 0,
        message: 'Resume uploaded successfully',
        data: resume,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[Upload] Upload failed: ${errorMsg}`, error instanceof Error ? error.stack : '');
      throw new HttpException(
        {
          code: -1,
          message: `Upload failed: ${errorMsg}`,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 获取简历 PDF 二进制数据
   * 必须在 GET :id 之前定义（更具体的路由）
   */
  @Get(':id/pdf')
  async getResumePdf(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Response({ passthrough: true }) res: any
  ) {
    const userId = req.user?.id as string;
    const resume = await this.resumeAnalysisService.getResumeById(id, userId);

    if (!resume.fileBinary) {
      throw new HttpException(
        {
          code: -1,
          message: 'PDF file not found',
        },
        HttpStatus.NOT_FOUND
      );
    }

    // 设置响应头
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${resume.fileName || 'resume.pdf'}"`,
      'Content-Length': resume.fileBinary.length,
    });

    return new StreamableFile(resume.fileBinary);
  }

  /**
   * 获取简历分析结果
   * 必须在 GET :id 之前定义（更具体的路由）
   */
  @Get(':id/analysis')
  async getAnalysis(@Param('id') id: string, @Request() req: AuthRequest) {
    const userId = req.user?.id as string;
    const analysis = await this.resumeAnalysisService.getResumeAnalysis(id, userId);

    // 解析 JSON 字符串字段
    const result = {
      ...analysis,
      strengths: analysis.strengths ? JSON.parse(analysis.strengths) : [],
      weaknesses: analysis.weaknesses ? JSON.parse(analysis.weaknesses) : [],
      suggestions: analysis.suggestions ? JSON.parse(analysis.suggestions) : {},
      keywordAnalysis: analysis.keywordAnalysis ? JSON.parse(analysis.keywordAnalysis) : {},
      structureAnalysis: analysis.structureAnalysis
        ? JSON.parse(analysis.structureAnalysis)
        : {},
      contentAnalysis: analysis.contentAnalysis ? JSON.parse(analysis.contentAnalysis) : {},
    };

    return {
      code: 0,
      message: 'ok',
      data: result,
    };
  }

  /**
   * 对标职位描述
   * 必须在 GET :id 之前定义（更具体的路由）
   */
  @Post(':id/compare')
  async compareWithJob(
    @Param('id') id: string,
    @Body() body: { jobDescription: string },
    @Request() req: AuthRequest
  ) {
    const userId = req.user?.id as string;
    const analysis = await this.resumeAnalysisService.compareWithJobDescription(
      id,
      userId,
      body.jobDescription
    );

    return {
      code: 0,
      message: 'ok',
      data: {
        matchAnalysis: analysis,
      },
    };
  }

  /**
   * 获取用户的所有简历
   */
  @Get()
  async getResumes(@Request() req: AuthRequest) {
    const userId = req.user?.id as string;
    const resumes = await this.resumeAnalysisService.getResumesByUserId(userId);

    return {
      code: 0,
      message: 'ok',
      data: resumes,
    };
  }

  /**
   * 获取简历详情
   * 必须在最后定义（最通用的路由）
   */
  @Get(':id')
  async getResumeDetail(@Param('id') id: string, @Request() req: AuthRequest) {
    const userId = req.user?.id as string;
    const resume = await this.resumeAnalysisService.getResumeById(id, userId);

    return {
      code: 0,
      message: 'ok',
      data: resume,
    };
  }

  /**
   * 更新简历
   */
  @Put(':id')
  async updateResume(
    @Param('id') id: string,
    @Body() body: { title: string; content: string },
    @Request() req: AuthRequest
  ) {
    const userId = req.user?.id as string;
    const resume = await this.resumeAnalysisService.updateResume(id, userId, body.title, body.content);

    return {
      code: 0,
      message: 'Resume updated successfully',
      data: resume,
    };
  }

  /**
   * 删除简历
   */
  @Delete(':id')
  async deleteResume(@Param('id') id: string, @Request() req: AuthRequest) {
    const userId = req.user?.id as string;
    await this.resumeAnalysisService.deleteResume(id, userId);

    return {
      code: 0,
      message: 'Resume deleted successfully',
    };
  }
}
