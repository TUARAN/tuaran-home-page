---
title: Cloudflare D1 与 Supabase：场景边界，而非功能清单
category: topics
topic_type: tech
tech_type: web_cloud
content_type: analysis
date: 2026-06-09
updated: 2026-11-04
tags: [Cloudflare D1, Supabase, SQLite, Postgres, 边缘数据库, BaaS]
summary: 以 2026-11-04 官方文档核对：D1 是 Workers 同区 SQLite；Supabase 是托管 Postgres + Auth/Realtime/Storage 平台。选型看数据模型、一致性与周边能力，不看「谁功能更多」。
tldr: 边缘读写、会话/配置/队列旁路、与 Workers 同命运 → D1。关系复杂、RLS、Realtime、需要成熟 Postgres 生态 → Supabase。二者可并存，不是互斥替换。
subjects: [web_cloud]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **D1** 是 Cloudflare 面向 Workers 的 **SQLite** 数据库：同区低延迟、SQL、Time Travel；不是完整 BaaS。
2. **Supabase** 是以 **Postgres** 为核心的平台：Auth、Realtime、Storage、Edge Functions、客户端 SDK 与 RLS 是产品一体。
3. **选型主轴**是场景边界：数据放在哪、谁连、一致性怎么定义、缺哪块周边能力——不是「SQLite vs Postgres 谁更强」的功能表。
4. **可并存**：边缘热路径用 D1；账户、订阅、复杂查询与 Realtime 用 Supabase（或其它 Postgres），用异步同步或 API 网关衔接。

## 二、事实层（2026-11-04）

### 2.1 D1 现行公开额度

来源：[D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)、[D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)（Last updated Oct 30, 2026）

| 项目 | Free | Workers Paid |
|---|---|---|
| 行读 | 500 万/天 | 含 2,500 万/月，超额约 $0.001/百万 |
| 行写 | 100,000/天 | 含 5,000 万/月，超额约 $1.00/百万 |
| 账户存储 | 合计 5 GB | 含 5 GB，超额约 $0.75/GB-month |
| 数据库数量 | 10 | 首 100,000 含入，超出约 $0.10/库/月 |
| 单库最大 | **500 MB** | **10 GB** |
| Time Travel | 7 天 | 30 天 |
| SQL 特性 | SQLite 子集；无完整 Postgres 扩展/RLS 产品层 | 同左 |

文档强调：D1 与 Worker 同区部署时延迟最低；跨区或从浏览器直连不是默认形态。

### 2.2 Supabase 现行公开套餐（org 计费）

来源：[supabase.com/pricing](https://supabase.com/pricing)

| 项目 | Free | Pro（公开起价） |
|---|---|---|
| 组织计费 | 免费档 | 从约 **$25**/月起（含计算额度表述以当日页为准） |
| 数据库 | Postgres；Free 档常见 **500 MB** 库 | 更大磁盘与计算，按计划升级 |
| 项目 | Free 档文档写 **2** 个活跃项目量级 | 更多 |
| 暂停策略 | Free 项目闲置约 **1 周**可暂停（需打开当日 FAQ 确认细则） | Pro 不因闲置自动暂停（以当日页为准） |
| 周边 | Auth、Realtime、Storage、Edge Functions、客户端 | 同产品线，额度随计划升高 |
| 安全模型 | Postgres **RLS** + 策略是一等公民 | 同左 |

标价与「含多少 MAU / 存储」会改；上表只固定「Postgres 平台 + org 计费 + Free 有暂停」这三条结构事实。

### 2.3 能力对照（只列选型相关）

| 维度 | D1 | Supabase |
|---|---|---|
| 引擎 | SQLite | Postgres |
| 典型调用方 | Workers / Pages Functions | 浏览器 SDK、服务端、Edge Functions |
| Auth / Realtime / Storage | 需自建或接其它服务 | 产品内建 |
| 行级安全产品化 | 无等同 RLS 控制台体验 | RLS 为核心 |
| 备份叙事 | Time Travel（点时间恢复窗口见上表） | 计划内备份 / PITR（以计划页为准） |
| 计费耦合 | Workers 平台账户 | Supabase org |

## 三、结构：场景边界

| 场景 | 更贴哪边 | 理由 |
|---|---|---|
| Worker 内会话、feature flag、轻量配置 | D1 | 同区、SQL、少运维面 |
| 边缘计数器、任务状态、队列旁路表 | D1 | 写路径简单；注意 Free 日写上限 |
| 多表关系、复杂 join、报表 | Supabase / Postgres | 引擎与工具链成熟 |
| 登录态、邮箱 OTP、社交登录要开箱 | Supabase Auth（或专用 Auth） | D1 只存你自己写的表 |
| 协作编辑、在线状态、频道推送 | Supabase Realtime（或其它） | D1 无对等产品 |
| 大文件与 CDN 对象 | R2 + 元数据可在 D1；或 Supabase Storage | 别用 D1 存 blob |
| 强合规、审计、企业合同 DB | 单独评估托管 Postgres / 企业合同 | 两边公开 Free/Pro 都不是合同终点 |

**反模式**：因为「都在 Cloudflare 账号里」就把用户主库硬塞进 D1；或因为「Supabase 什么都有」就把每次边缘读请求打回远端 Postgres。

## 四、外部研判

D1 解决的是「Worker 旁边要有一个诚实的小库」；Supabase 解决的是「应用要有一个带 Auth/Realtime 的 Postgres 后端」。把两者写成胜负表，会逼读者在错误维度上做选择。多数中型产品最终是**分层**：边缘状态近计算，系统真源近关系与身份。迁移成本主要在应用层假设（事务边界、RLS、Realtime 订阅），不在 SQL 方言本身。

## 五、信息来源与持续验证

复核截至 **2026-11-04（Asia/Shanghai）**。

- [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 文档入口](https://developers.cloudflare.com/d1/)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase 文档](https://supabase.com/docs)

### 持续验证

- D1 单库上限（Free 500 MB / Paid 10 GB）与行读计费定义若改，第二节表整表替换。
- Supabase Free 暂停天数、Pro 起价与「含多少」以当日 pricing 页为准；本稿不固化未截图的 MAU 细项。
