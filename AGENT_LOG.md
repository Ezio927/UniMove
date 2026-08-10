# Agent 协作日志

## 2026-08-10 / P0：课程与仓库审计

- Agent：Codex 主 Agent。
- 操作：阅读三份课程要求；检查仓库模块、测试、CI、Docker 和缺失交付物。
- 结论：选择 B 类应用项目；代码规模合格，需补齐课程过程与部署材料。
- 人工决策：学生确认已有项目可作为基线，目标为最低成本、稳妥及格。

## 2026-08-10 / P1：Brainstorming

- 技能：`superpowers:using-superpowers`、`superpowers:brainstorming`。
- 关键决策：选择 User 内 ObjectId 数组实现活动收藏；不增加收藏夹、通知和推荐。
- 人工干预：学生批准活动收藏选题及最终设计。
- 产物：`docs/superpowers/specs/2026-08-10-activity-favorites-design.md`。
- Commit：`39ceb4e`。

## 2026-08-10 / P2：Writing Plans

- 技能：`superpowers:writing-plans`。
- 操作：把收藏增量拆成 4 个任务和 23 个可核验步骤，明确 TDD 红—绿—重构与两阶段评审。
- 人工干预：学生选择 Subagent-Driven 执行方式。
- 产物：`docs/superpowers/plans/2026-08-10-activity-favorites.md`。
- Commit：`0012748`。

## 2026-08-10 / P4–P7：活动收藏实现、审查与验证

