# RAG 知识库系统 - 安装检查清单

使用此清单确保 RAG 系统已正确安装和配置。

## ✅ 前置条件检查

- [ ] Node.js >= 16 已安装
  ```bash
  node --version
  ```

- [ ] npm 已安装
  ```bash
  npm --version
  ```

- [ ] Docker 已安装
  ```bash
  docker --version
  ```

- [ ] Docker Compose 已安装
  ```bash
  docker-compose --version
  ```

## ✅ 项目文件检查

### 后端文件

- [ ] `/backend/src/knowledge-base/entities/knowledge-document.entity.ts` 存在
- [ ] `/backend/src/knowledge-base/dto/create-document.dto.ts` 存在
- [ ] `/backend/src/knowledge-base/dto/query-knowledge.dto.ts` 存在
- [ ] `/backend/src/knowledge-base/services/milvus.service.ts` 存在
- [ ] `/backend/src/knowledge-base/services/langchain.service.ts` 存在
- [ ] `/backend/src/knowledge-base/services/knowledge-base.service.ts` 存在
- [ ] `/backend/src/knowledge-base/services/llm-integration.service.ts` 存在
- [ ] `/backend/src/knowledge-base/knowledge-base.controller.ts` 存在
- [ ] `/backend/src/knowledge-base/knowledge-base.module.ts` 存在

### 配置文件

- [ ] `/backend/.env.example` 存在
- [ ] `/backend/package.json` 已更新依赖
- [ ] `/docker-compose.yml` 存在
- [ ] `/backend/src/app.module.ts` 已导入 KnowledgeBaseModule

### 前端文件

- [ ] `/frontend/src/components/KnowledgeBase.tsx` 存在

### 文档文件

- [ ] `/backend/RAG_KNOWLEDGE_BASE_README.md` 存在
- [ ] `/QUICK_START_RAG.md` 存在
- [ ] `/INTEGRATION_EXAMPLES.md` 存在
- [ ] `/RAG_SYSTEM_SUMMARY.md` 存在

## ✅ 依赖安装检查

### 后端依赖

```bash
cd backend
npm list langchain
npm list @langchain/core
npm list @langchain/openai
npm list milvus2-sdk-node
npm list pdf-parse
```

验证输出中应包含：
- [ ] langchain@^0.1.35
- [ ] @langchain/core@^0.1.46
- [ ] @langchain/openai@^0.0.33
- [ ] milvus2-sdk-node@^2.4.3
- [ ] pdf-parse@^1.1.1

## ✅ 环境配置检查

### 创建 .env 文件

```bash
cd backend
cp .env.example .env
```

- [ ] `/backend/.env` 已创建

### 编辑 .env 文件

编辑 `/backend/.env`，确保包含以下配置：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=201966
DB_NAME=notes

# 服务器配置
PORT=3001
MAX_REQUESTS_PER_15MIN=100

# Milvus 配置
MILVUS_HOST=localhost
MILVUS_PORT=19530

# OpenAI API 密钥（必需）
OPENAI_API_KEY=sk-your-api-key-here

# 应用配置
NODE_ENV=development
LOG_LEVEL=debug
```

- [ ] MILVUS_HOST 已设置
- [ ] MILVUS_PORT 已设置
- [ ] OPENAI_API_KEY 已设置（从 https://platform.openai.com/api-keys 获取）

## ✅ 服务启动检查

### 启动 Docker 服务

```bash
cd <project-root>
docker-compose up -d
```

验证服务状态：
```bash
docker-compose ps
```

- [ ] postgres 容器运行中
- [ ] milvus 容器运行中
- [ ] etcd 容器运行中
- [ ] minio 容器运行中

### 验证 Milvus 连接

```bash
curl http://localhost:9091/healthz
```

- [ ] 返回 200 OK

### 启动后端服务

```bash
cd backend
npm run start:dev
```

验证输出：
```
[Nest] ... - 01/15/2024, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] ... - 01/15/2024, 10:30:00 AM     LOG [InstanceLoader] KnowledgeBaseModule dependencies initialized
Server is running on http://localhost:3001
```

- [ ] 后端服务已启动
- [ ] KnowledgeBaseModule 已初始化
- [ ] 没有错误日志

### 启动前端服务

```bash
cd frontend
npm run dev
```

验证输出：
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
```

- [ ] 前端服务已启动
- [ ] 可访问 http://localhost:5173

## ✅ API 功能检查

### 测试添加文档

```bash
curl -X POST http://localhost:3001/api/knowledge-base/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文档",
    "content": "这是一个测试文档，用于验证系统功能。"
  }'
```

- [ ] 返回 200，包含 documentId
- [ ] 文档已保存到数据库

### 测试查询知识库

