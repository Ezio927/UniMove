# UniMove 数据库连接指南

## 选择运行方式

### 本地 Compose 分发

核心 `docker-compose.yml` 同时运行 MongoDB、backend 和 frontend。MongoDB 与 backend 只在 Compose 网络内可达，不发布宿主机端口；应用入口仅绑定在 `http://127.0.0.1/`。先在当前 shell 设置 `MONGO_ROOT_PASSWORD`、对应的 URI 百分号编码值 `MONGO_ROOT_PASSWORD_URI`，以及至少 32 字符的 `JWT_SECRET`，再按 [Docker 指南](DOCKER_GUIDE.md) 启动：

```powershell
$env:MONGO_ROOT_PASSWORD = '<strong-local-compose-value>'
$env:MONGO_ROOT_PASSWORD_URI = [System.Uri]::EscapeDataString($env:MONGO_ROOT_PASSWORD)
$env:JWT_SECRET = '<at-least-32-characters-for-local-compose-validation>'
docker compose up -d --build
docker compose ps
```

Mongo Express 不属于核心栈。只有显式合并 `docker-compose.tools.yml` 并设置独立的 `MONGO_EXPRESS_PASSWORD` 时，它才会在本机回环地址的 8081 端口启动；完整命令与停止方式只维护在 [DOCKER_GUIDE.md](DOCKER_GUIDE.md)。

为了让课程本地栈保持最小，backend 使用 MongoDB root 账户连接，且仓库不再挂载数据库初始化脚本或创建固定应用用户。这是本地开发简化。生产环境必须在外部 MongoDB 中创建权限最小化的独立应用用户，把连接 URI 交给受控密钥管理，并按实际集合与操作授予权限。

### 本机开发服务器与外部 MongoDB

若在宿主机直接运行 backend，应将 `backend/.env.example` 复制为未跟踪的 `backend/.env`，再把 `MONGODB_URI` 替换为你已明确配置并有权使用的本机、测试或 Atlas 数据库 URI。不要复制文档中的固定用户名或密码；仓库不提供通用数据库凭据。

```powershell
Copy-Item backend/.env.example backend/.env
npm run dev --prefix backend
```

开发 backend 默认监听 `http://localhost:3001`，健康端点是 `http://localhost:3001/api/health`。只有 Mongoose 状态为 connected 时该端点才返回 HTTP 200 与 `success: true`；其余连接状态返回 HTTP 503 与 `success: false`。

### MongoDB Atlas 或其他托管数据库

在供应商控制台创建数据库与最小权限应用用户，限制网络来源，并把供应商提供的 URI 写入部署平台的秘密管理，而不是仓库。公开部署还需要 TLS、备份、监控、凭据轮换和恢复演练；本地 Compose 配置不能替代这些控制。

## 旧命名卷的人工审计与轮换

早期版本曾通过初始化脚本在 `unimove` 数据库中创建一个 backend 未使用的应用用户。MongoDB 初始化脚本只会在空数据目录首次启动时执行，因此已有命名卷可能仍保留该 legacy user；移除仓库脚本不会修改旧卷，也不会自动删除任何用户或数据。

在操作旧卷前，先确认 Compose 项目名、卷归属、备份和所有实际客户端。不要运行 `down -v`、prune，或在未确认消费者时删除用户。对当前项目执行以下命令进入 `unimove` 数据库；`mongosh` 会交互式请求 core Compose 的 root 密码，因此密码不会出现在命令历史中：

```powershell
docker compose exec mongodb mongosh --quiet --username admin --authenticationDatabase admin unimove
```

在 `mongosh` 中先审计，不立即修改：

```javascript
db.getUsers()
```

如果审计确认某个旧应用用户仍被客户端使用，先通过 `db.changeUserPassword('<confirmed-user>', passwordPrompt())` 轮换密码、更新客户端秘密并验证迁移。如果确认它没有任何消费者，且备份与回滚方案已就绪，才可用 `db.dropUser('<confirmed-unused-user>')` 手工移除。上述操作只影响明确选中的用户，不会删除集合；仍应在变更后重新验证应用和备份。

## 排障

- Core Compose：运行 `docker compose ps` 与 `docker compose logs backend mongodb`，确认 MongoDB 和 backend 的健康状态。
- 本机 backend：确认 `MONGODB_URI` 指向可达且已授权的外部数据库，并检查 backend 启动日志。
- 身份验证失败：区分原始密码与 URI 百分号编码值；`docker compose config` 只能显示插值结果，不能证明两者来自同一密码。
- 已有卷的 root 密码不会因单纯修改环境变量自动改变；应先按上述审计流程确认卷与用户，再在数据库内执行受控轮换。
