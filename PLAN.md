# UniMove 课程项目实施计划

## 项目基线

UniMove 的认证、活动、订单、评论、前端界面、基础测试和 Docker 配置在课程增量开始前已经存在。本计划只把从 2026-08-10 开始执行的提交材料整理和活动收藏增量列为 Superpowers 流程任务，不把历史工作伪装为测试先行开发。

详细可执行计划见：

- `docs/superpowers/plans/2026-08-10-activity-favorites.md`
- `docs/superpowers/specs/2026-08-10-activity-favorites-design.md`

## 任务与依赖

- [x] P0：审计课程要求和仓库基线。依赖：无。证据：当前 SPEC、设计文档和仓库历史。
- [x] P1：通过 brainstorming 确定活动收藏设计。依赖：P0。提交：`39ceb4e`。
- [x] P2：通过 writing-plans 编写 TDD 实施计划。依赖：P1。提交：`0012748`。
- [ ] P3：陌生 Agent 仅凭 `SPEC.md` 与 `PLAN.md` 冷启动试做，并修正规约歧义。依赖：P2。可与提交材料初稿并行。
- [ ] P4：在独立 worktree 中实现后端收藏模型、服务和 API。依赖：P3。
- [ ] P5：实现前端收藏 API 与可复用状态 Hook。依赖：P4。
- [ ] P6：在活动列表、详情和个人中心接入收藏界面。依赖：P5。
- [ ] P7：执行任务级评审和全分支评审，修复重要问题。依赖：P4–P6。
- [ ] P8：增加根目录一键验证命令和 `.gitlab-ci.yml` 的 `unit-test` job。依赖：P0，可与 P4–P6 并行。
- [ ] P9：完善 Docker、README、安全边界、分发与已知限制。依赖：P8。
- [ ] P10：准备可访问的线上 WebUI。依赖：P9，需要部署平台账号授权。
- [ ] P11：由学生完成 `REFLECTION.md`，执行最终验证并提交。依赖：P3–P10。

## TDD 与评审纪律

P4–P6 的每个行为变更都遵循：先写失败测试并记录失败原因，再实现最少代码使其通过，随后重构并运行全量检查。每个任务由新的实现子 Agent 执行，再由独立审查 Agent 检查规约符合性和代码质量。

`PLAN.md` 在任务完成时补充实际 commit hash；过程、Agent、测试红绿结果和人工干预写入 `AGENT_LOG.md`。

## 验证命令

当前分目录验证：

```bash
cd backend && npm run lint && npm run type-check && npm test && npm run build
cd ../frontend && npm run lint && npm run type-check && npm test && npm run build
```

P8 将增加根目录统一命令，并由 GitLab CI 的 `unit-test` job 调用。

