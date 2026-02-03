import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`✅ 已创建上传目录: ${this.uploadDir}`);
    } else {
      console.log(`✅ 上传目录已存在: ${this.uploadDir}`);
    }
  }

  uploadImage(file: UploadedFile): { url: string } {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      let filename: string;

      if (file.filename) {
        filename = file.filename;
      } else if (file.buffer) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.originalname);
        filename = `${timestamp}-${random}${ext}`;
        const filepath = path.join(this.uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);
      } else {
        throw new BadRequestException('Invalid file object');
      }

      const url = `/uploads/${filename}`;
      return { url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to upload file: ${errorMessage}`);
    }
  }
}
