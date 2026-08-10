# SPEC 与 PLAN 形成过程

## 基线说明

UniMove 是学生已有的个人项目。2026-08-10 开始以该项目为课程 B 类应用项目基线，课程范围定义为工程化交付整理和一个新的活动收藏功能。既有提交历史不被描述为 Superpowers 或 TDD 产物。

## Brainstorming

主 Agent 首先审计三份课程要求和当前仓库，确认项目规模满足 B 类要求，但缺少五份过程文档、GitLab CI、统一测试入口和在线部署证据。

针对课程增量比较了三个方案：

1. 在 User 文档保存活动 ID 数组；
2. 建立独立 Favorite 集合；
3. 仅使用浏览器 localStorage。

最终选择方案 1，因为它能够覆盖前后端和数据库，同时保持实现规模适合现有项目。学生确认功能范围后，主 Agent 使用 `superpowers:brainstorming` 生成设计文档，经学生审核通过。

## Writing Plans

主 Agent 使用 `superpowers:writing-plans` 将功能拆成后端领域/API、前端状态、页面接入、最终评审四个任务。计划明确文件职责、接口、失败测试、验证命令和提交边界，并通过占位符、范围和一致性自检。

## 活动收藏的实现与验证证据

执行环境采用 `superpowers:using-git-worktrees` 隔离 worktree，以 `superpowers:subagent-driven-development` 协调独立实现/审查 Agent，以 `superpowers:test-driven-development` 约束行为变更，并用 `superpowers:requesting-code-review` 与 `superpowers:verification-before-completion` 完成评审和验证。后续分支收尾计划使用 `superpowers:finishing-a-development-branch`，但在本记录阶段尚未执行。

P4 由后端实现 Agent 在 `961c0a28cd339b8d528cdeae36acd4c830351d54` 完成。任务报告记录了服务与 Controller 分别从“方法不存在”的 RED 到 4/4 GREEN；schema 语法和 Unicode 消息回归均在最终行为验证前修正。

P5 由前端状态实现 Agent 从缺失模块的 RED 开始，`7d7580a31b8f65ca743031fab3d92364be43f1fa` 实现初版，随后用 `66313e0c418ea507e360202116850838ebf5d4b4`、`e44937fd3f6f3778b02d98410cbb2c8c5bdd3e12`、`04935c4bad7d9e28219e7146d115dd644f124d49` 三次处理 Hook 审查发现的 disable 时序问题。三轮实际证据依次为 RED/GREEN 3/8→8/8、1/9→9/9、1/10→10/10。

P6 的页面实现提交为 `cdf5d6d` 和 `d9444eb`。学生明确授权将 `frontend/src/pages/ActivityDetail.test.tsx` 纳入测试范围：该决定以规约正确性和 TDD 优先于原六文件计划限制。组织者收藏回归以 RED（无收藏按钮）开始，之后在 GREEN 中通过聚焦 2 文件的 5 个测试。

P7 第一阶段审查的 3 个 Important 由 `611f003` 和 `ecd48d6` 处理并分别通过 scoped re-review：前者以页面 RED/GREEN 增加游客登录引导、可重试错误和 Profile/list/detail 验收测试；后者补充后端 404、幂等、缺失用户和真实路由边界覆盖，并在一次有效 RED 中发现、修复旧用户无收藏字段的兼容问题。

第二阶段只读审查发现 1 个 Important：后端收藏列表没有 populate `organizer`，实际 ObjectId 不符合前端 `Activity.organizer: User` 契约，也无法供 `ActivityCard` 显示用户名和头像；前后端完整 organizer 假数据没有捕获该问题。`b804e693be893fb269068afb45d6baf8d3416e7a` 以 1/9 的有效 RED 证明缺失 populate，再以服务 9/9、真实路由 4/4 的 GREEN 增加指定字段 populate 与直接回归断言。最终只读复审无 Critical/Important，P7 完成。

`b804e69` 是最终应用代码提交及该轮验证 HEAD；当时门禁全部 exit 0：后端 lint、type-check、14 文件/46 测试和 build 通过；前端 lint、type-check、8 文件/28 测试和 build 通过。jsdom 的 pseudo-element 提示和 Vite 500 kB chunk 警告均不导致失败。该表述只定位历史验证批次，不把 `b804e69` 称为后续修复后的当前或最终 HEAD。

Agent/context 映射为：P4 `favorites_backend` / `review_backend`，P5 `favorites_state` / `review_state`，P6 `favorites_ui` / `review_ui`（均为 `gpt-5.6-terra` / `high`）；P7 `favorites_evidence` 为 `gpt-5.6-terra` / `medium`，文档只读审查为 `review_evidence`。实现 prompt 分别以对应 task brief 和既有接口/设计契约为核心上下文，审查 prompt 使用只读 brief、报告与 diff package。学生在最终审查中作出真实人工裁定：仓库记录可核验 prompt/context 摘要，不提交冗长逐字 session prompt，也不声称 actual verbatim prompts 已保存。完整临时 task reports/diff package 位于 gitignored `.superpowers/sdd/2026-08-10-activity-favorites/`，不随仓库提交。

后续最终审查发现 3 项 Important：committed disable 后 stale toggle 可写入、首次收藏状态 unknown 时可误 PUT，以及计划与证据的 prompt 留存契约冲突。`e35143c` 用实际 RED/GREEN 增加实时 enabled/ready/ID guards、页面 pending 禁用、`errorKind` 分类和 reload 清理；文档按上述人工裁定修正。原 deferred minors（API 401/403、三页错误启发式、组织者不可报名负向断言、精确 organizer DTO）也在同一波次清理。

## 冷启动验证

使用 `coldstart_favorites`（`gpt-5.6-terra` / `high`）这一无主对话历史的独立 Codex Agent，在 `course/coldstart-favorites` worktree 中仅以根目录 `SPEC.md` 和 `PLAN.md` 为需求材料，试做 P4 后端收藏任务。它没有读取 `AGENT_LOG.md`、`SPEC_PROCESS.md` 或 `docs/superpowers/` 下的详细资料，产出提交为 `91d86c2`。

该 Agent 没有向学生提问，而是记录了五处需要自行假设的内容：

1. “失效活动”没有映射到 Activity 的具体状态；它自行选择过滤 `cancelled`。
2. 根 SPEC 没有精确规定成功状态码、消息文本和 `data` 字段。
3. DELETE 面对已经删除的活动是否返回 404 不明确。
4. 无效引用是只在读取时过滤，还是物理清理用户数组，不明确。
5. 收藏列表的排序、分页和可收藏状态没有规定。

试做产出提交为 `91d86c2`，后端 lint、类型检查、构建通过，Vitest 共 14 个文件、41 项测试通过。该提交仅作为冷启动证据，不直接并入正式功能分支。

根据试做结果，SPEC 修订如下：

- 修订前：“删除或失效的活动不出现在收藏列表。”
- 修订后：只过滤数据库中已不存在的活动；`cancelled` 和 `completed` 仍显示。
- 明确三个成功接口均返回 200，GET 返回 `activities`，PUT/DELETE 返回 `favoriteActivityIds`。
- 明确 DELETE 对未收藏或已删除活动保持幂等成功。
- 明确列表按 `createdAt` 倒序、不分页，只在读取时过滤，不物理清理历史 ID。

这次验证证明仅写“失效”会让不同 Agent 合理地产生不同实现，因此正式开发前必须把领域词汇映射到具体数据库状态。
