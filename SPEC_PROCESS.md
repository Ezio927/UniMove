# SPEC 与 PLAN 形成及提交基础设施过程

## 基线与范围

UniMove 是学生已有项目。2026-08-10 起，课程工作以该项目为 B 类应用基线，范围是活动收藏增量及可提交的工程基础设施；既有历史提交不被描述为 Superpowers 或 TDD 产物。

## 收藏功能的形成过程

先审计课程要求、仓库模块、测试、CI、Docker 和缺失交付物。随后比较三种收藏数据方案：在 `User` 保存活动 ID、建立独立 Favorite 集合、或只用浏览器 localStorage。学生批准第一种方案，因为它覆盖前后端与数据库而不扩大范围。设计保存于 `docs/superpowers/specs/2026-08-10-activity-favorites-design.md`（`39ceb4e`），实施计划保存于 `docs/superpowers/plans/2026-08-10-activity-favorites.md`（`0012748`）。

冷启动 Agent `coldstart_favorites`（`gpt-5.6-terra` / high）只读取根 `SPEC.md` 与 `PLAN.md` 进行隔离试做（`91d86c2`，未合并）。它将“失效活动”擅自解释为 `cancelled`，暴露了状态、成功响应、DELETE 幂等性、缺失引用处理及排序/分页定义不足。学生决定先修正规约：只过滤数据库中不存在的活动，保留 `cancelled`/`completed`；三个成功端点均为 200；DELETE 对未收藏或已删除活动幂等；按 `createdAt` 倒序、不分页、只在读取时过滤。

正式实现采用 worktree 隔离、实现和审查 Agent 分离，并按 RED → GREEN → 重构保留任务证据。后端、状态和 UI 分别由 `favorites_backend`、`favorites_state`、`favorites_ui` 实现，独立复审者为对应的 `review_*` Agent。规约/质量审查发现的 Important 问题包括游客引导和 mutation 错误呈现、后端真实路由边界、`organizer` 未 populate、禁用后的 stale toggle 与 unknown 收藏状态写入；它们均先以失败测试证实，再在 `611f003`、`ecd48d6`、`b804e693be893fb269068afb45d6baf8d3416e7a`、`e35143c` 修复。审查只在所有 Critical/Important 关闭后通过。

过程使用 `superpowers:brainstorming`、`superpowers:writing-plans`、`superpowers:using-git-worktrees`、`superpowers:subagent-driven-development`、`superpowers:test-driven-development`、`superpowers:requesting-code-review` 与 `superpowers:verification-before-completion`。仓库仅记录可验证的 prompt/context 摘要；任务报告和审查 diff 位于 gitignored `.superpowers/sdd/`，不声称保留逐字会话内容。

## P8：质量命令与 CI

`infra_root_commands`（`gpt-5.6-terra` / medium）根据 Task 1 brief 创建根命令契约，`review_root_commands`（同模型/effort）只读 brief、报告和 diff，独立检查脚本、锁文件和 README 约束。`e4c4f84fce0a1d44933c29b25bfd7d950d7e9025` 增加 Node `>=22.12.0` 的根 `package.json` 与 `package-lock.json`：`npm test` 顺序运行前后端测试，`npm run verify` 顺序运行 lint、类型检查、测试和构建。

`infra_ci`（`gpt-5.6-terra` / medium）根据 Task 2 brief 增加 GitLab `test`/`quality` 阶段及 GitHub 双 Docker Buildx 检查；`review_ci`（`gpt-5.6-terra` / high）只读验证 YAML、锁文件缓存、context 与 `push: false`。提交 `6686bb6e5ace9b482f210a1177db77460eb09237`。Task 报告记录 `npm run verify` 退出 0，后端 14 文件/46 测试、前端 8 文件/40 测试通过；Vite chunk 建议和 jsdom pseudo-element 提示为非失败输出。

## P9：Docker 分发与文档

`infra_docker`（`gpt-5.6-terra` / high）按 Task 3 brief 实现容器发布，`review_docker`（`gpt-5.6-sol` / high）按规约、安全、运行时边界复审。第一次本机启动被一个预存、无标签的 `unimove-mongodb` 容器名称冲突阻断；未经学生授权，该容器未被删除。复审后以 `826f518` 移除所有 `container_name`，使 Compose 项目名隔离容器，并修复以下 Important 问题：

- 核心栈不再发布 MongoDB 或 backend 端口；frontend 为 `127.0.0.1:80:80`。
- 可选 Mongo Express 只由 `docker-compose.tools.yml` 添加，绑定 `127.0.0.1:8081:8081` 并启用基本认证。
- `MONGO_ROOT_PASSWORD` 是 Mongo 初始化/认证的原始密码；`MONGO_ROOT_PASSWORD_URI` 是相同值的 URI 百分号编码形式，只用于 backend 和 Mongo Express URI。
- Mongo 认证健康检查安全引用容器变量；nginx 同时监听 IPv4/IPv6，使其内置 `wget localhost /health` 探针可靠。

使用一次性、进程本地 dummy secrets（含带保留字符的密码）验证核心和 tools Compose 渲染。镜像构建通过；临时 `unimove-validation` 项目成功启动，三个服务均 healthy，`GET http://127.0.0.1/health` 为 `200 ok`，`GET http://127.0.0.1/api/health` 为 `200`、`success=True`、`database=connected`。第一次启动使用了短 JWT，backend 现有生产校验拒绝它；改用至少 32 字符的临时 JWT 后成功。`03b1efb` 将 Compose CORS allowlist 改为 `http://localhost,http://127.0.0.1`，并统一 backend manifest/lockfile 与根 MIT License；两个 Origin 的运行时请求均返回 200 和对应的 `Access-Control-Allow-Origin`。`review_docker` 复审 APPROVE，无新 Critical/Important。清理只执行该临时项目的 `down`，不使用 `-v`，不删除预存资源。

`infra_docs`（`gpt-5.6-terra` / high）将这些已验证事实写入 README、Docker 指南、计划和协作日志，首轮提交为 `71cb693`。`review_infra_docs`（`gpt-5.6-sol` / high）只读 Task 4 brief、报告和 diff，发现 2 项 Important：课程证据遗漏实际技能、模型/effort、reviewer/提交与 whole-branch review 状态；Docker 指南夸大 `compose config` 的校验能力且未提示解析后的秘密会输出。本修复轮据此明确：raw/encoded 等价由变量设置者保证，配置命令只检查缺失并显示渲染；只用临时值且不分享、重定向或保存输出。

提交基础设施阶段实际使用 `superpowers:using-git-worktrees`、`superpowers:subagent-driven-development`、`superpowers:requesting-code-review`、`superpowers:receiving-code-review` 和 `superpowers:verification-before-completion`；设计/计划使用 `superpowers:brainstorming`、`superpowers:writing-plans`。`superpowers:finishing-a-development-branch` 未发生。Task 4 定向审查已经发生，但 whole-branch review 尚未发生，保持 pending。

## 当前限制和后续

`/api/health` 目前报告 Mongoose 连接状态而不发起额外数据库读。核心发布仅绑定回环；线上暴露必须由学生在有授权的部署平台中完成 TLS、密钥管理和网络策略。P10 部署和 P11 学生反思仍 pending；`superpowers:finishing-a-development-branch` 尚未执行。
