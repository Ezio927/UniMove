# 提交基础设施设计

## 背景与目标

UniMove 的业务功能、测试和活动收藏课程增量已经完成，但课程提交仍缺少根目录一键验证入口、指定的 GitLab CI、容器构建检查以及 README 中若干明确章节。

本阶段只整理交付基础设施，不增加业务功能、不改变 API 行为，也不引入运行时或开发依赖。目标是让助教从仓库根目录即可发现、运行和验证项目，并让 GitHub/GitLab CI 使用同一组命令。

## 范围

### 包含

- 根目录 npm 脚本：`test`、`lint`、`type-check`、`build`、`verify`。
- 根目录锁文件，使 CI 能执行可重复的 `npm ci`。
- `.gitlab-ci.yml`，包含准确命名的 `unit-test` job。
- GitHub Actions 的 Docker 镜像构建验证。
- Docker Compose 配置整理、健康检查和乱码注释修复。
- README 的一键验证、分发、安全边界、已知限制和课程材料入口。
- 对配置和文档执行可重复的静态/运行验证。

### 不包含

- 新业务功能或数据库迁移。
- 更换前后端框架。
- 引入 npm 编排依赖。
- 在本阶段推送公开容器镜像。
- 在线部署；它在基础设施验证完成后单独处理。
- 代替学生撰写 `REFLECTION.md`。

## 根目录命令设计

根目录增加私有 npm package，不声明 dependencies。所有脚本使用 npm 自带的 `--prefix` 调用子项目，避免依赖 Unix shell 特性或额外编排工具。

- `npm test`：顺序运行后端和前端全部测试。
- `npm run lint`：顺序运行两端 ESLint。
- `npm run type-check`：顺序运行两端 TypeScript 检查。
- `npm run build`：顺序运行两端生产构建。
- `npm run verify`：依次执行 lint、type-check、test、build。

顺序执行牺牲少量速度，但日志稳定、故障位置清晰，并确保 Windows PowerShell、Linux CI 和普通终端行为一致。

## CI 设计

### GitLab CI

`.gitlab-ci.yml` 使用 Node.js 22 镜像。`unit-test` job 在仓库根目录安装两端锁定依赖，然后调用根目录 `npm test`。缓存仅用于 npm 下载缓存，不缓存 `node_modules`。

同一配置增加 `quality` job，调用 lint、类型检查和 build。`unit-test` 保持独立且名称完全符合课程要求，即使质量检查失败也能单独看到测试结果。

### GitHub Actions

保留现有 Frontend、Backend 和 Dependency review job。新增 `docker-build` job，在不推送、不需要凭据的情况下分别构建前后端镜像，用于证明 Dockerfile 持续可用。

公开 Registry 推送涉及仓库包可见性和外部凭据，留到部署阶段决定；README 不会虚构不存在的公开镜像地址。

## Docker Compose 设计

- 保留 MongoDB、backend、frontend 和可选 mongo-express 四个服务。
- 修复乱码注释，统一使用清晰中文或英文。
- 为 MongoDB、backend 和 frontend 添加健康检查。
- `depends_on` 使用健康条件，避免后端在数据库尚未可用时立即启动。
- 前端 API 地址继续通过构建/运行配置指向同一 Compose 网络或浏览器可访问地址。
- 所有密码继续要求环境变量，不加入默认真实值。

如果 Vite 环境变量必须在构建阶段注入，将通过 Dockerfile build argument 明确传递，而不是错误地只设置容器运行时变量。

## README 与安全边界

README 必须清晰包含以下内容：

- 项目简介与功能模块。
- 获取、安装和本地运行。
- 根目录一键测试与完整验证。
- Docker Compose 分发命令。
- 目录结构。
- 安全边界。
- 已知限制。
- 课程过程文档入口。
- MIT License 与主要第三方技术栈说明。

安全边界明确说明 JWT/MongoDB 密钥、Mongo Express、CORS、公开部署和示例数据的责任边界；不把开发环境配置描述成生产级秘密管理。

## 验证策略

配置和文档不需要伪造业务 TDD，但必须使用能够证明行为的验证：

- 从根目录运行 `npm test`，证明统一入口真实工作。
- 从根目录运行 `npm run verify`，证明完整质量门禁工作。
- 使用可用的 GitLab CI lint 或 YAML 解析检查配置语法；若无可用 lint 服务，记录局限并检查关键结构。
- 运行 `docker compose config`，证明 Compose 变量和结构可解析。
- 实际执行前后端 `docker build`。
- 若本机 Docker 服务可用，启动 Compose 并检查健康状态；不可用时不得声称已完成运行验证。
- 检查 Git diff、凭据模式和工作树状态。

## 完成标准

- 根目录 `npm test` 和 `npm run verify` 成功。
- `.gitlab-ci.yml` 存在 `unit-test` job，并调用真实测试入口。
- GitHub Actions 能构建两个 Docker 镜像。
- `docker compose config` 成功，两个 Dockerfile 均能构建。
- README 覆盖课程点名章节且命令与仓库实际一致。
- 未提交凭据或不存在的部署/镜像声明。
