---
title: Cloudflare 边缘智能体：Workers、Durable Objects 与 Agents SDK
category: topics
topic_type: tech
tech_type: agents_automation
content_type: analysis
subjects: [web_cloud]
date: 2026-06-03
updated: 2026-11-04
tags: [Cloudflare, Workers, Agents SDK, Durable Objects, Workflows, Vectorize, AI Gateway, MCP, 边缘计算, Agent]
summary: 把 Workers、Durable Objects、Workflows、Vectorize、AI Gateway 与 Agents SDK 的公开能力对齐到「带状态、可恢复、可调工具」的边缘 Agent 场景；区分平台事实、成本估算与架构取舍。
tldr: Cloudflare 把 Durable Objects 当 actor、Workflows 当可恢复长任务、Agents SDK 当封装层，再叠 AI Gateway 做模型路由——适合轻量、长尾、全球分布的 Agent。CPU 默认 30s 可调到 5 分钟；「唯一全栈」之类营销表述降级为对照表判断。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
---

## 结论

1. 在 Cloudflare 上跑边缘 Agent，公开可拼装的核心零件是：Workers（入口）、Durable Objects（有状态 actor）、Workflows（可 checkpoint 的长任务）、AI Gateway / Workers AI（模型路由与推理）、Vectorize / D1 / R2（检索与存储），上层可用官方 Agents SDK（`agents` 包）封装。
2. 对「全球分布的轻量会话型 Agent / MCP server hosting」这类场景，上述组合学习曲线相对短，尤其适合已经在 Cloudflare 上托管站点的团队。
3. **已过时断言需作废**：原稿「付费 Workers 单请求 CPU 30 秒上限不可破」不符合现行文档。Workers Paid 的 CPU 默认 30 秒，**可配置到 5 分钟**；Workflows 每步 wall time 无硬上限，但每步仍受配置的 CPU 限额约束。[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)、[Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)
4. 「目前唯一把全球分布 + 持久状态 + 模型路由 + 向量检索 + MCP 凑齐的边缘平台」属于营销式唯一性判断，缺乏可证伪的全市场审计；本文改为对照表 + 适用边界。
5. 基础设施费相对模型 API 费通常很小；任何美元成本表都必须标成**假设下的估算**，不能写成账单事实。
6. 深度绑定 Durable Objects / Workflows / Vectorize 私有 API 意味着迁出成本高——这是取舍，不是缺陷指责。

## 事实层：零件与公开限制

### 网络与入口

