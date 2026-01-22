import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`✅ 已创建上传目录: ${this.uploadDir}`);
    } else {
      console.log(`✅ 上传目录已存在: ${this.uploadDir}`);
    }
  }

  /**
   * 上传图片
   * @param file 图片文件
   * @returns 图片 URL
   */
  uploadImage(file: UploadedFile): { url: string } {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // 验证文件类型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // 生成唯一文件名
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}-${random}${ext}`;
      const filepath = path.join(this.uploadDir, filename);

      // 保存文件
      fs.writeFileSync(filepath, file.buffer);

      // 返回可访问的 URL
      const url = `/uploads/${filename}`;
      return { url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to upload file: ${errorMessage}`);
    }
  }
}
