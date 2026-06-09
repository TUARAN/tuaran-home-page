---
title: Cloudflare Workers + D1 vs Supabase 技术调研
category: topics
date: 2026-06-09
tags: [Cloudflare, D1, Workers, Supabase, 边缘计算, Postgres, SQLite, BaaS, 全栈, Vibe Coding, 数据库选型, 个人项目]
summary: 同一议题的两个视角合并为一篇：Opus 4.7 版做全栈平台对比（架构、周边服务、价格、站长迁移判断）；Composer 2.5 版做 Vibe Coding 实战（场景选型表、提示语模板、AI 幻觉清单）。页面顶部 version 切换。
tldr: 两套世界观——Cloudflare「边缘乐高 + D1 SQLite」，Supabase「Postgres 大礼包」。已 all-in CF 的站长不必迁；多用户 SaaS / RLS / Realtime 优先 Supabase。Vibe Coding 时选型必须在第一句提示语钉死，否则 AI 默认 Prisma/Postgres 导致大面积返工。切换 **Composer 2.5** tab 看提示语模板。
topic_type: tech
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

> **双视角说明**：本篇合并了同一议题的两份调研。默认 **Opus 4.7** 版覆盖全栈对比、价格与站长结论；切到 **Composer 2.5** 版看 Vibe Coding 场景选型与提示语模板（可用 `?v=cursor` 直达）。

## 一、是什么

两者都是"做 Web 应用不想自己运维服务器"的全栈基础设施，但起点完全不同。

### Cloudflare Workers + D1

