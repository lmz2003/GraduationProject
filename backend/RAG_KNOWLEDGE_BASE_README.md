# RAG 知识库系统使用指南

## 概述

本项目集成了 **LangChain** 框架和 **Milvus** 向量数据库，构建了一个完整的 RAG（Retrieval-Augmented Generation）知识库系统。

### 核心特性

- ✅ 文档管理：添加、更新、删除文档
- ✅ 智能分割：使用 LangChain 的递归文本分割器
- ✅ 向量化：使用 OpenAI Embeddings 生成高质量向量
- ✅ 相似度搜索：基于 Milvus 的高效向量检索
- ✅ RAG 增强：自动构建增强提示词用于 LLM
- ✅ 用户隔离：每个用户只能访问自己的文档

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端应用                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NestJS 后端 API                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │      KnowledgeBaseController                       │ │
│  │  - POST /documents (添加文档)                      │ │
│  │  - GET /documents (获取文档列表)                   │ │
│  │  - POST /query (查询知识库)                        │ │
│  │  - POST /rag-query (RAG 查询)                      │ │
│  └────────────────────────────────────────────────────┘ │
└────────────┬──────────────────────────────────┬─────────┘
             │                                  │
             ▼                                  ▼
    ┌─────────────────────┐        ┌──────────────────────┐
    │  PostgreSQL 数据库   │        │  LangChain Service   │
    │  (文档元数据存储)    │        │  - 文本分割           │
    └─────────────────────┘        │  - 向量生成           │
                                   │  - RAG 提示构建       │
                                   └──────────┬───────────┘
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │  OpenAI API          │
                                   │  (生成 Embeddings)   │
                                   └──────────────────────┘
                                              │
             ┌────────────────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │  Milvus 向量数据库   │
    │  - 向量存储          │
    │  - 相似度搜索        │
    │  - 用户隔离          │
    └─────────────────────┘
```

## 安装和配置

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置 Milvus

#### 使用 Docker 快速启动 Milvus

```bash
docker-compose up -d
```

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  milvus:
    image: milvusdb/milvus:latest
    container_name: milvus_standalone
    ports:
      - "19530:19530"
      - "9091:9091"
    environment:
      COMMON_STORAGETYPE: local
    volumes:
      - milvus_data:/var/lib/milvus
    networks:
      - milvus_network

volumes:
  milvus_data:

networks:
  milvus_network:
    driver: bridge
```

#### 验证 Milvus 连接

```bash
# 检查 Milvus 是否运行
curl http://localhost:9091/healthz
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# Milvus 配置
MILVUS_HOST=localhost
MILVUS_PORT=19530

# OpenAI API 密钥（必需）
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. 启动应用

```bash
npm run start:dev
```

## API 使用示例

### 1. 添加文档

```bash
curl -X POST http://localhost:3001/api/knowledge-base/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "title": "Python 基础教程",
    "content": "Python 是一种高级编程语言...",
    "source": "https://example.com/python-tutorial",
    "documentType": "text",
    "metadata": {
      "category": "programming",
      "tags": ["python", "tutorial"]
    }
  }'
```

**响应示例：**

```json
{
  "success": true,
  "message": "文档已添加",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Python 基础教程",
    "content": "Python 是一种高级编程语言...",
    "isProcessed": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. 查询知识库

```bash
curl -X POST http://localhost:3001/api/knowledge-base/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "query": "Python 如何定义函数？",
    "topK": 5,
    "threshold": 0.5
  }'
```

**响应示例：**

```json
{
  "success": true,
  "message": "查询成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000_0",
      "title": "Python 基础教程",
      "content": "Python 中使用 def 关键字定义函数...",
      "source": "https://example.com/python-tutorial",
      "score": 0.89
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001_2",
      "title": "Python 函数进阶",
      "content": "函数参数可以有默认值...",
      "source": "https://example.com/python-advanced",
      "score": 0.75
    }
  ]
}
```

### 3. RAG 查询（获取增强提示词）

```bash
curl -X POST http://localhost:3001/api/knowledge-base/rag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "query": "Python 如何定义函数？",
    "topK": 3,
    "threshold": 0.5
  }'
```

**响应示例：**

```json
{
  "success": true,
  "message": "RAG 查询成功",
  "data": {
    "query": "Python 如何定义函数？",
    "contexts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000_0",
        "title": "Python 基础教程",
        "content": "Python 中使用 def 关键字定义函数...",
        "score": 0.89
      }
    ],
    "ragPrompt": "根据以下文档内容回答问题。如果文档中没有相关信息，请说明。\n\n文档内容:\n[文档 1] 标题: Python 基础教程\n相似度: 89.00%\n内容:\nPython 中使用 def 关键字定义函数...\n\n问题: Python 如何定义函数？\n\n请基于上述文档内容提供详细的回答。"
  }
}
```

### 4. 获取文档列表

```bash
curl -X GET http://localhost:3001/api/knowledge-base/documents \
  -H "Authorization: Bearer your-token"
```

### 5. 获取单个文档

```bash
curl -X GET http://localhost:3001/api/knowledge-base/documents/{documentId} \
  -H "Authorization: Bearer your-token"
```

### 6. 更新文档

```bash
curl -X PUT http://localhost:3001/api/knowledge-base/documents/{documentId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "title": "更新后的标题",
    "content": "更新后的内容..."
  }'
```

### 7. 删除文档

```bash
curl -X DELETE http://localhost:3001/api/knowledge-base/documents/{documentId} \
  -H "Authorization: Bearer your-token"
```

### 8. 获取知识库统计

```bash
curl -X GET http://localhost:3001/api/knowledge-base/statistics \
  -H "Authorization: Bearer your-token"
```

**响应示例：**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "totalDocuments": 10,
    "processedDocuments": 9,
    "pendingDocuments": 1
  }
}
```

## 文件结构

```
backend/src/knowledge-base/
├── entities/
│   └── knowledge-document.entity.ts       # 知识库文档实体
├── dto/
│   ├── create-document.dto.ts             # 创建文档 DTO
│   └── query-knowledge.dto.ts             # 查询 DTO
├── services/
│   ├── milvus.service.ts                  # Milvus 向量数据库服务
│   ├── langchain.service.ts               # LangChain 集成服务
│   └── knowledge-base.service.ts          # 知识库业务逻辑服务
├── knowledge-base.controller.ts           # API 控制器
└── knowledge-base.module.ts               # 模块定义
```

## 核心概念

### 1. 文档处理流程

```
原始文档
  ↓
