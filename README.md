# UniMove

UniMove 是面向校园体育活动的全栈 Web 应用。它提供活动浏览与发布、名额报名、订单管理、评分评论、个人中心，以及活动收藏等功能。

## 技术栈

- 前端：React 19、TypeScript、Vite 7、Ant Design 5、Redux Toolkit
- 后端：Node.js 22、Express 4、TypeScript、MongoDB 7、Mongoose 8
- 质量与安全：Vitest、ESLint、GitHub Actions、GitLab CI、JWT、bcrypt、Helmet、CORS、速率限制、Zod

## 安装

需要 Node.js `>=22.12.0`、npm；本机开发还需要可访问的 MongoDB。

```bash
git clone https://github.com/Ezio927/UniMove.git
cd UniMove
npm run install:all
```

本机开发分别在 `backend/` 和 `frontend/` 复制各自的 `.env.example` 为 `.env`，填入开发环境所需值后启动：

```bash
cd backend
npm run dev

# 另一个终端
cd frontend
npm run dev
```

默认开发地址是前端 `http://localhost:5173`、后端 `http://localhost:3001`，健康检查为 `http://localhost:3001/api/health`。这些是本机开发服务器地址，不是 Docker 发布端口。

## 运行与验证

根目录提供统一入口：

```bash
npm test
npm run verify
```

`npm test` 顺序执行前后端测试；`npm run verify` 顺序执行 lint、类型检查、测试和构建，是本地提交前与 CI 使用的完整质量门禁。需要定位子项目问题时，可在对应目录运行 `npm run lint`、`npm run type-check`、`npm test` 或 `npm run build`。

后端示例数据仅能通过 CLI 导入，不提供公开 HTTP 导入端点：

```bash
cd backend
npm run import-data
```

## Docker 分发

核心 Compose 栈仅包含 MongoDB、backend 和 frontend。它不发布 MongoDB 或 backend 的宿主机端口；浏览器只经由前端反向代理访问 `/api`。前端仅绑定回环地址 `127.0.0.1:80`，因此默认只可由运行 Docker 的主机访问。

启动前在当前 shell 设置一次性变量；不要将生产凭据提交到 `.env` 或仓库。`MONGO_ROOT_PASSWORD_URI` 必须是与 `MONGO_ROOT_PASSWORD` 相同的密码、按 URI 百分号编码后的值：

```powershell
$env:MONGO_ROOT_PASSWORD = 'choose-a-strong-password'
$env:MONGO_ROOT_PASSWORD_URI = [System.Uri]::EscapeDataString($env:MONGO_ROOT_PASSWORD)
$env:JWT_SECRET = 'at-least-32-disposable-or-production-secret-characters'
docker compose up -d --build
```

访问 `http://127.0.0.1/health` 应返回 `200 ok`；`http://127.0.0.1/api/health` 经反向代理检查 backend，成功响应包含 `success: true` 和数据库连接状态。Docker 的详细变量、日志、停止、重建和可选管理工具说明见 [DOCKER_GUIDE.md](DOCKER_GUIDE.md)。

## API

API 根路径为 `/api`；受保护端点使用：

```http
Authorization: Bearer <access-token>
```

完整路由、参数、请求体与错误格式见 [API 文档](docs/API.md)。

## 目录结构

```text
UniMove/
├── frontend/                  # React 页面、组件、状态与 API 客户端
├── backend/                   # Express API、领域服务、校验与 MongoDB 模型
├── docs/                      # API、设计与课程过程文档
├── .github/workflows/ci.yml   # GitHub 测试与镜像构建检查
├── .gitlab-ci.yml             # GitLab 测试与质量门禁
├── docker-compose.yml         # 核心发布栈
└── docker-compose.tools.yml   # 可选 Mongo Express 工具栈
```

## 安全边界

- 不提交 `.env`、真实密码、JWT 密钥或连接串；Docker 凭据仅通过当前进程环境传入。
- MongoDB 与 backend 不映射宿主机端口；核心入口仅为回环绑定的前端代理。
- `MONGO_ROOT_PASSWORD` 只用于 MongoDB 初始化/认证；`MONGO_ROOT_PASSWORD_URI` 只用于连接 URI，必须是相同原始密码的百分号编码表示。
- Mongo Express 不是核心服务，启用后仍仅绑定 `127.0.0.1:8081`，并要求独立基本认证密码。
- 发现安全问题请遵循 [SECURITY.md](SECURITY.md) 私下报告。

## 已知限制

- 核心 Compose 默认不提供公网访问；生产部署应在受控反向代理、TLS、密钥管理和网络策略之后再暴露服务。
- `/api/health` 报告 Mongoose 连接状态；它目前不执行额外的数据库读操作。
- 前端构建可能出现 Vite 大 chunk 建议，测试环境可能出现 jsdom pseudo-element 提示；已知提示不改变成功退出码。
- Docker 的运行时验证依赖本机 Docker Engine 和可用网络；CI 静态检查不替代部署环境的运行时验证。

## 课程过程文档

- [实施计划](PLAN.md)
- [Agent 协作日志](AGENT_LOG.md)
- [SPEC 与 PLAN 形成过程](SPEC_PROCESS.md)
- [贡献指南](CONTRIBUTING.md)

## 第三方技术与许可证

本项目使用上述开源运行时、框架和工具，具体依赖及其许可证以各子项目的 `package-lock.json`、`package.json` 与 Docker 镜像声明为准。本仓库代码按 [MIT License](LICENSE) 发布。
