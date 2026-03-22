# AI Interviewer System - 智能求职辅助系统

一款面向求职者的智能求职辅助平台，集成了笔记管理、简历智能分析、知识库构建、AI智能助手、模拟面试等核心功能。系统采用前后端分离架构，通过整合大语言模型（LLM）、向量数据库（Milvus）和RAG（检索增强生成）技术，为求职者提供一站式的求职准备工具。

## 功能特性

### 核心模块

| 模块 | 功能描述 |
|------|---------|
| 用户认证 | GitHub OAuth 单点登录，JWT Token 身份验证 |
| 笔记管理 | 富文本编辑、版本控制、评论协作、一键同步至知识库 |
| 简历分析 | 多维度智能评分、岗位匹配度分析、AI优化建议 |
| 知识库 | 多格式文档支持、向量化存储、智能检索 |
| AI助手 | 基于知识库的RAG问答、流式响应、多会话管理 |
| 模拟面试 | AI驱动面试模拟、实时反馈与评分、多种面试形式 |

### 功能亮点

- 智能简历分析：多维度评分体系（完整性、关键词、经验、技能），校招/社招差异化评估
- 知识库构建：支持 PDF/Word/Excel/Markdown 等多格式文档，用户数据隔离
- AI智能助手：基于 RAG 技术的智能问答，流式响应输出
- 富文本笔记：基于 Plate.js 的专业编辑器，支持 AI 辅助写作
- 模拟面试：文字面试、语音面试、视频面试三种形式

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 最新 | 构建工具 |
| Plate.js | 52.x | 富文本编辑器 |
| Radix UI | 最新 | 无障碍UI组件 |
| React Router | 6.x | 路由管理 |
| Socket.io-client | 4.x | WebSocket通信 |
| Tailwind CSS | 4.x | 样式框架 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| NestJS | 10.x | 后端框架 |
| TypeScript | 5.x | 类型安全 |
| TypeORM | 0.3.x | ORM框架 |
| LangChain | 0.3.x | LLM应用框架 |
| Socket.io | 4.x | WebSocket服务 |
| Passport.js | 0.7.x | 认证中间件 |
| JWT | 10.x | Token认证 |

### 数据存储

| 技术 | 用途 |
|------|------|
| PostgreSQL | 关系型数据存储 |
| Milvus | 向量数据库 |

## 项目结构

```
AI_Interviewer_System/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── ai-assistant/       # AI助手模块
│   │   ├── auth/               # 用户认证模块
│   │   ├── interview/          # 模拟面试模块
│   │   ├── knowledge-base/     # 知识库模块
│   │   ├── notes/              # 笔记管理模块
│   │   ├── resume-analysis/    # 简历分析模块
│   │   ├── users/              # 用户管理模块
│   │   ├── upload/             # 文件上传模块
│   │   ├── common/             # 公共组件
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                   # 测试文件
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── AIAssistant/        # AI助手页面
│   │   ├── Interview/          # 模拟面试页面
│   │   ├── KnowledgeBase/      # 知识库页面
│   │   ├── LoginPage/          # 登录页面
│   │   ├── MainPage/           # 主页面
│   │   ├── Note/               # 笔记页面
│   │   ├── ResumeAnalysis/     # 简历分析页面
│   │   ├── components/         # 公共组件
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── docs/                       # 项目文档
│   ├── SYSTEM_DOCUMENTATION.md
│   ├── PRD_Interview_Module.md
│   └── DEV_MODULES_Interview.md
├── docker-compose.yml          # Docker编排配置
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 22.0.0
- PostgreSQL 15+
- Milvus 2.x
- Docker & Docker Compose（推荐）

### 使用 Docker Compose 启动基础服务

```bash
docker-compose up -d
```

这将启动以下服务：
- PostgreSQL（端口 5432）
- Milvus（端口 19530）
- etcd（端口 2379）
- MinIO（端口 9000/9001）

### 后端配置与启动

1. 进入后端目录：
```bash
cd backend
```

2. 安装依赖：
```bash
npm install
```

3. 创建 `.env` 文件并配置环境变量：
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=interviewer

MILVUS_ADDRESS=localhost:19530

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

OPENAI_API_KEY=your_openai_api_key
```

4. 启动开发服务器：
```bash
npm run start:dev
```

### 前端配置与启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 创建 `.env` 文件并配置环境变量：
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

4. 启动开发服务器：
```bash
npm run dev
```

## API 概览

### 认证相关

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/github` | POST | GitHub OAuth 登录 |

### 用户相关

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/users/me` | GET | 获取当前用户信息 |

### 笔记相关

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/notes` | GET | 获取笔记列表 |
| `/api/notes` | POST | 创建笔记 |
| `/api/notes/:id` | GET | 获取笔记详情 |
| `/api/notes/:id` | PUT | 更新笔记 |
| `/api/notes/:id` | DELETE | 删除笔记 |
| `/api/notes/:id/versions` | GET | 获取版本历史 |
| `/api/notes/:id/upload-to-knowledge` | POST | 上传至知识库 |

### 简历分析相关

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/resume-analysis/upload` | POST | 上传简历 |
| `/api/resume-analysis` | GET | 获取简历列表 |
| `/api/resume-analysis/:id` | GET | 获取简历详情 |
| `/api/resume-analysis/:id/analyze` | POST | 触发AI分析 |
| `/api/resume-analysis/:id/analysis` | GET | 获取分析结果 |

### 知识库相关

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/knowledge-base/documents` | GET | 获取文档列表 |
| `/api/knowledge-base/documents` | POST | 上传文档 |
| `/api/knowledge-base/query` | POST | 知识库问答 |

### AI助手相关

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/ai-assistant/sessions` | GET | 获取会话列表 |
| `/api/ai-assistant/sessions` | POST | 创建会话 |
| `/api/ai-assistant/sessions/:id/messages` | POST | 发送消息 |

### 模拟面试相关

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/interview/sessions` | GET | 获取面试列表 |
| `/api/interview/sessions` | POST | 创建面试 |
| `/api/interview/sessions/:id/messages` | POST | 发送消息 |
| `/api/interview/sessions/:id/report` | GET | 获取面试报告 |

## 开发指南

### 后端开发

```bash
cd backend

npm run start:dev      # 开发模式
npm run build          # 构建
npm run start:prod     # 生产模式
npm run test           # 运行测试
npm run test:e2e       # E2E测试
```

### 前端开发

```bash
cd frontend

npm run dev            # 开发模式
npm run build          # 构建
npm run preview        # 预览构建结果
npm run lint           # 代码检查
```

## 系统架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              前端层 (Frontend)                               │
│  React 18 + TypeScript + Vite + Plate.js + Radix UI + Socket.io-client      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ HTTP/WebSocket
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              后端层 (Backend)                                │
│  NestJS + TypeScript + TypeORM + LangChain + Socket.io + Passport.js        │
└───────────┬─────────────────┬─────────────────┬─────────────────────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────┐ ┌─────────────────────────────────────┐
│   PostgreSQL      │ │    Milvus     │ │         External Services           │
│   (关系型数据库)   │ │  (向量数据库)  │ │  OpenAI API + GitHub OAuth          │
└───────────────────┘ └───────────────┘ └─────────────────────────────────────┘
```

## 许可证

ISC License
