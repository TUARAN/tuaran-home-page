---
title: 通用后台 / SaaS / APP 权限系统标准技术调研：数据库持久化、Redis 缓存与 Cloudflare 实践
category: topics
date: 2026-07-03
tags: [权限系统, RBAC, ABAC, SaaS, APP, Redis, Cloudflare, Workers, D1, Durable Objects, KV, Upstash, 多租户]
summary: 系统梳理通用后台、SaaS 平台和移动端 APP 的权限系统标准架构：以数据库作为唯一权威数据源，以 Redis 或内存缓存加速高频校验，以主动删除缓存保证权限变更实时生效，并补充在 Cloudflare Workers 体系下如何实践 Redis、D1、Durable Objects 与 KV 的组合。
tldr: 权限系统的核心不是“把权限查出来”，而是“高频校验不拖垮数据库，权限回收后旧权限不能继续生效”。标准做法是 DB 存正本，Redis 缓存用户权限、会话 Token 与角色模板，管理员变更权限后先提交 DB 事务，再主动删除相关用户和角色缓存；下一次请求缓存未命中时回源查 DB。Cloudflare 体系下没有一个等同传统内网 Redis 的原生绑定，生产上优先用 Upstash Redis REST 客户端，或用外部 Redis + Workers TCP sockets；如果要尽量 Cloudflare 原生化，则用 D1/外部数据库做权威层，Durable Objects 做强一致状态与主动失效协调，KV 只适合低敏读多写少缓存，不应单独承担安全权限正本。
topic_type: tech
tech_type: security_identity
assistance: codex
model: gpt-5
pv: 0
---

