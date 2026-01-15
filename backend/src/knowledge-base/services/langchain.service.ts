import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

@Injectable()
export class LangChainService {
  private embeddings: OpenAIEmbeddings;
  private readonly logger = new Logger(LangChainService.name);
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY 未配置，请在 .env 文件中设置');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: 'text-embedding-3-small', // 使用 3-small 模型，维度 1536
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // 每个块的大小
      chunkOverlap: 200, // 块之间的重叠
      separators: ['\n\n', '\n', ' ', ''], // 分割符优先级
    });
  }

  /**
   * 生成文本的向量嵌入
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      this.logger.error('生成嵌入失败:', error);
      throw error;
    }
  }

  /**
   * 生成多个文本的向量嵌入
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.embeddings.embedDocuments(texts);
      return embeddings;
    } catch (error) {
      this.logger.error('批量生成嵌入失败:', error);
      throw error;
    }
  }

  /**
   * 分割文本为块
   */
  async splitText(text: string): Promise<Document[]> {
    try {
      const docs = await this.textSplitter.createDocuments([text]);
      this.logger.log(`文本分割完成，共 ${docs.length} 个块`);
      return docs;
    } catch (error) {
      this.logger.error('文本分割失败:', error);
      throw error;
    }
  }

  /**
   * 处理文档：分割 + 生成嵌入
   */
  async processDocument(
    content: string,
    title: string,
    metadata?: Record<string, any>
  ): Promise<Array<{ chunk: string; embedding: number[]; metadata: any }>> {
    try {
      // 分割文本
      const docs = await this.splitText(content);

      // 提取文本块
      const chunks = docs.map((doc) => doc.pageContent);

      // 生成嵌入
      const embeddings = await this.generateEmbeddings(chunks);

      // 组合结果
      const results = chunks.map((chunk, index) => ({
        chunk,
        embedding: embeddings[index],
        metadata: {
          ...metadata,
          title,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      }));

      this.logger.log(`文档处理完成: ${title} (${results.length} 个块)`);
      return results;
    } catch (error) {
      this.logger.error('文档处理失败:', error);
      throw error;
    }
  }

  /**
   * 使用 RAG 进行查询
   * @param query 查询文本
   * @param contexts 检索到的上下文
   * @returns 增强后的提示词
   */
  buildRAGPrompt(query: string, contexts: Array<{ content: string; title: string; score: number }>): string {
    const contextText = contexts
      .map(
        (ctx, index) =>
          `[文档 ${index + 1}] 标题: ${ctx.title}\n相似度: ${(ctx.score * 100).toFixed(2)}%\n内容:\n${ctx.content}`
      )
      .join('\n\n---\n\n');

    const prompt = `根据以下文档内容回答问题。如果文档中没有相关信息，请说明。

文档内容:
${contextText}

问题: ${query}

请基于上述文档内容提供详细的回答。`;

    return prompt;
  }

  /**
   * 获取 Embeddings 实例
   */
  getEmbeddings(): OpenAIEmbeddings {
    return this.embeddings;
  }
}