- 执行技能与框架：worktree 隔离使用 `superpowers:using-git-worktrees`；任务拆分与交接使用 `superpowers:subagent-driven-development`；实现纪律使用 `superpowers:test-driven-development`；评审使用 `superpowers:requesting-code-review`；完成声明前使用 `superpowers:verification-before-completion`。`superpowers:finishing-a-development-branch` 预留给后续分支收尾，本阶段尚未发生。
- P4 实现 Agent：`favorites_backend`，`gpt-5.6-terra` / `high`。prompt 摘要：以 `task-1-brief.md` 为任务边界，携带精确 API 响应、活动状态可见性、倒序、PUT/DELETE 幂等、TDD 与报告契约；不是逐字 prompt。先后对 `UserService` 和 `UserController` 运行 RED，均因方法尚未定义失败；最终各为 GREEN 4/4。实现中先修正了 schema 数组语法错误，并修正一次 Unicode 消息回归。提交：`961c0a28cd339b8d528cdeae36acd4c830351d54`。审查 Agent：`review_backend`，同模型/effort；只读 `task-1-brief.md`、任务报告和 diff，分别做规格与质量判定，修复提交为 `ecd48d6`、`b804e69`。
- P5 实现 Agent：`favorites_state`，`gpt-5.6-terra` / `high`。prompt 摘要：以 `task-2-brief.md`、既有 endpoint contract、TDD 约束，以及 disabled/error/race 行为为上下文；不是逐字 prompt。初始 RED 因 hook 模块不能解析而失败，GREEN 为 5/5。随后三轮 Hook 修复均保存实际 RED/GREEN：`success:false`、disable 后旧 GET/mutation 为 3/8→8/8；中断 render 的被动 effect 窗口为 1/9→9/9；layout 阶段旧 `reload` 为 1/10→10/10。提交：`7d7580a31b8f65ca743031fab3d92364be43f1fa`、`66313e0c418ea507e360202116850838ebf5d4b4`、`e44937fd3f6f3778b02d98410cbb2c8c5bdd3e12`、`04935c4bad7d9e28219e7146d115dd644f124d49`。审查 Agent：`review_state`，同模型/effort，只读 diff。
- P6 实现 Agent：`favorites_ui`，`gpt-5.6-terra` / `high`。prompt 摘要：以 `task-3-brief.md`、既有 `useFavorites` contract、Ant Design 一致性、不增加依赖和 TDD 为上下文；不是逐字 prompt。`ActivityCard` 收藏按钮先 RED（找不到所需可访问名称），后 GREEN 4/4。审查 Agent：`review_ui`，同模型/effort，只读 brief、报告和 diff。初始六文件范围与规约正确性冲突时，学生作出人类裁定：以规约正确性和 TDD 为准，授权新增 `frontend/src/pages/ActivityDetail.test.tsx`。组织者收藏先 RED（无收藏按钮）后 GREEN（聚焦 2 文件 5/5）；修复提交：`d9444eb`、`611f003`，初版提交：`cdf5d6d`。
- P7 证据 Agent：`favorites_evidence`，`gpt-5.6-terra` / `medium`。prompt 摘要：仅从四份 task brief、task reports 与 progress ledger 汇总课程证据，执行两阶段审查和前后端全量 gates，只提交三份过程文档；不是逐字 prompt。文档审查 Agent：`review_evidence`，只读 Task 4 文档 diff。
- 在 `d9444eb` 上的初次 Task 4 门禁结果：后端 `lint`、`type-check`、`test`、`build` 均 exit 0，Vitest 13 文件/37 测试通过；前端同四项均 exit 0，Vitest 6 文件/20 测试通过。前端 build 有非失败的 Vite 500 kB chunk 体积警告；该结果是审查修复前的历史证据，不代替最终门禁。
- P7 第一阶段规约审查（范围 `431803f..d9444eb`，未运行测试）发现 3 项 Important：列表页未登录收藏无登录引导；列表页和详情页未显示 mutation 失败错误；若干计划/设计验收情形没有直接自动化覆盖。`611f003` 以页面 RED/GREEN 补齐游客登录、错误恢复和 Profile/list/detail 测试；`ecd48d6` 补齐后端 404、幂等、缺失用户和真实路由边界，并修复旧用户没有 `favoriteActivities` 字段时的查询。两次 scoped re-review 均无 Critical/Important。
- P7 第二阶段质量、安全、错误处理和测试充分性审查（范围 `431803f..ecd48d6`，只读且未运行测试）发现 1 项 Important：`getFavorites` 未 populate `organizer`，实际 ObjectId 与前端 `Activity.organizer: User` 以及 `ActivityCard` 的头像/用户名读取不匹配；现有前后端测试都以完整 organizer 假数据掩盖了该跨层问题。`b804e693be893fb269068afb45d6baf8d3416e7a` 通过先 RED（populate spy 0 次调用、1/9 失败）再 GREEN（服务 9/9、真实路由 4/4）补充 `populate('organizer', 'username email avatar')` 及直接断言。最终只读复审 Approved，无 Critical/Important。
- `b804e69` 作为最终应用代码提交及该轮验证 HEAD 时的质量门禁实际结果：后端 `lint`、`type-check`、`test`、`build` 均 exit 0，Vitest 14 文件/46 测试通过；前端同四项均 exit 0，Vitest 8 文件/28 测试通过。前端测试输出 jsdom `getComputedStyle` pseudo-element 非失败提示，build 输出 Vite 500 kB chunk 非失败警告。该历史结果不表示它是后续修复后的当前或最终 HEAD。
- 后续最终审查发现 3 项 Important：disable commit 后旧 toggle 仍可写入；首次 favorites GET pending/失败时页面和 Hook 可把 unknown 误判为未收藏并 PUT；详细计划要求 actual prompts，但仓库证据只保留摘要。`e35143c` 以真实 RED/GREEN 增加实时 enabled/ready/ID guards、`ready`/`errorKind` 契约、页面禁用与错误分类，并清理组织者负向断言和精确 DTO。
- 此轮同时处理原 deferred minors：`favoriteActionAttempted` 从三页删除，API 文档区分 401/403，组织者测试明确不存在报名/已报名/取消报名控件。错误来源由 Hook 的 `errorKind` 决定，reload 开始时同步清理旧错误分类。
- Prompt/context 留存边界来自学生在最终审查中的真实人工裁定：提交材料保存可核验的 prompt/context 摘要，不提交冗长逐字 session prompt，也不声称 actual verbatim prompts 已被保存。完整临时 task reports 与 diff package 位于 gitignored `.superpowers/sdd/2026-08-10-activity-favorites/` 工作区，不随仓库提交。

## 已知流程偏离

- UniMove 基线代码早于本课程流程，不能证明全部使用测试先行；课程增量从 P3 起严格记录。
- 基线 UI 使用 Ant Design，没有使用 Open Design。为保持既有界面一致且控制作业范围，本增量继续使用 Ant Design。
- 早期仓库使用普通功能分支而非 worktree；活动收藏增量开始使用独立 worktree。

## 2026-08-10 / P3：陌生 Agent 冷启动验证

- Agent：独立 Codex 子 Agent（无主对话历史），任务名 `coldstart_favorites`，`gpt-5.6-terra` / `high`。
- 输入边界：只以根目录 `SPEC.md`、`PLAN.md` 为需求资料，允许检查实现所需源码。
- 工作区：`.worktrees/coldstart-favorites`，分支 `course/coldstart-favorites`。
- 技能纪律：TDD；逐项记录 RED/GREEN。
- 结果：试做提交 `91d86c2`；后端 lint、类型检查、构建通过，14 个测试文件、41 项测试通过。
- 关键偏差：Agent 把“失效活动”解释为 `cancelled` 并主动过滤，而原意只是忽略数据库中不存在的引用。
- 人工决策：不直接合并试做代码；先明确状态、响应、排序、分页与物理清理策略，再由正式子 Agent 从修订规约实现。
- 教训：抽象领域词必须在 SPEC 中映射到具体枚举值和 API 行为。
