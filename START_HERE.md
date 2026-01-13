# RAG 知识库系统 - 单一指南

本文件整合了之前的快速开始、FAQ 和系统摘要，减少重复，只保留一个可落地的操作指南。详细 API 与架构说明请查阅 [backend/RAG_KNOWLEDGE_BASE_README.md](backend/RAG_KNOWLEDGE_BASE_README.md)，示例代码参见 [INTEGRATION_EXAMPLES.md](INTEGRATION_EXAMPLES.md)。

## 必备条件

- Node.js ≥ 16（建议与项目锁定版本一致）
- Docker（已包含 compose）
- OpenAI API 密钥

## 本地 / 云服务器快速启动

1. 拉代码并进入项目根目录：

```bash
git clone <repo> && cd GraduationProject
```

2. 启动依赖服务（Postgres + Milvus）：

```bash
docker compose up -d postgres milvus
docker compose ps
```

3. 配置后端环境变量：

```bash
cd backend
cp .env.example .env
# 至少填：OPENAI_API_KEY=...，DATABASE_URL=postgres://postgres:201966@localhost:5432/notes
# 若容器内访问 Milvus，用 MILVUS_ADDRESS=milvus:19530；宿主访问可用 localhost:19530
```

4. 安装并启动后端：

```bash
npm install
npm run build
pm2 start dist/main.js --name graduation-backend
pm2 save
```

5. 安装并启动前端（可选部署到 Nginx）：

```bash
cd ../frontend
npm install
npm run dev   # 本地开发
# 生产部署：npm run build 后将 dist/ 静态托管，/api 反代到 http://127.0.0.1:3001
```

## 环境变量速查（后端）

- OPENAI_API_KEY：必填
- DATABASE_URL：如 `postgres://postgres:201966@localhost:5432/notes`
- MILVUS_ADDRESS：默认 `localhost:19530`（容器互访用 `milvus:19530`）
- PORT：默认 3001

## API 速查

- 文档管理：
  - POST `/api/knowledge-base/documents` 添加
  - GET `/api/knowledge-base/documents` 列表
  - GET `/api/knowledge-base/documents/:id` 获取单个
  - PUT `/api/knowledge-base/documents/:id` 更新
  - DELETE `/api/knowledge-base/documents/:id` 删除
- 查询：
  - POST `/api/knowledge-base/query` 基础查询（`topK`, `threshold`）
  - POST `/api/knowledge-base/rag-query` RAG 查询（`topK`）
- 统计：
  - GET `/api/knowledge-base/statistics`

## 数据持久化

- compose 已挂载卷：
  - Postgres → `postgres_data` → `/var/lib/postgresql/data`
  - Milvus → `milvus_data` → `/var/lib/milvus`
  - etcd → `etcd_data`
  - MinIO → `minio_data`
- 重启容器数据仍在；`docker compose down -v` 会删除卷并清空数据（谨慎使用）。

## 常见操作

- 查看容器状态：`docker compose ps`
- 查看容器日志：`docker compose logs postgres` / `milvus`
- 重启依赖：`docker compose restart postgres milvus`
- 后端日志（pm2）：`pm2 logs graduation-backend`

## 部署到云服务器的小贴士

- 安全组/防火墙：仅放行 80/443（调试时临时开放 3001/4173），数据库端口保持内网。
- 反向代理：Nginx 静态托管前端 dist，并将 `/api` 反代到后端 3001。
- 开机自启：`pm2 save && pm2 startup`，Nginx 使用 systemd 默认自启。

## 故障排除快览

- Milvus 连接失败：`docker compose logs milvus`，确认 `MILVUS_ADDRESS`；必要时重启 milvus/minio/etcd。
- OpenAI 报错：检查 OPENAI_API_KEY 是否填入 `.env`，并确认网络可访问 OpenAI。
- 查询结果不相关：调高 `threshold` 或检查文档质量/分块大小。
- 启动后端失败：确保 Postgres 与 Milvus 已启动，`DATABASE_URL` 正确，端口未被占用。

## 进一步阅读

- 详细 API 与架构： [backend/RAG_KNOWLEDGE_BASE_README.md](backend/RAG_KNOWLEDGE_BASE_README.md)
- 集成示例： [INTEGRATION_EXAMPLES.md](INTEGRATION_EXAMPLES.md)
- 文件结构参考： [FILE_STRUCTURE.md](FILE_STRUCTURE.md)
