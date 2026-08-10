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

本节将在陌生 Agent 仅凭 `SPEC.md` 和 `PLAN.md` 完成试做后补充，记录它的提问、误解、输出差距以及对应的 SPEC/PLAN 修订。不会事后虚构未发生的问答。

