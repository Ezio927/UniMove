# UniMove 课程项目实施计划

## 项目基线

UniMove 的认证、活动、订单、评论、前端界面和既有 Docker 配置在本课程增量前已经存在。本课程从 2026-08-10 起记录活动收藏功能和提交基础设施整理；不将历史代码虚构为 TDD 或 Superpowers 产物。

详细的收藏功能设计与计划：

- `docs/superpowers/specs/2026-08-10-activity-favorites-design.md`
- `docs/superpowers/plans/2026-08-10-activity-favorites.md`

## 任务与依赖

- [x] P0：审计课程要求与仓库基线。
- [x] P1：通过 brainstorming 确定活动收藏设计（`39ceb4e`）。
- [x] P2：通过 writing-plans 编写 TDD 实施计划（`0012748`）。
- [x] P3：由冷启动 Agent 试做并据此修正规约（`91d86c2`；隔离分支，未直接合并）。
- [x] P4：实现后端收藏模型、服务与 API（`961c0a28cd339b8d528cdeae36acd4c830351d54`）。
- [x] P5：实现前端收藏 API 与可复用状态 Hook（`7d7580a31b8f65ca743031fab3d92364be43f1fa`、`66313e0c418ea507e360202116850838ebf5d4b4`、`e44937fd3f6f3778b02d98410cbb2c8c5bdd3e12`、`04935c4bad7d9e28219e7146d115dd644f124d49`）。
- [x] P6：接入活动列表、详情和个人中心界面（`cdf5d6d`、`d9444eb`、`611f003`）。
- [x] P7：完成规约、质量与安全复审；修复跨层 organizer 契约及状态时序问题（`ecd48d6`、`b804e693be893fb269068afb45d6baf8d3416e7a`、`e35143c`）。
- [x] P8：提供根目录一键质量门禁和 GitLab `unit-test`/质量 CI（`e4c4f84fce0a1d44933c29b25bfd7d950d7e9025`、`6686bb6e5ace9b482f210a1177db77460eb09237`）；本阶段最终 `npm run verify` 已通过。
- [x] P9：完成可复核 Docker 分发、安全边界、README 与提交文档（既有提交 `72ac455`、`826f518`、`03b1efb`、`71cb693`、`e0f4868`；终审集中修复 `a13e3b7`、`895f7bb`；证据 `90b0eab`）。`final_infra_review`（`gpt-5.6-sol` / max）对 `ac6d52c..90b0eab` 完成 scoped re-review，结论为 **APPROVE / Ready to merge: Yes**：4 项 Important 与 1 项 Minor 全部 ADDRESSED，无新 Critical/Important；定向复跑 2 个测试文件/7 项测试全部通过。
- [ ] P10：配置 PR/merge 后准备可访问的线上 WebUI。依赖 P9，仍需部署平台账号与授权、`main` 首次 GHCR 发布及 Public、Atlas/Render 和真实 URL 验证、NJU GitLab 成功；不含学生 `REFLECTION.md`。
- [ ] P11：由学生完成 `REFLECTION.md`，执行最终验证并提交。依赖 P3–P10。

## 本阶段验证证据

根目录的 `npm run verify` 顺序执行前后端 lint、类型检查、测试与构建。Task 1 的实际结果是后端 14 个测试文件/46 项测试、前端 8 个测试文件/40 项测试均通过；Vite chunk 建议和 jsdom pseudo-element 提示不影响退出码。

Task 3 的配置 PR 证据顺序固定为：预验证 → whole-branch review → 记录实际证据 → 提交；在 review 存在前不得记录复审通过。

Task 3 使用仅进程本地的伪值验证了核心和 tools Compose 渲染、镜像构建及运行时健康检查。核心栈在 `unimove-validation` 项目名下运行成功：frontend、backend、mongodb 均为 healthy，`GET http://127.0.0.1/health` 返回 `200 ok`，`GET http://127.0.0.1/api/health` 返回 `200`、`success=True`、`database=connected`。`03b1efb` 后又分别以 `Origin: http://127.0.0.1` 和 `Origin: http://localhost` 请求同一健康端点，两次均返回 200 与完全匹配的 `Access-Control-Allow-Origin`。启动曾因短于 32 字符的 JWT 被 backend 拒绝；以满足既有校验的临时 JWT 重试成功。清理仅使用项目作用域的 `down`，未删除卷或原有 Docker 资源。

终审修复后，根 `npm run verify` 再次通过（backend 16 文件/53 测试、frontend 8 文件/40 测试）。隔离 `unimove-finalfix-runtime` 栈初始三服务 healthy；停止该项目 MongoDB 后 `/api/health` 返回 503、`success=false`、`database=disconnected`，重启后恢复三服务 healthy 与 200/connected。项目级 `down` 未使用 `-v`，容器与网络清零、1 个命名卷保留，预存 `d965b6c27f62` 未改变。core/tools Compose、两个 Docker build、ignore 内容、扩展凭据扫描和 diff 门禁均通过。

## 过程纪律与边界

收藏行为变更按 RED → GREEN → 重构记录；实施使用独立 worktree、实现/审查 Agent 分离，且在完成声明前运行验证。提交基础设施阶段使用 root 命令、CI、Docker 与文档审查；不宣称完整历史基线均为 TDD。

核心 Docker 栈不发布 backend 或 MongoDB 端口；frontend 仅绑定回环地址。凭据由 shell 环境传入，`MONGO_ROOT_PASSWORD_URI` 是原始 Mongo 密码的 URI 百分号编码值，该等价关系由变量设置者保证而非 `docker compose config` 验证。Scoped re-review 批准时保留 3 项已披露、non-load-bearing residual：健康检查使用 `readyState` 而非主动 ping；本地 Compose 为简化使用 root、生产必须使用外部最小权限应用用户；旧卷用户与 seed admin 仍需操作者人工审计、轮换或删除。Mongo Express 是显式启用的可选工具，亦仅绑定回环地址。`superpowers:finishing-a-development-branch` 尚未执行。
## 2026-08-11 Deployment evidence update (P10 remains pending)

PR #28 merged to `main` as `ba8ef6f`; main CI run `31471843621` passed and published public GHCR images. PR #30 merged to `main` as `6f6160c`; main CI run `31481673894` passed. Verified evidence includes the public WebUI, API health, both public GHCR pages, partial Atlas/Render configuration, and sanitized ordinary-account registration, login, profile, and empty-favorites smoke. A fresh local `npm run verify` on `6f6160c` passed on 2026-08-11: deployment 3/3, backend 53/53, frontend 43/43, lint/type-check/build passed.

P10 remains unchecked. Remaining gates: create 2--3 sanitized activities through the admin WebUI; ordinary-account browse/order/comment/favorite/profile UI smoke involving those activities; Render backend cold-wake and health-recovery observation; remove the temporary personal Atlas IP and confirm the two Render CIDRs remain with no `0.0.0.0/0`; and the designated NJU GitLab URL with a passing latest pipeline containing job exactly `unit-test`. P11 remains unchecked: student-authored 1500--2500 Chinese-character `REFLECTION.md`. Final whole-branch review, PR approval/merge, and public re-check also remain pending.
