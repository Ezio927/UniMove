# UniMove API

## Favorites `/users/favorites`

All favorite endpoints require `Authorization: Bearer <token>` and return HTTP 200 on success.

`GET /favorites` returns every stored favorite activity that still exists in the database, with no pagination and in descending `createdAt` order. Cancelled and completed activities remain visible. The response is:

```json
{
  "success": true,
  "data": { "activities": [] }
}
```

`PUT /favorites/:activityId` adds an activity idempotently. Its response is:

```json
{
  "success": true,
  "message": "收藏成功",
  "data": { "favoriteActivityIds": [] }
}
```

`DELETE /favorites/:activityId` removes an activity idempotently, including when the activity has already been deleted. Its response is:

```json
{
  "success": true,
  "message": "已取消收藏",
  "data": { "favoriteActivityIds": [] }
}
```

An invalid `activityId` returns 400. PUT returns 404 when the activity does not exist; all three endpoints return 401 without a valid authenticated user, and return 404 if that user no longer exists.

默认根地址：`http://localhost:3001/api`

## 通用约定

受保护端点要求 `Authorization: Bearer <token>`。成功响应包含 `success: true`；错误响应统一为：

```json
{
  "success": false,
  "message": "请求数据无效",
  "details": [{ "path": "email", "message": "Invalid email address" }]
}
```

`details` 仅在存在结构化错误信息时返回。常见状态码：400 输入错误、401 未认证、403 无权限、404 不存在、409 状态冲突、429 请求过多、500 服务端错误。

列表接口使用 `page` 和 `limit`，页码从 1 开始，`limit` 最大为 100。列表响应中的 `pagination` 包含 `current`、`total`（总页数）和 `count`（总记录数）。

## 用户 `/users`

| 方法 | 路径 | 认证 | 用途 |
| --- | --- | --- | --- |
| POST | `/register` | 否 | 注册 |
| POST | `/login` | 否 | 登录 |
| GET | `/profile` | 是 | 当前用户资料 |
| PUT | `/profile` | 是 | 更新用户名、手机号或头像 |
| PUT | `/password` | 是 | 修改密码 |

注册请求：`username`、`email`、`password` 必需，`phone` 可选。客户端不能指定角色。登录成功返回 `user`、`token` 和 `refreshToken`。

## 活动 `/activities`

| 方法 | 路径 | 认证 | 用途 |
| --- | --- | --- | --- |
| GET | `/` | 否 | 活动列表 |
| GET | `/:id` | 否 | 活动详情 |
| POST | `/` | 是 | 创建活动 |
| PUT | `/:id` | 是 | 组织者或管理员更新活动 |
| DELETE | `/:id` | 是 | 组织者或管理员删除活动 |
| GET | `/my/created` | 是 | 我创建的活动 |
| GET | `/my/joined` | 是 | 我参加的活动 |

列表筛选：`category`、`location`、`search`、`startDate`、`endDate`、`minPrice`、`maxPrice`。排序字段仅支持 `createdAt`、`startTime`、`price`，方向为 `asc` 或 `desc`。

创建活动必需字段：`title`、`description`、`category`、`location`、`startTime`、`endTime`、`maxParticipants`、`price`；可选字段为 `images`、`tags`。时间采用 ISO 8601 格式。

## 订单 `/orders`

| 方法 | 路径 | 认证 | 用途 |
| --- | --- | --- | --- |
| POST | `/` | 是 | 报名并创建已支付订单 |
| GET | `/` | 是 | 我的订单 |
| GET | `/:id` | 是 | 订单详情 |
| PUT | `/:id/pay` | 是 | 支付历史 pending 订单 |
| PUT | `/:id/cancel` | 是 | 取消或退款 |
| GET | `/activity/:activityId` | 是 | 组织者或管理员查看活动订单 |

创建请求为 `{ "activityId": "..." }`。报名采用原子名额预留，不能报名自己组织、已开始、未发布、已满或已经参加的活动。退款要求距离活动开始至少 24 小时。

订单状态：`pending`、`paid`、`cancelled`、`refunded`。支付方式：`wechat`、`alipay`、`card`。

## 评论 `/comments`

| 方法 | 路径 | 认证 | 用途 |
| --- | --- | --- | --- |
| GET | `/activity/:activityId` | 否 | 活动评论与评分统计 |
| POST | `/` | 是 | 创建评论 |
| GET | `/my` | 是 | 我的评论 |
| PUT | `/:id` | 是 | 评论作者在 24 小时内编辑 |
| DELETE | `/:id` | 是 | 作者或管理员删除 |

只有持有该活动 `paid` 订单的用户可以评论，同一用户对同一活动只能评论一次。评分必须是 1–5 的整数，正文最长 1000 字符，图片最多 10 张。

## 健康检查

`GET /health` 返回服务时间、版本和数据库连接状态，不暴露数据库地址或集合信息。
