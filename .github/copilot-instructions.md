# GraduationProject Copilot 指南

## 项目概览
这是一个包含 **NestJS** 后端和 **React + Vite** 前端的全栈应用程序。
- **根目录**: 包含 `backend/` 和 `frontend/` 目录。
- **数据库**: PostgreSQL (通过 TypeORM)。
- **认证**: 手机号验证 + JWT。

## 后端 (NestJS)
- **框架**: NestJS 配合 TypeORM。
- **结构**: 标准的 `Module` -> `Controller` -> `Service` 模式。
- **数据库**:
  - 使用 **TypeORM**，实体文件位于 `*.entity.ts`。
  - 通过 `ConfigModule` 和 `.env` 进行配置。
- **认证**:
  - `AuthModule` 处理手机号和验证码登录。
  - 受保护的路由使用 `JwtAuthGuard`。
  - `isFirstLogin` 逻辑处理用户引导。
- **验证**:
  - 在 DTO (`*.dto.ts`) 中使用 `class-validator` 装饰器。
  - 启用了全局 `ValidationPipe` 并设置 `whitelist: true`。
- **错误处理**:
  - 已知错误使用 `HttpException`。
  - 全局 `HttpExceptionFilter` 格式化响应。
- **实时功能**:
  - `NotesGateway` 使用 `socket.io` 进行实时更新。

## 前端 (React + Vite)
- **框架**: React 19 + TypeScript + Vite。
- **样式**:
  - **Styled-components** 用于动态组件样式 (例如 `Login.tsx`)。
  - **SCSS Modules** (`*.module.scss`) 用于页面级布局 (例如 `UserSetup.module.scss`)。
- **状态管理**:
  - 本地状态 (`useState`) 和用于存储 auth token 的 `localStorage`。
  - `useEffect` 用于副作用和 token 监听。
- **组件**:
  - `LoginPage`: 处理登录/注册流程。
  - `MainPage`: 核心应用界面。
  - `Note`: 使用 `@uiw/react-markdown-editor` 进行 Markdown 编辑。
- **API 交互**:
  - 后端 API 前缀为 `/api`。
  - 确保请求包含 `Authorization: Bearer <token>` 头部。

## 开发工作流
- **后端**:
  - 运行: `npm run start:dev` (端口 3001)。
  - 测试: `npm run test` 或 `npm run test:e2e`。
- **前端**:
  - 运行: `npm run dev` (Vite)。
  - 构建: `npm run build`。

## 代码规范
- **TypeScript**: 严格类型。避免使用 `any`。
- **命名**:
  - 文件: `kebab-case` (例如 `auth.service.ts`, `Login.tsx`)。
  - 类: `PascalCase`。
  - 变量/函数: `camelCase`。
- **Async/Await**: 优先使用 `async/await` 而不是 `.then()`。
- **注释**: 为复杂逻辑添加注释，特别是 `AuthService` 和 `NotesGateway`。
