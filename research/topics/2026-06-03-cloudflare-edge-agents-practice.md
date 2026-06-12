---
title: 基于 Cloudflare 的边缘智能体开发实战
category: topics
topic_type: tech
date: 2026-06-03
tags: [Cloudflare, Workers, Agents SDK, Durable Objects, Workflows, Vectorize, AI Gateway, MCP, 边缘计算, Agent]
summary: 把 Workers + Durable Objects + Workflows + Vectorize + AI Gateway 这一套拼起来，Cloudflare 已经能在 300 个城市的边缘节点跑「带状态、能恢复、能调工具」的 Agent；本文从架构、代码、成本、坑四个角度写一份可落地的实战指南。
tldr: Cloudflare 把「带状态的 Agent」做成了一等公民——Durable Objects 当 actor、Workflows 当 saga、Agents SDK 当壳子，配合 AI Gateway 缓存/路由模型请求，是目前唯一把「全球分布 + 持久状态 + 模型路由 + 向量检索 + MCP server」凑齐的边缘平台。代价是：被锁定在 Workers runtime（Node 兼容是补丁不是原生）、CPU 时间硬上限 30 秒/请求、跨大区延迟仍受 Durable Object 单点位置影响。结论：跑「轻量、长尾、全球分布」的 Agent（客服、监控、个人助理、MCP server hosting）非常香；跑「单次推理重、需要本地 GPU 的训练任务」不要碰。
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

> 这篇调研写给两类人：
> 1) 已经在用 Vercel / AWS Lambda / 自建 K8s 跑 Agent，被冷启动、状态管理、跨区延迟折磨，想看看 Cloudflare 的方案是不是真的不一样；
> 2) 已经在 Cloudflare 上跑静态站，听说 Workers AI / Agents SDK 出了，想知道把 Agent 搬过来值不值。
>
> 不写「Cloudflare Workers 是什么」的科普——那部分自行查官方文档。本文聚焦**把一个 Agent 真的跑在 Cloudflare 边缘上**这件事，从架构选型到代码骨架到避坑清单。

## 一、是什么

**「Cloudflare 边缘智能体」** 在 2026 年的语境下，是指把一个具备以下特征的 Agent 跑在 Cloudflare 全球 300+ 个 PoP 节点上：

- **带状态**：能记住对话历史、任务进度、用户偏好，跨多次请求保持上下文
- **能调工具**：可以读写数据库、调外部 API、执行浏览器操作、调用其他 Agent
- **可恢复**：单次任务可能跑几分钟到几小时，中途宕机/超时后能从上一个 checkpoint 继续
- **多模型路由**：根据任务类型在 Workers AI 本地模型、OpenAI、Anthropic、DeepSeek 之间分发
- **边缘就近**：请求落在离用户最近的节点，冷启动 < 5ms

Cloudflare 在 2024 年底到 2025 年中陆续补齐了这一套的几乎所有零件，2025 年 4 月正式开源 **Agents SDK** (`agents` npm 包)，把「带状态的 Agent」做成了 Workers 生态里的一等公民——这是它和 Vercel AI SDK / LangChain JS 最本质的区别：后两者是**纯客户端框架**，状态自己想办法存；Agents SDK 直接绑定 Durable Objects 当 actor 容器。

## 二、为什么重要

边缘跑 Agent，业内卷了两年，真正能凑齐「带状态 + 全球分布 + 模型路由 + 持久执行」四件套的玩家不多：

| 平台 | 状态 | 全球分布 | 持久执行 | 模型路由 | 评价 |
|---|---|---|---|---|---|
| **Cloudflare** | Durable Objects | ✅ 300+ PoP | Workflows | AI Gateway | 唯一全栈 |
| Vercel | KV / Redis | 部分 Edge | ❌（要外接 Inngest/Temporal） | AI SDK 转发 | 偏前端 |
| AWS Lambda + Step Functions | DynamoDB | ❌ 区域级 | Step Functions | Bedrock | 重、贵、延迟高 |
| Deno Deploy | KV | ✅ 全球 | ❌ | ❌ | 缺持久执行 |
| 自建 K8s + Temporal | 自管 | 自管 | Temporal | 自管 | 上限高，运维重 |

