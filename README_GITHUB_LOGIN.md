# GitHub 登录配置与使用指引

本项目已切换为 GitHub OAuth 登录。按以下步骤完成配置与验证。

## 1) 创建 GitHub OAuth App

1. 进入 https://github.com/settings/developers > **OAuth Apps** > **New OAuth App**。
2. 填写：
   - Application name: 任意
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5173/login`
3. 创建后记录 **Client ID**，点击 **Generate a new client secret** 获取 **Client Secret**。

> 生产环境请将 Homepage/Callback 设置为生产域名，并使用 HTTPS。

## 2) 后端环境变量（backend/.env）

```
GITHUB_CLIENT_ID=<你的 GitHub Client ID>
GITHUB_CLIENT_SECRET=<你的 GitHub Client Secret>
GITHUB_REDIRECT_URI=http://localhost:5173/login
# 其他现有变量保持不变，例如 DB/JWT 等
```

## 3) 前端环境变量（frontend/.env）

```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GITHUB_CLIENT_ID=<你的 GitHub Client ID>
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login
```

> 若端口或域名不同，请同步修改后端的 `GITHUB_REDIRECT_URI` 和前端的 `VITE_GITHUB_REDIRECT_URI`，并确保与 GitHub OAuth App 的 Callback URL 一致。

## 4) 安装依赖并启动

- 后端：在 `backend/` 运行 `npm install`，然后 `npm run start:dev`。
- 前端：在 `frontend/` 运行 `npm install`，然后 `npm run dev`（默认 Vite 5173 端口）。

## 5) 登录流程说明

- 前端点击 “Continue with GitHub” 后跳转 GitHub 授权页。
- GitHub 回调到 `http://localhost:5173/login?code=...&state=...`。
- 前端用 `code` 调用后端 `POST /api/auth/github`，后端验证并返回：
  - `token`: JWT，已包含 GitHub 用户标识
  - `isFirstLogin`: 是否首次登录
- 前端会将 `token` 存入 `localStorage`，首登时同步保存 `isFirstLogin=true`。

## 6) 数据与字段

- 用户表新增字段：`githubId`, `githubUsername`, `avatar`, `email`, `githubProfileUrl`（电话可空）。
- 旧的手机号验证码登录已移除。

## 7) 本地调试小贴士

- 如遇状态校验失败，前端会清理 URL 中的 `code/state` 并提示重新登录。
- 如需重新授权，可清空浏览器 `localStorage` 中的 `token` 与 `github_oauth_state`。
- 确保后端 `.env` 与前端 `.env` 的 Client ID/Redirect URI 完全一致。

## 8) 生产部署要点

- 使用 HTTPS 域名，并在 GitHub OAuth App 中更新 Homepage/Callback。
- 将 `VITE_API_BASE_URL` 指向生产后端域名（含 `/api` 前缀）。
- 将 `GITHUB_REDIRECT_URI` / `VITE_GITHUB_REDIRECT_URI` 改为生产登录页地址。
