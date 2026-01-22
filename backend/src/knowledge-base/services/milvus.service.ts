import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

@Injectable()
export class MilvusService implements OnModuleInit, OnModuleDestroy {
  private milvusClient: MilvusClient;
  private readonly logger = new Logger(MilvusService.name);
  private readonly collectionName = 'knowledge_vectors';

  constructor(private configService: ConfigService) {
    // 初始化 milvusClient 为 null，在 onModuleInit 中会被赋值
    this.milvusClient = null as any;
  }

  async onModuleInit() {
    try {
      const milvusHost = this.configService.get<string>('MILVUS_HOST') || 'localhost';
      const milvusPort = this.configService.get<number>('MILVUS_PORT') || 19530;

      // 使用正确的地址格式：host:port
      this.milvusClient = new MilvusClient({
        address: `${milvusHost}:${milvusPort}`,
      });

      this.logger.log(`连接到 Milvus: ${milvusHost}:${milvusPort}`);
      
      // 初始化集合
      await this.initializeCollection();
    } catch (error) {
      this.logger.error('Milvus 连接失败:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.milvusClient) {
      await this.milvusClient.closeConnection();
      this.logger.log('Milvus 连接已关闭');
    }
  }

  /**
   * 初始化 Milvus 集合
   */
  private async initializeCollection() {
    try {
      // 检查集合是否存在
      const collections = await this.milvusClient.listCollections();
      const exists = collections.data?.some(
        (c: any) => c.name === this.collectionName
      );

      if (!exists) {
        this.logger.log(`创建集合: ${this.collectionName}`);
        
        await this.milvusClient.createCollection({
          collection_name: this.collectionName,
          fields: [
            {
              name: 'id',
              description: 'Document ID',
              data_type: 'VarChar',
              is_primary_key: true,
              max_length: 100,
            },
            {
              name: 'embedding',
              description: 'Document embedding vector',
              data_type: 'FloatVector',
              dim: 1536, // OpenAI embedding 维度
            },
            {
              name: 'title',
              description: 'Document title',
              data_type: 'VarChar',
              max_length: 500,
            },
            {
              name: 'content',
              description: 'Document content',
              data_type: 'VarChar',
              max_length: 65535,
            },
            {
              name: 'source',
              description: 'Document source',
              data_type: 'VarChar',
              max_length: 500,
            },
            {
              name: 'userId',
              description: 'Owner user ID',
              data_type: 'VarChar',
              max_length: 100,
            },
            {
              name: 'timestamp',
              description: 'Creation timestamp',
              data_type: 'Int64',
            },
          ],
        });

        // 创建索引
        await this.milvusClient.createIndex({
          collection_name: this.collectionName,
          field_name: 'embedding',
          index_type: 'IVF_FLAT',
          metric_type: 'L2',
          params: {
            nlist: 1024,
          },
        });

        this.logger.log(`集合 ${this.collectionName} 创建成功`);
      } else {
        this.logger.log(`集合 ${this.collectionName} 已存在`);
      }

      // 加载集合到内存
      await this.milvusClient.loadCollectionSync({
        collection_name: this.collectionName,
      });
    } catch (error) {
      this.logger.error('初始化集合失败:', error);
      throw error;
    }
  }

  /**
   * 插入向量数据
   */
  async insertVector(
    id: string,
    embedding: number[],
    title: string,
    content: string,
    source: string | null,
    userId: string
  ) {
    try {
      // 验证输入
      if (!id || id.trim().length === 0) {
        throw new Error('向量 ID 不能为空');
      }
      if (!embedding || embedding.length === 0) {
        throw new Error('向量嵌入不能为空');
      }
      if (!title || title.trim().length === 0) {
        throw new Error('标题不能为空');
      }
      if (!content || content.trim().length === 0) {
        throw new Error('内容不能为空');
      }
      if (!userId || userId.trim().length === 0) {
        throw new Error('用户 ID 不能为空');
      }

      // 检查 Milvus 客户端是否连接
      if (!this.milvusClient) {
        throw new Error('Milvus 客户端未初始化，请确保 Milvus 服务已启动');
      }

      this.logger.log(`插入向量: ${id}, 嵌入维度: ${embedding.length}, 内容长度: ${content.length}`);

      const result = await this.milvusClient.insert({
        collection_name: this.collectionName,
        fields_data: [
          {
            name: 'id',
            data: [id],
          },
          {
            name: 'embedding',
            data: [embedding],
          },
          {
            name: 'title',
            data: [title.substring(0, 500)], // 确保不超过最大长度
          },
          {
            name: 'content',
            data: [content.substring(0, 65535)],
          },
          {
            name: 'source',
            data: [source || ''],
          },
          {
            name: 'userId',
            data: [userId],
          },
          {
            name: 'timestamp',
            data: [Date.now()],
          },
        ],
      });

      this.logger.log(`向量插入成功: ${id}`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`向量插入失败: ${errorMsg}`, error);
      
      // 检查是否是连接问题
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('connect') || errorMsg.includes('ENOTFOUND')) {
        throw new Error('Milvus 服务连接失败。请确保 Milvus 已在 ' + 
          `${this.configService.get('MILVUS_HOST')}:${this.configService.get('MILVUS_PORT')} 运行`);
      }
      throw error;
    }
  }

