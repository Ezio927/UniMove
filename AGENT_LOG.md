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