对「全球分布的轻量 Agent」（客服 bot、MCP server、监控巡检、个人助理）这个细分场景，**Cloudflare 是目前唯一一个不需要拼多家厂商就能跑起来的平台**。这也是为什么 Anthropic 自己的 Claude Skills marketplace、Block (Square)、Stripe Apps 等都把 MCP server 默认部署在 Workers 上。

## 三、关键玩家与生态

### 3.1 Cloudflare 官方零件清单

| 产品 | 在 Agent 架构里扮演 | 关键限制 |
|---|---|---|
| **Workers** | 请求入口、无状态计算 | 单请求 CPU 30s（付费）/ 10ms（免费），内存 128MB |
| **Durable Objects** | Agent 实例 = 一个 DO，承载对话状态、工具调用上下文 | 单 DO 全球只在一个 region 物化，跨区访问有延迟 |
| **Workflows** | 长任务持久执行，自动 checkpoint，宕机可恢复 | 2025-Q4 才 GA，单步 30s 仍受 Worker 限制 |
| **Workers AI** | 本地推理 Llama 3/Qwen2.5/Stable Diffusion 等 | 模型有限，大模型走 AI Gateway |
| **AI Gateway** | 模型路由、缓存、限流、可观测 | 多家上游（OpenAI/Anthropic/Workers AI/Replicate/HuggingFace）统一接入 |
| **Vectorize** | 向量数据库 | 单索引 500 万向量，1536 维 |
| **D1** | SQLite 边缘数据库 | 单库 10GB，读写分离 |
| **R2** | 对象存储（无 egress 费） | 文档、图片、模型权重存这 |
| **Queues** | 异步任务队列 | 解耦 Agent 调用 |
| **Browser Rendering** | Headless Chrome | 让 Agent 能爬网页、截图、PDF |
| **Cron Triggers** | 定时调度 | 让 Agent 定时自驱（巡检/日报） |

### 3.2 上层框架与第三方

- **Agents SDK** (`npm i agents`)：Cloudflare 自家，2025-04 开源，封装了 DO + WebSocket + MCP server 一条龙。GitHub `cloudflare/agents`。
- **mcp-remote / workers-mcp**：把任意 Worker 暴露成 MCP server，让 Claude Desktop / Cursor / Codex 等客户端直接接入。
- **Hono**：在 Workers 上写 HTTP 路由的事实标准，Agents SDK 的 HTTP 层就是 Hono。
- **LangChain JS / LlamaIndex.ts**：能跑，但和 Agents SDK 的状态模型有重叠，二选一。
- **PartyKit**（已被 Cloudflare 收购并合并进 Agents SDK）：原 WebSocket-first 框架，作者 Sunil Pai 现在主导 Agents SDK。

### 3.3 真实在用的项目

- **Anthropic Skills marketplace**：MCP server 推荐部署到 Workers
- **Block (Square)** 的 goose Agent：CLI 端在本地，云端工具调用走 Workers
- **Coinbase** 部分客服 Agent
- 国内：极少。**Workers 在中国大陆访问受限**（无独立 ICP），国内团队基本只用海外节点跑面向海外用户的 Agent

## 四、技术 / 实施细节

### 4.1 推荐架构（"Cloudflare 全家桶版"）

```
用户
  │ HTTPS / WebSocket
  ▼
Workers（入口路由，Hono）
  │ idFromName(userId)
  ▼
Durable Object: AgentSession  ←─── 长连接 WebSocket，对话状态
  │
  ├─→ AI Gateway → Anthropic Claude / OpenAI / Workers AI（推理）
  ├─→ Vectorize（RAG 检索）
  ├─→ D1（用户/任务表）
  ├─→ R2（文件/截图）
  ├─→ Workflows（长任务，例：批量爬取 200 个网页并总结）
  └─→ Browser Rendering / 外部 MCP server（工具调用）
```

**核心心法**：一个用户 = 一个 Durable Object 实例。DO 是单线程 actor，天然解决了「同一用户的并发请求要看到一致状态」这个分布式难题。