  /**
   * 搜索相似向量
   */
  async searchSimilar(
    queryEmbedding: number[],
    userId: string,
    topK: number = 5,
    threshold: number = 0.5
  ) {
    try {
      // 验证输入
      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('查询嵌入不能为空');
      }
      if (!userId || userId.trim().length === 0) {
        throw new Error('用户 ID 不能为空');
      }
      if (topK <= 0) {
        throw new Error('topK 必须大于 0');
      }
      if (threshold < 0 || threshold > 1) {
        throw new Error('threshold 必须在 0 到 1 之间');
      }

      // 检查 Milvus 客户端是否连接
      if (!this.milvusClient) {
        throw new Error('Milvus 客户端未初始化，请确保 Milvus 服务已启动');
      }

      this.logger.log(`搜索向量: userId=${userId}, topK=${topK}, threshold=${threshold}`);

      const result = await this.milvusClient.search({
        collection_name: this.collectionName,
        vectors: [queryEmbedding],
        vector_type: DataType.FloatVector,
        search_params: {
          anns_field: 'embedding',
          topk: topK.toString(),
          metric_type: 'L2',
          params: JSON.stringify({ nprobe: 10 }),
        },
        output_fields: ['id', 'title', 'content', 'source', 'userId'],
        filter: `userId == "${userId}"`, // 只搜索该用户的文档
      });

      // 处理结果，转换距离为相似度分数
      const results = result.results?.[0]?.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        source: item.source,
        score: 1 / (1 + item.distance), // 转换 L2 距离为相似度分数 (0-1)
      })) || [];

      // 过滤低于阈值的结果
      const filtered = results.filter((r: any) => r.score >= threshold);
      this.logger.log(`搜索完成: 找到 ${results.length} 个候选项，${filtered.length} 个满足阈值`);
      return filtered;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`搜索向量失败: ${errorMsg}`, error);
      
      // 检查是否是连接问题
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('connect') || errorMsg.includes('ENOTFOUND')) {
        throw new Error('Milvus 服务连接失败。请确保 Milvus 已在 ' + 
          `${this.configService.get('MILVUS_HOST')}:${this.configService.get('MILVUS_PORT')} 运行`);
      }
      throw error;
    }
  }

  /**
   * 删除向量 - 支持删除文档 ID 的所有向量（包括分块）
   */
  async deleteVector(id: string) {
    try {
      if (!id || id.trim().length === 0) {
        throw new Error('向量 ID 不能为空');
      }

      // 由于 Milvus 向量 ID 格式为 ${documentId}_${chunkIndex}
      // 所以需要用 like 操作符来删除所有相关向量
      // 注意：Milvus 的 like 操作符在 expr 中的语法是 `id like "prefix%"`
      const deleteExpr = `id like "${id}_%"`;
      
      this.logger.log(`删除向量: ${id}，使用表达式: ${deleteExpr}`);

      await this.milvusClient.deleteEntities({
        collection_name: this.collectionName,
        expr: deleteExpr,
      });

      this.logger.log(`向量删除成功: ${id} (删除所有分块)`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`向量删除失败: ${errorMsg}`, error);
      throw error;
    }
  }

  /**
   * 删除用户的所有向量
   */
  async deleteUserVectors(userId: string) {
    try {
      await this.milvusClient.deleteEntities({
        collection_name: this.collectionName,
        expr: `userId == "${userId}"`,
      });

      this.logger.log(`用户 ${userId} 的向量删除成功`);
    } catch (error) {
      this.logger.error('用户向量删除失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Milvus 客户端
   */
  getClient(): MilvusClient {
    return this.milvusClient;
  }
}