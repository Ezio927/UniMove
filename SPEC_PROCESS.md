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

## 冷启动验证

使用一个无主对话历史的独立 Codex Agent，在 `course/coldstart-favorites` worktree 中仅以根目录 `SPEC.md` 和 `PLAN.md` 为需求材料，试做 P4 后端收藏任务。它没有读取 `AGENT_LOG.md`、`SPEC_PROCESS.md` 或 `docs/superpowers/` 下的详细资料。

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
