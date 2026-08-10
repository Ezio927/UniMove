# P4 冷启动试做报告

## 范围与资料边界

本试做仅把 worktree 根目录的 `SPEC.md` 与 `PLAN.md` 作为需求资料。未读取
`AGENT_LOG.md`、`SPEC_PROCESS.md`，也未读取 `docs/superpowers/` 下的详细设计或
计划文件。随后仅检查实现 P4 所需的后端源码、现有测试和项目配置。

`PLAN.md` 将 P4 定义为“在独立 worktree 中实现后端收藏模型、服务和 API”；它还
要求每个行为先有实际 RED，再以最小实现转为 GREEN。依此将收藏放入现有用户领域：

- `User.favoriteActivities` 为 Activity ObjectId 数组；
- `UserService` 负责收藏规则和数据库写操作；
- `UserController` 只将已认证用户 ID 传入服务并生成统一响应；
- `users` 路由在既有 `authenticateToken` 之后暴露三个端点。

未向用户提问（任务明确要求不要提问）。

## 实现内容

- 为 `IUser` 和 Mongoose `UserSchema` 增加 `favoriteActivities`，元素引用 `Activity`。
- 添加 `UserService.addFavorite`：先校验 ObjectId（400）、确认活动存在（404），再
  通过 `$addToSet` 原子写入，重复 PUT 保持幂等。
- 添加 `UserService.removeFavorite`：先校验 ObjectId（400），再通过 `$pull` 原子
  移除，重复 DELETE 保持幂等。
- 添加 `UserService.getFavorites`：只从用户记录的 ID 中查询活动；数据库中不存在的
  活动自然不会返回，`cancelled` 活动由查询条件排除，结果按 `createdAt` 倒序并填充
  organizer 基本资料。
- 添加 `GET /api/users/favorites`、`PUT /api/users/favorites/:activityId`、
  `DELETE /api/users/favorites/:activityId`。GET 返回
  `{ success: true, data: { activities } }`；两个变更接口返回标准成功信封和消息。
  三者都处于既有 JWT 中间件之后，且没有接收客户端提供的用户 ID。
- 新增服务、控制器和实际 Express 路由分派测试。

## TDD 记录

所有命令均在 `backend` 目录执行。

| 行为 | RED 命令与结果 | 最小 GREEN 实现 | GREEN 命令与结果 |
| --- | --- | --- | --- |
| PUT 非法 ID 返回 400 | `npm test -- src/services/UserService.favorites.test.ts`：1 failed，`addFavorite is not a function` | 新增 `addFavorite` 的 ObjectId 校验 | 同命令：1 passed |
| PUT 使用 `$addToSet` | 同命令：2 tests 中 1 failed，`findByIdAndUpdate` 调用数为 0 | 增加活动存在性检查和 `$addToSet` 更新；同时增加模型字段 | 同命令：2 passed |
| PUT 缺失活动返回 404 且不更新用户 | 为确保该行为独立 RED，先撤回提前写入的存在性分支；同命令：3 tests 中 1 failed，promise resolved `undefined` | 恢复 `Activity.findById` 和 404 分支 | 同命令：3 passed |
| DELETE 使用 `$pull` | 同命令：4 tests 中 1 failed，`removeFavorite is not a function` | 新增 `$pull` 更新 | 同命令：4 passed |
| DELETE 非法 ID 返回 400 | 同命令：5 tests 中 1 failed，Mongoose `CastError`，而非 `AppError(400)` | 在删除服务入口增加 ObjectId 校验 | 同命令：5 passed |
| GET 过滤已取消活动 | 同命令：6 tests 中 1 failed，`getFavorites is not a function` | 读取收藏 ID，使用 `$in` 和 `status: { $ne: 'cancelled' }` 查询 | 同命令：6 passed |
| GET 控制器信封 | `npm test -- src/controllers/UserController.favorites.test.ts`：1 failed，`getFavorites is not a function` | 新增 GET 控制器方法 | 同命令：1 passed |
| PUT 控制器只使用 JWT 用户 ID | 同命令：2 tests 中 1 failed，`addFavorite is not a function` | 新增 PUT 控制器方法 | 同命令：2 passed |
| DELETE 控制器只使用 JWT 用户 ID | 同命令：3 tests 中 1 failed，`removeFavorite is not a function` | 新增 DELETE 控制器方法 | 同命令：3 passed |
| 三条精确 HTTP 路径 | `npm test -- src/routes/users.favorites.test.ts`：3 failed，均为 404 而非 200 | 在 JWT 中间件之后注册 GET/PUT/DELETE 路由 | 同命令：3 passed |

### 暂停与修正

1. 第一个控制器测试的 `vi.mock` 被提升后引用了尚未初始化的变量，测试套件报
   `Cannot access 'getFavorites' before initialization`，这属于测试配置错误而不是
   所需的 RED。改为 `vi.hoisted` 后重新运行，得到预期的缺失控制器方法 RED。
2. 第一个路由测试只验证未认证请求返回 401；由于项目把认证中间件作用于所有后续
   用户路径，即使路由不存在也会返回 401，该测试错误地 3/3 通过。已删除该测试，
   改为通过真实 Express 请求验证精确路径分派到对应处理器，随后得到三项 404 RED。
3. “缺失活动 404”最初和 `$addToSet` 一起被写入。发现对应测试尚未单独 RED 后，
   立即撤回该分支，补写独立失败测试，再恢复最小实现。未向用户提问。

## 最终验证

以下是提交前重新执行并读取完整输出的验证：

```text
npm run lint       # exit 0
npm run type-check # exit 0
npm test           # 14 files passed, 41 tests passed
npm run build      # exit 0
git diff --check   # exit 0，无空白错误
```

## 规约缺口与本次假设

1. “失效的活动”未映射到现有 `Activity.status` 的具体值。本次把 `cancelled` 解释为
   失效；`completed` 仍可显示。若“失效”还包括已结束、`draft` 或其他状态，需在
   SPEC 中定义过滤集合并更新查询测试。
2. API 只规定了响应外层 `{ success, message?, data? }`，未规定成功状态码、消息文本
   或 `data` 的字段。本次沿用项目既有 200 成功风格，GET 使用 `data.activities`，PUT/
   DELETE 不返回 data。前端 P5 应以此为契约，或先补充规约。
3. “收藏不存在的活动返回 404”明确实现于 PUT。DELETE 对已删除活动仍执行 `$pull`
   并成功，以保持取消操作幂等；若 DELETE 也必须 404，需要补充明确要求和测试。
4. “删除或失效的活动不出现在收藏列表”没有说明是否应同时从用户数组中物理清理。
   本次只在读取时过滤，保留历史 ID；删除活动的清理策略如有需要应单独规定。
5. 收藏列表没有指定排序、分页或是否允许收藏 `draft`/`completed` 活动。本次采用
   创建时间倒序，PUT 只要求活动存在，未增加额外状态限制。