- **Workers**：V8 isolate 在 Cloudflare 全球 ~330+ 城市的边缘节点跑你的 JS/TS 代码。冷启动 ~5ms。
- **D1**：基于 SQLite 的边缘分布式数据库。主副本在一个区域，自动同步只读副本到其它区域。**目前已 GA**（2024 年），但读副本（Read Replication）是 2025 年初转入 Beta → 2026 年初转入 GA。
- **配套服务**（全部独立产品，各自计费）：KV、R2（S3 兼容对象存储）、Queues、Durable Objects、Workers AI、Vectorize（向量数据库）、Hyperdrive（外部 Postgres 加速）、AI Gateway、Browser Rendering、Email Routing、Pages、Stream（视频）、Images……
- **官方文档**：[developers.cloudflare.com](https://developers.cloudflare.com/)

### Supabase

- **Postgres 数据库**：完整的 Postgres（不是简化版），可装 pgvector / PostGIS / pg_cron 等扩展。**单区域部署**（创建项目时选区域），无自动多区域分发。
- **PostgREST**：把 Postgres 表自动暴露成 REST API；通过 RLS（行级安全）做权限控制。
- **配套服务**（全部围绕 Postgres）：Auth（GoTrue）、Storage（S3 兼容）、Realtime（Postgres 逻辑复制）、Edge Functions（Deno Deploy）、Vector（pgvector）、Queues（pgmq）。
- **官方文档**：[supabase.com/docs](https://supabase.com/docs)

### 世界观差异

| 维度 | Cloudflare | Supabase |
|---|---|---|
| 起点 | 边缘 CDN + Workers 计算 | Postgres + BaaS |
| 数据库模型 | SQLite（D1）、KV、R2 | Postgres |
| 默认部署形态 | 全球边缘 | 单区域 |
| 服务粒度 | 多个独立服务，自己拼装 | 大礼包，开箱即用 |
| 开发者画像 | 偏 infra 工程师 / 想精细控制 | 偏前端 / 全栈 / 创业产品 |
| 价格模型 | 按调用 / 按存储分别计费 | 按项目套餐 + 超额 |

---

## 二、为什么重要

- 这是 2026 年「个人开发者 / 小团队做 SaaS / 内容站 / 工具站」最热的两条路线
- 价格对独立开发者极友好（Cloudflare 几乎可以 0 元跑出 10 万 PV/月；Supabase 免费版能跑完整 Auth + 数据库的 MVP）
- 选错了不致命但迁移成本不低 — 尤其是 Auth 和数据库 schema 一旦绑定，搬家是大工程

---

## 三、关键玩家与生态

### Cloudflare 生态

- 自家全栈：Workers / D1 / R2 / Pages / KV / Queues / Vectorize / Workers AI
- 框架适配：[Hono](https://hono.dev/)、[Next.js on Workers](https://developers.cloudflare.com/workers/frameworks/framework-guides/nextjs/)、[Remix](https://remix.run/)、[SvelteKit](https://kit.svelte.dev/)、[Astro](https://astro.build/)、[TanStack Start](https://tanstack.com/start)
- Auth 第三方：[Better Auth](https://www.better-auth.com/)、[Clerk](https://clerk.com/)、[WorkOS](https://workos.com/)、自研（D1 + 邮件 OTP）
- 邮件：[Resend](https://resend.com/)（CF 没有自己的事务邮件产品）

### Supabase 生态

- 自家全栈：Database / Auth / Storage / Realtime / Edge Functions / Vector / Queues / Branching / Cron
- 框架适配：Next.js、Nuxt、SvelteKit、Remix、SolidStart、Expo、Flutter；官方 SDK 覆盖 JS/Python/Dart/Swift/Kotlin
- 部署搭配：常和 Vercel / Netlify / Fly.io 搭配（不是替代关系）
- 客户案例：1Password、Mozilla、PwC、Replicate、Resend（**注**：Resend 自己用 Supabase）

### 横向竞品

- 完全 Postgres BaaS：[Neon](https://neon.tech/)（serverless Postgres + Branching）、[Xata](https://xata.io/)、[Nhost](https://nhost.io/)
- 边缘数据库：[Turso](https://turso.tech/)（libSQL，SQLite 边缘分发，和 D1 最像）、[PlanetScale](https://planetscale.com/)（MySQL，2024 年取消免费版）
- 全栈 BaaS：[Appwrite](https://appwrite.io/)、[Pocketbase](https://pocketbase.io/)（自托管）、[Convex](https://www.convex.dev/)

---

## 四、技术 / 实施细节

### 4.1 数据库层

| 维度 | Cloudflare D1 | Supabase Postgres |
|---|---|---|
| 引擎 | SQLite | Postgres 15/16 |
| 部署 | 主副本在一区域，只读副本自动分发到全球 | 单区域（创建时选） |
| 单库容量 | 10 GB / 库（免费 + 付费同款上限） | 免费 500 MB，Pro 8 GB，可升到 1 TB+ |
| 写入吞吐 | 中等（SQLite 写锁，单写者） | 高（Postgres 标准） |
| 读延迟 | 全球边缘 < 50ms（命中 read replica） | 取决于客户端到区域距离 |
| 事务 | 完整 SQLite 事务；不支持跨库事务 | 完整 Postgres 事务 |
| 扩展能力 | 受 SQLite 限制（无 stored procedures、有限的 JSON 操作） | 强（pgvector、PostGIS、pg_cron、pgmq、pg_graphql 等几十种） |
| 备份 | Time Travel（30 天，付费 plan 30 天，免费 7 天） | PITR（Pro $25/mo 含 7 天；可加购到 28 天） |
| 迁移工具 | `wrangler d1 migrations` | `supabase migration` + Branching |
| 锁机制 | 库级写锁 | 行级锁，MVCC |

**关键观察**：

- **如果应用是"读多写少 + 全球用户"**（内容站、博客、个人工具）→ D1 优势巨大，边缘读延迟无敌
- **如果应用是"重事务 + 复杂查询 + 高并发写"**（电商订单、协作工具、IM）→ Postgres 更合适，D1 的单写者限制会成为瓶颈

### 4.2 计算层

| 维度 | Workers | Supabase Edge Functions |
|---|---|---|
| 运行时 | V8 isolate（Node 兼容层 `nodejs_compat`） | Deno（V8 + 原生 TypeScript） |
| 冷启动 | ~5 ms | ~50–100 ms |
| 单次执行时长 | 30s CPU（Free），无限挂壁时间到 30 分钟（Paid） | 默认 150s（可调） |
| 内存上限 | 128 MB | 256 MB |
| 部署形态 | 全球边缘 | 全球边缘（Deno Deploy 底层） |
| 调用模式 | HTTP / Cron / Queue / RPC / Email | HTTP / Cron / Webhook（DB Trigger） |
| 包大小 | 10 MB（压缩后） | 20 MB |
| 价格 | $5/mo 10M 请求；超出 $0.30/M | $25/mo 套餐内 2M 调用；超出 $2/M |

**关键观察**：

- Workers 冷启动远好于 Edge Functions（毫秒级 vs 几十毫秒）
- Edge Functions 单次执行时长更宽松，适合稍重的处理（PDF 生成、邮件批处理）
- 两者都不适合长任务（图像/视频处理 > 5 分钟 → 都要换方案）

### 4.3 周边服务对比

| 能力 | Cloudflare 方案 | Supabase 方案 |
|---|---|---|
| **Auth** | 自研（D1 + JWT）/ Better Auth / Clerk / WorkOS | **Supabase Auth（GoTrue）**：Email+Password、Magic Link、OAuth（Google/GitHub/Apple/40+）、Phone、Anonymous、SAML、MFA |
| **对象存储** | **R2**（S3 兼容、免出流量费） | **Supabase Storage**（S3 兼容、出流量计费） |
| **Realtime** | Durable Objects + WebSocket（自己写状态机） | **Supabase Realtime**（Postgres 表变更 / 广播 / Presence 一行代码订阅） |
| **向量** | **Vectorize**（独立产品，5M 索引免费） | **pgvector**（直接 SQL，与业务表 JOIN 自然） |
| **队列** | **Queues**（每月 1M 操作 $0.40） | **pgmq** / **Queues**（基于 Postgres，2025 GA） |
| **定时任务** | Cron Triggers（Workers 自带） | pg_cron / Edge Functions Cron |
| **全文搜索** | 无自研（用 D1 FTS5 / R2 + 第三方） | Postgres 全文搜索（`tsvector`） |
| **数据库分支** | 无原生 | **Branching**（每个 PR 一个隔离数据库） |
| **邮件** | Email Routing（只能收信和路由，**不能发**） | 无自研（Auth 邮件用 Resend / SendGrid） |
| **CDN/边缘缓存** | 自家 CDN 是世界第一梯队 | 无（依赖 Vercel/Netlify） |

**关键观察**：

- Supabase 的 **Auth + Realtime + Branching** 是 Cloudflare 没有对位产品的"杀手锏"
- Cloudflare 的 **R2（免出流量费）+ CDN + 边缘网络** 是 Supabase 无法对位的"基础设施降维"
- 两者都是"用 80% 的能力换 20% 的灵活性" — 真实项目里常常**两个一起用**（Workers 跑边缘 + Supabase 当数据库）

### 4.4 价格（2026 年现行）

#### Cloudflare（按服务独立计费）

| 服务 | 免费额度 | 付费 |
|---|---|---|
| Workers | 100,000 请求/天 | $5/mo 含 10M 请求；超出 $0.30/M |
| D1 | 5 GB 存储；5M 行读/天；100k 行写/天 | $5/mo 含 25B 行读 + 50M 行写 + 5GB；超出 $0.001/M 读、$1/M 写、$0.75/GB |
| R2 | 10 GB 存储；100 万次 A 类请求/月；1000 万次 B 类/月；**出流量永远免费** | $0.015/GB 存储，$4.5/M 写，$0.36/M 读 |
| Vectorize | 30M 向量维度查询 + 5M 存储维度（约 10k 1536 维向量） | $0.04/M 查询维度，$0.05/100M 存储维度 |
| Workers AI | 10k Neurons/天 | 按模型计 |
| Queues | 100 万操作/月 | $0.40/M |
| KV | 100k 读 + 1k 写/天 | $0.50/M 读，$5/M 写 |
| Pages | 500 builds/月，免费部署 | 同样免费部署，仅 build 时间收费 |

#### Supabase（按项目套餐）

| 套餐 | 月费 | 包含 |
|---|---|---|
| **Free** | $0 | 500 MB DB；1 GB Storage；5 GB egress；50k MAU；2M Edge Functions 调用；**项目 7 天不活动会被暂停**；最多 2 个 Free 项目 |
| **Pro** | $25 / 项目 | 8 GB DB；100 GB Storage；250 GB egress；100k MAU；2M Edge Functions；7 天 PITR；Branching |
| **Team** | $599 / 月（组织级） | SOC2、SSO、24h SLA |
| 超额 | — | DB $0.125/GB；Storage $0.021/GB；Egress $0.09/GB；Auth $0.00325/MAU |

**典型对比场景：一个 10 万 PV/月、5 GB 数据、50k 用户的内容站**

| 项目 | Cloudflare | Supabase |
|---|---|---|
| 请求 | Workers 10 万 × 30 = 300 万 → 免费内 | 包含 |
| 数据库 | D1 5 GB → 免费内 | 8 GB 套餐内 |
| 存储 | R2 几 GB → 免费内 | 1 GB 免费 / 超出付费 |
| 出流量 | R2 出流量 0 元 | $0.09/GB |
| Auth | Better Auth 自部署（D1 内） | Supabase Auth |
| 月费估算 | **$0** | **$25** |

> Supabase 不是更贵，是把多个服务打包；Cloudflare 不是更便宜，是把成本分散到每个独立服务，**只有当某些服务用量极小时才显得便宜**。

---

### 4.5 真实开发体验

#### 本地开发

| 维度 | Cloudflare | Supabase |
|---|---|---|
| CLI | `wrangler` | `supabase` |
| 本地数据库 | Miniflare 内置 SQLite（与 D1 同样语法） | Docker 启动完整 Postgres + 所有服务 |
| 启动速度 | 秒级 | 1–3 分钟（Docker 下载/启动） |
| 离线开发 | ✅ 完全离线可用 | ✅ 完全离线可用 |
| 真实环境一致性 | 高（Workers runtime 在本地完全模拟） | 高（本地起的就是真实 Postgres） |

#### 迁移与变更

- **D1**：`wrangler d1 migrations create / apply`，文件化 SQL 迁移。不支持 schema diff，需要手写。
- **Supabase**：`supabase migration new`，文件化 SQL；**支持 db diff、db lint、db push**。Branching 让 PR 级别 schema 变更很丝滑。

#### 可观测性

- **Cloudflare**：Workers Logs（30 天免费）、Trace、Analytics Engine、Logpush（付费推到 R2/S3）；D1 有 Insights 看慢查询
- **Supabase**：Dashboard 自带 logs、metrics；可装 [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)

#### "心智模型"差异（最重要）

- **Cloudflare**：你写代码 + 自己拼几个服务。每个服务都有自己的 binding/env，所有交互都是 RPC，灵活但繁琐。Auth 需要自己想清楚每一步。
- **Supabase**：你写代码 + 用 SDK 调 Supabase。Auth 是一行 `supabase.auth.signInWithPassword(...)`，Realtime 是一行 `.subscribe(...)`，几乎零样板。

---

## 五、争议与风险

### Cloudflare 侧

1. **D1 写吞吐天花板**：SQLite 单写者特性使其在 > 1000 QPS 写入场景容易瓶颈；官方建议跨多个 D1 库做 sharding，但这是应用层负担。
2. **D1 多区域写**：仍是"主副本单点"。Cloudflare 在推 Durable Objects + SQLite 的方向（每个 DO 一个 SQLite），但生态成熟度低。
3. **Workers 没有内建 Auth**：必须依赖第三方（Better Auth 是当下最佳选择）或自研，对初学者门槛高。
4. **生态分散**：D1 + R2 + Vectorize + Durable Objects 每个都有自己的概念，学习曲线长。
5. **某些定价隐性变化**：D1 row reads 计费在 2024 年改过定义，每次 schema 操作可能计算多次 row read，**真实账单可能比预期高**。
6. **vendor lock**：D1 SQLite 数据可以导出（标准 SQL），但 R2、Durable Objects、Workers KV 都没有真正的"标准"接口，迁出代价不低。

### Supabase 侧

1. **单区域风险**：默认部署在一个区域，跨区域用户延迟高；多区域要 Read Replicas（Team 套餐及以上）或自己做。
2. **Free 套餐项目 7 天不活动暂停**：对副业/小工具不友好，需要定期 ping。
3. **Auth 锁定**：用了 Supabase Auth 后想迁出几乎要重做（迁移 GoTrue users 表理论可行，OAuth provider 配置全要重来）。
4. **PostgREST 性能**：自动生成的 REST API 在复杂查询/聚合场景下不如手写 SQL/RPC，且 RLS 写得不好容易性能塌方。
5. **Edge Functions 不如 Workers 快**：冷启动 ~50–100ms，对低延迟场景不够顶级。
6. **大文件 / 大流量场景的出流量费贵**：Pro 200 GB egress 后 $0.09/GB —— 一个图站很容易超。
7. **Supabase 自身命运**：2024–2025 是融资和增长黄金期，但成本不低；如果未来调整 Free 套餐（学 PlanetScale 取消免费），对小项目是巨大冲击。
8. **2026 年新动态**：Supabase 在 2025 年增加了 [Snaplet](https://supabase.com/blog/snaplet-acquired)（数据 seeding）、[Edge Functions deno 2 支持](https://supabase.com/blog)、Branching GA，整体方向是"更全栈"。

---

## 六、个人结论

### 一句话定性

**Cloudflare 是"乐高 + 边缘第一"，Supabase 是"Postgres + 大礼包"** —— 没有谁更好，只有谁更匹配你的画像。

### 站长视角：当前栈 = Cloudflare 全家桶 + Resend + D1，要不要碰 Supabase？

| 维度 | 判断 |
|---|---|
| 是否要迁移现有项目到 Supabase | 🔴 **不要**。当前栈已经稳定、成本极低、性能好；Supabase 的核心增量是 Auth，但 Resend OTP + D1 这条 Auth 路径已经在跑（参见 [Resend Email OTP + Cloudflare D1 实践](/articles/research/topics/resend-email-otp-cloudflare-d1)），没必要换。 |
| 是否要把 Supabase 加入"备选清单" | 🟢 **要**。两种场景值得：① 如果某天需要复杂 Postgres 能力（pgvector + 复杂 JOIN + GIS）；② 如果要做一个"重 Realtime"的应用（多人协作、Presence）—— Cloudflare 的 Durable Objects 写起来麻烦得多。 |
| 是否要试一下 Supabase Auth | 🟡 **观望**。如果 Better Auth + Resend OTP 哪天踩坑无法解决，再启用。**不要为了试而试**，Auth 一旦上线迁移成本极高。 |
| 是否值得花时间学 Supabase 体系 | 🟡 **学一遍核心 API 就好**（Auth + Realtime + Storage 的客户端调用方式），别深入到 RLS 和 Postgres 调优 —— 那是另一种心智模型，对当前栈帮助不大。 |

### 下一步行动

1. **不动现有项目**：CF + D1 + Resend 跑得好就别折腾
2. **新建一个 Supabase Free 项目**做 sandbox：30 分钟体验 Auth + Realtime + Storage 的开发流，建立"备胎认知"
3. **保留 Cloudflare 的核心定位**：边缘网络 + R2（出流量 0 元）+ Workers AI / Vectorize 是不可替代的护城河
4. **真要做一个"重 Postgres / 重 Realtime"的应用**（如多人协作工具、聊天工具），优先 Supabase 主体 + Cloudflare 做 CDN/Workers 边缘的混搭
5. **价格预警**：如果 Supabase 调整 Free 套餐（不再活跃暂停 / 取消免费），立即放弃备选清单

---

## 七、信息来源

### Cloudflare 官方

- [Cloudflare Developers](https://developers.cloudflare.com/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [D1 Read Replication](https://developers.cloudflare.com/d1/best-practices/read-replication/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Vectorize](https://developers.cloudflare.com/vectorize/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)

### Supabase 官方

- [Supabase Docs](https://supabase.com/docs)
- [Database Overview](https://supabase.com/docs/guides/database)
- [Auth Overview](https://supabase.com/docs/guides/auth)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Pricing](https://supabase.com/pricing)
- [Branching](https://supabase.com/docs/guides/deployment/branching)

### 横向参考

- [Turso（D1 的最近竞品）](https://turso.tech/)
- [Neon（Supabase 的最近 DB-only 竞品）](https://neon.tech/)
- [Better Auth（Workers 上自建 Auth 的事实标准）](https://www.better-auth.com/)
- [Hono（Workers/Edge Functions 上最流行的轻量框架）](https://hono.dev/)

### 本仓库相关调研

- [Resend Email OTP + Cloudflare D1 实践](/articles/research/topics/resend-email-otp-cloudflare-d1)
- [Cloudflare Edge Agents 实践](/articles/research/topics/cloudflare-edge-agents-practice)
- [Next.js 在 Cloudflare 上的性能优化](/articles/research/topics/nextjs-cloudflare-performance-optimization)
- [本地 Agent Ops（launchd + Cloudflare Tunnel）](/articles/research/topics/local-agent-ops-launchd-cloudflare-tunnel)

<!-- variant:cursor -->

> **本版视角**：Vibe Coding 实战——聚焦「跟 AI 协作时怎么选型、怎么写提示语」。全栈平台对比、价格明细、周边服务矩阵见页面顶部 **Opus 4.7** 切换。

> **写给谁**：已经在用 AI 写全栈、但每到「加数据库」就卡在「D1 还是 Supabase」的开发者。默认你有 Cloudflare 或 Supabase 的基础概念，不重复官方入门文档——聚焦**选型差异**和**怎么跟 AI 说清楚**。

## 一、是什么

先把两个东西放到同一坐标系里，否则对比会跑偏。

| 维度 | Cloudflare Workers + D1 | Supabase |
|---|---|---|
| **本质** | 边缘计算运行时 + 绑在 Worker 上的 SQLite 库 | 托管 PostgreSQL + Auth + Storage + Realtime + Edge Functions 的 BaaS 平台 |
| **数据库引擎** | SQLite（D1） | PostgreSQL 15+ |
| **请求入口** | Worker / Pages Functions（全球 300+ PoP） | REST / GraphQL（PostgREST）/ 直连 Postgres / Edge Functions（Deno） |
| **与前端的关系** | 通常「前端 → Worker API → D1」，不暴露数据库 | 可以「前端 → `@supabase/supabase-js` 直连」，RLS 挡在数据库层 |
| **身份系统** | 无内置，需自建（JWT / cookie / OAuth） | 内置 Auth（邮箱、OAuth、Magic Link、MFA） |
| **实时能力** | 需 Durable Objects + WebSocket 自己拼 | 内置 Realtime（Postgres Changes / Broadcast） |
| **文件存储** | R2（另绑） | Storage（S3 兼容 API） |
| **向量检索** | Vectorize（另绑）或 sqlite-vec 实验性 | pgvector 扩展 |

**一句话定性**：D1 是 Cloudflare 边缘栈里的**数据零件**；Supabase 是独立的**数据 + 身份 + 存储平台**。拿 D1 对标「整个 Supabase」会失真；更公平的对标是 **D1 vs Supabase 里的 Postgres 那一层**——但即便只比数据库，SQLite 和 Postgres 的语义差距仍然很大。

<figure class="research-inline-diagram">
<svg viewBox="0 0 760 420" role="img" aria-label="D1 与 Supabase 架构对照">
<rect x="20" y="30" width="340" height="360" rx="12" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<text x="190" y="58" text-anchor="middle" font-size="14" font-weight="600">Cloudflare 边缘栈</text>
<rect x="50" y="80" width="120" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="110" y="103" text-anchor="middle" font-size="12">Pages / 前端</text>
<path d="M170 98 L210 98" stroke="currentColor" stroke-width="1.2" marker-end="url(#arrow)"/>
<rect x="210" y="80" width="120" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="270" y="103" text-anchor="middle" font-size="12">Worker API</text>
<path d="M270 116 L270 150" stroke="currentColor" stroke-width="1.2" marker-end="url(#arrow)"/>
<rect x="210" y="150" width="120" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="270" y="173" text-anchor="middle" font-size="12">D1 (SQLite)</text>
<rect x="50" y="210" width="100" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
<text x="100" y="231" text-anchor="middle" font-size="11">R2</text>
<rect x="170" y="210" width="100" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
<text x="220" y="231" text-anchor="middle" font-size="11">KV</text>
<rect x="290" y="210" width="60" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
<text x="320" y="231" text-anchor="middle" font-size="11">DO</text>
<text x="190" y="280" text-anchor="middle" font-size="11" opacity="0.75">Auth / Realtime 需自建或外接</text>

<rect x="400" y="30" width="340" height="360" rx="12" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<text x="570" y="58" text-anchor="middle" font-size="14" font-weight="600">Supabase 平台</text>
<rect x="430" y="80" width="120" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="490" y="103" text-anchor="middle" font-size="12">Web / Mobile</text>
<path d="M550 98 L590 98" stroke="currentColor" stroke-width="1.2" marker-end="url(#arrow)"/>
<rect x="590" y="80" width="120" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="650" y="103" text-anchor="middle" font-size="12">supabase-js</text>
<path d="M650 116 L650 150" stroke="currentColor" stroke-width="1.2" marker-end="url(#arrow)"/>
<rect x="590" y="150" width="120" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="650" y="173" text-anchor="middle" font-size="12">PostgREST</text>
<path d="M650 186 L650 220" stroke="currentColor" stroke-width="1.2" marker-end="url(#arrow)"/>
<rect x="590" y="220" width="120" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="650" y="243" text-anchor="middle" font-size="12">PostgreSQL</text>
<rect x="430" y="280" width="90" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
<text x="475" y="301" text-anchor="middle" font-size="11">Auth</text>
<rect x="540" y="280" width="90" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
<text x="585" y="301" text-anchor="middle" font-size="11">Storage</text>
<rect x="650" y="280" width="70" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
<text x="685" y="301" text-anchor="middle" font-size="11">RT</text>
<text x="570" y="350" text-anchor="middle" font-size="11" opacity="0.75">RLS 在 Postgres 层统一鉴权</text>
<defs>
<marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
<path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
</marker>
</defs>
</svg>
</figure>

## 二、为什么重要（尤其在 Vibe Coding 里）

AI 写代码的默认假设是 **Postgres + ORM（Prisma / Drizzle）+ Next.js API Route**。你跟它说「加个用户表」，它十有八九给你：

```typescript
// AI 默认幻觉路径（与 D1 不兼容）
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
await prisma.user.create({ data: { email } })
```

或者：

```typescript
// AI 默认幻觉路径（与 Worker 边缘栈不匹配）
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, anonKey) // 在 Worker 里暴露 anon key 也不对
```

**一次选型失误的代价**：

| 失误 | 典型返工量 |
|---|---|
| 项目已部署 Cloudflare Pages，AI 生成了 Prisma + Vercel Postgres | 换 D1 或换部署平台，1–3 天 |
| Worker 里直连 Supabase 用 service role，密钥泄漏风险 | 安全审计 + 架构重写 |
| D1 上写了复杂事务 + 大量 JOIN，上线后性能/语义踩坑 | schema 拆分或迁 Postgres |
| Supabase 项目没用 RLS，前端直连数据库裸奔 | 数据泄漏事故（不可逆） |

所以在 Vibe Coding 里，**数据库选型必须是对话的第一句约束**，不能留到「先跑起来再说」。这和 [Vibe Coding 判断力结构](/articles/research/topics/vibe-coding-judgment-structure) 里「问题定义判断」是同一层——AI 放大的是执行速度，选型错了速度越快偏航越快。

## 三、核心差异（八维对照）

### 3.1 数据库引擎与 SQL 能力

| 能力 | D1 (SQLite) | Supabase (PostgreSQL) |
|---|---|---|
| JSON 查询 | `json_extract` 等 SQLite 函数 | `jsonb` 操作符、`@>`、`?` 等，更强 |
| 全文检索 | 基础 `FTS5`（需自建） | `tsvector` / `tsquery` 原生 |
| 复杂 JOIN / 窗口函数 | 支持但大表性能差 | 成熟，优化器强 |
| 存储过程 / 触发器 | 有限 | PL/pgSQL 完整生态 |
| 扩展 | 几乎无 | pgvector、PostGIS、pg_cron 等 |
| 单库上限 | 10 GB（2026 官方限制） | 免费 500 MB，付费可扩到 TB 级 |
| 并发写 | 单主写入，读可复制 | 标准 Postgres 并发模型 |

**结论**：数据模型简单（< 20 张表、无复杂分析查询）→ D1 够用；要 OLAP 味、地理、向量、复杂报表 → Postgres。

### 3.2 部署拓扑与延迟

- **D1**：数据跟着 Cloudflare 边缘网络走，Worker 通过 binding 同区域访问，**读延迟极低**（同一请求链路内）。写操作仍落主库，跨区有复制延迟。
- **Supabase**：数据库实例在固定 Region（如 `ap-southeast-1`）。前端在 Cloudflare Pages 上时，每次 API 调用是 **Pages → 互联网 → Supabase Region**，多一跳；Realtime WebSocket 也是连 Supabase 而非边缘。

**本站实测语境**（未备案域名）：Cloudflare 走海外 PoP，国内 50–150ms；Supabase 新加坡区类似。**两者在国内都不是「本地机房」体验**，但 Cloudflare 全栈至少少一跳。

### 3.3 身份与权限模型

| | D1 路径 | Supabase 路径 |
|---|---|---|
| 登录 | 自建：Resend OTP、GitHub OAuth、Passkey…… | `supabase.auth.signInWithOAuth()` 等一行调用 |
| 授权 | 在 Worker 代码里 `if (userId !== row.owner)` | **RLS**：`CREATE POLICY ... USING (auth.uid() = user_id)` |
| 多租户 | 全靠应用层 discipline | RLS 是平台级安全网 |
| 与菜单/权限 | 本站做法：`audience` 字段 + D1 `nav_overrides` 表 | CMS 式角色表 + policy |

**对照本站**：[2aran.com 站长鉴权实践](/articles/research/topics/2aran-owner-auth-practice) 里论证过：单站长场景自建 `edgeSession` + D1 比引入 Supabase Auth 更轻；但如果是**多用户 SaaS**，Supabase Auth + RLS 的安全边际远高于「让 AI 手写 if 判断」。

### 3.4 实时与长连接

- **D1**：无。要聊天室、协同编辑、Agent 状态 → Durable Objects + WebSocket（见 [Cloudflare 边缘 Agent 实践](/articles/research/topics/cloudflare-edge-agents-practice)）。
- **Supabase Realtime**：监听 Postgres 行变更，前端 `supabase.channel().on('postgres_changes', ...)` 即可。适合「评论刷新、订单状态、简单协作」，不适合超高频交易撮合。

### 3.5 迁移与本地开发

| | D1 | Supabase |
|---|---|---|
| Schema 版本管理 | `wrangler d1 migrations apply` + SQL 文件 | SQL migration 或 Supabase CLI `db push` |
| 本地库 | `wrangler d1 execute --local` | `supabase start`（Docker 起全套） |
| 与 AI 协作 | 需明确「不要用 Prisma migrate」 | AI 对 Supabase CLI 熟悉度高，但 RLS policy 常被漏写 |

### 3.6 成本（个人 / 小项目视角，2026）

| | D1 | Supabase |
|---|---|---|
| 免费档 | 每日 500 万 read、10 万 write、5 GB 存储 | 500 MB 库、1 GB 文件、5 万 MAU Auth |
| 付费触发点 | 读放大（每个 API 多次 query） | 库体积、egress、Auth MAU、Realtime 连接数 |
| 隐藏成本 | 无 — 账单在 Cloudflare 一张里 | Edge Function 冷启动、Storage egress |

对个人 side project，**两者基本都免费**；D1 的优势是已经和 Pages/Workers 账单合并，Supabase 的优势是 Auth+Storage 不用另找供应商。

### 3.7 供应商锁定与迁出

- **D1**：SQLite 文件可导出，但 Durable Objects / Workers binding / AI Gateway 等是深度绑定。迁出 = 换运行时 + 换数据库托管。
- **Supabase**：核心是 Postgres，**迁出相对容易**（`pg_dump` → 任何 Postgres）。Auth 用户可导出但密码 hash 格式有粘性。

### 3.8 国内可达性与合规

两者在大陆都走海外节点，无 ICP 备案则都不是「境内云服务」。区别：

- Cloudflare：GFW 对 CF IP 段通常不整体封禁，本站实测可访问。
- Supabase：域名 `*.supabase.co` 偶尔受干扰，需备用自定义域名或代理。

**不做备案的 toC 产品**：两者都要接受延迟和稳定性 trade-off；**不做 toC 的个人工具**：都够用。

## 四、场景选型表（12 条）

| # | 场景 | 推荐 | 理由 |
|---|---|---|---|
| 1 | 个人博客 / 周刊，已托管 Cloudflare Pages | **D1** | 零额外供应商；菜单覆盖、阅读量、简单配置表足够 |
| 2 | 个人工具站 + 站长鉴权（单 owner） | **D1** + 自建 session | 本站路径；Supabase Auth 过重 |
| 3 | 邮箱注册登录 + 边缘 API（SyncBlog 类） | **D1** + Resend | 见 [Resend × D1 实战](/articles/research/topics/resend-email-otp-cloudflare-d1) |
| 4 | 多用户笔记 / 协作 SaaS | **Supabase** | RLS + Realtime + Auth 一站式 |
| 5 | 移动端 + Web 共用后端 | **Supabase** | 官方 SDK 成熟；PostgREST 自动生成 API |
| 6 | 全球边缘 Agent + 工具状态 | **D1 + DO** | Agent 状态在 DO，配置/日志在 D1 |
| 7 | 复杂报表、BI、多表 JOIN | **Supabase** | Postgres 分析能力 |
| 8 | 用户上传头像 / 附件 | **Supabase Storage** 或 **R2** | 已 all-in CF 用 R2；已 all-in Supabase 用 Storage |
| 9 | 向量检索 RAG | **Supabase pgvector** 或 **Vectorize** | 数据已在哪边就跟哪边 |
| 10 | Next.js 部署 Vercel，数据库独立 | **Supabase** | Vercel Postgres 也贵；Supabase 生态默认匹配 |
| 11 | Next.js 部署 Cloudflare Pages | **D1** | `next-on-pages` / OpenNext 与 Worker binding 原生 |
| 12 | 从 0 学 SQL + 想快速看到 Dashboard | **Supabase** | Studio UI 友好；D1 只有 wrangler CLI + 控制台表格 |

**反模式（不要做）**：

- D1 做主库 + Supabase 做从库同步 — 个人项目运维地狱
- Worker 里塞 `@supabase/supabase-js` 用 `service_role` — 密钥在边缘函数环境，泄漏面大
- Supabase 不用 RLS 却让前端 `anon key` 直连 — AI 生成的 demo 最常见事故

## 五、Vibe Coding 实践：怎么跟 AI 说清楚

### 5.1 选型阶段：第一句必须钉死的约束

在打开 Cursor / Codex **之前**，用下面模板做「架构预审」——复制整段，只改括号部分：

```markdown
## 项目约束（必须遵守，不要擅自更换技术栈）
- 部署：[Cloudflare Pages + Workers | Vercel + Node | 其他]
- 数据库：[Cloudflare D1 (SQLite) | Supabase (PostgreSQL)] — 二选一，不要引入 Prisma 连第三方 Postgres
- 认证：[自建 JWT/cookie | Supabase Auth | 无登录]
- 用户规模：[单站长 | <1000 MAU | 多租户 SaaS]
- 是否需要 Realtime：[是/否]
- 是否需要文件上传：[是/否，若是用 R2 还是 Supabase Storage]

## 我要做的功能
（一句话描述，例如：邮箱验证码注册 + 会话 cookie）

## 请你先输出
1. 选型确认（如果你认为我上面的约束不合理，说明理由，但不要静默替换）
2. 表结构 DDL
3. API 路由列表
4. 鉴权流程序列图

确认后再写代码。
```

**关键**：要求 AI **先出 DDL 和路由表，再写代码**。跳过这步是 Vibe Coding 数据库事故的第一来源。

### 5.2 选 D1 时的提示语模板

```markdown
用 Cloudflare Workers + D1 实现（不要 Prisma，不要 Supabase）：

1. wrangler.toml 里已有 binding：`[[d1_databases]] binding = "DB" database_name = "xxx"`
2. 用 `wrangler d1 migrations` 管理 schema，迁移文件放 `migrations/xxxx.sql`
3. 查询只用 prepared statements：`env.DB.prepare('SELECT ...').bind(id).first()`
4. 密码用 PBKDF2 或 Web Crypto，不要 bcrypt（Workers 无原生 bcrypt）
5. Session 用 HMAC 签名的 HttpOnly cookie，参考 edge 安全实践
6. 每个 API route 是 Worker 的 `export default { async fetch(req, env) }` 或 Hono router

功能：（具体需求）
```

**加分项**（减少幻觉）：

- 贴上你现有的 `wrangler.toml` 片段
- 贴上已有 migration 文件的命名风格
- 明确说「参考本站 SyncBlog / 2aran.com 的 D1 模式」

### 5.3 选 Supabase 时的提示语模板

```markdown
用 Supabase 实现（PostgreSQL + supabase-js）：

1. 所有表必须启用 RLS，给出完整的 CREATE POLICY 语句
2. 前端只用 anon key；service_role 仅用于 Edge Function 或 server-only 环境
3. 用 `@supabase/ssr` 处理 Next.js App Router cookie session
4. Migration 用 Supabase CLI SQL 文件，不要混用 Prisma
5. 列出每个 API 操作对应的 policy：（谁能在什么条件下 SELECT/INSERT/UPDATE/DELETE）

功能：（具体需求）
```

**RLS 必须让 AI 写出来**。你说「加个 comments 表」，它会给表结构但漏 policy——这是 Supabase 路径最高危的幻觉。

### 5.4 迭代阶段：小步提示，不要「全部重写」

| 阶段 | 好的提示 | 坏的提示 |
|---|---|---|
| 加字段 | 「在 `users` 表加 `plan TEXT`，写 migration `0017_xxx.sql`，更新 Worker 的 register handler」 | 「优化一下数据库」 |
| 加接口 | 「新增 `GET /api/me`，从 cookie 读 session，查 D1 users 表，返回 `{id, email, isOwner}`」 | 「做个用户接口」 |
| 修 bug | 「`wrangler d1 execute --local` 报错：no such column，migration 顺序是 0015→0016，帮我 diff」 | 「数据库坏了修一下」 |
| 上生产 | 「生成 `wrangler d1 migrations apply xxx --remote` 检查清单，含回滚 SQL」 | 「部署到线上」 |

### 5.5 代码审查提示（生成后必跑一轮）

```markdown
审查刚才生成的数据库相关代码，按检查清单逐项标注通过/失败：

D1 清单：
- [ ] 有没有用 Prisma / pg / mysql2？
- [ ] SQL 是否全部 parameterized（无字符串拼接）？
- [ ] migration 是否可重复执行或幂等？
- [ ] secret 是否只通过 wrangler secret 注入？
- [ ] 密码/验证码是否只存 hash？

Supabase 清单：
- [ ] 每张表是否 ENABLE ROW LEVEL SECURITY？
- [ ] 是否有 policy 覆盖 SELECT/INSERT/UPDATE/DELETE？
- [ ] 前端代码里是否出现 service_role？
- [ ] anon key 是否只在前端做已 RLS 保护的操作？
```

### 5.6 常见 AI 幻觉清单（2026 实测高频）

| 幻觉 | 表现 | 纠正一句 |
|---|---|---|
| Prisma on D1 | `schema.prisma` + `datasource db { provider = "sqlite" }` 但仍要 Node 运行时 | 「D1 只用 wrangler + raw SQL，删掉 Prisma」 |
| bcrypt in Worker | `import bcrypt from 'bcrypt'` | 「改用 Web Crypto PBKDF2」 |
| Supabase in Worker | Worker 里 `createClient(url, service_role)` | 「Worker 走 D1；或 Supabase 只在 Next.js server component 调」 |
| 无 RLS 裸奔 | 只 `create table` 无 policy | 「补全 RLS policy，假设多租户」 |
| `JSON` 列当 Postgres 用 | D1 里写 `jsonb_set` | 「这是 SQLite，用 `json_set`」 |
| 环境变量 `.env` 提交 | 代码里硬编码 `SESSION_SECRET = 'dev'` | 「secret 走 wrangler secret / CF dashboard」 |
| migration 手改线上 | 「你手动去控制台改表」 | 「必须写 migration 文件，local 测过再 apply --remote」 |

## 六、两套最小可跑骨架（给 AI 的 few-shot）

### 6.1 D1：单表 CRUD（Worker + Hono）

```typescript
// src/index.ts — 给 AI 的参考骨架，不是让你复制粘贴的库
import { Hono } from 'hono'

type Bindings = { DB: D1Database; SESSION_SECRET: string }
const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/items', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, title, created_at FROM items ORDER BY created_at DESC LIMIT 50'
  ).all()
  return c.json(results)
})

app.post('/api/items', async (c) => {
  const { title } = await c.req.json<{ title: string }>()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO items (id, title, created_at) VALUES (?, ?, ?)'
  ).bind(id, title, Date.now()).run()
  return c.json({ id }, 201)
})

export default app
```

```sql
-- migrations/0001_items.sql
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

### 6.2 Supabase：带 RLS 的 comments 表

```sql
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments_select_public"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = user_id);
```

提示语里贴上这类骨架，AI 偏离概率会明显下降。

## 七、争议与风险

1. **「D1 是玩具」论**：2024 年早期 beta 确实坑多；2026 年对于个人站、边缘 Agent 配置层、轻量 SaaS 已可生产。瓶颈在 10 GB 和复杂分析，不在「能不能用」。
2. **「Supabase 锁定」论**：数据层可迁；Auth 用户迁移麻烦。比 Firebase 好迁，比裸 Postgres 差迁。
3. **「两个都用」论**：除非有明确分工（如 Supabase 做 Auth 源、D1 做边缘缓存副本），否则个人项目双栈 = 双倍账单 + 双倍幻觉。
4. **AI 放大安全债**：RLS 漏写、SQL 拼接、密钥进前端——在 Vibe Coding 里发生频率比手写高一个数量级，必须用第五节审查清单兜底。

## 八、个人结论

**一句话定性**：D1 是「边缘一体、轻量、跟着 Cloudflare 走」；Supabase 是「Postgres 全栈、多用户、跟着数据平台走」。不是谁替代谁，是**你的部署锚点在哪**。

**是否值得跟进**：

| 你现在的状态 | 建议 |
|---|---|
| 已 all-in Cloudflare（本站、SyncBlog） | 继续 D1，别被 AI 拐去 Supabase |
| 新开多用户 SaaS，部署无所谓 | 先 Supabase，省 Auth/RLS 时间 |
| 边缘 Agent / MCP server | D1 + DO，见边缘 Agent 调研 |
| 还在学全栈 | 两个都搭一个 todo demo，**重点练提示语模板第五节** |

**下一步行动**（本站可落地）：

1. 把第五节「审查清单」做成 Cursor rule（`.cursor/rules/d1-supabase.md`），新对话自动注入
2. 在 Agent Ops 控制台加一个「schema diff」小工具：对比 local / remote D1 migration 状态
3. 若未来开多读者会员，再评估 Supabase Auth 迁移路径——当前 D1 + `audience` 三档仍够用

## 九、信息来源

- [Cloudflare D1 官方文档](https://developers.cloudflare.com/d1/)
- [Cloudflare D1 Migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare Workers Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)
- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- 站内调研：[Resend 邮箱验证码 × Cloudflare D1 实战](/articles/research/topics/resend-email-otp-cloudflare-d1)
- 站内调研：[Cloudflare 边缘 Agent 开发实战](/articles/research/topics/cloudflare-edge-agents-practice)
- 站内调研：[2aran.com 站长鉴权体系实践](/articles/research/topics/2aran-owner-auth-practice)
- 站内调研：[Vibe Coding 判断力结构](/articles/research/topics/vibe-coding-judgment-structure)
- 站内调研：[本地 × 云端开发工具编排](/articles/research/topics/local-cloud-dev-tooling-orchestration)
