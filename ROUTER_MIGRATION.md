# React Router 迁移指南

## 概述

已将前端从**基于状态的条件渲染**方式迁移到**使用 React Router 的客户端路由**方式。

## 主要改动

### 1. 新增依赖
```bash
npm install react-router-dom
```

### 2. 路由结构

#### 文件结构
```
frontend/src/
├── routes/
│   └── index.tsx          # 路由配置文件（新增）
├── LoginPage/
│   ├── HomePage.tsx       # 主页面
│   ├── Login.tsx          # 登录表单
│   └── LoginCallback.tsx  # 登录回调处理（新增）
├── MainPage/
│   └── MainPage.tsx       # 主应用页面
├── main.tsx               # 应用入口（已修改）
└── App.tsx                # 不再需要（可删除）
```

#### 路由配置
```typescript
/ → HomePage（登录页面）
/login → HomePage（已登录则重定向到 /dashboard）
/login/callback → LoginCallback（GitHub OAuth 回调处理）
/dashboard → MainPageLayout（已保护的主应用）
/dashboard/:module → MainPageLayout（指定模块，已保护）
*（其他） → 重定向到 /
```

### 3. URL 变化

#### 登录流程
1. 用户在 `/` 或 `/login` 页面
2. 点击"GitHub 登录"按钮
3. 跳转到 GitHub 授权页面
4. GitHub 回调到 `/login/callback`
5. 成功后重定向到 `/dashboard`

#### 模块导航
- 笔记：`/dashboard/notes`
- 简历：`/dashboard/resume`
- 面试：`/dashboard/interview`
- 知识库：`/dashboard/knowledge`

### 4. 核心代码改动

#### main.tsx
```typescript
// 之前
import App from './App.tsx'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 之后
import { RouterProvider } from 'react-router-dom'
import router from './routes/index.tsx'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

#### LoginCallback.tsx（新增）
负责处理 GitHub OAuth 回调流程：
- 获取授权码（code）
- 验证状态（state）
- 交换 Token
- 保存到 localStorage
- 重定向到 `/dashboard`

#### MainPage.tsx 改动
```typescript
// 新增 Router 支持
const { module } = useParams<{ module?: string }>();
const navigate = useNavigate();

// 导航改用 navigate 而不是状态更新
const handleNavClick = (module: string) => {
  setActiveModule(module);
  navigate(`/dashboard/${module}`);  // 新增
  // ...
};

// 登出改用 navigate
const handleLogout = () => {
  localStorage.removeItem('token');
  navigate('/login');  // 改用 navigate 替代 window.location.reload()
};
```

### 5. 环境变量更新

#### 前端 .env 变更
```env
# 之前
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login

# 之后
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login/callback
```

**重要**：需要在 GitHub OAuth App 设置中更新回调 URL：
- 开发环境：`http://localhost:5173/login/callback`
- 生产环境：`https://yourdomain.com/login/callback`

### 6. Login.tsx 简化

- ✅ 移除了 `exchangeCodeForToken` 函数（由 LoginCallback 处理）
- ✅ 移除了授权码处理的 `useEffect`
- ✅ 移除了 `isLoading` 状态
- ✅ 移除了 `onLogin` 回调
- ✅ 简化了 GitHub 登录按钮

### 7. 受保护路由

实现了 `ProtectedRoute` 组件来保护需要认证的页面：
```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? element : <Navigate to="/login" replace />;
};
```

### 8. 优点

✅ **URL 状态同步** - 用户可以书签保存特定页面 URL  
✅ **浏览器后退** - 使用浏览器后退按钮可正确导航  
✅ **路由保护** - 自动检查认证状态  
✅ **更清晰的流程** - 登录回调逻辑独立  
✅ **更好的 SEO** - URL 更有意义  
✅ **分离关注点** - 登录逻辑和主应用页面分离  

## 迁移检查清单

- [x] 安装 React Router 依赖
- [x] 创建 `routes/index.tsx` 配置
- [x] 创建 `LoginCallback.tsx` 组件
- [x] 更新 `main.tsx` 使用 RouterProvider
- [x] 修改 `MainPage.tsx` 支持路由参数
- [x] 修改 `Login.tsx` 简化登录逻辑
- [x] 更新前端 `.env` GitHub 回调 URL
- [x] TypeScript 类型检查通过
- [ ] 在开发环境手动测试登录流程
- [ ] 在开发环境手动测试页面导航
- [ ] 在开发环境手动测试后退按钮
- [ ] 更新 GitHub OAuth App 回调 URL

## 手动测试步骤

### 1. 测试登录流程
1. 访问 `http://localhost:5173/`
2. 点击"GitHub 登录"按钮
3. 授权后应重定向到 `http://localhost:5173/dashboard`

### 2. 测试模块导航
1. 在主应用内点击各模块（笔记、简历、面试、知识库）
2. URL 应该相应更改为 `/dashboard/notes` 等
3. 刷新页面，模块应该保持正确

### 3. 测试退出登录
1. 点击侧边栏的"退出"按钮
2. 应重定向到 `/login` 页面
3. Token 应从 localStorage 中移除

### 4. 测试受保护路由
1. 清除 localStorage 的 token
2. 访问 `http://localhost:5173/dashboard`
3. 应重定向到 `/login`

## 后续优化建议

1. **404 页面** - 添加自定义 404 页面
2. **加载状态** - 在路由切换时显示加载指示器
3. **预加载** - 实现路由预加载以改善性能
4. **深链接** - 支持更深的嵌套路由
5. **路由过渡** - 添加页面切换动画

## 回滚方案

如需回滚到原先方式，可：
1. 删除 `routes/` 目录和 `LoginCallback.tsx`
2. 恢复原来的 `main.tsx` 和 `App.tsx`
3. 卸载 React Router：`npm uninstall react-router-dom`
4. 恢复 `VITE_GITHUB_REDIRECT_URI` 到 `/login`
