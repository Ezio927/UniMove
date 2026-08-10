# UniMove - 体育场所预约系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-green.svg)](https://www.mongodb.com/)

UniMove 是一个现代化的体育场所预约系统，采用前后端分离的架构，为用户提供便捷的体育活动创建、预约和管理服务。

## 🚀 功能特性

### 已完成功能

- 🔐 **用户认证系统**: 注册、登录、个人信息管理
- 📅 **活动管理**: 创建、编辑、浏览体育活动（管理员）
- 🎯 **活动报名**: 参加活动，实时人数统计
- 📋 **订单管理**: 活动预订记录
- 📃 **活动列表**: 活动浏览、搜索、筛选、分页
- 📖 **活动详情**: 详细信息展示、参与者统计
- 💬 **评论系统**: 活动评价、评分功能
- 👤 **个人中心**: 用户信息、活动记录、订单管理
- 🏠 **首页展示**: 特色活动、统计信息
- ℹ️ **关于页面**: 平台介绍、技术栈展示
- 🔍 **智能搜索**: 多维度活动搜索和筛选

### 技术特色

- 🎨 **现代化 UI**: 基于 Ant Design 的简约设计风格
- 📱 **响应式设计**: 完美适配移动端和桌面端
- ⚡ **SPA 架构**: 单页应用，流畅的用户体验
- 🏗️ **组件化开发**: 高度模块化的前端架构
- 🔒 **安全认证**: JWT 身份验证和权限控制
- 🎯 **RESTful API**: 统一的接口设计规范

## 🛠️ 技术栈

### 前端

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Ant Design
- **状态管理**: Redux Toolkit
- **路由**: React Router
- **HTTP 客户端**: Axios
- **日期处理**: Day.js

### 后端

- **运行时**: Node.js
- **框架**: Express.js + TypeScript
- **数据库**: MongoDB + Mongoose
- **身份验证**: JWT + bcryptjs
- **开发工具**: ts-node + nodemon

### 开发工具

- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript
- **版本控制**: Git
- **包管理**: npm

## 📦 项目结构

```
UniMove/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API接口
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # Redux状态管理
│   │   └── App.tsx          # 主应用组件
│   ├── public/              # 静态资源
│   └── package.json
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── index.ts         # 应用入口
│   └── package.json
└── README.md
```

## � 项目状态

### ✅ 已完成

- 前后端基础架构搭建
- 用户认证与授权系统
- 完整的活动管理流程
- 响应式 UI 界面设计
- RESTful API 实现
- 数据库模型设计
- 基础的 CI/CD 配置

### 🚧 待完善

- 图片上传功能
- 支付系统集成
- 邮件通知系统
- 数据分析面板
- 更多单元测试
- 性能优化
- 安全加固

## �🚀 快速开始

### 环境要求

- Node.js >= 22.12.0
- MongoDB >= 4.4
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd UniMove
```

2. **安装后端依赖**

```bash
cd backend
npm install
```

3. **配置环境变量**

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置数据库连接等信息
```

4. **启动 MongoDB 数据库**

```bash
# 确保MongoDB服务正在运行
mongod
```

5. **启动后端服务**

```bash
# 开发模式
npm run dev

# 或构建后启动
npm run build
npm start
```

6. **安装前端依赖**

```bash
cd ../frontend
npm install
```

7. **启动前端应用**

```bash
npm run dev
```

8. **访问应用**

- 前端地址: http://localhost:5173
- 后端 API: http://localhost:3001

## 📚 API 文档

### 认证相关

- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息
- `PUT /api/users/password` - 修改密码

### 活动相关

- `GET /api/activities` - 获取活动列表
- `GET /api/activities/:id` - 获取活动详情
- `POST /api/activities` - 创建活动
- `PUT /api/activities/:id` - 更新活动
- `DELETE /api/activities/:id` - 删除活动
- `POST /api/activities/:id/join` - 参加活动
- `POST /api/activities/:id/leave` - 退出活动

### 订单相关

- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id/pay` - 支付订单
- `PUT /api/orders/:id/cancel` - 取消订单

### 评论相关

- `GET /api/comments/activity/:id` - 获取活动评论
- `POST /api/comments` - 创建评论
- `PUT /api/comments/:id` - 更新评论
- `DELETE /api/comments/:id` - 删除评论

## 🧪 开发指南

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 规则
- 组件和函数使用驼峰命名
- 常量使用大写下划线命名
- 文件名使用 PascalCase（组件）或 camelCase（工具）

### 组件开发

- 使用函数式组件和 React Hooks
- 组件应该单一职责，高内聚低耦合
- 复杂状态逻辑使用 useReducer 或 Redux
- 异步操作使用 useEffect 和 async/await

### API 设计

- 遵循 RESTful 设计原则
- 使用 HTTP 状态码表示操作结果
- 统一的响应格式：`{ success: boolean, message: string, data: any }`
- 实现适当的错误处理和输入验证

## 🚀 部署说明

### 前端部署

```bash
cd frontend
npm run build
# 将dist目录部署到Web服务器
```

### 后端部署

```bash
cd backend
npm run build
# 配置生产环境变量
# 使用PM2或Docker部署Node.js应用
```

### 环境配置

- 配置 MongoDB 生产数据库
- 设置 JWT 密钥和过期时间
- 配置 CORS 允许的域名
- 启用 HTTPS 和安全 headers

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详细信息。

## 👥 开发团队

- **项目负责人**: 241880444 曲俊璇
- **前端开发**: React + TypeScript
- **后端开发**: Node.js + Express
- **UI 设计**: Ant Design

## 📞 联系我们

如有问题或建议，请提交 Issue 或联系我：241880444@smail.nju.edu.cn。

---

🏃‍♂️ **让运动更简单，让生活更精彩！**
