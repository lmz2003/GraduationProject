import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios from 'axios';

export interface VideoFrameAnalysis {
  timestamp: number;
  emotions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down';
  eyeContact: boolean;
  faceDetected: boolean;
  confidence: number;
}

export interface VideoAnalysisSummary {
  totalFrames: number;
  averageEmotions: Record<string, number>;
  dominantEmotion: string;
  eyeContactRatio: number;
  gazeDistribution: Record<string, number>;
  faceDetectionRatio: number;
  overallScore: number;
  feedback: string[];
}

export interface VideoAnalysisOptions {
  frameInterval?: number;
  maxFrames?: number;
}

@Injectable()
export class VideoAnalysisService {
  private readonly logger = new Logger(VideoAnalysisService.name);
  private apiKey: string;
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LLM_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('LLM_BASE_URL') || 'https://api.siliconflow.cn/v1';
  }

  async analyzeFrame(
    imageBuffer: Buffer,
    timestamp: number,
  ): Promise<VideoFrameAnalysis> {
    this.logger.debug(`[视频分析] 分析帧，时间戳: ${timestamp}ms`);

    const defaultResult: VideoFrameAnalysis = {
      timestamp,
      emotions: {
        neutral: 0.5,
        happy: 0.1,
        sad: 0.1,
        angry: 0.1,
        fearful: 0.1,
        disgusted: 0.1,
        surprised: 0.1,
      },
      gazeDirection: 'center',
      eyeContact: true,
      faceDetected: true,
      confidence: 0.5,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'Qwen/Qwen2-VL-72B-Instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                  },
                },
                {
                  type: 'text',
                  text: this.getFacialAnalysisPrompt(),
                },
              ],
            },
          ],
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const content = response.data.choices?.[0]?.message?.content || '';
      return this.parseAnalysisResult(content, timestamp);
    } catch (error) {
      const errorMsg = axios.isAxiosError(error)
        ? `${error.response?.status} - ${JSON.stringify(error.response?.data)}`
        : (error instanceof Error ? error.message : '未知错误');
      this.logger.warn(`[视频分析] 帧分析失败: ${errorMsg}，使用默认值`);
      return defaultResult;
    }
  }

  async analyzeFrameBase64(
    base64Image: string,
    timestamp: number,
  ): Promise<VideoFrameAnalysis> {
    const base64Data = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    const imageBuffer = Buffer.from(base64Data, 'base64');
    return this.analyzeFrame(imageBuffer, timestamp);
  }

  generateSummary(analyses: VideoFrameAnalysis[]): VideoAnalysisSummary {
    if (analyses.length === 0) {
      return {
        totalFrames: 0,
        averageEmotions: {},
        dominantEmotion: 'neutral',
        eyeContactRatio: 0,
        gazeDistribution: {},
        faceDetectionRatio: 0,
        overallScore: 0,
        feedback: ['未检测到视频数据'],
      };
    }

    const emotionSums: Record<string, number> = {};
    const gazeCounts: Record<string, number> = {};
    let eyeContactCount = 0;
    let faceDetectedCount = 0;

    for (const analysis of analyses) {
      if (analysis.faceDetected) {
        faceDetectedCount++;
        for (const [emotion, value] of Object.entries(analysis.emotions)) {
          emotionSums[emotion] = (emotionSums[emotion] || 0) + value;
        }
        if (analysis.eyeContact) {
          eyeContactCount++;
        }
        gazeCounts[analysis.gazeDirection] = (gazeCounts[analysis.gazeDirection] || 0) + 1;
      }
    }

    const averageEmotions: Record<string, number> = {};
    for (const [emotion, sum] of Object.entries(emotionSums)) {
      averageEmotions[emotion] = sum / faceDetectedCount;
    }

    let dominantEmotion = 'neutral';
    let maxEmotionValue = 0;
    for (const [emotion, value] of Object.entries(averageEmotions)) {
      if (value > maxEmotionValue) {
        maxEmotionValue = value;
        dominantEmotion = emotion;
      }
    }

    const eyeContactRatio = faceDetectedCount > 0 ? eyeContactCount / faceDetectedCount : 0;
    const faceDetectionRatio = analyses.length > 0 ? faceDetectedCount / analyses.length : 0;

    const gazeDistribution: Record<string, number> = {};
    for (const [direction, count] of Object.entries(gazeCounts)) {
      gazeDistribution[direction] = count / faceDetectedCount;
    }

    const overallScore = this.calculateOverallScore(
      eyeContactRatio,
      faceDetectionRatio,
      averageEmotions,
      gazeDistribution,
    );

    const feedback = this.generateFeedback(
      eyeContactRatio,
      faceDetectionRatio,
      dominantEmotion,
      gazeDistribution,
    );

    return {
      totalFrames: analyses.length,
      averageEmotions,
      dominantEmotion,
      eyeContactRatio,
      gazeDistribution,
      faceDetectionRatio,
      overallScore,
      feedback,
    };
  }

  private getFacialAnalysisPrompt(): string {
    return `分析这张人脸图像，返回以下信息的JSON格式：
{
  "emotions": {
    "neutral": 0-1之间的数值,
    "happy": 0-1之间的数值,
    "sad": 0-1之间的数值,
    "angry": 0-1之间的数值,
    "fearful": 0-1之间的数值,
    "disgusted": 0-1之间的数值,
    "surprised": 0-1之间的数值
  },
  "gazeDirection": "center/left/right/up/down",
  "eyeContact": true/false,
  "faceDetected": true/false,
  "confidence": 0-1之间的数值
}

只返回JSON，不要其他解释。如果无法检测到人脸，faceDetected设为false，其他字段使用默认值。`;
  }

  private parseAnalysisResult(content: string, timestamp: number): VideoFrameAnalysis {
    const defaultResult: VideoFrameAnalysis = {
      timestamp,
      emotions: {
        neutral: 0.5,
        happy: 0.1,
        sad: 0.1,
        angry: 0.1,
        fearful: 0.1,
        disgusted: 0.1,
        surprised: 0.1,
      },
      gazeDirection: 'center',
      eyeContact: true,
      faceDetected: true,
      confidence: 0.5,
    };

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return defaultResult;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        timestamp,
        emotions: parsed.emotions || defaultResult.emotions,
        gazeDirection: parsed.gazeDirection || 'center',
        eyeContact: parsed.eyeContact !== false,
        faceDetected: parsed.faceDetected !== false,
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      this.logger.warn(`[视频分析] 解析结果失败: ${error}`);
      return defaultResult;
    }
  }

  private calculateOverallScore(
    eyeContactRatio: number,
    faceDetectionRatio: number,
    averageEmotions: Record<string, number>,
    gazeDistribution: Record<string, number>,
  ): number {
    let score = 0;

    score += eyeContactRatio * 30;

    score += faceDetectionRatio * 20;

    const positiveEmotions = (averageEmotions['neutral'] || 0) + (averageEmotions['happy'] || 0);
    const negativeEmotions = (averageEmotions['sad'] || 0) + (averageEmotions['angry'] || 0) + 
                            (averageEmotions['fearful'] || 0);
    const emotionScore = Math.max(0, (positiveEmotions - negativeEmotions * 0.5)) * 30;
    score += emotionScore;

    const centerGaze = gazeDistribution['center'] || 0;
    score += centerGaze * 20;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private generateFeedback(
    eyeContactRatio: number,
    faceDetectionRatio: number,
    dominantEmotion: string,
    gazeDistribution: Record<string, number>,
  ): string[] {
    const feedback: string[] = [];

    if (eyeContactRatio < 0.5) {
      feedback.push('建议增加与面试官的眼神交流，保持自信的目光接触');
    } else if (eyeContactRatio > 0.85) {
      feedback.push('眼神交流很好，展现了自信和专注');
    }

    if (faceDetectionRatio < 0.8) {
      feedback.push('建议保持在摄像头视野范围内，确保面部始终可见');
    }

    const emotionFeedback: Record<string, string> = {
      happy: '面试过程中保持了积极愉悦的表情，给人留下好印象',
      sad: '建议保持更积极的表情，展现对职位的热情',
      angry: '注意控制情绪，保持平和友善的表情',
      fearful: '建议放松心态，展现自信的一面',
      neutral: '表情自然得体，保持了专业的面试状态',
    };

    if (emotionFeedback[dominantEmotion]) {
      feedback.push(emotionFeedback[dominantEmotion]);
    }

    const leftGaze = gazeDistribution['left'] || 0;
    const rightGaze = gazeDistribution['right'] || 0;
    if (leftGaze > 0.3 || rightGaze > 0.3) {
      feedback.push('建议减少视线游离，保持对面试官的关注');
    }

    if (feedback.length === 0) {
      feedback.push('整体表现良好，继续保持专业的面试状态');
    }

    return feedback;
  }
}
