import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadService } from './upload.service';
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
      destination: path.join(process.cwd(), 'uploads'),
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const originalBaseName = path.basename(file.originalname, ext);
        const fixedBaseName = fixFileNameEncoding(originalBaseName);
        cb(null, `${fixedBaseName}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  };
};

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', getMulterOptions()))
  uploadImage(@UploadedFile() file: UploadedFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = this.uploadService.uploadImage(file);
      return {
        code: 0,
        message: 'Image uploaded successfully',
        data: result,
        url: result.url,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      return {
        code: 1,
        message: errorMessage,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }
}