### 4.2 一个最小可跑的 Agent 骨架

`wrangler.toml`:
```toml
name = "my-agent"
main = "src/index.ts"
compatibility_date = "2026-05-01"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "AGENT"
class_name = "MyAgent"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["MyAgent"]   # 注意：新项目要用 SQLite-backed DO

[ai]
binding = "AI"

[[vectorize]]
binding = "VEC"
index_name = "my-rag-index"
```

`src/index.ts`:
```ts
import { Agent, AgentNamespace, routeAgentRequest } from "agents";
import { Hono } from "hono";

export class MyAgent extends Agent<Env, { history: Message[] }> {
  initialState = { history: [] };

  async onMessage(connection, message) {
    const userMsg = JSON.parse(message);
    this.setState({
      history: [...this.state.history, { role: "user", content: userMsg.text }]
    });

    // 1) RAG: 查向量库
    const vec = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: userMsg.text });
    const matches = await this.env.VEC.query(vec.data[0], { topK: 3 });

    // 2) 调大模型（走 AI Gateway，自动缓存 + 重试）
    const resp = await fetch("https://gateway.ai.cloudflare.com/v1/<acct>/<gw>/anthropic/v1/messages", {
      method: "POST",
      headers: { "x-api-key": this.env.ANTHROPIC_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `Context:\n${matches.matches.map(m => m.metadata.text).join("\n")}`,
        messages: this.state.history,
      })
    });
    const data = await resp.json();
    connection.send(JSON.stringify({ reply: data.content[0].text }));
  }
}

const app = new Hono<{ Bindings: Env }>();
app.all("*", c => routeAgentRequest(c.req.raw, c.env) ?? c.text("not found", 404));
export default app;
```

`wrangler dev` 起来就能 WebSocket 连上跑。这套骨架在 2026-06 的 `agents` 0.1.x 版本验证可用。

### 4.3 长任务：用 Workflows 而不是死磕 Worker

Worker 单请求 CPU 时间 30 秒是硬上限，付费版也无法突破。Agent 跑「爬 100 个网页 → 摘要 → 写报告」这种任务必然超时。正确姿势：

```ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";

export class CrawlAndSummarize extends WorkflowEntrypoint<Env, { urls: string[] }> {
  async run(event: WorkflowEvent<{ urls: string[] }>, step: WorkflowStep) {
    const pages = await Promise.all(
      event.payload.urls.map(url =>
        step.do(`fetch-${url}`, { retries: { limit: 3, backoff: "exponential" } }, async () => {
          const r = await fetch(url);
          return await r.text();
        })
      )
    );

    const summary = await step.do("summarize", async () => {
      return await callClaude(pages.join("\n\n"));
    });

    await step.do("persist", async () => {
      await this.env.DB.prepare("INSERT INTO reports (content) VALUES (?)").bind(summary).run();
    });
  }
}
```

每个 `step.do` 是一次 checkpoint，失败自动重试，宕机后从上一个成功的 step 继续。Workflows 在 2025-Q4 GA，是 Cloudflare 补齐 Agent 拼图的最后一块。

### 4.4 把 Worker 暴露成 MCP server

2025 年下半年 Cloudflare 推了官方的 `workers-mcp` 模板，三行命令把 Worker 变成 Claude Desktop / Cursor 能直接接入的 MCP server：

```bash
npm create cloudflare@latest my-mcp-server -- --template=cloudflare/agents/templates/mcp
npx wrangler deploy
# 然后在 Claude Desktop 配置 mcpServers: { "my-tool": { "url": "https://my-mcp-server.workers.dev/sse" } }
```

这是目前**部署 MCP server 最便宜的方式**——一个免费 Workers 账号能扛 10 万次/天调用。

### 4.5 成本估算（2026-06 报价）

跑一个「日活 1 万、人均 20 轮对话、平均 1500 tokens 输入 + 500 tokens 输出 用 Claude Sonnet 4.6」的 Agent：

