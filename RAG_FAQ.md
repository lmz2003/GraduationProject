# RAG 知识库系统 - 常见问题解答 (FAQ)

## 🎯 基础问题

### Q1: RAG 是什么？
**A:** RAG 代表 Retrieval-Augmented Generation（检索增强生成）。它是一种将信息检索与文本生成相结合的技术，通过从知识库中检索相关信息来增强 LLM 的回答质量。

### Q2: 为什么要使用 RAG？
**A:** 主要优势：
- 减少 LLM 幻觉（hallucination）
- 提供最新信息（LLM 训练数据可能已过时）
- 降低 API 成本（更短的提示词）
- 提高答案准确性和相关性
- 支持私有数据查询

### Q3: Milvus 和 PostgreSQL 分别用来做什么？
**A:** 
- **PostgreSQL**: 存储文档的元数据（标题、来源、创建时间等）
- **Milvus**: 存储和搜索文档的向量表示（用于语义相似度搜索）

### Q4: 向量维度 1536 是什么意思？
**A:** 这是 OpenAI text-embedding-3-small 模型的输出维度。每个文本块都被转换为一个 1536 维的向量，用于计算相似度。

---

## 🔧 安装和配置问题

### Q5: 如何获取 OpenAI API 密钥？
**A:** 
1. 访问 https://platform.openai.com/api-keys
2. 登录或创建账户
3. 点击 "Create new secret key"
4. 复制密钥并保存到 `.env` 文件

### Q6: Milvus 连接失败怎么办？
**A:** 
```bash
# 检查 Milvus 是否运行
docker-compose ps

# 查看日志
docker-compose logs milvus

# 重启 Milvus
docker-compose restart milvus

# 验证连接
curl http://localhost:9091/healthz
```

### Q7: 如何修改 Milvus 端口？
**A:** 
1. 编辑 `docker-compose.yml`
2. 修改 `ports: - "19530:19530"`
3. 编辑 `.env` 中的 `MILVUS_PORT`
4. 重启服务

### Q8: 可以使用其他 LLM 而不是 OpenAI 吗？
**A:** 可以！系统支持：
- Anthropic Claude
- Cohere
- 本地模型（通过 Ollama）
- 其他兼容 LangChain 的 LLM

只需修改 `LLMIntegrationService` 中的配置。

---

## 📊 功能相关问题

### Q9: 一个文档可以有多大？
**A:** 
- 建议: < 100KB
- 最大: 理论上无限制，但会影响性能
- 太大的文档会被自动分割成多个块

### Q10: 支持上传 PDF 文件吗？
**A:** 目前系统支持文本内容。如需 PDF 支持，可以：
1. 使用 `pdf-parse` 库提取文本
2. 将提取的文本添加为文档
3. 参考 `INTEGRATION_EXAMPLES.md` 的 PDF 上传示例

### Q11: 如何调整搜索结果的数量？
**A:** 
```bash
# 修改 topK 参数
{
  "query": "你的查询",
  "topK": 10,      # 返回 10 个结果
  "threshold": 0.5 # 相似度阈值
}
```

### Q12: 相似度阈值应该设置多少？
**A:** 
- `0.3-0.5`: 宽松，返回更多结果
- `0.5-0.7`: 平衡，推荐值
- `0.7-0.9`: 严格，仅返回高相关性结果
- `0.9-1.0`: 极严格，很少返回结果

根据你的使用场景调整。

### Q13: 如何删除所有文档？
**A:** 
```bash
# 通过 API 逐个删除
# 或直接清空 Milvus 集合

# 删除集合
curl -X DELETE http://localhost:9091/api/v1/collections/knowledge_vectors

# 系统会自动重建集合
```

---

## ⚡ 性能问题

### Q14: 系统速度太慢怎么办？
**A:** 检查以下几点：
1. **网络**: 检查与 OpenAI API 的连接
2. **模型**: 考虑使用更快的模型
3. **索引**: 升级到 HNSW 索引
4. **缓存**: 实现查询结果缓存
5. **硬件**: 增加服务器资源

### Q15: 如何优化向量搜索性能？
**A:** 
```typescript
// 在 milvus.service.ts 中修改索引
index_type: 'HNSW',  // 比 IVF_FLAT 更快
params: {
  M: 30,
  efConstruction: 200,
}
```

### Q16: 支持多少个文档？
**A:** 
- 小规模: 1K-10K 文档（无问题）
- 中规模: 10K-100K 文档（需要优化）
- 大规模: 100K+ 文档（需要分片和集群）

### Q17: 如何处理大量并发查询？
**A:** 
1. 使用负载均衡器
2. 增加后端实例数
3. 实现查询缓存
4. 使用消息队列（RabbitMQ、Redis）
5. 优化数据库连接池

---

## 🐛 错误和故障排除

### Q18: "Vector dimension mismatch" 错误
**A:** 
```
原因: Milvus 集合维度与嵌入模型维度不匹配
解决:
1. 检查 Milvus 集合配置 (应为 1536)
2. 检查 LangChain 配置 (应为 text-embedding-3-small)
3. 删除旧集合，重新创建
```

### Q19: "API rate limit exceeded" 错误
**A:** 
```
原因: OpenAI API 调用频率过高
解决:
1. 实现请求队列
2. 添加速率限制中间件
3. 增加 API 配额
4. 使用缓存减少 API 调用
```

