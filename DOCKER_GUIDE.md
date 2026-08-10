# UniMove Docker 指南

## 服务边界

核心文件是 `docker-compose.yml`，其中只有 `mongodb`、`backend` 与 `frontend`。MongoDB 和 backend 只在 Compose 网络内可达；没有宿主机直出端口。frontend 是唯一核心入口，并且仅映射为 `127.0.0.1:80:80`。

`docker-compose.tools.yml` 只添加可选的 Mongo Express；它不属于核心栈，且仅映射为 `127.0.0.1:8081:8081`。

为了保持本地分发最小，core Compose 中 backend 使用 MongoDB root 账户，仓库不再挂载初始化脚本或创建一个未使用的固定应用用户。这是已知的本地简化，不是生产凭据模型；生产环境应在外部数据库中配置独立、最小权限的应用用户，并通过受控密钥管理提供连接 URI。旧命名卷的审计与轮换见 [DATABASE_SETUP.md](DATABASE_SETUP.md)。

## 必需变量

在启动的同一终端设置下列变量，不要写入仓库，也不要提交 `.env`：

| 变量 | 用途 |
| --- | --- |
| `MONGO_ROOT_PASSWORD` | MongoDB 初始化与认证使用的原始密码。 |
| `MONGO_ROOT_PASSWORD_URI` | 与上项相同的密码，经 URI 百分号编码后用于 backend/Mongo Express 连接 URI。 |
| `JWT_SECRET` | backend JWT 密钥；生产模式须满足应用现有的最少 32 字符校验。 |
| `MONGO_EXPRESS_PASSWORD` | 仅在启用工具栈时需要的 Mongo Express 基本认证密码。 |
| `MONGO_EXPRESS_USERNAME` | 可选；默认 `admin`。 |

PowerShell 示例（只在当前进程有效）：

```powershell
$env:MONGO_ROOT_PASSWORD = 'a-strong-password-with-reserved-characters-if-needed'
$env:MONGO_ROOT_PASSWORD_URI = [System.Uri]::EscapeDataString($env:MONGO_ROOT_PASSWORD)
$env:JWT_SECRET = 'at-least-32-characters-for-production-validation'
```

不要用未编码的密码替代 `MONGO_ROOT_PASSWORD_URI`；密码中的 `@`、`:`、`/`、`?` 等字符会改变 URI 解析结果。Compose 无法判断原始值与编码值是否等价，这一对应关系必须由设置变量的人通过同一原始密码生成来保证。

## 启动核心栈

```bash
docker compose up -d --build
docker compose ps
```

Docker 会按健康状态排序启动：MongoDB 健康后启动 backend，backend 健康后启动 frontend。服务地址：

- 应用入口：`http://127.0.0.1/` 或 `http://localhost/`
- 前端健康检查：`http://127.0.0.1/health` 或 `http://localhost/health`
- 经前端代理的 backend 健康检查：`http://127.0.0.1/api/health`

预期结果是 `/health` 返回 `200 ok`，`/api/health` 在 Mongoose connected 时返回 HTTP 200、`success: true` 和 `database.status: connected`。任何非 connected 状态返回 HTTP 503 与 `success: false`；backend 镜像和 Compose healthcheck 都会因非 2xx 响应而失败。Compose 为 backend 配置 `http://localhost` 和 `http://127.0.0.1` 两个精确 CORS Origin；两种浏览器入口均已通过运行时响应头验证。核心栈不发布 backend、MongoDB 或 Vite 开发服务器端口。

## 可选 Mongo Express 工具

在已设置上述变量后，补充工具密码并显式合并覆盖文件：

```powershell
$env:MONGO_EXPRESS_PASSWORD = 'a-separate-strong-tool-password'
docker compose -f docker-compose.yml -f docker-compose.tools.yml up -d --build
```

访问 `http://127.0.0.1:8081`，使用 `MONGO_EXPRESS_USERNAME` 和 `MONGO_EXPRESS_PASSWORD` 登录。该工具只应在受控的本机运维场景启用，停止时使用同样的 `-f` 参数。

## 日常操作

```bash
# 查看状态和健康状态
docker compose ps

# 查看全部或单个服务日志
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# 检查必需变量是否存在，并查看插值后的 Compose 配置（不启动容器）
docker compose config
docker compose -f docker-compose.yml -f docker-compose.tools.yml config

# 重新构建并替换服务
docker compose up -d --build

# 停止核心栈；保留命名卷中的数据库数据
docker compose down
```

`docker compose config` 会把解析后的环境变量（包括秘密）输出到终端。只用临时值执行，不要分享、重定向或保存输出。该命令能发现缺失变量并显示最终渲染结果，但不能证明 `MONGO_ROOT_PASSWORD_URI` 与原始密码等价，也不能替代运行时认证测试。

如需从头构建镜像，可运行 `docker compose build --no-cache`，再执行 `docker compose up -d`。`docker compose down -v` 会删除命名卷，`docker system prune` 会影响不相关的 Docker 资源；两者都不是常规排障或停止步骤，只应在明确确认目标和数据备份后使用。

## 排障与限制

- 先用临时值运行 `docker compose config`：它会发现未设置变量并显示 URI 的渲染结果；编码是否来自同一原始密码仍须由使用者保证。
- 若服务没有变为 healthy，使用 `docker compose logs <service>` 检查；backend 的 JWT 密钥不满足最少长度会阻止启动。
- 若端口 80 或 8081 被占用，应先识别占用者或在受控环境中调整回环映射；不要为了方便暴露 backend/MongoDB。
- `/api/health` 依据 Mongoose `readyState` 判定，不额外执行数据库读；非 connected 状态会返回 HTTP 503 并使 Docker healthcheck 失败。