| 项 | 用量 | 月费 |
|---|---|---|
| Workers 请求 | 600 万次 | $5（Workers Paid plan，含 1000 万请求） |
| Durable Objects | 1 万实例 × 30 天 × 8h 活跃 | ~$15 |
| AI Gateway | 转发 | $0（基础免费） |
| Anthropic API（走 Gateway） | ~120 亿 input + 40 亿 output | ~$48,000（模型费，跟 Cloudflare 无关） |
| Vectorize | 100 万向量、6000 万查询 | ~$30 |
| D1 | 中等读写 | ~$5 |
| **合计基础设施（不含模型）** | | **~$55** |

**关键观察**：Cloudflare 这套基础设施在百万 DAU 量级前几乎是「免费」的。Agent 的钱 99% 是模型费——这也是 AI Gateway 的缓存（重复 prompt 自动命中缓存）能直接帮你省到模型费上的原因。

## 五、争议与风险

### 5.1 技术上的硬约束

1. **CPU 时间 30 秒上限不可破**。任何单次推理超过 30 秒都必须拆 Workflow，简单 Agent 也得改架构。
2. **Durable Object 物化位置不可控**。DO 第一次访问时根据请求者位置决定 region，之后**不会迁移**。如果你的用户从北京迁到圣何塞，依然走原来的 region，跨洋延迟 200ms+。规避：按业务键分片（如 `userId-cn-east`）。
3. **Node 兼容不是原生**。`nodejs_compat` flag 覆盖大部分 API，但 `child_process`、`worker_threads`、原生 `fs` 等基本不能用。大量 npm 包（Puppeteer 完整版、sharp、node-canvas）跑不了——需要用 Cloudflare 提供的替代品（Browser Rendering、Images）。
4. **冷启动声称 0ms 是营销话术**。Worker 进程冷启动确实 < 5ms，但「首次加载用户的 Durable Object + 初始化 SQLite」实测在 50-200ms。
5. **可观测性偏弱**。Logpush + Tail Workers + AI Gateway 分析能凑合用，但比起 Datadog/Honeycomb 的体验仍有差距。

### 5.2 商业与生态风险

1. **平台锁定严重**。Durable Objects、Workflows、Vectorize 都是 Cloudflare 私有 API，迁出基本等于重写。
2. **中国大陆只能走海外 PoP**。Workers 在大陆的低延迟服务依赖 Cloudflare × 京东云的合作产品，需要 ICP 备案才能落地境内节点；没备案的域名（如本站）走的是香港/东京/新加坡等海外 PoP——绝大多数时候**可达**（GFW 对 Cloudflare IP 段不做 IP 级封禁，主要看 SNI/域名是否被点名），但延迟通常在 50–150ms、且稳定性受 GFW 状态影响。结论：做 toC、对延迟敏感、需要 SLA 的国内 Agent 不要选；做个人站、低流量、内容中性的边缘服务完全可用。
3. **Workers AI 模型库小且更新慢**。能跑的开源模型只有几十个，2026 年最新的 Qwen3.7 / DeepSeek V4 之类基本要等 3-6 个月。
4. **Agents SDK 还在 0.x**。API 在迭代，2026-Q1 才把 `state` 从 in-memory 改成 SQLite-backed，未来还可能改。生产用要锁版本。
5. **被 Anthropic 深度绑定的政治风险**。Cloudflare 与 Anthropic 在 MCP 上深度合作，对 OpenAI 的支持优先级肉眼可见偏低。如果业务重度依赖 OpenAI，要评估 AI Gateway 的二等公民问题。

### 5.3 真实社区吐槽

- **DO 价格不透明**：按 「duration（活跃秒）+ requests + storage」三维计费，做预算极痛苦。Hacker News 上每季度都有人发「我没算清楚被收了一笔大账单」的帖。
- **Workflows 调试痛苦**：step 失败重试时，Wrangler 本地几乎没法 step-through，只能 console.log + 看日志。
- **Vectorize 比 Pinecone/Qdrant 慢**：尤其是 top-k 大于 50 时延迟明显。

## 六、个人结论

**一句话定性**：Cloudflare 是目前「全球分布 + 带状态 + 持久执行」三选三的边缘 Agent 平台里**唯一一个开箱即用的**，对个人开发者和中小团队尤其友好；但深度绑定 Workers 生态意味着上限被 Cloudflare 的产品路线图决定。

