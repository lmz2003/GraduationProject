import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

interface RAGContext {
  query: string;
  contexts: Array<{ content: string; title: string; score: number }>;
  ragPrompt: string;
}

interface LLMResponse {
  query: string;
  answer: string;
  contexts: Array<{ title: string; score: number }>;
  model: string;
  tokensUsed?: number;
}

@Injectable()
export class LLMIntegrationService {
  private llm: ChatOpenAI;
  private readonly logger = new Logger(LLMIntegrationService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY 未配置');
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  /**
   * 使用 RAG 上下文生成答案
   */
  async generateRAGAnswer(ragContext: RAGContext): Promise<LLMResponse> {
    try {
      if (!this.llm) {
        throw new Error('LLM 未正确初始化');
      }

      // 调用 LLM
      const response = await this.llm.call(ragContext.ragPrompt);

      return {
        query: ragContext.query,
        answer: response,
        contexts: ragContext.contexts.map((c) => ({
          title: c.title,
          score: c.score,
        })),
        model: 'gpt-3.5-turbo',
      };
    } catch (error) {
      this.logger.error('LLM 调用失败:', error);
      throw error;
    }
  }

  /**
   * 创建自定义提示模板
   */
  createCustomPromptTemplate(template: string): PromptTemplate {
    return PromptTemplate.fromTemplate(template);
  }

  /**
   * 构建 LLM 链
   */
  buildLLMChain(promptTemplate: PromptTemplate): LLMChain {
    return new LLMChain({
      llm: this.llm,
      prompt: promptTemplate,
    });
  }

  /**
   * 多轮对话 RAG
   */
  async multiTurnRAGChat(
    conversationHistory: Array<{ role: string; content: string }>,
    ragContext: RAGContext
  ): Promise<LLMResponse> {
    try {
      if (!this.llm) {
        throw new Error('LLM 未正确初始化');
      }

      // 构建消息
      const messages = [
        ...conversationHistory,
        {
          role: 'system',
          content: ragContext.ragPrompt,
        },
      ];

      // 调用 LLM
      const response = await this.llm.call(JSON.stringify(messages));

      return {
        query: ragContext.query,
        answer: response,
        contexts: ragContext.contexts.map((c) => ({
          title: c.title,
          score: c.score,
        })),
        model: 'gpt-3.5-turbo',
      };
    } catch (error) {
      this.logger.error('多轮对话失败:', error);
      throw error;
    }
  }

  /**
   * 总结文档
   */
  async summarizeDocument(content: string, maxLength: number = 200): Promise<string> {
    try {
      if (!this.llm) {
        throw new Error('LLM 未正确初始化');
      }

      const prompt = `请用不超过 ${maxLength} 个字符总结以下文档内容：\n\n${content}`;
      const summary = await this.llm.call(prompt);

      return summary;
    } catch (error) {
      this.logger.error('文档总结失败:', error);
      throw error;
    }
  }

  /**
   * 提取关键词
   */
  async extractKeywords(content: string, count: number = 5): Promise<string[]> {
    try {
      if (!this.llm) {
        throw new Error('LLM 未正确初始化');
      }

      const prompt = `从以下文本中提取 ${count} 个最重要的关键词，用逗号分隔：\n\n${content}`;
      const response = await this.llm.call(prompt);

      return response.split(',').map((kw: string) => kw.trim());
    } catch (error) {
      this.logger.error('关键词提取失败:', error);
      throw error;
    }
  }

  /**
   * 分类文档
   */
  async classifyDocument(
    content: string,
    categories: string[]
  ): Promise<{ category: string; confidence: number }> {
    try {
      if (!this.llm) {
        throw new Error('LLM 未正确初始化');
      }

      const categoriesList = categories.join('、');
      const prompt = `将以下文本分类到以下类别之一：${categoriesList}\n\n文本：${content}\n\n请回答：类别名称和置信度（0-100）`;
      const response = await this.llm.call(prompt);

      // 解析响应
      const lines = response.split('\n');
      const categoryLine = lines[0];
      const confidenceLine = lines[1];

      const category = categoryLine.split('：')[1]?.trim() || categories[0];
      const confidence =
        parseInt(confidenceLine.split('：')[1]) / 100 || 0.5;

      return { category, confidence };
    } catch (error) {
      this.logger.error('文档分类失败:', error);
      throw error;
    }
  }

  /**
   * 生成问题
   */
  async generateQuestions(content: string, count: number = 3): Promise<string[]> {
    try {
      if (!this.llm) {
        throw new Error('LLM 未正确初始化');
      }

      const prompt = `基于以下文本生成 ${count} 个有意义的问题：\n\n${content}`;
      const response = await this.llm.call(prompt);

      // 解析响应
      const questions = response
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());

      return questions.slice(0, count);
    } catch (error) {
      this.logger.error('问题生成失败:', error);
      throw error;
    }
  }

  /**
   * 评估答案质量
   */
  async evaluateAnswer(
    question: string,
    answer: string,
    context: string
  ): Promise<{ score: number; feedback: string }> {
    try {
      if (!this.llm) {
        throw new Error('LLM 未正确初始化');
      }

      const prompt = `请评估以下答案的质量（1-10分），并提供反馈。

问题：${question}
答案：${answer}
上下文：${context}

请按以下格式回答：
分数：[1-10]
反馈：[您的反馈]`;

      const response = await this.llm.call(prompt);

      // 解析响应
      const scoreMatch = response.match(/分数：(\d+)/);
      const feedbackMatch = response.match(/反馈：(.+)/);

      const score = scoreMatch ? parseInt(scoreMatch[1]) / 10 : 0.5;
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';

      return { score, feedback };
    } catch (error) {
      this.logger.error('答案评估失败:', error);
      throw error;
    }
  }

  /**
   * 获取 LLM 实例
   */
  getLLM(): ChatOpenAI {
    return this.llm;
  }
}