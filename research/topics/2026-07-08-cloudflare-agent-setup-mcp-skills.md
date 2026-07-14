---
title: Cloudflare Agent Setup：Skills 与 MCP 服务器集成调研
category: topics
topic_type: tech
tech_type: agents_automation
date: 2026-07-08
tags: [Cloudflare, MCP, Skills, Codex, Claude Code, Cursor, Windsurf, OpenCode, AI Agent, 开发环境]
summary: Cloudflare 发布了一份面向 AI 编程代理的 Agent Setup 指南，用 Skills 提供平台知识，用远程 MCP 服务器提供文档、账户资源、Bindings、Builds 和 Observability 能力；对个人站和边缘应用开发者来说，它更像一套“让代理理解 Cloudflare 项目”的开发环境入口。
tldr: Cloudflare 的 Agent Setup 文档已经在 developers.cloudflare.com 上公开返回 text/markdown，适合用于 Codex、Claude Code、Cursor、Windsurf、OpenCode 等代理的 Cloudflare 开发环境配置。它的价值不在于安装几个命令本身，而在于把“平台知识、官方文档、账户级资源、构建与观测”接进代理工作流。落地时应区分只读文档服务器和需要 OAuth 的账户服务器，不建议在没有明确意图时让代理自动修改全局配置或触发登录。
assistance: codex
model: gpt-5
pv: 0
---

