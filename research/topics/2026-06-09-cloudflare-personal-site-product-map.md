---
title: Cloudflare 开发者平台选型地图：2aran.com 个人站该用哪个、别用哪个
category: topics
date: 2026-06-09
tags: [Cloudflare, Pages, D1, R2, KV, Workers, 个人站, 2aran.com, 架构选型, S3, 对象存储]
summary: 对照 tuaran-home-page（2aran.com）的实际代码与 wrangler 配置，梳理 Cloudflare 开发者平台 20+ 产品在本站的适用性：已用 Pages + Functions + D1；R2 暂不需要；KV / DO / Workers AI 等大多可跳过。附数据流图、产品判定表、D1/R2/KV 分工与 R2 触发规则。
tldr: 继续 Pages + D1 + Git 静态资源即可。R2 不是必需品——只有出现用户上传、大文件、不 deploy 发内容时再绑。D1 存结构化数据和小密文；R2（S3 兼容）存 blob；KV 做缓存——个人站现阶段 D1 已够，不必为「全家桶」加复杂度。
topic_type: tech
assistance: cursor
model: composer
pv: 0
---

> **判定口径**：**已用** = wrangler / 代码里已接入；**以后再说** = 有明确触发条件再加；**暂不需要** = 加了只会增复杂度。

## 一、结论速览

2aran.com 当前在 Cloudflare 上的**最小有效栈**：

```text
Pages + Functions + D1 + Git 内容 + Resend + GitHub OAuth
```

**核心判断**：

- **继续用**：Pages、Workers/Functions、D1
- **以后再说**：R2、Agents SDK、Turnstile
- **暂不需要**：KV、Durable Objects、Queues、Workers AI、Vectorize、Hyperdrive、Images、Stream、Tunnel 等

| 判定 | 数量 | 代表产品 |
|---|---:|---|
| 已用 | 3 | Pages、Functions、D1 |
| 以后再说 | 3 | R2、Agents SDK、Turnstile |
| 暂不需要 | 14+ | KV、DO、Workers AI、Vectorize… |

---

## 二、站点现状（对照代码）

| 维度 | 当前方案 |
|---|---|
| 部署 | Cloudflare Pages + Functions（`next-on-pages`） |
| 动态数据 | D1 binding `DB`：留言、评论、点赞、短链、邮箱注册、PV、加密分享等 |
| 内容与静态资源 | Git + `public/`（约 7MB、54 个文件） |
| AI 体验 | 浏览器 WebGPU（`/web-llm`），不进 Cloudflare AI |
| 对象存储 | **未绑定 R2**（`wrangler.toml` 只有 `[[d1_databases]]`） |

调研文、文章正文走 **Git Markdown**（`research/`），发布 = deploy，不是后台 CMS。

---

## 三、数据流（你现在这条链路）

