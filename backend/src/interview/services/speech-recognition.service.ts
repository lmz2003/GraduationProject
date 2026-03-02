import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Readable } from 'stream';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  duration?: number;
  language?: string;
}

@Injectable()
export class SpeechRecognitionService {
  private readonly logger = new Logger(SpeechRecognitionService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('LLM_API_KEY');
    const baseUrl = this.configService.get<string>('LLM_BASE_URL');
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'openai';

    // Whisper API 仅支持 OpenAI 官方端点，或者支持 whisper 的兼容端点
    // 如果使用硅基流动等第三方，需要确认其是否支持 Whisper
    if (provider === 'siliconflow' && baseUrl) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: baseUrl,
      });
    } else {
      this.openai = new OpenAI({
        apiKey,
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      });
    }
  }

  /**
   * 转录音频文件（支持 webm, mp3, wav, m4a 等格式）
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    options: {
      language?: string;
      fileName?: string;
      mimeType?: string;
    } = {},
  ): Promise<TranscriptionResult> {
    const { language = 'zh', fileName = 'audio.webm', mimeType = 'audio/webm' } = options;

    this.logger.log(`[语音识别] 开始转录，文件: ${fileName}, 大小: ${audioBuffer.length} bytes`);

    try {
      // 将 Buffer 转为 File 对象
      const audioFile = new File([audioBuffer], fileName, { type: mimeType });

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language,
        response_format: 'verbose_json',
      });

      const result: TranscriptionResult = {
        text: transcription.text,
        language: (transcription as any).language || language,
        duration: (transcription as any).duration || undefined,
      };

      this.logger.log(`[语音识别] 转录成功: "${result.text.substring(0, 50)}..."`);
      return result;
    } catch (error) {
      this.logger.error('[语音识别] 转录失败:', error);
      throw new Error(`语音识别失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从 base64 编码的音频数据转录
   */
  async transcribeBase64Audio(
    base64Audio: string,
    options: {
      language?: string;
      mimeType?: string;
    } = {},
  ): Promise<TranscriptionResult> {
    const { language = 'zh', mimeType = 'audio/webm' } = options;

    // 去除 data URL 前缀（如果有）
    const base64Data = base64Audio.includes(',')
      ? base64Audio.split(',')[1]
      : base64Audio;

    const audioBuffer = Buffer.from(base64Data, 'base64');
    const extension = this.getExtensionFromMimeType(mimeType);

    return this.transcribeAudio(audioBuffer, {
      language,
      fileName: `audio.${extension}`,
      mimeType,
    });
  }

  /**
   * 检测音频中是否有语音活动（VAD）
   * 简单实现：检查音频数据的大小（实际项目中应使用专业VAD库）
   */
  detectVoiceActivity(audioBuffer: Buffer): boolean {
    // 简单判断：音频数据超过1KB认为有语音
    return audioBuffer.length > 1024;
  }

  /**
   * 根据 MIME 类型获取文件扩展名
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'mp4',
      'audio/m4a': 'm4a',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
    };
    return mimeToExt[mimeType] || 'webm';
  }
}
