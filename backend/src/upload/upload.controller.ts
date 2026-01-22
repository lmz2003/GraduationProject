import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = this.uploadService.uploadImage(file);
      return {
        code: 0,
        message: 'Image uploaded successfully',
        data: result,
        url: result.url, // 兼容前端现有代码
      };
    } catch (error) {
      return {
        code: 1,
        message: error.message || 'Failed to upload image',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }
}