### Q20: 文档处理失败
**A:** 
```
可能原因:
1. 文档过大 - 分割成更小的块
2. 特殊字符 - 清理文本内容
3. 网络错误 - 检查连接
4. API 配额 - 检查 OpenAI 账户

调试:
1. 查看后端日志
2. 检查 .env 配置
3. 验证 API 密钥
```

### Q21: 查询返回不相关的结果
**A:** 
```
解决步骤:
1. 增加 threshold 值
2. 检查文档质量
3. 调整 chunk 大小
4. 重新处理文档
5. 检查查询词是否清晰
```

### Q22: "Milvus collection not found" 错误
**A:** 
```
原因: 集合未创建或被删除
解决:
1. 添加任何文档会自动创建集合
2. 或重启后端服务
3. 检查 Milvus 是否运行
```

---

## 🔐 安全和隐私问题

### Q23: 数据是否安全？
**A:** 
- 数据存储在本地 PostgreSQL 和 Milvus
- 支持数据加密（可配置）
- 用户数据隔离（通过 userId）
- 建议使用 HTTPS 和防火墙

### Q24: 如何保护 API 密钥？
**A:** 
```
最佳实践:
1. 不要在代码中硬编码
2. 使用 .env 文件
3. 添加 .env 到 .gitignore
4. 定期轮换密钥
5. 限制 API 密钥权限
6. 使用环境变量
```

### Q25: 支持多用户吗？
**A:** 支持！系统通过 `userId` 实现用户隔离：
- 每个用户只能访问自己的文档
- 查询时自动过滤用户数据
- 支持多租户架构

---

## 💰 成本相关问题

### Q26: 使用此系统需要多少成本？
**A:** 
```
成本构成:
1. OpenAI API: 
   - text-embedding-3-small: $0.02/1M tokens
   - gpt-3.5-turbo: $0.50/$1.50 per 1M tokens
2. 服务器: 取决于你的基础设施
3. 数据库: PostgreSQL 和 Milvus (开源免费)

示例成本 (1000 个文档):
- 向量化: ~$0.02
- 查询 (1000次): ~$0.50
- 月度预估: $10-50
```

### Q27: 如何降低成本？
**A:** 
```
方法:
1. 使用缓存减少 API 调用
2. 批量处理文档
3. 使用本地模型替代 OpenAI
4. 优化 chunk 大小
5. 定期清理旧文档
6. 使用 embedding 缓存
```

---

## 🚀 高级问题

### Q28: 如何集成自定义 LLM？
**A:** 
```typescript
// 在 llm-integration.service.ts 中
import { ChatCustom } from '@langchain/custom';

const llm = new ChatCustom({
  // 你的配置
});
```

### Q29: 支持多语言吗？
**A:** 
- OpenAI Embeddings 支持 100+ 语言
- 系统可以处理多语言混合
- 建议为每种语言创建单独的集合

### Q30: 如何实现实时更新？
**A:** 
```typescript
// 使用 WebSocket
@WebSocketGateway()
export class KnowledgeGateway {
  @SubscribeMessage('document-update')
  handleUpdate(client: Socket, data: any) {
    // 实时推送更新
    this.server.emit('document-updated', data);
  }
}
```

### Q31: 支持分布式部署吗？
**A:** 
```
支持！架构:
1. 多个后端实例
2. 负载均衡器
3. 共享 PostgreSQL
4. 共享 Milvus 集群
5. 消息队列 (RabbitMQ)
```

### Q32: 如何实现向量更新？
**A:** 
```typescript
// 更新文档时自动重新生成向量
async updateDocument(docId: string, content: string) {
  // 1. 删除旧向量
  await this.milvusService.deleteVector(docId);
  
  // 2. 处理新内容
  const chunks = await this.langChainService.processDocument(content);
  
  // 3. 插入新向量
  for (const chunk of chunks) {
    await this.milvusService.insertVector(...);
  }
}
```

---

## 📚 学习资源

### Q33: 我应该从哪里开始学习？
**A:** 
1. 阅读 `QUICK_START_RAG.md` - 快速入门
2. 查看 `RAG_KNOWLEDGE_BASE_README.md` - 详细文档
3. 学习 `INTEGRATION_EXAMPLES.md` - 实际示例
4. 研究源代码 - 深入理解

### Q34: 有哪些有用的资源？
**A:** 
- [LangChain 文档](https://python.langchain.com/)
- [Milvus 官方文档](https://milvus.io/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [RAG 论文](https://arxiv.org/abs/2005.11401)
- [NestJS 文档](https://docs.nestjs.com/)

---

## 🆘 获取帮助

### 如果问题未在 FAQ 中列出：

1. **查看文档**
   - `RAG_KNOWLEDGE_BASE_README.md`
   - `QUICK_START_RAG.md`
   - `INTEGRATION_EXAMPLES.md`

2. **检查日志**
   ```bash
   # 后端日志
   docker-compose logs backend
   
   # Milvus 日志
   docker-compose logs milvus
   
   # PostgreSQL 日志
   docker-compose logs postgres
   ```

3. **验证配置**
   - 检查 `.env` 文件
   - 验证所有服务运行
   - 检查网络连接

4. **搜索社区**
   - GitHub Issues
   - Stack Overflow
   - LangChain 讨论

---

**最后更新**: 2024-01-15  
**版本**: 1.0  
**维护者**: AI 面试官项目团队

祝你使用愉快！如有问题，欢迎提问。🚀