本文面向通用后台、B 端 SaaS、移动端 APP、小程序与多租户系统的权限架构设计。重点是工程实现，不讨论组织审批流、法务授权边界和企业 IAM 采购。
>
> 参考资料：Cloudflare Workers [TCP sockets](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)、Cloudflare Workers [Upstash integration](https://developers.cloudflare.com/workers/databases/third-party-integrations/upstash/)、Cloudflare KV [How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)、Cloudflare Durable Objects [overview](https://developers.cloudflare.com/durable-objects/)、Cloudflare D1 [documentation](https://developers.cloudflare.com/d1/)、Cloudflare Hyperdrive [documentation](https://developers.cloudflare.com/hyperdrive/)。

## 一、整体核心设计思想

行业绝大多数 B 端后台、SaaS 平台、移动端 APP 权限体系，都会收敛到一个共同架构：

**数据库持久化 + 缓存加速 + 权限变更后主动失效缓存。**

这套架构解决两个核心痛点。

第一，权限校验是高频操作。一个后台页面可能同时请求菜单、列表、详情、按钮、导出、上传、统计等接口；一个移动端会话也可能在短时间内连续触发多个 API。如果每个请求都完整查询用户、角色、权限、租户、部门和数据范围，数据库压力会很快被放大。

第二，权限回收必须实时生效。管理员禁用用户、移除角色、关闭某个接口权限、强制下线用户后，旧权限不能继续停留在缓存里。否则用户虽然在数据库里已经被禁用，但仍可凭旧缓存访问系统，这不是体验问题，而是安全漏洞。

所以权限系统的基本原则是：

| 层级 | 角色 | 核心原则 |
|---|---|---|
| 数据库 | 唯一权威数据源 | 所有权限变更最终落 DB，排查问题以 DB 为准 |
| Redis / 内存缓存 | 高速副本 | 只做加速，不单独作为可信正本 |
| 网关 / 拦截器 | 强制执行点 | 所有后端接口必须校验，前端隐藏按钮只做体验优化 |
| 管理后台 | 权限变更入口 | 变更 DB 后必须主动清除相关缓存 |

一句话：**权限正本在数据库，权限热路径走缓存，权限变更靠主动失效保证实时性。**

## 二、权限存储分层完整说明

### 2.1 底层持久层：数据库

数据库通常使用 MySQL、PostgreSQL、SQL Server、Oracle、Cloudflare D1、SQLite 或其他关系数据库。无论具体选型如何，它都承担同一个职责：存储全量、可信、可审计的权限数据。

典型核心表如下。

| 表 | 职责 | 常见字段 |
|---|---|---|
| 用户表 | 账号、状态、基础信息 | `id`、`tenant_id`、`email`、`phone`、`status`、`created_at` |
| 角色表 | 角色编码、角色名称、角色状态 | `id`、`tenant_id`、`code`、`name`、`enabled` |
| 用户角色关联表 | 用户和角色多对多 | `user_id`、`role_id`、`tenant_id` |
| 资源权限表 | 接口、页面、按钮、菜单、动作 | `id`、`code`、`type`、`path`、`method`、`enabled` |
| 角色权限关联表 | 角色可访问哪些资源 | `role_id`、`permission_id` |
| 数据权限配置表 | 部门、租户、个人、区域等隔离规则 | `subject_type`、`subject_id`、`scope_type`、`scope_value` |
| 会话 / Token 表 | 登录态正本或审计记录 | `token_hash`、`user_id`、`device_id`、`expires_at`、`revoked_at` |

最常见的权限模型是 RBAC，也就是用户绑定角色，角色绑定权限。复杂 SaaS 会继续叠加 ABAC 或 PBAC：例如根据租户、部门、项目、地域、订单归属、客户经理、数据标签来判断数据范围。

底层规则必须明确：

- DB 是唯一权威数据源。
- Redis、KV、本地内存都只是副本。
- 管理后台的权限变更必须先落 DB。
- 缓存不能绕过账号状态、租户状态和资源状态。
- 权限问题排查时先查 DB，再看缓存是否未失效。

### 2.2 加速层：Redis 分布式缓存 / 单机内存缓存

权限缓存的目标不是“替代数据库”，而是降低高频校验时的数据库查询次数。

常见缓存内容包括：

| 缓存对象 | 示例 Key | Value 内容 |
|---|---|---|
| 用户登录 Token | `token:{tokenHash}` | `userId`、`tenantId`、`deviceId`、`expiresAt`、`sessionVersion` |
| 用户全量权限集合 | `perm:user:{tenantId}:{userId}` | 接口、页面、按钮、菜单、数据范围 |
| 角色基础权限模板 | `perm:role:{tenantId}:{roleId}` | 角色拥有的资源编码集合 |
| 用户数据权限 | `data_scope:user:{tenantId}:{userId}` | 部门、项目、本人、全部等过滤条件 |
| 用户 Token 索引 | `idx:user_tokens:{tenantId}:{userId}` | 该用户所有有效 Token key |
| 角色用户索引 | `idx:role_users:{tenantId}:{roleId}` | 绑定该角色的用户 id 集合 |

缓存 Key 设计要有三个基本要求。

第一，必须带租户维度。多租户 SaaS 里不要只写 `perm:user:{userId}`，否则不同租户用户 id 撞号时会污染。

第二，不能依赖 `KEYS token:*` 这类全库扫描来清理用户会话。生产 Redis 里应维护用户到 Token 的索引，例如 `idx:user_tokens:{tenantId}:{userId}`，强制下线时按索引批量删除。

第三，所有权限缓存都要设置 TTL。常见范围是 30 分钟到 2 小时；高安全系统可以更短，低风险后台可以更长。TTL 是兜底，不是替代主动删缓存。

## 三、管理员关闭 / 回收用户权限完整执行链路

典型场景包括：

- 后台管理员手动禁用用户；
- 移除用户角色；
- 关闭某个功能权限；
- 修改公共角色权限；
- 强制下线用户；
- 冻结某个租户；
- 修改部门或数据范围。

### Step 1：数据库事务更新

权限变更必须先以数据库事务提交。

```text
1. 开启数据库事务
2. 根据操作类型修改权限正本
   - 禁用用户：UPDATE users SET status = 0 WHERE id = ?
   - 移除角色：DELETE FROM user_roles WHERE user_id = ? AND role_id = ?
   - 回收功能权限：DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?
   - 修改数据权限：UPDATE data_scopes SET ... WHERE subject_id = ?
3. 写审计日志
4. 提交事务
5. 事务失败则回滚，不执行缓存清理
```

这里的关键是原子性。数据库事务没有成功提交前，不应该删除缓存。否则可能出现 DB 回滚了、缓存被删了，下一次请求又按旧 DB 数据重建缓存，造成操作语义混乱。

### Step 2：主动清除对应缓存

事务提交成功后，必须主动删除相关缓存。

按操作类型拆开看：

| 管理操作 | 必须清理 |
|---|---|
| 禁用用户 | `perm:user:{tenantId}:{userId}`、`data_scope:user:{tenantId}:{userId}`、该用户全部 `token:{tokenHash}` |
| 强制下线用户 | 该用户全部 `token:{tokenHash}`，必要时同时删除用户权限缓存 |
| 移除用户角色 | `perm:user:{tenantId}:{userId}`、`data_scope:user:{tenantId}:{userId}` |
| 修改角色权限 | `perm:role:{tenantId}:{roleId}`，以及所有绑定该角色用户的 `perm:user:*` |
| 修改数据权限 | 用户或角色相关的数据权限缓存 |
| 冻结租户 | 租户级会话、用户权限、租户配置缓存 |

如果跳过这一步，旧权限缓存仍存在，用户下一次请求会继续命中缓存。结果就是数据库里权限已经被回收，但用户还能访问已回收功能，形成权限延迟生效和安全漏洞。

### Step 3：处理并发与失败

生产环境需要考虑缓存删除失败、并发更新和缓存重建竞争。

建议机制：

- 权限变更写审计日志，便于追踪是谁改的、改了什么。
- 缓存删除失败要记录错误并进入重试队列，不能静默吞掉。
- 用户权限缓存里带 `permissionVersion` 或 `updatedAt`，请求时可与用户/角色版本比对。
- 修改角色权限时，先查出受影响用户列表，再批量删除用户权限缓存。
- 高并发场景下可用分布式锁或版本号，避免旧请求把旧权限重新写回缓存。

## 四、用户下次请求权限校验完整链路

用户访问接口、页面或按钮对应的后端能力时，应由网关、middleware、拦截器或业务 API 统一校验。

完整链路如下：

```text
1. 用户请求 API / 页面
2. 读取 Token / Cookie / Authorization Header
3. 查 token:{tokenHash}
4. Token 不存在或过期：返回 401
5. 查 perm:user:{tenantId}:{userId}
6. 用户权限缓存命中：直接判断是否包含目标权限
7. 用户权限缓存未命中：回源 DB 查询用户状态、角色、权限、数据范围
8. DB 显示账号禁用 / 租户冻结 / 无权限：返回 403 或 401
9. DB 校验通过：重建用户权限缓存，继续请求
```

### 情况 A：缓存已被删除

管理员刚刚回收权限后，对应用户权限缓存和会话缓存已被删除。

用户下一次请求会发生缓存未命中。系统回源数据库查询最新账号状态、角色和权限。如果数据库显示账号已禁用、角色已移除或无对应资源权限，后端直接拦截请求。

返回码建议：

| 场景 | 返回码 | 语义 |
|---|---|---|
| Token 不存在、过期、被强制下线 | 401 | 未登录或登录态失效 |
| 已登录但无资源权限 | 403 | 无访问权限 |
| 资源不存在或不对外暴露 | 404 | 避免泄漏资源存在性 |
| 租户被冻结 | 403 或业务错误码 | 视产品交互决定 |

### 情况 B：缓存存在且有效

权限未变更时，系统直接读取缓存权限集合判断。

这种路径不查 DB，响应速度快，适合高并发后台和移动端 API。缓存命中路径也是权限系统性能优化的主要收益来源。

## 五、配套兜底容错机制

### 5.1 缓存过期兜底

所有权限缓存都应设置 TTL。即使某次主动删缓存失败，缓存到期后也会重新回源数据库。

TTL 建议：

| 缓存类型 | 建议 TTL |
|---|---|
| Token 会话 | 与登录有效期一致，或短 Token + Refresh Token |
| 用户权限集合 | 30 分钟到 2 小时 |
| 角色权限模板 | 30 分钟到 6 小时 |
| 数据权限范围 | 15 分钟到 1 小时 |
| 菜单 / 页面结构 | 可更长，但必须跟权限版本绑定 |

注意：TTL 只能保证最终一致，不能替代主动删除。对权限回收、封号、强制下线等安全操作，必须主动失效。

### 5.2 分布式锁与版本号

权限更新和缓存重建存在竞争。

典型问题：

```text
T1 请求 A 读取旧 DB 权限，准备写缓存
T2 管理员提交权限回收，并删除缓存
T3 请求 A 把旧权限重新写回缓存
```

解决方案有两类。

第一类是分布式锁：重建用户权限缓存时，对 `lock:perm:user:{tenantId}:{userId}` 加短锁，避免并发回源和覆盖。

第二类是版本号：用户、角色、租户维护 `permission_version`。缓存 value 里也带版本。写缓存前确认当前版本未变；请求读取缓存时发现版本落后则丢弃并回源。

复杂 SaaS 更建议用版本号，因为它可审计、可跨缓存系统，不完全依赖 Redis 锁。

### 5.3 Redis 故障降级

Redis 不可用时，权限系统不能默认放行。

推荐策略：

| 故障点 | 策略 |
|---|---|
| Redis 读失败 | 降级直连 DB 校验 |
| Redis 写失败 | 请求可继续，但记录告警，后续重试 |
| Redis 删除失败 | 记录高优先级告警，进入重试队列，必要时提升 `permission_version` 强制旧缓存失效 |
| DB 不可用 | 不允许用旧缓存无限放行，高安全系统应失败关闭 |

对于金融、医疗、企业核心后台，权限系统应优先“失败关闭”：无法确认权限时拒绝高危操作。普通内容站可对低风险读接口适度降级，但后台管理和写操作不能放行。

### 5.4 前端辅助拦截

前端可以根据后端下发权限隐藏菜单、页面和按钮，但前端不是安全边界。

标准做法：

- 后端返回当前用户可访问菜单和按钮编码；
- 前端据此隐藏不可见入口；
- 所有 API 仍由后端校验；
- 前端路由守卫只能优化体验，不能替代接口鉴权。

只在前端控制按钮显示，而后端接口不校验，是权限系统最常见的高危漏洞之一。用户可以绕过前端，直接调用接口。

## 六、Cloudflare 体系下如何实践 Redis

Cloudflare Workers 的运行环境和传统 VPC 内的 Node.js 服务不同。它没有“在同一内网里直接挂一个 Redis 实例”的默认模式。因此，在 Cloudflare 体系下实践 Redis 要分三种方案看。

### 6.1 方案一：Upstash Redis，推荐给大多数 Workers 项目

Upstash 提供基于 HTTP 的 Redis API，天然适配 serverless 和 Workers。Cloudflare 官方文档也有 Workers + Upstash 的集成说明。

适合场景：

- Next.js on Cloudflare / Workers API；
- SaaS 后台权限缓存；
- Token 会话缓存；
- 轻量限流；
- 不希望维护 Redis 服务器；
- 接受通过公网 HTTPS 访问托管 Redis。

示例代码：

```ts
import { Redis } from "@upstash/redis/cloudflare";

export interface Env {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env) {
    const redis = Redis.fromEnv(env);
    const tokenHash = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!tokenHash) return new Response("Unauthorized", { status: 401 });

    const session = await redis.get(`token:${tokenHash}`);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { tenantId, userId } = session as { tenantId: string; userId: string };
    const permKey = `perm:user:${tenantId}:${userId}`;

    let permissions = await redis.get<string[]>(permKey);
    if (!permissions) {
      permissions = await loadPermissionsFromD1(env.DB, tenantId, userId);
      await redis.set(permKey, permissions, { ex: 3600 });
    }

    if (!permissions.includes("order:export")) {
      return new Response("Forbidden", { status: 403 });
    }

    return new Response("ok");
  },
};
```

注意事项：

- 不要在 Workers 中把 Redis 密钥写死在代码里，应放到 Wrangler secrets 或环境变量。
- 不要用 `KEYS token:*` 做批量清理，应维护用户 Token 索引。
- 对权限缓存写入 TTL。
- 管理员修改权限后，从 Worker API 中同步调用 `DEL` / `SREM` / `SMEMBERS` 等操作主动清理。

### 6.2 方案二：外部 Redis + Workers TCP sockets

Cloudflare Workers 支持出站 TCP sockets，可以通过 `cloudflare:sockets` 连接 TCP 服务。因此理论上可以连接外部 Redis 或 Redis 兼容服务。

适合场景：

- 已有 Redis 集群；
- 需要更接近原生 Redis 协议；
- 企业网络和安全策略允许 Workers 访问该 Redis；
- 团队能处理 TLS、连接生命周期、客户端兼容性和网络失败。

不建议一上来就这么做，原因是：

- Workers 不是长驻 Node.js 进程，连接复用模型不同；
- 很多传统 Redis 客户端默认依赖 Node TCP API，不一定适配 Workers；
- 出站网络、TLS、认证、超时、重试都要自己验证；
- 对权限缓存这种短请求场景，HTTP Redis 通常更简单。

### 6.3 方案三：Cloudflare 原生替代组合

如果不想引入 Redis，可以用 Cloudflare 原生组件组合实现大部分权限缓存需求。

| 需求 | Cloudflare 原生方案 | 是否适合做权限核心 |
|---|---|---|
| 权威权限表 | D1，或外部 PostgreSQL/MySQL + Hyperdrive | 适合 |
| 用户会话 | D1 正本 + Durable Objects / KV / Cookie 辅助 | 视安全等级 |
| 高频权限缓存 | Durable Objects 或 KV | DO 更适合强一致，KV 只适合读多写少 |
| 强制下线 | D1 更新 + DO 状态清理 + 版本号 | 适合 |
| 角色批量失效 | D1 查用户列表 + Queue 异步清缓存 | 适合 |
| 全局低敏配置缓存 | KV | 适合 |

Cloudflare KV 需要谨慎使用。KV 是读多写少的分布式 Key-Value 存储，适合配置、静态内容、低敏缓存和功能开关。它不是强一致权限数据库，也不适合高频写和强实时删除。权限系统可以把 KV 用在角色菜单模板、页面配置等低风险数据上，但不要把“用户是否有权访问接口”只交给 KV 判断。

Durable Objects 更适合强一致的用户会话、租户状态、在线状态和主动失效协调。一个用户或一个租户映射到一个 Durable Object，可以在对象内维护当前权限版本、活跃 token 和短期缓存。代价是设计复杂度更高，跨区域访问会落到对象所在位置。

### 6.4 Cloudflare 权限系统推荐架构

对一个跑在 Cloudflare 上的后台 / SaaS，推荐架构如下：

```text
前端 / APP
  │
  ▼
Cloudflare Worker / Pages Function
  │
  ├─ 读取 Token：Upstash Redis / Durable Object / D1
  ├─ 读取用户权限缓存：Upstash Redis 优先，DO 次之，KV 慎用
  ├─ 回源权威数据：D1，或 Postgres/MySQL via Hyperdrive
  ├─ 异步失效任务：Cloudflare Queues
  └─ 审计日志：D1 / R2 / 外部日志系统
```

不同规模的选型建议：

| 规模 | 推荐组合 |
|---|---|
| 个人站、小后台 | D1 做正本，短 TTL 内存/DO 缓存，必要时不用 Redis |
| 早期 SaaS | D1 或 Postgres + Upstash Redis，缓存用户权限和 Token |
| 多租户正式 SaaS | Postgres/MySQL + Hyperdrive + Upstash Redis + Queues + 审计日志 |
| 强实时协同 / 在线状态 | Durable Objects 管会话状态，Redis/DB 管权限正本 |
| 高合规企业后台 | 外部主数据库 + Redis 集群 + Cloudflare 只做入口和边缘安全 |

### 6.5 Cloudflare 下的权限回收链路

以“管理员移除用户角色”为例：

```text
1. 管理员请求 Worker Admin API
2. Worker 校验管理员自身权限
3. 开启 D1 / 外部 DB 事务
4. 删除 user_roles 记录，写 audit_logs
5. 提交事务
6. 删除 Upstash Redis:
   - DEL perm:user:{tenantId}:{userId}
   - DEL data_scope:user:{tenantId}:{userId}
7. 如果需要强制重新登录:
   - SMEMBERS idx:user_tokens:{tenantId}:{userId}
   - DEL token:{tokenHash1} token:{tokenHash2} ...
   - DEL idx:user_tokens:{tenantId}:{userId}
8. 返回成功
```

以“管理员修改角色权限”为例：

```text
1. DB 事务修改 role_permissions
2. 查询绑定该角色的所有用户 id
3. 删除 perm:role:{tenantId}:{roleId}
4. 批量删除 perm:user:{tenantId}:{userId}
5. 用户量很大时，把 userId 列表投递到 Cloudflare Queues 分批清理
```

角色影响用户很多时，不要在一个请求里同步删除几十万 key。更稳妥的方式是：

- DB 里给角色 `permission_version + 1`；
- 同步删除角色模板缓存；
- 小批量删除高活跃用户缓存；
- 剩余用户由 Queue 异步删除；
- 请求读到旧缓存时发现版本落后，立即丢弃并回源。

## 七、该架构优势总结

### 性能

绝大多数正常用户请求走缓存。Token、用户权限集合、角色模板、数据权限范围都可以在 Redis 或边缘缓存中读取，避免每次请求都查多张表。

这对 SaaS 多租户系统尤其重要。租户越多、页面越复杂、按钮和接口越细，权限查询越容易成为热点。

### 实时性

管理员回收权限后主动删除缓存，用户下一次操作立即失效。

安全系统最怕“看起来改了，实际上还没生效”。主动失效让权限变更从“等 TTL 过期”变成“下一次请求马上生效”。

### 通用性

这套架构适配：

- 单体后台；
- 微服务网关；
- SaaS 多租户；
- 移动端 APP；
- 微信小程序；
- 内部管理系统；
- Cloudflare Workers / Vercel / K8s / 传统 ECS。

差异只在缓存和数据库具体选型，不在核心思想。

### 可维护性

分层清楚，排障路径明确：

1. 先查 DB 权限正本；
2. 再查用户权限缓存是否过期或未删除；
3. 再查 Token 是否仍有效；
4. 最后查前端菜单和按钮是否刷新。

### 扩展性

后续可以叠加：

- 租户隔离；
- 部门数据权限；
- 字段级权限；
- 行级权限；
- 审批流；
- 操作审计；
- 风险控制；
- 设备管理；
- 单点登录和企业 IdP。

底层“DB 正本 + 缓存副本 + 主动失效”的原则不需要重构。

## 八、常见踩坑点

| 踩坑 | 后果 | 正确做法 |
|---|---|---|
| 只更新数据库，不删除 Redis 缓存 | 权限延迟生效，高危安全问题 | DB 事务提交后主动删除用户/角色缓存 |
| 只缓存 Token，不缓存完整权限列表 | 每次请求仍要查库，缓存收益有限 | 缓存用户权限集合和数据范围 |
| 修改角色权限时，只删角色缓存 | 绑定该角色的用户权限仍旧 | 批量删除所有关联用户权限缓存 |
| 缓存不设 TTL | 极端场景永久脏数据 | 所有权限缓存设置 TTL |
| 用 `KEYS token:*` 扫描清会话 | 生产 Redis 阻塞风险 | 维护 `idx:user_tokens:{tenantId}:{userId}` |
| 多租户 Key 不带租户 id | 权限串租户 | Key 必须包含 `tenantId` |
| 仅前端隐藏按钮 | 可直接调接口绕过 | 后端接口强制鉴权 |
| JWT 长有效期且不做黑名单 | 用户禁用后旧 JWT 继续有效 | 短 TTL + refresh token + token version / blacklist |
| KV 当强一致权限库 | 权限回收可能延迟 | KV 只做低敏读缓存，核心权限回源 DB 或 Redis/DO |
| Redis 故障默认放行 | 故障变安全事故 | 高危操作失败关闭，低风险读请求可有限降级 |

## 九、结论

通用后台、SaaS 和 APP 权限系统的标准答案不是某个框架，而是一套分层原则：

**数据库负责可信，缓存负责性能，主动失效负责实时，后端拦截负责安全。**

权限回收链路中，最关键的一步是“DB 事务提交后主动清缓存”。只要这一步缺失，权限系统就会出现数据库和缓存不一致，轻则用户体验混乱，重则已被禁用或已被收权的用户继续访问系统。

在 Cloudflare 体系下，Redis 的实践方式要根据规模选择：

- 简单项目可以用 D1 + Durable Objects，不一定马上引入 Redis；
- 标准 SaaS 推荐 Upstash Redis + D1 / 外部数据库；
- 已有企业数据库可通过 Hyperdrive 连接 PostgreSQL/MySQL，Redis 继续用托管或自建服务；
- KV 适合低敏配置和读多写少缓存，不适合作为强实时权限正本。

最终判断标准很简单：**权限变更后，用户下一次请求是否一定按最新 DB 权限判断。能做到这一点，架构就是合格的；做不到，再复杂也只是缓存了一个安全漏洞。**
