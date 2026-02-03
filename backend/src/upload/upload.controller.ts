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

const getMulterOptions = () => {
  return {
    storage: diskStorage({
      destination: path.join(process.cwd(), 'uploads'),
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
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