**是否跟进**：✅ **强烈跟进，且建议立项一个实战项目**。理由：
- 本站（2aran.com）已经在 Cloudflare Pages 上，加 Workers 几乎零额外学习成本
- 网站后续要做的「AI 调研助手 / 站内对话 / MCP server 暴露调研内容」三件事，Cloudflare 全家桶是最短路径
- MCP server 在 Workers 上部署是目前最便宜方案（千次调用成本可忽略），对个人 IP 建设有杠杆——可以把「TUARAN 的调研知识库」做成 MCP server 给别人 Claude 接

**下一步行动**：
1. 在本站现有 Cloudflare 项目里加一个 `apps/mcp-server` Worker，把 `research/topics/*.md` 暴露成 MCP server，能让 Claude Desktop 直接查询站内调研。**这一步独立、低风险、有传播价值**。
2. 用 Agents SDK 写一个最小 demo：站内悬浮按钮 → WebSocket → Durable Object → 调 Claude 总结当前文章。先跑通再决定要不要做大。
3. **不投入**重型 Agent 后端（比如批量爬虫、长任务 pipeline）——这类需求量上来后会撞 CPU 30s 限制，到时改 Workflows 成本不小，初期用 Modal / Railway 起步更灵活。
4. 写一篇本站的实战记录《把调研知识库变成 MCP server：30 行代码 + 1 个 Cloudflare Worker》，反过来给本调研做案例闭环。

风险评估：唯一需要警惕的是「DO 物化位置」对国内访问体验的影响。本站当前未做 ICP 备案，国内访问走的是 Cloudflare 海外 PoP（实测 HKG/NRT 居多）——关 VPN 也能开，只是延迟比国内 CDN 高一档（50–150ms），已经接受了这个 trade-off。若未来要做对延迟敏感的国内 toC Agent，再考虑备案 + 京东云合作版。

## 七、信息来源

### 官方一手
- [Cloudflare Agents 官方文档](https://developers.cloudflare.com/agents/)
- [Agents SDK GitHub 仓库](https://github.com/cloudflare/agents)
- [Workflows 文档](https://developers.cloudflare.com/workflows/)
- [Durable Objects 文档](https://developers.cloudflare.com/durable-objects/)
- [AI Gateway 文档](https://developers.cloudflare.com/ai-gateway/)
- [Workers AI 模型库](https://developers.cloudflare.com/workers-ai/models/)
- [Vectorize 文档](https://developers.cloudflare.com/vectorize/)
- [workers-mcp 模板](https://github.com/cloudflare/agents/tree/main/templates/mcp)

### 关键博客与发布
- [Cloudflare Blog: Build agents on Cloudflare](https://blog.cloudflare.com/build-ai-agents-on-cloudflare/)（2025-04 Agents SDK 发布稿）
- [Cloudflare Blog: Workflows GA](https://blog.cloudflare.com/workflows-ga/)
- [Sunil Pai - PartyKit 加入 Cloudflare](https://blog.cloudflare.com/cloudflare-acquires-partykit/)

### 社区与对比
- Anthropic [MCP 官方文档](https://modelcontextprotocol.io/) 中 Workers 作为推荐 server 托管方案
- Hacker News [关于 Cloudflare Agents 的讨论](https://news.ycombinator.com/from?site=cloudflare.com)（持续更新）
- Vercel AI SDK vs Agents SDK 对比文章（社区）
- 站内相关调研：[Next.js + Cloudflare 性能优化](/articles/research/topics/nextjs-cloudflare-performance-optimization)、[端侧 Agent 开发课程市场分析](/articles/research/topics/edge-agent-dev-course)

> 写作说明：本文骨架与代码片段由 TUARAN 在 Claude Code（Opus 4.7）协助下整理，所有架构选型与"个人结论"为人工判断。代码骨架基于 2026-06 的 `agents@0.1.x` 与 `wrangler@4.x`，API 仍在演进，落地前请对照官方文档锁版本。