```bash
curl -X POST http://localhost:3001/api/knowledge-base/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "测试",
    "topK": 5,
    "threshold": 0.5
  }'
```

- [ ] 返回 200，包含查询结果
- [ ] 返回相关文档

### 测试 RAG 查询

```bash
curl -X POST http://localhost:3001/api/knowledge-base/rag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "什么是测试？",
    "topK": 3
  }'
```

- [ ] 返回 200
- [ ] 包含 ragPrompt 字段
- [ ] 包含 contexts 数组

### 测试获取文档列表

```bash
curl -X GET http://localhost:3001/api/knowledge-base/documents
```

- [ ] 返回 200
- [ ] 返回文档数组

### 测试获取统计信息

```bash
curl -X GET http://localhost:3001/api/knowledge-base/statistics
```

- [ ] 返回 200
- [ ] 包含 totalDocuments、processedDocuments、pendingDocuments

## ✅ 前端功能检查

访问 http://localhost:5173

- [ ] 页面加载成功
- [ ] 知识库组件显示
- [ ] 可以输入文档标题和内容
- [ ] 可以点击"添加文档"按钮
- [ ] 可以输入查询内容
- [ ] 可以点击"搜索"按钮
- [ ] 显示查询结果

## ✅ 数据库检查

### 检查 PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d notes -c "\dt"
```

- [ ] knowledge_documents 表存在

### 检查 Milvus

```bash
curl -X GET http://localhost:9091/api/v1/collections \
  -H "Content-Type: application/json"
```

- [ ] knowledge_vectors 集合存在

## ✅ 日志检查

### 后端日志

检查后端控制台输出：

```
[Nest] ... LOG [KnowledgeBaseService] 文档已保存: xxx
[Nest] ... LOG [MilvusService] 向量插入成功: xxx
```

- [ ] 没有 ERROR 日志
- [ ] 没有 CRITICAL 日志

### Docker 日志

```bash
docker-compose logs -f milvus
docker-compose logs -f postgres
```

- [ ] Milvus 日志正常
- [ ] PostgreSQL 日志正常

## ✅ 性能检查

### 测试响应时间

添加文档后测试查询速度：

```bash
time curl -X POST http://localhost:3001/api/knowledge-base/query \
  -H "Content-Type: application/json" \
  -d '{"query":"test","topK":5}'
```

- [ ] 响应时间 < 1 秒
- [ ] 返回结果正确

## ✅ 安全检查

- [ ] API 密钥不在代码中硬编码
- [ ] .env 文件已添加到 .gitignore
- [ ] 没有调试信息暴露
- [ ] 错误消息不包含敏感信息

## 🔧 常见问题排查

### 问题：连接 Milvus 失败

```bash
# 检查 Milvus 容器
docker-compose ps milvus

# 查看 Milvus 日志
docker-compose logs milvus

# 重启 Milvus
docker-compose restart milvus
```

- [ ] Milvus 容器运行中
- [ ] 端口 19530 可访问
- [ ] 没有连接错误

### 问题：OpenAI API 错误

```bash
# 验证 API 密钥
echo $OPENAI_API_KEY

# 检查 API 配额
# 访问 https://platform.openai.com/account/billing/overview
```

- [ ] API 密钥正确
- [ ] 有足够的配额
- [ ] 网络连接正常

### 问题：文档处理失败

```bash
# 检查后端日志
docker-compose logs backend

# 检查文档大小
# 确保文档不超过 100KB
```

- [ ] 文档大小合理
- [ ] 没有特殊字符问题
- [ ] 网络连接正常

## 📋 最终验证

完成所有检查后，运行完整测试：

```bash
# 1. 添加 5 个不同的文档
# 2. 执行 10 个查询
# 3. 验证结果准确性
# 4. 检查性能指标
# 5. 查看系统日志
```

- [ ] 所有文档已添加
- [ ] 所有查询返回结果
- [ ] 结果准确性 > 80%
- [ ] 平均响应时间 < 500ms
- [ ] 没有错误日志

## 📞 获取帮助

如遇问题，请检查：

1. **文档**
   - `RAG_KNOWLEDGE_BASE_README.md` - 详细文档
   - `QUICK_START_RAG.md` - 快速启动
   - `INTEGRATION_EXAMPLES.md` - 集成示例

2. **日志**
   - 后端控制台输出
   - Docker 日志
   - 浏览器开发者工具

3. **配置**
   - `.env` 文件是否正确
   - 所有服务是否运行
   - 网络连接是否正常

## ✨ 完成！

所有检查完成后，你的 RAG 知识库系统已准备就绪！

开始使用：
1. 添加你的知识文档
2. 查询知识库
3. 与 LLM 集成生成答案
4. 构建智能应用

祝你使用愉快！🚀