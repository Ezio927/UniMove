# UniMove

UniMove 是面向校园体育活动的全栈 Web 应用。它提供活动浏览与发布、名额报名、订单管理、评分评论、个人中心，以及活动收藏等功能。

## 技术栈

- 前端：React 19、TypeScript、Vite 7、Ant Design 5、Redux Toolkit
- 后端：Node.js 22、Express 4、TypeScript、MongoDB 7、Mongoose 8
- 质量与安全：Vitest、ESLint、GitHub Actions、GitLab CI、JWT、bcryptjs、Helmet、CORS、速率限制、Zod

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

`npm test` 顺序执行部署合约、后端和前端测试；`npm run verify` 顺序执行 lint、类型检查、测试和构建，是本地提交前与 CI 使用的完整质量门禁。需要定位子项目问题时，可在对应目录运行 `npm run lint`、`npm run type-check`、`npm test` 或 `npm run build`。

后端示例数据仅能通过 CLI 导入，不提供公开 HTTP 导入端点。该 importer **只用于本地演示**：它会创建或复用一个 admin 用户，并清空、重建活动数据；`NODE_ENV=production` 时会直接拒绝执行。必须在当前进程环境中提供至少 12 字符的强临时密码，不要把它写入 `.env` 或仓库：

```powershell
$env:SEED_ADMIN_PASSWORD = '<strong-temporary-value-with-at-least-12-characters>'
npm run import-data --prefix backend
Remove-Item Env:SEED_ADMIN_PASSWORD
```

公开部署前必须删除该演示 admin，或通过受控流程重置其密码，并审计示例活动是否应保留。再次运行 importer 不会自动轮换已存在 admin 的密码。

## GHCR image distribution

After the first successful `main` publish, change each package's visibility to **Public** in GitHub Packages. Images are available as `ghcr.io/ezio927/unimove-frontend` and `ghcr.io/ezio927/unimove-backend`; anonymous users can pull them with:

```bash
docker pull ghcr.io/ezio927/unimove-frontend:latest
docker pull ghcr.io/ezio927/unimove-backend:latest
```

For deployments, prefer the immutable commit-SHA tag over `latest`, for example `ghcr.io/ezio927/unimove-frontend:<commit-sha>`.

## Docker 分发

核心 Compose 栈仅包含 MongoDB、backend 和 frontend。它不发布 MongoDB 或 backend 的宿主机端口；浏览器只经由前端反向代理访问 `/api`。前端仅绑定回环地址 `127.0.0.1:80`，因此默认只可由运行 Docker 的主机访问。浏览器可使用 `http://127.0.0.1` 或 `http://localhost`；backend 的 Compose CORS allowlist 同时允许这两个精确 Origin，但端口仍只绑定于本机回环接口。

启动前在当前 shell 设置一次性变量；不要将生产凭据提交到 `.env` 或仓库。`MONGO_ROOT_PASSWORD_URI` 必须是与 `MONGO_ROOT_PASSWORD` 相同的密码、按 URI 百分号编码后的值：

```powershell
$env:MONGO_ROOT_PASSWORD = 'choose-a-strong-password'
$env:MONGO_ROOT_PASSWORD_URI = [System.Uri]::EscapeDataString($env:MONGO_ROOT_PASSWORD)
$env:JWT_SECRET = 'at-least-32-disposable-or-production-secret-characters'
docker compose up -d --build
```

访问 `http://127.0.0.1/health` 应返回 `200 ok`；`http://127.0.0.1/api/health` 经反向代理检查 backend。仅当 Mongoose 状态为 connected 时，backend 才返回 HTTP 200 与 `success: true`；断开、连接中或断开中均返回 HTTP 503 与 `success: false`，因此 Docker healthcheck 也会失败。Docker 的详细变量、日志、停止、重建和可选管理工具说明见 [DOCKER_GUIDE.md](DOCKER_GUIDE.md)。

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
- 为了保持本地 Compose 配置最小，backend 当前使用 MongoDB root 账户；仓库不再创建一个未被 backend 使用的固定应用用户。生产环境应在外部数据库中配置权限最小化的独立应用用户，并通过受控密钥管理提供连接 URI。
- Mongo Express 不是核心服务，启用后仍仅绑定 `127.0.0.1:8081`，并要求独立基本认证密码。
- 发现安全问题请遵循 [SECURITY.md](SECURITY.md) 私下报告。

## 已知限制

- 核心 Compose 默认不提供公网访问；生产部署应在受控反向代理、TLS、密钥管理和网络策略之后再暴露服务。
- 本地 Compose 为简化使用 MongoDB root 账户，不是生产最小权限方案；生产应使用外部配置的独立最小权限用户。
- `/api/health` 依据 Mongoose `readyState` 判定连接状态，不执行额外数据库读；任何非 connected 状态都会返回 HTTP 503 与 `success: false`。
- 前端构建可能出现 Vite 大 chunk 建议，测试环境可能出现 jsdom pseudo-element 提示；已知提示不改变成功退出码。
- Docker 的运行时验证依赖本机 Docker Engine 和可用网络；CI 静态检查不替代部署环境的运行时验证。

## 课程过程文档

- [实施计划](PLAN.md)
- [Agent 协作日志](AGENT_LOG.md)
- [SPEC 与 PLAN 形成过程](SPEC_PROCESS.md)
- [贡献指南](CONTRIBUTING.md)

## 第三方技术与许可证

本项目使用上述开源运行时、框架和工具，具体依赖及其许可证以各子项目的 `package-lock.json`、`package.json` 与 Docker 镜像声明为准。根许可证以及 backend 的 `package.json`/`package-lock.json` 根包元数据均为 MIT；本仓库代码按 [MIT License](LICENSE) 发布。
