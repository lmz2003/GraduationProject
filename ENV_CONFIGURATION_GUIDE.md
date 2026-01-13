# 🔧 环境变量配置完整指南

> 本指南详细说明所有必需和可选的环境变量配置

---

## 📋 目录

1. [快速开始](#快速开始)
2. [后端配置（backend/.env）](#后端配置)
3. [前端配置（frontend/.env）](#前端配置)
4. [环境变量详解](#环境变量详解)
5. [多环境配置](#多环境配置)
6. [故障排查](#故障排查)

---

## 🚀 快速开始

### 一键配置（本地开发）

```bash
# 1. 复制后端环境模板
cd backend
cp .env.example .env

# 2. 复制前端环境模板
cd ../frontend
cp .env.example .env

# 3. 编辑后端 .env，添加 OPENAI_API_KEY
# 编辑前端 .env（默认配置已可用）

# 4. 启动应用
cd ../backend && npm run start:dev &
cd ../frontend && npm run dev
```

---

## 📊 后端配置（backend/.env）

### 完整配置示例

```env
# ===================================
# 🚀 服务器配置
# ===================================
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# ===================================
# 🔐 JWT 认证配置
# ===================================
JWT_SECRET=mysecretjwtkey12345678901234567890
JWT_EXPIRATION=7d

# ===================================
# 📊 数据库配置 (PostgreSQL)
# ===================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=201966
DB_NAME=db1

# ===================================
# 🔒 GitHub OAuth 配置
# ===================================
GITHUB_CLIENT_ID=Ov23liulgU7RbhoS5LKF
GITHUB_CLIENT_SECRET=591052719dc36697c73dffdc3d3b094f59d4efe0
GITHUB_REDIRECT_URI=http://localhost:5173/login

# ===================================
# 🗄️ Milvus 向量数据库配置
# ===================================
MILVUS_HOST=localhost
MILVUS_PORT=19530

# ===================================
# 🤖 OpenAI API 配置（RAG 系统必需）
# ===================================
OPENAI_API_KEY=sk-your-api-key-here

# ===================================
# 🔧 应用配置
# ===================================
MAX_REQUESTS_PER_15MIN=100
VERIFICATION_CODE_EXPIRATION=300
```

### 各配置项说明

| 配置项 | 说明 | 示例 | 必需 | 环境 |
|--------|------|------|------|------|
| **PORT** | 后端服务端口 | 3001 | ✅ | 所有 |
| **NODE_ENV** | Node.js 运行环境 | development/production | ✅ | 所有 |
| **LOG_LEVEL** | 日志级别 | debug/info/warn/error | ✅ | 所有 |
| **JWT_SECRET** | JWT 签名密钥 | 任意字符串，越复杂越好 | ✅ | 所有 |
| **JWT_EXPIRATION** | JWT 过期时间 | 7d (7天) | ✅ | 所有 |
| **DB_HOST** | 数据库主机 | localhost | ✅ | 所有 |
| **DB_PORT** | 数据库端口 | 5432 | ✅ | 所有 |
| **DB_USERNAME** | 数据库用户名 | postgres | ✅ | 所有 |
| **DB_PASSWORD** | 数据库密码 | 201966 | ✅ | 所有 |
| **DB_NAME** | 数据库名 | db1 | ✅ | 所有 |
| **GITHUB_CLIENT_ID** | GitHub OAuth Client ID | Ov23liulgU7RbhoS5LKF | ✅ | 所有 |
| **GITHUB_CLIENT_SECRET** | GitHub OAuth Secret | 591052719dc36... | ✅ | 所有 |
| **GITHUB_REDIRECT_URI** | GitHub OAuth 重定向 URI | http://localhost:5173/login | ✅ | 所有 |
| **MILVUS_HOST** | Milvus 向量数据库主机 | localhost | ⚠️ | RAG 功能 |
| **MILVUS_PORT** | Milvus 向量数据库端口 | 19530 | ⚠️ | RAG 功能 |
| **OPENAI_API_KEY** | OpenAI API 密钥 | sk-... | ⚠️ | RAG 功能 |
| **MAX_REQUESTS_PER_15MIN** | 15 分钟内最大请求数 | 100 | ✅ | 所有 |
| **VERIFICATION_CODE_EXPIRATION** | 验证码过期时间（秒） | 300 | ✅ | 所有 |

---

## 🌐 前端配置（frontend/.env）

### 完整配置示例

```env
# ===================================
# 🌐 前端 Vite 环境变量
# ===================================

# ===================================
# 🔗 API 配置
# ===================================
VITE_API_BASE_URL=http://localhost:3001/api

# ===================================
# 🔒 GitHub OAuth 配置
# ===================================
VITE_GITHUB_CLIENT_ID=Ov23liulgU7RbhoS5LKF
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login

# ===================================
# 🎨 应用配置
# ===================================
VITE_DEFAULT_THEME=system
```

### 各配置项说明

| 配置项 | 说明 | 示例 | 必需 | 用途 |
|--------|------|------|------|------|
| **VITE_API_BASE_URL** | 后端 API 基础地址 | http://localhost:3001/api | ✅ | 所有 API 请求 |
| **VITE_GITHUB_CLIENT_ID** | GitHub OAuth Client ID | Ov23liulgU7RbhoS5LKF | ✅ | GitHub 登陆 |
| **VITE_GITHUB_REDIRECT_URI** | GitHub OAuth 重定向地址 | http://localhost:5173/login | ✅ | GitHub 回调 |
| **VITE_DEFAULT_THEME** | 默认主题 | light/dark/system | ⚠️ | 可选，默认 system |

### 重要提示

⚠️ **前端环境变量必须以 `VITE_` 前缀开头才能在浏览器中暴露！**

```javascript
// ✅ 正确的使用方式
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// ❌ 错误的使用方式（不会工作）
const apiUrl = import.meta.env.API_BASE_URL;
```

---

## 🔍 环境变量详解

### 🔒 GitHub OAuth 配置

#### 为什么需要配置？
GitHub OAuth 用于用户认证和授权，无需用户密码，更安全。

#### 如何获取 Client ID 和 Secret？

1. **访问 GitHub 开发者设置**
   ```
   https://github.com/settings/developers
   ```

2. **创建 OAuth App**
   - 点击 `New OAuth App`
   - 填写应用信息：
     - **Application name**: 任意名称
     - **Homepage URL**: http://localhost:5173 (本地) 或你的生产域名
     - **Authorization callback URL**: http://localhost:5173/login (本地) 或你的生产地址

3. **获取凭证**
   - **Client ID**: 直接显示在应用页面
   - **Client Secret**: 需要点击 `Generate a new client secret`

#### 配置注意事项
- 后端和前端的 **Client ID 必须一致**
- **Redirect URI 必须在三个地方保持一致**：
  1. GitHub OAuth App 配置
  2. 后端 `GITHUB_REDIRECT_URI`
  3. 前端 `VITE_GITHUB_REDIRECT_URI`

### 🗄️ Milvus 配置

#### 为什么需要配置？
Milvus 是向量数据库，用于 RAG 系统的向量存储和相似度搜索。

#### 配置步骤

```bash
# 1. 启动 Docker 服务（包含 Milvus）
docker-compose up -d

# 2. 验证连接
curl http://localhost:9091/healthz
# 应该返回 200 OK

# 3. 配置 .env
MILVUS_HOST=localhost
MILVUS_PORT=19530
```

### 🤖 OpenAI API 配置

#### 为什么需要配置？
OpenAI API 用于生成向量嵌入和 LLM 功能。

#### 获取 API 密钥

1. **访问 OpenAI 官网**
   ```
   https://platform.openai.com/api-keys
   ```

2. **创建新密钥**
   - 点击 `Create new secret key`
   - 复制密钥（只显示一次）

3. **配置到 .env**
   ```env
   OPENAI_API_KEY=sk-your-secret-key
   ```

#### 成本考量
- OpenAI API 是付费的
- 使用 `gpt-3.5-turbo` 相对便宜
- 可以设置使用额度限制

---

## 🌍 多环境配置

### 本地开发环境

```env
# backend/.env
NODE_ENV=development
DB_HOST=localhost
OPENAI_API_KEY=sk-your-dev-key

# frontend/.env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login
```

### 测试环境

```env
# backend/.env
NODE_ENV=staging
DB_HOST=test-db.example.com
DB_PORT=5432

# frontend/.env
VITE_API_BASE_URL=https://test-api.example.com/api
VITE_GITHUB_REDIRECT_URI=https://test.example.com/login
```

### 生产环境

```env
# backend/.env
NODE_ENV=production
LOG_LEVEL=info
PORT=3001
JWT_SECRET=<复杂的随机字符串>
DB_HOST=<RDS 主机>
DB_PORT=5432
DB_USERNAME=<强密码>
DB_PASSWORD=<强密码>
GITHUB_REDIRECT_URI=https://yourdomain.com/login

# frontend/.env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_GITHUB_REDIRECT_URI=https://yourdomain.com/login
```

### 环境变量切换方案

**方案 1: 多个 .env 文件**

```bash
.env                    # 默认（开发）
.env.development        # 开发
.env.staging           # 测试
.env.production        # 生产

# 启动时指定
NODE_ENV=production npm run start
```

**方案 2: 脚本自动切换**

```bash
# scripts/setup-env.sh
#!/bin/bash
ENV=$1
cp .env.$ENV .env
echo "Environment set to: $ENV"

# 使用
./scripts/setup-env.sh production
```

---

## 🔍 验证配置

### 检查后端配置

```bash
# 1. 验证环境变量已加载
cd backend
npm run start:dev

# 应该看到输出：
# [Nest] 12345  - 01/15/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...

# 2. 验证数据库连接
# 检查是否有数据库连接错误

# 3. 验证 Milvus 连接
curl http://localhost:9091/healthz
# 应该返回 200

# 4. 测试 GitHub OAuth
curl -X POST http://localhost:3001/api/auth/github \
  -H "Content-Type: application/json" \
  -d '{"code":"test-code"}'
# 应该返回 GitHub 相关错误（这是正常的，说明配置正确）
```

### 检查前端配置

```bash
# 1. 启动前端
cd frontend
npm run dev

# 2. 检查浏览器控制台
# 打开 http://localhost:5173
# 按 F12 打开开发者工具 > Console

# 3. 验证环境变量已加载
console.log(import.meta.env.VITE_API_BASE_URL)
// 应该显示: http://localhost:3001/api

console.log(import.meta.env.VITE_GITHUB_CLIENT_ID)
// 应该显示: Ov23liulgU7RbhoS5LKF
```

---

## 🐛 故障排查

### 问题 1: "Cannot find module .env"

**原因**: dotenv 包未安装

**解决**:
```bash
npm install dotenv
```

### 问题 2: "GitHub OAuth 回调失败"

**原因**: Redirect URI 不匹配

**检查**:
1. GitHub OAuth App 设置中的 Authorization callback URL
2. 后端 `GITHUB_REDIRECT_URI`
3. 前端 `VITE_GITHUB_REDIRECT_URI`
4. 三者必须完全一致！

### 问题 3: "Milvus 连接失败"

**原因**: Milvus 服务未启动

**解决**:
```bash
# 1. 启动 Docker 服务
docker-compose up -d

# 2. 验证 Milvus 运行
docker-compose ps
# 应该看到 milvus 容器 running

# 3. 测试连接
curl http://localhost:9091/healthz
```

### 问题 4: "OpenAI API 密钥无效"

**原因**: API 密钥错误或过期

**解决**:
1. 检查 `.env` 中的密钥是否正确复制
2. 确保没有额外空格
3. 从 OpenAI 重新生成新密钥

### 问题 5: "环境变量在前端访问不到"

**原因**: 前端环境变量名称没有 `VITE_` 前缀

**解决**:
```javascript
// ❌ 错误
const url = import.meta.env.API_BASE_URL

// ✅ 正确
const url = import.meta.env.VITE_API_BASE_URL
```

---

## ✅ 配置检查清单

### 本地开发环境检查

- [ ] 后端 `.env` 已创建
- [ ] 前端 `.env` 已创建
- [ ] 数据库配置正确（主机、端口、用户名、密码、数据库名）
- [ ] JWT_SECRET 已设置
- [ ] GitHub Client ID 和 Secret 已配置
- [ ] GitHub Redirect URI 三处一致
- [ ] Milvus 服务已启动（若使用 RAG）
- [ ] OpenAI API 密钥已配置（若使用 RAG）

### 生产环境检查

- [ ] NODE_ENV 设为 production
- [ ] LOG_LEVEL 设为 info（减少日志）
- [ ] JWT_SECRET 使用复杂密钥
- [ ] 数据库使用生产 RDS 实例
- [ ] 所有密钥都从安全的密钥管理系统读取
- [ ] 敏感信息（如数据库密码）未提交到 Git
- [ ] `.env` 文件已添加到 `.gitignore`

---

## 🔐 安全建议

### 1. 不要提交 `.env` 到 Git

```bash
# 在 .gitignore 中添加
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 2. 使用强密钥

```javascript
// 生成安全的 JWT_SECRET
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
console.log(secret);
```

### 3. 定期轮换密钥

- GitHub Secret: 在 GitHub 中重新生成
- OpenAI Key: 在 OpenAI 中停用旧密钥
- JWT Secret: 更新后重新部署

### 4. 使用环境变量管理工具

生产环境推荐使用：
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Kubernetes Secrets

---

## 📚 相关文档

- [README_GITHUB_LOGIN.md](./README_GITHUB_LOGIN.md) - GitHub OAuth 配置指南
- [backend/.env.example](./backend/.env.example) - 后端环境变量模板
- [frontend/.env.example](./frontend/.env.example) - 前端环境变量模板
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - 完整安装检查清单

---

**最后更新**: 2024-01-15  
**文档版本**: 1.0
