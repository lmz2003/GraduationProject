# 🤖 RAG 知识库系统 - 文档索引

欢迎使用 AI 面试官系统的 RAG 知识库功能！本文件帮助你快速找到所需的文档。

## 🎯 快速导航

### 👤 我是新用户
**开始这里**: [QUICK_START_RAG.md](./QUICK_START_RAG.md)
- ⏱️ 5分钟快速启动
- 📝 基础示例代码
- 🎯 常见用例说明

### 👨‍💻 我是开发者
**推荐阅读**:
1. [QUICK_START_RAG.md](./QUICK_START_RAG.md) - 快速了解
2. [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md) - 详细文档
3. [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - 代码示例
4. [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) - 项目结构

### 🔧 我是运维人员
**推荐阅读**:
1. [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - 安装验证清单
2. [docker-compose.yml](./docker-compose.yml) - 服务配置
3. [backend/.env.example](./backend/.env.example) - 环境配置

### ❓ 我有问题
**查看这里**: [RAG_FAQ.md](./RAG_FAQ.md)
- 32 个常见问题
- 详细解答
- 最佳实践

### 📊 我想了解架构
**查看这里**: [RAG_SYSTEM_SUMMARY.md](./RAG_SYSTEM_SUMMARY.md)
- 完整架构说明
- 数据流程图
- 技术栈介绍

---

## 📚 完整文档列表

### 核心文档

| 文档 | 描述 | 适合人群 | 阅读时间 |
|------|------|---------|---------|
| [QUICK_START_RAG.md](./QUICK_START_RAG.md) | 5分钟快速启动 | 👤 所有人 | 5分钟 |
| [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md) | 详细系统文档 | 👨‍💻 开发者 | 30分钟 |
| [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) | 集成示例和代码 | 👨‍💻 开发者 | 20分钟 |
| [RAG_SYSTEM_SUMMARY.md](./RAG_SYSTEM_SUMMARY.md) | 项目总结和架构 | 👔 经理 | 15分钟 |

### 参考文档

| 文档 | 描述 | 适合人群 | 阅读时间 |
|------|------|---------|---------|
| [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) | 安装检查清单 | 🔧 运维 | 20分钟 |
| [RAG_FAQ.md](./RAG_FAQ.md) | 常见问题解答 | ❓ 所有人 | 按需 |
| [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) | 文件结构说明 | 👨‍💻 开发者 | 15分钟 |
| [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) | 实现完成报告 | 👔 经理 | 10分钟 |

---

## 🚀 快速启动 (3 步)

### 1. 安装依赖
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. 启动服务
```bash
# 终端 1: 启动 Docker 服务
docker-compose up -d

# 终端 2: 启动后端
cd backend && npm run start:dev

# 终端 3: 启动前端
cd frontend && npm run dev
```

### 3. 配置 API 密钥
```bash
cp backend/.env.example backend/.env
# 编辑 .env，添加 OPENAI_API_KEY
```

**访问**: http://localhost:5173

---

## 🎯 常见场景

### 场景 1: 我想快速试用系统
→ 阅读 [QUICK_START_RAG.md](./QUICK_START_RAG.md)
- 包含所有必要的步骤
- 提供示例代码
- 5分钟内可以运行

### 场景 2: 我想深入理解系统
→ 阅读以下文档（顺序）:
1. [RAG_SYSTEM_SUMMARY.md](./RAG_SYSTEM_SUMMARY.md) - 了解架构
2. [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md) - 学习细节
3. [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) - 理解代码结构
4. [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - 查看实现

### 场景 3: 我想集成到我的应用
→ 阅读 [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)
- 完整的代码示例
- 前后端集成示例
- 高级功能演示

### 场景 4: 安装或部署遇到问题
→ 检查 [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- 逐步验证安装
- 故障排除指南
- 常见问题解决

### 场景 5: 我有具体问题
→ 查看 [RAG_FAQ.md](./RAG_FAQ.md)
- 32 个常见问题
- 详细解答
- 最佳实践

---

## 📖 按主题查找

### 安装和配置
- [QUICK_START_RAG.md](./QUICK_START_RAG.md) - 快速启动
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - 安装验证
- [backend/.env.example](./backend/.env.example) - 环境配置
- [docker-compose.yml](./docker-compose.yml) - Docker 配置

### API 使用
- [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md) - API 文档
- [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - 代码示例

### 系统架构
- [RAG_SYSTEM_SUMMARY.md](./RAG_SYSTEM_SUMMARY.md) - 架构说明
- [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) - 文件结构

### 故障排除
- [RAG_FAQ.md](./RAG_FAQ.md) - 常见问题
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - 故障排除

### 高级功能
- [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - 高级示例

---

## 🔑 关键概念速查

### 什么是 RAG？
检索增强生成 (Retrieval-Augmented Generation) 是一种将信息检索与文本生成相结合的技术。
→ 详见 [RAG_FAQ.md](./RAG_FAQ.md) Q1

### 系统用到了哪些技术？
- **后端**: NestJS + TypeScript
- **数据库**: PostgreSQL + Milvus
- **AI**: LangChain + OpenAI
- **前端**: React + Vite

→ 详见 [RAG_SYSTEM_SUMMARY.md](./RAG_SYSTEM_SUMMARY.md)

### 如何添加文档？
```bash
curl -X POST http://localhost:3001/api/knowledge-base/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "文档标题",
    "content": "文档内容"
  }'
```

→ 详见 [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md)

### 如何查询知识库？
```bash
curl -X POST http://localhost:3001/api/knowledge-base/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "查询内容",
    "topK": 5,
    "threshold": 0.5
  }'
```

→ 详见 [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md)

---

## 🆘 需要帮助？

### 问题类型 → 推荐文档

| 问题类型 | 推荐文档 |
|---------|---------|
| 如何快速开始？ | [QUICK_START_RAG.md](./QUICK_START_RAG.md) |
| 如何安装系统？ | [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) |
| 如何使用 API？ | [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md) |
| 如何集成代码？ | [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) |
| 系统如何工作？ | [RAG_SYSTEM_SUMMARY.md](./RAG_SYSTEM_SUMMARY.md) |
| 遇到错误了？ | [RAG_FAQ.md](./RAG_FAQ.md) |
| 文件在哪里？ | [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) |

---

## 📊 文档统计

- **总文档数**: 8 个
- **总页数**: 50+ 页
- **总字数**: 25,000+ 字
- **代码示例**: 100+ 个
- **问答**: 32 个

---

## ✨ 文档特色

✅ **完整性**: 覆盖所有主要功能  
✅ **易读性**: 清晰的结构和导航  
✅ **实用性**: 包含大量代码示例  
✅ **深度**: 从入门到高级  
✅ **多角度**: 适合不同读者群体  

---

## 🚀 建议阅读顺序

### 对于新用户
1. 本文件 (README_RAG.md)
2. [QUICK_START_RAG.md](./QUICK_START_RAG.md)
3. [RAG_FAQ.md](./RAG_FAQ.md)

### 对于开发者
1. [QUICK_START_RAG.md](./QUICK_START_RAG.md)
2. [RAG_SYSTEM_SUMMARY.md](./RAG_SYSTEM_SUMMARY.md)
3. [RAG_KNOWLEDGE_BASE_README.md](./backend/RAG_KNOWLEDGE_BASE_README.md)
4. [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)
5. [FILE_STRUCTURE.md](./FILE_STRUCTURE.md)

### 对于运维人员
1. [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
2. [docker-compose.yml](./docker-compose.yml)
3. [backend/.env.example](./backend/.env.example)
4. [RAG_FAQ.md](./RAG_FAQ.md)

---

## 📞 快速链接

### 官方资源
- [LangChain 文档](https://python.langchain.com/)
- [Milvus 文档](https://milvus.io/)
- [OpenAI API](https://platform.openai.com/docs)
- [NestJS 文档](https://docs.nestjs.com/)

### 项目文件
- [后端代码](./backend/src/knowledge-base/)
- [前端代码](./frontend/src/components/KnowledgeBase.tsx)
- [Docker 配置](./docker-compose.yml)

---

## 🎓 学习路径

```
开始 (1-2小时)
├── 阅读 QUICK_START_RAG.md
├── 运行示例代码
└── 在前端尝试

理解 (2-4小时)
├── 阅读 RAG_SYSTEM_SUMMARY.md
├── 理解架构
└── 查看 FILE_STRUCTURE.md

应用 (4-8小时)
├── 阅读 INTEGRATION_EXAMPLES.md
├── 编写自己的代码
└── 集成到应用

精通 (持续)
├── 深入研究源代码
├── 优化性能
└── 扩展功能
```

---

## ✅ 检查清单

在开始之前，确保你：

- [ ] 已安装 Node.js >= 16
- [ ] 已安装 Docker
- [ ] 有 OpenAI API 密钥
- [ ] 了解基本的 REST API 概念
- [ ] 有文本编辑器或 IDE

---

## 💡 提示

- 📌 将此文件添加到书签
- 🔍 使用浏览器搜索功能查找关键词
- 💬 遇到问题先查看 FAQ
- 📧 有建议可以反馈

---

## 🎉 准备好了吗？

[开始使用 QUICK_START_RAG.md →](./QUICK_START_RAG.md)

或者直接运行：
```bash
cd GraduationProject
docker-compose up -d
cd backend && npm run start:dev
```

祝你使用愉快！🚀

---

**最后更新**: 2024-01-15  
**版本**: 1.0  
**状态**: ✅ 完成

有任何问题，欢迎查阅相关文档！