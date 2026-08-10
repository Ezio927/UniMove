<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# UniMove 项目 Copilot 指令

## 项目概述
UniMove 是一个体育场所预约系统，采用前后端分离架构：
- 前端：React 19 + TypeScript + Vite + Ant Design + Redux Toolkit
- 后端：Node.js + Express + TypeScript + MongoDB + Mongoose
- 主要功能：用户管理、活动管理、订单管理、评论系统

## 代码规范

### 通用规范
- 使用 TypeScript 确保类型安全
- 采用函数式编程风格，优先使用 React Hooks
- 遵循 ESLint 和 Prettier 配置
- 使用有意义的变量和函数命名
- 添加适当的注释和 JSDoc

### 命名规范
- 组件：PascalCase (例如：ActivityCard)
- 文件名：PascalCase (组件) 或 camelCase (工具函数)
- 变量和函数：camelCase
- 常量：UPPER_SNAKE_CASE
- 类型接口：PascalCase，以 I 开头 (例如：IUser)

### 前端规范
- 使用 React.FC 类型注解函数组件
- Props 接口以组件名 + Props 命名
- 使用 useAppSelector 和 useAppDispatch hooks
- API 调用使用 try-catch 错误处理
- 使用 Ant Design 组件，保持设计一致性
- CSS 类名使用 kebab-case

### 后端规范
- 控制器方法使用 static async 
- 路由处理函数使用 async/await
- 数据验证使用 Mongoose schema validators
- 错误响应格式：{ success: false, message: string }
- 成功响应格式：{ success: true, data: any, message?: string }
- 使用 middleware 进行认证和权限检查

## API 设计原则
- 遵循 RESTful 设计模式
- 使用适当的 HTTP 状态码
- 实现统一的错误处理
- 提供完整的输入验证
- 支持分页、搜索、排序功能

## 目录结构
```
frontend/src/
├── api/          # API 接口定义
├── components/   # 可复用组件
├── pages/        # 页面组件
├── store/        # Redux 状态管理
└── App.tsx       # 主应用

backend/src/
├── controllers/  # 业务逻辑控制器
├── models/       # 数据模型
├── routes/       # 路由定义
├── middleware/   # 中间件
├── utils/        # 工具函数
└── index.ts      # 应用入口
```

## 开发提示
- 创建新组件时，同时创建对应的 CSS 文件
- API 接口优先考虑类型安全和错误处理
- 使用 dayjs 处理日期时间
- 图片上传和显示考虑懒加载和占位符
- 移动端适配使用响应式设计
- 性能优化：代码分割、懒加载、缓存策略

## 常用模式
- 页面组件：useState + useEffect + API 调用
- 表单处理：Ant Design Form + 验证
- 列表组件：分页 + 搜索 + 筛选
- 模态框：受控组件模式
- 错误处理：try-catch + message 提示
