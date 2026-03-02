import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSOptions {
  voice?: TTSVoice;
  speed?: number; // 0.25 ~ 4.0, default 1.0
}

export interface TTSResult {
  audioBuffer: Buffer;
  format: string;
  duration?: number;
}

// 语音通话会话中用于 TTS 的缓存结构
interface TTSCacheEntry {
  audioBuffer: Buffer;
  createdAt: number;
}

@Injectable()
export class SpeechSynthesisService {
  private readonly logger = new Logger(SpeechSynthesisService.name);
  private openai: OpenAI;
  private ttsCache = new Map<string, TTSCacheEntry>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 分钟缓存

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('LLM_API_KEY');
    const baseUrl = this.configService.get<string>('LLM_BASE_URL');
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'openai';

    // TTS API 需要支持 OpenAI TTS 格式的端点
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

    // 定期清理过期缓存
    setInterval(() => this.cleanupCache(), this.CACHE_TTL_MS);
  }

  /**
   * 将文本转换为语音
   */
  async synthesizeSpeech(
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    const { voice = 'nova', speed = 1.0 } = options;

    // 检查缓存
    const cacheKey = `${text}-${voice}-${speed}`;
    const cached = this.ttsCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < this.CACHE_TTL_MS) {
      this.logger.log(`[语音合成] 命中缓存，文本: "${text.substring(0, 30)}..."`);
      return {
        audioBuffer: cached.audioBuffer,
        format: 'mp3',
      };
    }

    this.logger.log(`[语音合成] 开始合成，文本长度: ${text.length} 字符，音色: ${voice}`);

    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        speed,
        response_format: 'mp3',
      });

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      // 存入缓存
      this.ttsCache.set(cacheKey, {
        audioBuffer,
        createdAt: Date.now(),
      });

      this.logger.log(`[语音合成] 合成成功，音频大小: ${audioBuffer.length} bytes`);

      return {
        audioBuffer,
        format: 'mp3',
      };
    } catch (error) {
      this.logger.error('[语音合成] 合成失败:', error);
      throw new Error(`语音合成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 流式语音合成（用于实时播放）
   * 返回可读流，前端可以边下载边播放
   */
  async synthesizeSpeechStream(
    text: string,
    options: TTSOptions = {},
  ): Promise<{ stream: AsyncIterable<Buffer>; format: string }> {
    const { voice = 'nova', speed = 1.0 } = options;

    this.logger.log(`[语音合成流式] 开始合成，文本: "${text.substring(0, 50)}..."`);

    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        speed,
        response_format: 'mp3',
      });

      // 将响应转为 AsyncIterable<Buffer>
      const stream = this.responseToBufferStream(response);

      return { stream, format: 'mp3' };
    } catch (error) {
      this.logger.error('[语音合成流式] 合成失败:', error);
      throw new Error(`流式语音合成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取可用音色列表
   */
  getAvailableVoices(): Array<{ id: TTSVoice; name: string; description: string; gender: string }> {
    return [
      { id: 'alloy', name: 'Alloy', description: '中性、平衡的声音', gender: 'neutral' },
      { id: 'echo', name: 'Echo', description: '男性、成熟的声音', gender: 'male' },
      { id: 'fable', name: 'Fable', description: '英式口音声音', gender: 'male' },
      { id: 'onyx', name: 'Onyx', description: '男性、深沉有力的声音', gender: 'male' },
      { id: 'nova', name: 'Nova', description: '女性、清晰友好的声音', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', description: '女性、温柔的声音', gender: 'female' },
    ];
  }

  /**
   * 将 OpenAI TTS 响应转换为 Buffer 流
   */
  private async *responseToBufferStream(response: Response): AsyncIterable<Buffer> {
    const arrayBuffer = await response.arrayBuffer();
    // 分块返回，每块 4KB
    const chunkSize = 4096;
    const buffer = Buffer.from(arrayBuffer);
    for (let i = 0; i < buffer.length; i += chunkSize) {
      yield buffer.slice(i, i + chunkSize);
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.ttsCache.entries()) {
      if (now - entry.createdAt > this.CACHE_TTL_MS) {
        this.ttsCache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.log(`[语音合成] 清理了 ${cleaned} 个过期缓存条目`);
    }
  }
}
