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

## 已知流程偏离

## 2026-08-10 / P4–P7：活动收藏实现、审查与验证

- P4 实现 Agent：负责后端收藏领域与 API 的实现 Agent（事实来源未保存其任务标识符）。先后对 `UserService` 和 `UserController` 运行 RED，均因方法尚未定义失败；最终各为 GREEN 4/4。实现中先修正了 schema 数组语法错误，并修正了一次 Unicode 消息回归。提交：`961c0a28cd339b8d528cdeae36acd4c830351d54`。
- P5 实现 Agent：负责前端 API 和 `useFavorites` 的实现 Agent（事实来源未保存其任务标识符）。初始 RED 因 hook 模块不能解析而失败，GREEN 为 5/5。随后三轮 Hook 修复均保存了实际 RED/GREEN：`success:false`、disable 后旧 GET/mutation 为 3/8→8/8；中断 render 的被动 effect 窗口为 1/9→9/9；layout 阶段旧 `reload` 为 1/10→10/10。提交：`7d7580a31b8f65ca743031fab3d92364be43f1fa`、`66313e0c418ea507e360202116850838ebf5d4b4`、`e44937fd3f6f3778b02d98410cbb2c8c5bdd3e12`、`04935c4bad7d9e28219e7146d115dd644f124d49`。
- P6 实现 Agent：负责收藏页面接入的实现 Agent（事实来源未保存其任务标识符）。`ActivityCard` 收藏按钮先 RED（找不到所需可访问名称），后 GREEN 4/4。初始六文件范围与规约正确性冲突时，学生作出人类裁定：以规约正确性和 TDD 为准，授权新增 `frontend/src/pages/ActivityDetail.test.tsx`。组织者收藏先 RED（无收藏按钮）后 GREEN（聚焦 2 文件 5/5）。提交：`cdf5d6d`、`d9444eb`。
- 在 `d9444eb` 上的初次 Task 4 门禁结果：后端 `lint`、`type-check`、`test`、`build` 均 exit 0，Vitest 13 文件/37 测试通过；前端同四项均 exit 0，Vitest 6 文件/20 测试通过。前端 build 有非失败的 Vite 500 kB chunk 体积警告；该结果是审查修复前的历史证据，不代替最终门禁。
- P7 第一阶段规约审查（范围 `431803f..d9444eb`，未运行测试）发现 3 项 Important：列表页未登录收藏无登录引导；列表页和详情页未显示 mutation 失败错误；若干计划/设计验收情形没有直接自动化覆盖。`611f003` 以页面 RED/GREEN 补齐游客登录、错误恢复和 Profile/list/detail 测试；`ecd48d6` 补齐后端 404、幂等、缺失用户和真实路由边界，并修复旧用户没有 `favoriteActivities` 字段时的查询。两次 scoped re-review 均无 Critical/Important。
- P7 第二阶段质量、安全、错误处理和测试充分性审查（范围 `431803f..ecd48d6`，只读且未运行测试）发现 1 项 Important：`getFavorites` 未 populate `organizer`，实际 ObjectId 与前端 `Activity.organizer: User` 以及 `ActivityCard` 的头像/用户名读取不匹配；现有前后端测试都以完整 organizer 假数据掩盖了该跨层问题。`b804e693be893fb269068afb45d6baf8d3416e7a` 通过先 RED（populate spy 0 次调用、1/9 失败）再 GREEN（服务 9/9、真实路由 4/4）补充 `populate('organizer', 'username email avatar')` 及直接断言。最终只读复审 Approved，无 Critical/Important。
- P7 最终审查保留 1 项 Minor：成功收藏后 `favoriteActionAttempted` 未复位，未来独立 reload 错误可能被标为“收藏操作失败”；当前没有自动后台刷新，不阻塞完成。此前 P4 的 API 文档 401/403 小项与 P6 组织者不可报名负向断言小项也保持为 deferred minor。
- 当前 HEAD `b804e69` 的最终质量门禁实际结果：后端 `lint`、`type-check`、`test`、`build` 均 exit 0，Vitest 14 文件/46 测试通过；前端同四项均 exit 0，Vitest 8 文件/28 测试通过。前端测试输出 jsdom `getComputedStyle` pseudo-element 非失败提示，build 输出 Vite 500 kB chunk 非失败警告。

- UniMove 基线代码早于本课程流程，不能证明全部使用测试先行；课程增量从 P3 起严格记录。
- 基线 UI 使用 Ant Design，没有使用 Open Design。为保持既有界面一致且控制作业范围，本增量继续使用 Ant Design。
- 早期仓库使用普通功能分支而非 worktree；活动收藏增量开始使用独立 worktree。

## 2026-08-10 / P3：陌生 Agent 冷启动验证

- Agent：独立 Codex 子 Agent（无主对话历史），任务名 `coldstart_favorites`。
- 输入边界：只以根目录 `SPEC.md`、`PLAN.md` 为需求资料，允许检查实现所需源码。
- 工作区：`.worktrees/coldstart-favorites`，分支 `course/coldstart-favorites`。
- 技能纪律：TDD；逐项记录 RED/GREEN。
- 结果：试做提交 `91d86c2`；后端 lint、类型检查、构建通过，14 个测试文件、41 项测试通过。
- 关键偏差：Agent 把“失效活动”解释为 `cancelled` 并主动过滤，而原意只是忽略数据库中不存在的引用。
- 人工决策：不直接合并试做代码；先明确状态、响应、排序、分页与物理清理策略，再由正式子 Agent 从修订规约实现。
- 教训：抽象领域词必须在 SPEC 中映射到具体枚举值和 API 行为。
