# UniMove Docker 指南

## 服务边界

核心文件是 `docker-compose.yml`，其中只有 `mongodb`、`backend` 与 `frontend`。MongoDB 和 backend 只在 Compose 网络内可达；没有宿主机直出端口。frontend 是唯一核心入口，并且仅映射为 `127.0.0.1:80:80`。

`docker-compose.tools.yml` 只添加可选的 Mongo Express；它不属于核心栈，且仅映射为 `127.0.0.1:8081:8081`。

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

不要用未编码的密码替代 `MONGO_ROOT_PASSWORD_URI`；密码中的 `@`、`:`、`/`、`?` 等字符会改变 URI 解析结果。

## 启动核心栈

```bash
docker compose up -d --build
docker compose ps
```

Docker 会按健康状态排序启动：MongoDB 健康后启动 backend，backend 健康后启动 frontend。服务地址：

- 应用与前端健康检查：`http://127.0.0.1/`、`http://127.0.0.1/health`
- 经前端代理的 backend 健康检查：`http://127.0.0.1/api/health`

预期结果是 `/health` 返回 `200 ok`，`/api/health` 返回 HTTP 200 且 JSON 中有 `success: true` 与数据库连接状态。核心栈中不存在 `localhost:3001`、`localhost:27017` 或 `localhost:5173` 的 Docker 服务端口。

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

# 检查变量插值与最终 Compose 配置（不启动容器）
docker compose config
docker compose -f docker-compose.yml -f docker-compose.tools.yml config

# 重新构建并替换服务
docker compose up -d --build

# 停止核心栈；保留命名卷中的数据库数据
docker compose down
```

如需从头构建镜像，可运行 `docker compose build --no-cache`，再执行 `docker compose up -d`。`docker compose down -v` 会删除命名卷，`docker system prune` 会影响不相关的 Docker 资源；两者都不是常规排障或停止步骤，只应在明确确认目标和数据备份后使用。

## 排障与限制

- 先运行 `docker compose config`：未设置变量或 URI 编码错误会在此暴露。
- 若服务没有变为 healthy，使用 `docker compose logs <service>` 检查；backend 的 JWT 密钥不满足最少长度会阻止启动。
- 若端口 80 或 8081 被占用，应先识别占用者或在受控环境中调整回环映射；不要为了方便暴露 backend/MongoDB。
- `/api/health` 当前检查的是 Mongoose 连接状态，未额外执行数据库读操作。