本文按 2026-07-08 11:28（Asia/Shanghai）前后访问 Cloudflare 官方地址整理。原始页面地址为 [https://developers.cloudflare.com/agent-setup/prompt.md](https://developers.cloudflare.com/agent-setup/prompt.md)，HTTP 响应为 `200`，`content-type` 为 `text/markdown; charset=utf-8`。涉及命令和服务器地址时，应以 Cloudflare 官方页面为准。

## 一、结论

Cloudflare 这份 Agent Setup 文档不是传统意义上的产品说明页，而是一份给 AI 编程代理读取和执行的环境配置提示词。它要解决的问题很具体：当开发者用 Codex、Claude Code、Cursor、Windsurf、OpenCode 或 GitHub Copilot 写 Cloudflare 项目时，代理不能只靠训练语料猜 Workers、Pages、D1、R2、Bindings、Builds、Observability 的最新用法，而应该接入 Cloudflare 提供的 Skills 和 MCP servers。

这件事有三个直接价值。

第一，**把平台知识前置到代理上下文**。Skills 负责提供 Cloudflare 平台、Workers、Pages、D1、Durable Objects、Workers AI、Agents SDK 等产品的结构化知识，让代理在做架构判断时不完全依赖过期记忆。

第二，**把官方文档变成可查询工具**。`cloudflare-docs` MCP server 是公开的，不需要认证，适合让代理在生成代码、解释限制、查 API 或校验配置时直接检索 Cloudflare Docs。

第三，**把账户级能力接入开发循环**。`cloudflare`、`cloudflare-bindings`、`cloudflare-builds`、`cloudflare-observability` 这些 MCP servers 会涉及账户、项目、绑定、构建和观测能力，通常需要 OAuth 授权。它们更适合在需要真实部署、诊断构建、检查绑定或查看运行状态时使用。

一句话概括：**这份文档是 Cloudflare 给“AI 开发代理时代”的官方接线图。**

## 二、官方来源是否可信

可信度较高，原因有三点。

首先，页面位于 Cloudflare 官方开发者文档域名 `developers.cloudflare.com` 下，路径是 `/agent-setup/prompt.md`，而不是第三方博客、仓库 issue 或社区复制稿。

其次，页面返回 Markdown 原文，且响应头显示由 Cloudflare 服务提供。它不是网页 UI 中的一段二次转述，而是可被代理直接抓取的提示词文件。

第三，文档中列出的资源链接都指向对应生态的官方入口，包括 Anthropic Claude Code MCP 文档、Cursor MCP 文档、Windsurf MCP 文档、OpenCode MCP 文档、VS Code Copilot MCP 文档，以及 Cloudflare 自己的 Skills 和 MCP GitHub 仓库。

需要注意的是，可信不等于应该无条件执行。文档里的语气面向 AI 代理，会要求代理“直接运行命令”。对于本地开发机，这类命令可能修改全局配置、安装技能、注册远程 MCP 服务器，并触发 Cloudflare OAuth 登录。因此，真正落地时要看当前任务是不是“安装配置”，而不是只因为文档这么写就执行。

## 三、它安装的到底是什么

这份指南把 Cloudflare Agent 环境拆成两层。

第一层是 **Skills**。Skills 更像代理的本地知识包，告诉代理 Cloudflare 平台有哪些产品、什么时候选 Workers、什么时候选 Pages、什么时候用 D1/R2/KV/Durable Objects、什么时候查最新文档。它解决的是“代理知道什么”的问题。

第二层是 **MCP servers**。MCP 是 Model Context Protocol，用来把外部工具、文档、账户资源暴露给代理。Cloudflare 这里给了五类远程 server：

| MCP server | 作用判断 | 是否通常需要认证 |
|---|---|---|
| `cloudflare` | Cloudflare 账户和平台 API 入口 | 需要 OAuth |
| `cloudflare-docs` | 官方文档检索 | 不需要认证 |
| `cloudflare-bindings` | 项目绑定、资源连接、环境能力 | 需要 OAuth |
| `cloudflare-builds` | 构建、部署相关上下文 | 需要 OAuth |
| `cloudflare-observability` | 日志、指标、观测排障 | 需要 OAuth |

这五个 server 的分工很重要。对于只写文章、查 API、解释概念，`cloudflare-docs` 足够；对于改真实项目配置、看部署、查日志，就会进入需要 OAuth 的账户能力。

## 四、不同代理的集成方式

Cloudflare 给不同代理分别写了安装方式。

Claude Code 走插件体系，用 Cloudflare plugin marketplace 安装。它的特点是插件命令同时处理 Skills 和 MCP，不建议再手动混用 `npx skills` 或 `claude mcp add`。

Codex 走命令式注册。流程是先安装 Skills，再用 `codex mcp add` 逐个注册远程 MCP server，最后对 `cloudflare` 执行登录。对当前这个站点的开发环境来说，如果未来要让 Codex 直接管理 Cloudflare Pages、Workers、D1 或观测数据，Codex 这一段就是最相关的。

OpenCode、Windsurf、Cursor、GitHub Copilot 则主要是编辑对应的 MCP 配置文件。差异点在于配置字段名称：Windsurf 使用 `serverUrl`，Cursor / Copilot / 通用代理通常使用 `url`，OpenCode 使用 `"type": "remote"` 和 `"enabled": true` 这类结构。

这说明 Cloudflare 的策略不是绑定单一代理，而是把 MCP server 做成远程标准入口，再按各家代理的配置格式分别接入。

## 五、对本站开发的实际意义

这个站点本身已经部署和维护在 Cloudflare 生态附近：仓库里有 `wrangler.toml`，也有 Pages、D1、R2、Next on Pages、Cloudflare split plan 等相关痕迹。把 Cloudflare Agent Setup 集成进开发环境，实际收益主要体现在四类任务。

第一，**查文档更稳**。例如 Workers runtime、Next on Pages、D1 SQL、R2 资源访问、Pages 构建限制、Wrangler 配置项经常变化，代理接入 `cloudflare-docs` 后，可以优先查官方文档再动手。

第二，**部署排障更短**。当 Pages build、Bindings、环境变量、D1 migration、R2 bucket、Workers logs 出问题时，代理如果能访问 builds 和 observability 上下文，就不必只靠本地猜测。

第三，**架构决策更贴近平台边界**。例如什么时候用 D1，什么时候用 KV，什么时候用 Durable Objects，什么时候把资源放 R2，什么时候让 Pages Functions 计入 Workers 限制，这些判断都依赖 Cloudflare 当前规则。

第四，**减少“旧知识生成新代码”的风险**。Cloudflare Workers 的 Node 兼容、compatibility flags、runtime API、Wrangler 配置、Agents SDK 都在快速变动。让代理在关键节点检索官方文档，比静态记忆可靠。

## 六、风险与边界

这份文档最值得注意的不是技术复杂度，而是权限边界。

第一，安装 Skills 和注册 MCP servers 会改变代理的全局配置。对 Codex 来说，这通常不是某个项目内的改动，而是当前用户环境的能力变更。

第二，OAuth 登录会把代理接到 Cloudflare 账户。后续如果工具权限足够，代理可能读取账户资源、项目配置、构建状态或观测数据。应该用最小权限账户或明确知道授权范围。

第三，`cloudflare-docs` 和其他 server 的风险等级不同。只读文档检索风险低，账户 API、Bindings、Builds、Observability 风险更高。建议在团队环境里把“查文档”和“操作账户”分开授权。

第四，自动执行提示词存在供应链和上下文污染问题。即便页面来自官方，也不代表任意任务都应该执行其中命令。更稳妥的做法是：当任务明确是“安装 Cloudflare Agent Setup”时再执行；当任务只是“调研这份文档”时，只核验和分析。

## 七、建议的落地顺序

如果只是个人站开发，推荐按保守路径推进。

第一步，只接入或使用 Cloudflare Docs 能力。它无需认证，主要解决“查最新文档”的问题。

第二步，在需要真实部署和排障时，再注册账户级 MCP servers，并完成 OAuth。

第三步，把 Cloudflare Skills 当成长期知识层使用，但不要让它替代官方文档检索。涉及价格、限制、API 字段、Wrangler schema、compatibility flags 时仍应查最新来源。

第四步，在团队或生产环境里单独建立 Cloudflare 开发账户或权限受限 token，避免把主账户的高权限能力直接交给代理。

## 八、原文位置与短摘录

官方原文地址：[https://developers.cloudflare.com/agent-setup/prompt.md](https://developers.cloudflare.com/agent-setup/prompt.md)。

短摘录如下：

> official instructions from Cloudflare

> Install Cloudflare Skills and MCP servers

> Restart your agent to load the MCP servers

这三个短句基本覆盖了文档的性质、目标和安装后的必要动作。完整原文建议直接以官方页面为准，因为该页面本身就是给代理和开发者读取的 Markdown 文件，也便于后续重新核验是否发生变化。

## 九、参考链接

- Cloudflare Agent Setup prompt：<https://developers.cloudflare.com/agent-setup/prompt.md>
- Cloudflare Skills：<https://github.com/cloudflare/skills>
- Cloudflare API MCP server：<https://github.com/cloudflare/mcp>
- Cloudflare MCP server collection：<https://github.com/cloudflare/mcp-server-cloudflare>
- Claude Code MCP：<https://docs.anthropic.com/en/docs/claude-code/mcp>
- Cursor MCP：<https://cursor.com/docs/mcp>
- Windsurf MCP：<https://docs.windsurf.com/windsurf/cascade/mcp>
- OpenCode MCP servers：<https://opencode.ai/docs/mcp-servers/>
- GitHub Copilot MCP servers：<https://code.visualstudio.com/docs/copilot/customization/mcp-servers>