LangChain 文本分割
  ↓
多个文本块
  ↓
OpenAI Embeddings
  ↓
向量数据
  ↓
Milvus 存储
```

### 2. 查询流程

```
用户查询
  ↓
生成查询向量 (OpenAI Embeddings)
  ↓
Milvus 相似度搜索
  ↓
返回相关文档块
  ↓
构建 RAG 提示词
  ↓
发送给 LLM 生成答案
```

### 3. 向量参数说明

- **维度 (Dimension)**: 1536 (OpenAI text-embedding-3-small)
- **距离度量 (Metric)**: L2 (欧氏距离)
- **索引类型**: IVF_FLAT (适合中等规模数据)
- **块大小 (Chunk Size)**: 1000 字符
- **块重叠 (Overlap)**: 200 字符

## 性能优化建议

### 1. 调整文本分割参数

```typescript
// 在 langchain.service.ts 中
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // 根据实际情况调整
  chunkOverlap: 200,    // 增加重叠以提高相关性
});
```

### 2. 调整 Milvus 索引参数

```typescript
// 在 milvus.service.ts 中
await this.milvusClient.createIndex({
  collection_name: this.collectionName,
  field_name: 'embedding',
  index_type: 'HNSW',    // 改用 HNSW 获得更好性能
  metric_type: 'L2',
  params: {
    M: 30,
    efConstruction: 200,
  },
});
```

### 3. 批量处理优化

```typescript
// 使用批量嵌入而不是逐个处理
const embeddings = await this.langChainService.generateEmbeddings(chunks);
```

## 故障排除

### 问题 1: Milvus 连接失败

**症状**: `Error: Failed to connect to Milvus`

**解决方案**:
```bash
# 检查 Milvus 是否运行
docker ps | grep milvus

# 检查连接
curl http://localhost:9091/healthz

# 重启 Milvus
docker-compose restart milvus
```

### 问题 2: OpenAI API 错误

**症状**: `Error: Invalid API key`

**解决方案**:
```bash
# 检查 .env 中的 API 密钥
echo $OPENAI_API_KEY

# 确保 API 密钥有效且有足够的配额
```

### 问题 3: 向量维度不匹配

**症状**: `Error: Vector dimension mismatch`

**解决方案**:
```typescript
// 确保 Milvus 集合中的维度与 OpenAI 模型匹配
// text-embedding-3-small: 1536
// text-embedding-3-large: 3072
```

## 扩展功能

### 1. 支持 PDF 上传

```typescript
import pdfParse from 'pdf-parse';

async uploadPDF(file: Express.Multer.File) {
  const data = await pdfParse(file.buffer);
  const content = data.text;
  // 处理 PDF 文本...
}
```

### 2. 批量导入文档

```typescript
async importDocuments(documents: CreateDocumentDto[], userId: string) {
  for (const doc of documents) {
    await this.addDocument(doc, userId);
  }
}
```

### 3. 集成其他 LLM

```typescript
// 支持 Anthropic Claude
import { ChatAnthropic } from '@langchain/anthropic';

// 支持 Cohere
import { Cohere } from '@langchain/cohere';
```

## 最佳实践

1. **定期清理过期文档**: 设置定时任务删除不再需要的文档
2. **监控向量数据库**: 定期检查 Milvus 的性能指标
3. **批量操作**: 使用批量 API 处理大量文档
4. **缓存常见查询**: 缓存热点查询结果
5. **版本控制**: 保存文档的多个版本

## 相关资源

- [LangChain 文档](https://python.langchain.com/)
- [Milvus 文档](https://milvus.io/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [RAG 论文](https://arxiv.org/abs/2005.11401)

## 许可证

ISC