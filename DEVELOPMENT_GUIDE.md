# UniMove 开发指南

## 环境与安装

需要 Node.js `>=22.12.0`、npm 和 Git。本机运行 backend 时还需要一个你已配置并获授权访问的 MongoDB；运行完整本地栈则需要 Docker Engine 与 Docker Compose v2。

```powershell
git clone https://github.com/Ezio927/UniMove.git
Set-Location UniMove
npm run install:all
```

`npm run install:all` 使用前后端锁文件执行 `npm ci`。请保留 `package-lock.json`，不要把 `node_modules`、构建输出或环境文件提交到仓库。

## 本机开发服务器

复制两个已跟踪的示例文件，再只在未跟踪的 `.env` 中填入你自己的开发值：

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

- `backend/.env` 的 `MONGODB_URI` 必须指向你明确配置的本机、测试或托管数据库；仓库不提供固定数据库用户名或密码。
- `JWT_SECRET` 应使用开发环境专用的随机值；生产模式至少 32 字符。
- `PORT=3001`、`FRONTEND_URL=http://localhost:5173` 与 frontend 的 `VITE_API_URL=http://localhost:3001/api` 是现有示例契约。
- `.env` 与 `.env.*` 被 Docker build context 排除；`.env.example` 仍会保留为无秘密模板。

分别启动两个开发服务器：

```powershell
# 终端 1
npm run dev --prefix backend

# 终端 2
npm run dev --prefix frontend
```

前端地址为 `http://localhost:5173`，backend 地址为 `http://localhost:3001`，backend 健康端点为 `http://localhost:3001/api/health`。健康端点仅在 Mongoose connected 时返回 HTTP 200 与 `success: true`，其他连接状态返回 HTTP 503 与 `success: false`。

## Docker 本地分发

Docker 的唯一详细操作文档是 [DOCKER_GUIDE.md](DOCKER_GUIDE.md)，数据库模式与旧卷审计见 [DATABASE_SETUP.md](DATABASE_SETUP.md)。核心栈只有 MongoDB、backend、frontend：

- frontend 是唯一宿主机入口，仅绑定 `127.0.0.1:80`；
- backend 与 MongoDB 只在 Compose 网络内可达，不发布宿主机端口；
- Mongo Express 是 `docker-compose.tools.yml` 中显式启用的可选工具，仅绑定本机回环地址的 8081 端口；
- 所有 Compose 密钥都从启动命令所在 shell 的进程环境传入。

不要把 Compose 的本地 root 数据库账户模型当作生产方案。生产环境应使用外部配置的最小权限应用用户、TLS、受控密钥管理、网络策略、备份与监控。

## 本地演示数据

`import-data` 会创建或复用 admin 用户，并清空、重建活动数据，因此只能对可丢弃的本地演示数据库执行。脚本在 production 中无条件拒绝运行，并要求当前进程环境提供至少 12 字符的临时 admin 密码：

```powershell
$env:SEED_ADMIN_PASSWORD = '<strong-temporary-value-with-at-least-12-characters>'
npm run import-data --prefix backend
Remove-Item Env:SEED_ADMIN_PASSWORD
```

不要把 seed 密码写入 `.env` 或仓库。公开部署前删除演示 admin，或通过受控流程重置其密码；再次导入不会自动轮换已存在 admin 的凭据。

## 质量门禁

从仓库根目录执行：

```powershell
npm test
npm run verify
```

`npm test` 顺序运行前后端测试。`npm run verify` 顺序运行两端 lint、TypeScript 检查、测试和生产构建，是本地提交前与 CI 的完整门禁。定位单个子项目时可使用 `--prefix`：

```powershell
npm run lint --prefix backend
npm run type-check --prefix backend
npm test --prefix backend
npm run build --prefix backend
```

## 项目结构

```text
UniMove/
├── backend/                   # Express API、模型、服务、校验与测试
├── frontend/                  # React 页面、组件、状态、API 客户端与测试
├── docs/                      # API、设计和实施计划
├── docker-compose.yml         # MongoDB/backend/frontend 核心栈
├── docker-compose.tools.yml   # 可选 Mongo Express 工具覆盖
├── DOCKER_GUIDE.md            # Docker 命令、安全边界与排障
└── DATABASE_SETUP.md          # 数据库模式、旧卷审计与轮换
```

## 开发与提交约定

- TypeScript 代码必须通过现有 ESLint 与类型检查；不要为无关代码做顺手重构。
- 业务行为或 bugfix 使用 RED → GREEN 测试循环，并在完成声明前运行相关测试与根门禁。
- API 契约变更同步更新 [docs/API.md](docs/API.md)；部署与凭据边界同步更新 Docker/数据库指南。
- 提交信息采用简洁的 Conventional Commits 风格，例如 `fix: reject unhealthy database state` 或 `docs: update database setup`。
- 安全问题按 [SECURITY.md](SECURITY.md) 私下报告，不在公开 issue 中粘贴凭据或敏感日志。