<figure class="research-inline-diagram">
<svg viewBox="0 0 760 300" role="img" aria-label="2aran.com 在 Cloudflare 上的数据流">
<text x="0" y="16" font-size="11" opacity="0.65">架构快照 · tuaran-home-page · 2026-06</text>
<rect x="20" y="40" width="120" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="80" y="68" text-anchor="middle" font-size="13" font-weight="600">访客</text>
<text x="80" y="84" text-anchor="middle" font-size="11" opacity="0.75">浏览器</text>
<rect x="180" y="40" width="140" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="250" y="68" text-anchor="middle" font-size="13" font-weight="600">Cloudflare CDN</text>
<text x="250" y="84" text-anchor="middle" font-size="11" opacity="0.75">Pages 边缘</text>
<rect x="360" y="28" width="160" height="80" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="440" y="58" text-anchor="middle" font-size="13" font-weight="600">Pages Functions</text>
<text x="440" y="78" text-anchor="middle" font-size="11" opacity="0.75">Next.js API Routes</text>
<rect x="560" y="40" width="160" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="640" y="68" text-anchor="middle" font-size="13" font-weight="600">D1 · DB</text>
<text x="640" y="84" text-anchor="middle" font-size="11" opacity="0.75">SQLite 边缘库</text>
<rect x="180" y="130" width="140" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="250" y="158" text-anchor="middle" font-size="13" font-weight="600">Git 构建产物</text>
<text x="250" y="174" text-anchor="middle" font-size="11" opacity="0.75">public/ + SSR</text>
<rect x="360" y="130" width="160" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="440" y="158" text-anchor="middle" font-size="13" font-weight="600">Resend</text>
<text x="440" y="174" text-anchor="middle" font-size="11" opacity="0.75">邮箱验证码</text>
<rect x="560" y="130" width="160" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="640" y="158" text-anchor="middle" font-size="13" font-weight="600">GitHub OAuth</text>
<text x="640" y="174" text-anchor="middle" font-size="11" opacity="0.75">登录身份</text>
<rect x="180" y="210" width="300" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
<text x="330" y="238" text-anchor="middle" font-size="13" font-weight="600">浏览器 WebGPU</text>
<text x="330" y="254" text-anchor="middle" font-size="11" opacity="0.75">/web-llm 本地推理</text>
<rect x="520" y="210" width="200" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.7"/>
<text x="620" y="238" text-anchor="middle" font-size="13" font-weight="600">R2</text>
<text x="620" y="254" text-anchor="middle" font-size="11" opacity="0.75">未绑定</text>
<line x1="140" y1="68" x2="180" y2="68" stroke="currentColor" stroke-width="1.5" marker-end="url(#cf-arrow)"/>
<line x1="320" y1="68" x2="360" y2="68" stroke="currentColor" stroke-width="1.5"/>
<line x1="520" y1="68" x2="560" y2="68" stroke="currentColor" stroke-width="1.5"/>
<line x1="250" y1="96" x2="250" y2="130" stroke="currentColor" stroke-width="1.5"/>
<line x1="440" y1="108" x2="440" y2="130" stroke="currentColor" stroke-width="1.5"/>
<line x1="440" y1="186" x2="440" y2="210" stroke="currentColor" stroke-width="1.5"/>
<line x1="640" y1="96" x2="640" y2="130" stroke="currentColor" stroke-width="1.5"/>
<defs>
<marker id="cf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
<path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
</marker>
</defs>
<figcaption>访客请求经 Pages CDN 分发；动态写操作进 Functions → D1；静态资源来自 Git 构建；R2 虚线框表示尚未接入。</figcaption>
</figure>

---

## 四、核心三层：继续用

| 层级 | 产品 | 职责 | 判定 | 备注 |
|---|---|---|---|---|
| 入口 & 托管 | **Pages** | Next.js SSR、静态 CDN、Functions 宿主 | 已用 | `wrangler.toml` 已配置 |
| 边缘计算 | **Workers / Functions** | API、OAuth、Edge Session | 已用 | `app/api/*` 跑在边缘 |
| 关系型数据 | **D1** | 结构化数据 + 小密文 | 已用 | binding = `DB`，离 10GB 上限还很远 |

---

## 五、存储 & 数据类产品

| 产品 | 类型 | 个人站场景 | 判定 |
|---|---|---|---|
| **D1** | SQL（SQLite） | 留言、评论、点赞、短链、邮箱注册、PV | 已用 |
| **R2** | 对象存储（S3 兼容） | 用户上传、音频、大附件、动态媒体库 | 以后再说 |
| **KV** | 键值缓存 | 全站配置、feature flag | 暂不需要 |
| **Durable Objects** | 强一致有状态 | 实时聊天、WebSocket Agent | 暂不需要 |
| **Queues** | 异步队列 | 批量邮件、异步转码 | 暂不需要 |
| **Hyperdrive** | 外部 Postgres 加速 | 已有 D1，无需外部 DB | 暂不需要 |

### D1 vs R2 vs KV：怎么选

| | 存什么 | 本站情况 |
|--|--------|----------|
| **D1** | 行/列、SQL、小文本密文 | 已在用；**别放**图片、视频、大 PDF |
| **R2** | 文件 blob（S3 兼容 API） | 没上传 API，先别绑；出流量免费是加分项 |
| **KV** | 全球键值、最终一致 | D1 已够轻；除非读极多且要省 D1 读次数 |

**和 AWS 对照**：**S3** = 亚马逊对象存储行业标准；**R2** = S3 兼容 + 免 egress。本站静态图在 `public/`，动态数据在 D1——都不属于 S3/R2 的典型用法。

