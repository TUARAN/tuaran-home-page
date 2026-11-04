---
title: Cloudflare Agent Setup：Skills、MCP 与开发代理接线
category: topics
topic_type: tech
tech_type: agents_automation
content_type: guide
date: 2026-07-08
updated: 2026-11-04
tags: [Cloudflare, MCP, Skills, Agents SDK, Codex, Claude Code, Cursor, AI Agent, 开发环境]
summary: 对照现行 developers.cloudflare.com/agent-setup 与托管 MCP 目录：Skills 提供平台知识，远程 MCP（尤其 Code Mode 的 cloudflare API server）提供账户与文档工具；与「在 Workers 上托管边缘 Agent」是不同问题。
tldr: Agent Setup 解决的是「写 Cloudflare 项目的编码代理如何接官方知识与账户工具」，不是 Durable Object Agent 运行时本身。现行 prompt 对多数代理默认注册 `https://mcp.cloudflare.com/mcp`；产品专用 MCP 为可选。docs 只读与账户 OAuth 风险等级不同，应按任务最小化授权。
subjects: [web_cloud]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **Cloudflare Agent Setup** 是给 Claude Code、Codex、Cursor、OpenCode 等**编码代理**读的官方接线说明，入口为可抓取的 Markdown：[`/agent-setup/prompt.md`](https://developers.cloudflare.com/agent-setup/prompt.md)（2026-11-04 复核仍返回官方说明正文）。
2. **两层能力**：Skills（平台知识包）+ 远程 MCP（工具）。现行主推的账户侧入口是 **Cloudflare API MCP** `https://mcp.cloudflare.com/mcp`（Code Mode：`search` / `execute` / `docs`），官方称覆盖 2,500+ API 端点且以约千级 token 暴露工具面。[servers-for-cloudflare](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)
3. **与边缘 Agent 专文分工**：[`cloudflare-edge-agents-practice`](/articles/research/topics/cloudflare-edge-agents-practice) 讲 Workers / Durable Objects / Agents SDK **托管运行时**；这里只讲**开发机上的代理如何接 Cloudflare 文档与账户**。不在此重复 DO / Workflows 限额表。
4. **权限边界**：`docs` 类只读检索与带 OAuth 的账户 API 风险不同；未明确「要改账户 / 看构建 / 查日志」时，不应默认完成全套登录。
5. **命令会改本地全局配置**：prompt 语气面向代理「自己执行」；人审任务若只是调研，应停在核验与分析，不自动跑安装。

## 二、事实层：现行官方接线（2026-11-04）

### 2.1 prompt.md 在装什么

复核当日 `prompt.md` 结构可概括为：

| 步骤 | 现行公开做法 |
|---|---|
| Claude Code | `claude plugin marketplace add cloudflare/skills` → `claude plugin install cloudflare@cloudflare`，再 `/reload-plugins` |
| 其他代理 Skills | `npx -y skills add cloudflare/skills --skill '*' --yes --global`（或各代理文档中的 Skills 目录） |
| 多数代理的 MCP | 注册 `https://mcp.cloudflare.com/mcp`，首次工具调用触发 OAuth；Codex / Pi 等用各自 `mcp add` + `login` |
| 可选 | 安装 beta CLI `cf`，并在代理说明文件中约定优先用 `cf`（无 Wrangler 配置时） |

配置字段名因代理而异：Cursor / Copilot 常用 `url`；部分桌面代理用 `serverUrl`；OpenCode 用 remote + `oauth` 对象。以各代理 MCP 文档与当日 prompt 为准。

### 2.2 托管 MCP 目录（主 server + 可选专用）

[Cloudflare's own MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)（文档更新标注 Oct 27, 2026）写明：

- 连接 Streamable HTTP 的 `/mcp`；
- **声明支持 MCP `2026-07-28`**，并兼容 2025 Streamable HTTP 客户端的无状态请求；
- **主推荐**：`https://mcp.cloudflare.com/mcp`（API + 文档；Code Mode）；
- **可选产品专用**（官方表，主 server 已覆盖全 API 时多数人不必再挂）：例如 docs、containers、browser、DEX、CASB、Agents SDK docs 等独立 URL。

历史文稿常并列五个远程 server（cloudflare / docs / bindings / builds / observability）。**现行 prompt 对多数代理已收敛到主 `cloudflare` URL**；专用 server 仍存在于目录页，属于可选增强，不是「必须装五个才算完成」。

`cloudflare-docs` 一类公开文档检索在旧说明中常标为无需认证；主 API server 则走 OAuth 或 API Token。以你实际添加的 URL 与授权页为准。

### 2.3 Agents 运行时里的 MCP（交叉引用，不展开）

Agents 文档另有一条线：在 Workers 上跑的 Agent **作为 MCP 客户端** `addMcpServer()`，把外部工具传入模型调用。[Agents → MCP](https://developers.cloudflare.com/agents/tools/mcp/)

那是**部署在 Cloudflare 上的 agent 调外部 MCP**，与「本地编码代理调 Cloudflare MCP」方向相反。架构零件（DO、Lifecycle、harness）见边缘智能体专文与 [Agents 总览](https://developers.cloudflare.com/agents/)。

## 三、结构：什么时候该接、接到哪一层

| 任务 | 建议接线 | 理由 |
|---|---|---|
| 查 Workers / D1 / Wrangler 现行限制 | Skills + 文档检索（主 server `docs` 或可选 docs server） | 降低过期语料直接写配置的风险 |
| 解释概念、写示例、不碰账户 | 可不登录账户 API | 缩小 blast radius |
| 排障构建、绑定、观测、改真实资源 | 再完成 OAuth / Token，并尽量用权限受限账户 | 账户工具可读写 |
| 设计边缘 Agent 拓扑 | 读 Agents / DO 文档；运行时问题转边缘专文 | 避免把 Setup 当成 SDK 教程 |

对本站这类已有 Wrangler / Pages / D1 痕迹的项目，Agent Setup 的实际收益通常是：**查文档更稳、部署排障更短、少把过期 API 写进 PR**——前提是操作者知道代理何时持有账户权限。

## 四、外部研判

Cloudflare 把 Skills 与 MCP 做成「给编码代理的官方接线图」，说明平台默认读者不再只是人类点控制台，而是会执行命令的代理。价值在接线清晰；风险也在接线过于自动——prompt 要求代理直接跑安装时，调研任务与安装任务必须由人分开授权。

主 server 的 Code Mode（少量工具 + 动态生成调用代码）是在用工程手段压工具 schema 的 token 税；这与「把每个 REST 端点暴露成一个 MCP tool」是不同产品策略。是否足够安全，取决于沙箱、OAuth scope 与你是否审查模型生成的调用——本稿不做未实测的安全评级。

## 五、信息来源与持续验证

资料复核截至 **2026-11-04（Asia/Shanghai）**。

- [Agent Setup prompt.md](https://developers.cloudflare.com/agent-setup/prompt.md)
- [Agent setup 入口](https://developers.cloudflare.com/agent-setup/)
- [Cloudflare's own MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)
- [Agents 作为 MCP 客户端](https://developers.cloudflare.com/agents/tools/mcp/)
- [Agents 总览](https://developers.cloudflare.com/agents/)
- Skills / MCP 仓库入口（prompt 引用）：`cloudflare/skills`、`cloudflare/mcp`、`cloudflare/mcp-server-cloudflare`

交叉阅读（不重复展开）：站内《Cloudflare 边缘智能体：Workers、Durable Objects 与 Agents SDK》。

### 持续验证

- `prompt.md` 若再次增删默认 MCP URL 或代理分段（例如重新强制五个 server），第二节表需按当日正文替换。  
- Code Mode 的工具名、token 对比数字来自 Cloudflare 文档表；若文档改口径，应更新事实层而非沿用旧对比。
