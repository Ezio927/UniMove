# UniMove

UniMove 是一个面向校园体育活动的全栈 Web 应用，支持活动发布与检索、原子名额报名、订单管理、评分评论和个人中心。

## 技术栈

- 前端：React 19、TypeScript、Vite 7、Ant Design 5、Redux Toolkit
- 后端：Node.js 22、Express 4、TypeScript、MongoDB 7、Mongoose 8
- 质量保障：ESLint、Vitest、GitHub Actions、Dependabot、依赖审计
- 安全基础：JWT、bcrypt、Helmet、CORS、速率限制、Zod 严格输入验证

## 本地开发

要求 Node.js `>=22.12.0`、npm 和 MongoDB。

```bash
git clone https://github.com/Ezio927/UniMove.git
cd UniMove
```

后端：

```bash
cd backend
npm ci
cp .env.example .env
npm run dev
```

前端（另一个终端）：

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001
- 健康检查：http://localhost:3001/api/health

Windows PowerShell 可使用 `Copy-Item .env.example .env` 代替 `cp`。

## 环境变量

后端必需配置：

```dotenv
MONGODB_URI=mongodb://localhost:27017/unimove
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

`FRONTEND_URL` 支持逗号分隔的多个来源。前端通过 `VITE_API_URL` 指定 API 根地址。

## 常用命令

前后端目录均提供：

```bash
npm run lint
npm run type-check
npm test
npm run build
```

后端样例数据通过 CLI 导入，不通过公共 HTTP 端点暴露：

```bash
cd backend
npm run import-data
```

## API

API 根路径为 `/api`。受保护端点使用：

```http
Authorization: Bearer <access-token>
```

完整路由、筛选参数、请求体和错误格式见 [API 文档](docs/API.md)。

## Docker

根目录提供 `docker-compose.yml`。启动前需要配置 `MONGO_ROOT_PASSWORD`、`JWT_SECRET` 和 `MONGO_EXPRESS_PASSWORD`：

```bash
docker compose up --build
```

更多说明见 [Docker 指南](DOCKER_GUIDE.md) 与 [数据库指南](DATABASE_SETUP.md)。

## 项目结构

```text
UniMove/
├── frontend/src/       # React 页面、组件、hooks、API 与状态
├── backend/src/
│   ├── controllers/    # HTTP 请求与响应映射
│   ├── services/       # 业务规则与数据访问
│   ├── validation/     # 请求 schema
│   ├── middleware/     # 认证、验证与错误边界
│   ├── models/         # Mongoose 模型
│   └── routes/         # Express 路由
├── docs/               # 项目文档
└── .github/            # CI、Issue 与 PR 配置
```

## 贡献与安全

- 开发流程见 [CONTRIBUTING.md](CONTRIBUTING.md)
- 安全问题请按 [SECURITY.md](SECURITY.md) 私下报告
- 本项目采用 [MIT License](LICENSE)