Cloudflare 公开网络页与 2026 年新闻稿称其网络覆盖 **300+ / 340+ 城市**量级（live 城市列表会变；2026-10 新闻稿写 more than 340 cities）。边缘就近是平台卖点，但具体 RTT 取决于用户网络与 PoP 可达性，本文不编造「冷启动 < 5ms」的通用保证。[network](https://www.cloudflare.com/network/)

### 平台零件（角色）

| 产品 | 在 Agent 架构里的角色 | 公开限制要点（核验时点 2026-11） |
|---|---|---|
| Workers | HTTP/WebSocket 入口、无状态计算 | Free：CPU 10ms；Paid：默认 30s，可调至 5 min；内存 128MB |
| Durable Objects | 每用户/会话一个 actor，承载状态 | 单对象有位置亲和；跨区访问有延迟代价 |
| Workflows | 多步长任务、重试与持久状态 | 每步 CPU 同 Workers 配置；wall time per step unlimited；实例状态有上限 |
| Workers AI | 边缘侧开源模型推理 | 模型目录有限，大模型常走外部 API |
| AI Gateway | 上游模型统一入口、缓存、可观测 | 多家上游接入（以文档列表为准） |
| Vectorize | 向量检索 | 以产品 limits 页为准，勿沿用过期「单索引 500 万」口头数 |
| D1 / R2 / Queues / Browser Rendering / Cron | 关系数据、对象、异步、浏览、定时 | 各有独立配额 |

文档入口：[Agents](https://developers.cloudflare.com/agents/)、[Durable Objects](https://developers.cloudflare.com/durable-objects/)、[Workflows](https://developers.cloudflare.com/workflows/)、[AI Gateway](https://developers.cloudflare.com/ai-gateway/)、[Vectorize](https://developers.cloudflare.com/vectorize/)。

### Agents SDK

Cloudflare 维护 `cloudflare/agents` 与 Agents 文档，把 Durable Objects、实时连接与 agent 生命周期封装成 SDK。API 仍在快速演进（历史上出现过 state 存储形态变化、Workflows 集成、新 harness）。生产代码应**锁版本**并对照当前文档，不要把 2026-06 的示例骨架当成永不变更的合同。

### 对照表（工程判断，非排行榜）

| 平台组合 | 状态 | 全球边缘 | 持久执行 | 模型路由 |
|---|---|---|---|---|
| Cloudflare Workers + DO + Workflows + AI Gateway | DO | 全球 Anycast 网络 | Workflows | AI Gateway |
| Vercel + 外部队列/DB | 需自管或外接 | Edge 能力因产品而异 | 常外接 | AI SDK 转发 |
| AWS Lambda + Step Functions 等 | 自管数据层 | 区域为主 | Step Functions 等 | Bedrock 等 |
| 自建 K8s + Temporal | 自管 | 自管 | Temporal | 自管 |

「谁更适合」取决于延迟目标、团队运维能力与锁定接受度，而不是单一「唯一全栈」口号。

## 结构：推荐拼法与代码级注意

### 推荐拓扑（示意）

```
用户 ─HTTPS/WS─ Workers(Hono 等)
                 │ idFromName(userId)
                 ▼
         Durable Object: AgentSession
                 ├─ AI Gateway → 外部/Workers AI
                 ├─ Vectorize / D1 / R2
                 ├─ Workflows（长任务）
                 └─ Browser Rendering / 外部 MCP
```

心法：一个会话键对应一个 DO，利用单线程 actor 语义降低「同一用户并发写状态」的复杂度。DO 物化位置有亲和性，用户地理位置大变时可能出现跨区延迟——可用业务键分片缓解，无法魔法消除物理距离。

### 长任务

不要用单次 Worker 硬扛「爬一百个网页再写报告」。用 Workflows 把工作切成 `step.do`，依赖平台 checkpoint 与重试。每步仍要满足配置的 CPU 限额；网络等待不计入 CPU。

### MCP server hosting

官方 Agents / templates 路径提供把 Worker 暴露为 MCP server 的模板与文档。是否「最便宜」取决于你的调用量与是否已有 Cloudflare 账单——把它当成**可行且常见的部署面**，而不是未经比价的绝对最低价断言。

### 成本（估算，附假设）

下列数字是**示例演算**，不是 Cloudflare 账单摘录：

假设：日活 1 万、人均 20 轮、模型走 Anthropic、基础设施用 Workers Paid + DO + Vectorize + D1。

- Workers / DO / Vectorize / D1 月费：往往在数十美元量级（强烈依赖活跃时长与查询次数；DO 按活跃时长等维度计费，预算前必须打开定价页自算）。
- 模型 API：通常占绝对大头；原稿 ~$48,000/月 来自「约 120 亿 input + 40 亿 output token」量级假设——**未在本轮复核 token 单价与用量公式，整行降级为「模型费可能比基础设施高两个数量级」的定性判断**，不再给出伪精确美元数。

AI Gateway 缓存可能降低重复 prompt 的上游费用；具体命中率取决于你的流量形状。

## 风险与合规提示

1. **平台锁定**：DO / Workflows / Vectorize 迁出 ≈ 重写状态与编排层。
2. **中国大陆访问**：未备案站点通常走海外 PoP；可达性与延迟受网络环境波动，不适合强 SLA 的国内 toC 低延迟 Agent。
3. **Node 兼容**：`nodejs_compat` 覆盖面有限；依赖 `child_process`、完整 Puppeteer、部分原生模块的包需要替代方案（Browser Rendering、Images 等）。
4. **可观测性**：Logpush / Tail / AI Gateway 分析可用，但成熟度观感因团队原工具链而异。
5. **第三方「谁在用」案例**：原稿列举的 Anthropic Skills marketplace / Block / Coinbase 等，本轮未逐条找到可稳定引用的一手部署声明；**降级为传闻级，不写入事实层**。需要案例时另开带出处的补丁。

## 外部判断

若本站已在 Cloudflare 上：用 Agents SDK 做一个只读 MCP / 站内助手 demo，是验证路径最短的动作。重型批处理、本地 GPU、强国内 SLA 的任务，一开始就押 Cloudflare 全家桶并不划算。CPU 可调到 5 分钟缓解了「任何稍长推理都必须拆 Workflow」的绝对说法，但长任务仍应以 Workflows 为默认编排，而不是把同步请求拉到上限碰运气。

## 信息来源

- [Cloudflare Agents docs](https://developers.cloudflare.com/agents/)
- [Agents SDK GitHub](https://github.com/cloudflare/agents)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [Vectorize](https://developers.cloudflare.com/vectorize/)
- [Cloudflare network](https://www.cloudflare.com/network/)
- [Press: 10M developers / 340+ cities (2026-10)](https://www.cloudflare.com/press/press-releases/2026/more-than-10-million-developers-are-building-on-cloudflare/)
- [Blog: Build AI agents on Cloudflare](https://blog.cloudflare.com/build-ai-agents-on-cloudflare/)

## 持续验证

- Agents SDK 主版本与推荐模板路径仍在变；实施前核对 docs 与 npm 版本。
- Vectorize / D1 / DO 定价与硬限额以产品 pricing + limits 页为准，本文不锁死数值。
- Workflows GA 以后的调试体验与本地 step-through 能力需用当时 Wrangler 实测，社区吐槽不能当现行缺陷证明。
- 「MCP 默认部署在 Workers」若要写成产业事实，需要补充一手文档或公告链接。
