# UniMove Render + Atlas 部署设计

日期：2026-08-11  
状态：已由学生逐节批准

## 目标与范围

为课程提交提供截止前可访问的公网 WebUI、公开容器镜像和可复核的 CI/CD 记录。部署改造只处理运行边界，不重构页面、业务模型或现有 API。

课程文档按最小合规原则维护：保留必须文件、链接、命令和真实证据，不扩写非必要运维手册。`REFLECTION.md` 仍由学生提供核心内容并满足课程字数要求。

## 平台选择

采用以下免费或爱好项目级服务：

- Render Static Site：构建并托管 React 前端，提供托管 HTTPS 与 `onrender.com` 地址。
- Render Web Service：从 backend Dockerfile 构建并运行 Express API，提供托管 HTTPS 与健康检查。
- MongoDB Atlas Free Cluster：持久化 UniMove 数据。
- GitHub Actions + GHCR：验证提交并发布公开的前端、后端容器镜像。

不使用当前上海 ECS 承载公网网站。该服务器没有已备案域名；中国内地服务器不作为本次课程公网部署路径，也不因本项目被删除或重配置。

## 架构与数据流

```text
Browser
  -> Render Static Site (React, HTTPS)
  -> Render Web Service (Express, HTTPS)
  -> MongoDB Atlas (TLS connection)
```

前端构建时通过 `VITE_API_URL` 获得后端 HTTPS 地址。后端通过 `PORT` 监听 Render 指定端口，通过 `MONGODB_URI` 连接 Atlas，并将 `FRONTEND_URL` 限定为实际前端来源。现有 `/api/health` 作为部署健康检查。

Render 从仓库构建部署；GHCR 镜像是独立、公开、可复现的课程分发产物，不作为 Render 自动部署的强依赖。

## 安全与秘密

- `JWT_SECRET`、`MONGODB_URI` 和其他真实凭据只存于 Render/Atlas 的秘密管理界面，不写入仓库、日志或课程文档。
- Atlas 使用独立应用数据库用户，只授予 UniMove 数据库所需读写权限。
- Atlas 网络访问列表优先限定为 Render 后端公布的出站地址；若平台能力不提供稳定地址，实施必须暂停并重新评估，不默认开放全网。
- CORS 只允许最终 Render 前端 URL。
- 保留 production 禁止 seed 的现有边界，不为部署新增公开 seed 端点或固定演示密码。
- 前端和 API 均通过 Render 托管 HTTPS 暴露；MongoDB 不直接向浏览器公开。

## 演示数据初始化

线上数据库不运行 production seed。首次部署后：

1. 学生通过正式注册页面创建一个自有账号并自行保管强密码。
2. 学生在 Atlas 控制台将该账号的 `role` 从 `user` 改为 `admin`。
3. 学生通过正式 WebUI 创建少量无敏感信息的示例活动。
4. README 不公开管理员凭据；验收者可自行注册普通用户测试报名、评论和收藏。

## CI/CD 与公开分发

现有 GitHub CI 继续执行前后端 lint、类型检查、测试、构建和 Docker build。`main` 上的发布步骤在门禁通过后，将前后端镜像推送到：

- `ghcr.io/ezio927/unimove-frontend`
- `ghcr.io/ezio927/unimove-backend`

每个镜像至少提供不可变 commit SHA 标签；`latest` 仅指向最近一次成功的 `main` 发布。发布使用 GitHub 自动提供的令牌及最小 package 权限，不新增仓库长期凭据。

Render 部署配置集中在精简的 `render.yaml`，声明前端静态站点、后端 Web Service、健康检查和需要人工填写的秘密变量。部署失败时保留上一个成功版本，不执行数据库破坏性迁移。

## 验证与完成标准

完成声明前必须取得以下新鲜证据：

- 根目录 `npm run verify` 通过。
- 前后端 Docker 镜像在 CI 中构建并推送到公开 GHCR，匿名可查看或拉取。
- Render 前端 URL 可从公网打开，React SPA 深层路由可刷新。
- 后端 `/api/health` 返回成功且数据库状态为 connected。
- 浏览器走通注册、登录、活动浏览、报名、评论和收藏；管理员走通活动创建。
- GitHub 最后一次相关流水线为通过状态；NJU GitLab 的 required `unit-test` job 取得最终通过记录。
- README 记录线上 URL、部署架构、CI/CD、公开镜像、秘密配置方式和已知限制。

## 错误处理与回退

- Render 构建或启动失败：读取构建/运行日志，修复仓库配置后重新走 PR 与 CI，不在控制台维护不可复现的代码补丁。
- Atlas 连接失败：只检查网络列表、应用用户、URI 与 TLS 边界，不在日志输出连接串。
- 前端 API 或 CORS 失败：以最终两个 Render URL 为唯一来源核对构建变量与 allowlist。
- 免费后端休眠：README 披露首次请求可能等待约一分钟；这不视为数据丢失。
- 免费平台能力不满足稳定公网访问：保留已验证提交和 Atlas 数据，重新评估其他非中国内地部署平台，不回退到未备案上海 ECS 公网服务。

## 明确不做

- 不重构业务功能或 UI。
- 不新增管理后台、生产 seed API、付费监控或多区域高可用。
- 不迁移或删除阿里云 ECS 上的未知资源。
- 不把课程演示平台描述为正式生产环境。