**命名梗（顺带）**：**D1** = Database 1，Cloudflare 第一条 SQL 产品线；**R2** 官方玩 backronym（Really Requestable、Ridiculously Reliable…），行业里也常当作 S3 的对应物。

---

## 六、AI & Agent 类产品

| 产品 | 职责 | 判定 | 原因 |
|---|---|---|---|
| Workers AI | 边缘推理 Llama / Qwen 等 | 暂不需要 | `/web-llm` 已在浏览器本地跑模型 |
| AI Gateway | 多模型路由、缓存、限流 | 暂不需要 | 无服务端 LLM 代理需求 |
| Vectorize | 向量检索 / RAG | 暂不需要 | 调研文走 Git Markdown |
| Agents SDK + DO | 有状态 Agent、MCP、WebSocket | 以后再说 | 若做服务端 Agent 再考虑 |

---

## 七、平台 & 周边服务（大多可跳过）

| 产品 | 职责 | 判定 | 说明 |
|---|---|---|---|
| Turnstile | 人机验证 | 以后再说 | 已有 D1 限流；垃圾注册增多时可加 |
| Email Routing | 域名邮件转发 | 暂不需要 | 验证码走 Resend |
| Images | 图片变换 CDN | 暂不需要 | `public/` 很小；调研配图走 Unsplash |
| Stream | 视频托管 | 暂不需要 | 无视频业务 |
| Tunnel | 内网穿透 | 暂不需要 | 站点已公网托管 |
| Browser Rendering | Headless Chrome | 暂不需要 | 无爬虫 / 截图自动化 |
| Workflows | 长任务编排 | 暂不需要 | 无多步持久工作流 |
| Analytics Engine | 时序分析 | 暂不需要 | research PV 已存 D1 |

---

## 八、什么时候该加 R2？（触发规则）

| 触发信号 | 建议动作 |
|---|---|
| 评论 / 留言要附图、用户上传头像 | 加 R2；D1 只存元数据（key、owner、时间） |
| 语音任务存 mp3/wav 原音 | R2 存音频；D1 存转写文本和索引 |
| 调研文改成后台发布、不 deploy 就更新 | R2 存 Markdown + 图片；可选 KV 做列表缓存 |
| 要做服务端 Chat Agent / MCP | Agents SDK + Durable Objects；R2 可选存附件 |
| D1 单条密文 > 几百 KB | 大 blob 迁 R2，D1 留 slug + envelope 元数据 |
| 垃圾注册 / 刷接口明显增多 | Turnstile + 现有 D1 限流双保险 |

推荐分工：

```text
D1  →  元数据（谁、何时、文件名、R2 key）
R2  →  实际文件
```

---

## 九、推荐最小栈 vs 刻意不加

**保留（2026 · 个人站）**：

`Pages` · `Functions` · `D1` · `Git 内容` · `Resend` · `GitHub OAuth`

**刻意不加**（除非上表触发规则命中）：

`R2` · `KV` · `Durable Objects` · `Workers AI` · `Vectorize` · `Queues` · `Hyperdrive`

---

## 十、和本站其他调研的关系

- [Cloudflare Workers + D1 vs Supabase](/articles/research/topics/cloudflare-d1-vs-supabase) — 平台选型（要不要迁 Supabase）
- [Resend 邮箱 OTP + Cloudflare D1](/articles/research/topics/resend-email-otp-cloudflare-d1) — 本站 Auth 落地
- [2aran.com 私有功能鉴权](/articles/research/topics/2aran-owner-auth-practice) — owner session 与菜单权限
- [Next.js on Cloudflare 性能优化](/articles/research/topics/nextjs-cloudflare-performance-optimization) — Pages 构建与缓存

本篇聚焦 **「Cloudflare 全家桶里个人站该接哪些 binding」**，不重复 D1 vs Supabase 的全栈对比。

---

## 参考

- [Cloudflare D1 发布公告](https://blog.cloudflare.com/introducing-d1/)
- [Cloudflare R2 发布公告](https://blog.cloudflare.com/introducing-r2-object-storage/)
- [Cloudflare 开发者文档](https://developers.cloudflare.com/)
- 本站 `wrangler.toml`、`ai-context/architecture.md`（2026-06 快照）
