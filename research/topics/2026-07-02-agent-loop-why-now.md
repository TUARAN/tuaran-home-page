---
title: Agent Loop 深度调研：把决定权交给模型的一次换代，为什么发生在现在
category: topics
topic_type: tech
tech_type: agents_automation
subjects: [ai_dev]
content_type: analysis
date: 2026-07-02
time: 23:08
updated: 2026-11-04
tags: [Agent, Agent Loop, Prompt Engineering, RAG, LangChain, MCP, Tool Use, ReAct, METR, 范式演化, 技术调研]
summary: Agent loop 改的是控制权：下一步做什么、何时算完成，由模型在工具反馈循环里决定。结构在 ReAct（2022）已有；2024–2026 能规模化，靠模型可完成任务时长上升、MCP 工具接口标准化、编码场景先商业验证。时点论证绑到 2026-11-04 仍可核验的公开产品与论文变化。
tldr: 最小 agent loop 是 while：调工具 → 看结果 → 模型决定是否停止。Prompt / RAG / chain 框架没有消失，多数降为 loop 里的组件。AutoGPT 2023 已试过同类循环但当时单步能力不够。截至 2026-11-04，METR TH1.1、MCP 进入 Linux 基金会 AAIF、Claude Managed Agents / 编码代理产品线，是「为什么是现在」的可引用锚点。个人开发者：先掌握最小实现；框架与 multi-agent 按需。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

**Agent loop 改的是控制权**：LLM 应用里，「下一步做什么、什么时候算完成」从开发者写死的代码路径，交到模型根据工具反馈动态决定。

要点：

1. **三代组织中心可观察**：Prompt 时代（一次怎么问）→ RAG / 管道时代（怎么喂知识、怎么串调用）→ Agent loop 时代（谁决定下一步）。生产系统里三代并存，分期只用于定位概念。
2. **上一代主角常降为新范式组件**：prompt 技能迁到 system prompt 与工具描述；RAG 变为 loop 内检索工具；LangChain 1.0 核心转向 `create_agent` 一类 agent loop API。
3. **循环结构是旧的**：ReAct（2022-10）成文；AutoGPT（2023 春）大众化试跑后回落——当时多步成功率撑不住。
4. **2024–2026 同时到位的三件事**：模型在可自动评分任务上的时间跨度上升（METR）；工具接入标准化（MCP → AAIF）；编码代理先出现规模化付费与工程验证。
5. **工程建议仍克制**：Anthropic《Building effective agents》主张能简单则简单；页首已指向现行 Managed Agents 文档。多数任务停在最小 tool-use loop 即可。

---

## 二、事实层（复核截至 2026-11-04）

### 2.1 最小形态

Anthropic 区分（[Building effective agents](https://www.anthropic.com/research/building-effective-agents)，2024-12-19；页首注明工具景观已变，现行方案见 Managed Agents）：

- **Workflow**：LLM 与工具按代码预编排路径走。
- **Agent**：LLM 动态决定工具与路径，并维持对如何完成任务的控制。

Agent loop 伪代码：

```
messages = [user_task]
while True:
    reply = model(messages, tools)
    if reply 无工具调用:
        return reply          # 模型判定完成
    result = 执行(reply.工具调用)
    messages.append(reply, result)
```

三要素：工具定义、循环、停止条件（模型停调工具，或步数 / 预算兜底）。站内实践升级路径见 [chat → agent loop](/articles/research/topics/chat-to-agent-loop-anthropic-practice)。

### 2.2 时间线（公开事件，绑到可点开的出处）

| 时间 | 事件 | 对「为什么现在」的含义 |
|---|---|---|
| 2020-05 | [RAG 论文](https://arxiv.org/abs/2005.11401) | 第二代「喂知识」标准答案 |
| 2022-10 | [ReAct](https://arxiv.org/abs/2210.03629) | Reason + Act 循环成文 |
| 2022-10 | LangChain 开源 | 第二代脚手架 |
| 2023 春 | AutoGPT / BabyAGI 热潮回落 | 结构对了、当时模型多步不稳 |
| 2023-06 | OpenAI function calling | 工具调用 API 原生化 |
| 2024-11 | [MCP 发布](https://www.anthropic.com/news/model-context-protocol) | 工具接入标准化起步 |
| 2024-12 | Building effective agents | workflow / agent 工程共识 |
| 2025 | Claude Code 等编码代理上量；OpenAI 等跟进 MCP | 编码场景商业验证 |
| 2025-10 | [LangChain / LangGraph 1.0](https://www.langchain.com/blog/langchain-langgraph-1dot0) | 框架核转向 agent loop |
| 2025-12-09 | [Linux 基金会 AAIF](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)：MCP / goose / AGENTS.md | 工具协议中立治理；公告称 10,000+ 公开 MCP server，SDK「97M+ monthly downloads」（官方新闻口径，第三方转述需分开） |
| 2026-01-29 | [METR Time Horizon 1.1](https://metr.org/blog/2026-01-29-time-horizon-1-1/) | 任务套件扩到 228；2023 后倍增周期估计缩短（见下） |
| 2026-04 起 | Claude Managed Agents beta（`managed-agents-2026-04-01`） | 托管 harness：agent / environment / session | 
| 2026-07-28 | MCP 无状态远程 HTTP 等协议演进（路线图与站内 MCP 专篇） | 远程 MCP 更像普通 HTTP 负载 |

### 2.3 换代样本（各验证「主角 → 组件」）

**Prompt 工程**：单次调用缺环境反馈与中间状态。Loop 里技能迁到 system prompt、工具描述、错误回喂格式。Anthropic [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) 把工具接口设计提到与 prompt 同等重要。

**RAG**：从「开口前预检索管道」变为 loop 内 `search` / `read_file` / `query_db`（agentic retrieval）。编码代理常用 grep + 读文件多轮，而不必先上向量库。固定语料、延迟敏感场景，预检索管道仍可更稳更便宜。

**LangChain**：1.0 博客写明 refocus on core agent loop；`create_agent` 传 model / tools / system prompt，跑在 LangGraph 运行时上的 ReAct 循环。框架自己换核，比布道文更能说明风向。横评见站内 [多 Agent 框架对比](/articles/research/topics/multi-agent-frameworks-comparison)。

---

## 三、结构分析：为什么火在 2024–2026

结构 2022 年就有，故「为什么现在」只能在结构之外找。三条可核验因素：

### 3.1 模型可完成任务的时间跨度上升

Loop 整体成功率近似单步成功率的连乘：单步 90% 时，20 步约 12%；单步 99% 时约 82%。单步能力的缓慢提升，会在某点让多步任务「突然能用」。

[METR](https://metr.org/time-horizons/) 用「以给定成功率能完成的、按人类专家耗时度量的任务难度」定义 time horizon（**不是** agent 墙上时钟跑了多久）。TH1.1（2026-01-29）显示：全时段拼接线倍增仍约 7 个月量级；**≥2023** 的 P50 倍增约 131 天（TH1.1）对 TH1 的约 165 天；**≥2024** 约 89 天对 109 天。置信区间仍宽；METR 亦提示超长时长测量不可靠。本文采用「近年倍增加快、编码向任务进入小时级难度带」的趋势，不拿单点小时数做营销句。

### 3.2 工具接入从 N×M 变成近似 N+M

MCP 让工具方实现一次 server、多客户端复用。AAIF 成立后治理中立化；ChatGPT / Cursor / Gemini / Copilot / VS Code 等在基金会新闻中被列为采用方。个人开发者可在周末级成本接工具，loop 可调用面扩大。

「97M+ monthly SDK downloads」来自 **2025-12-09 Linux 基金会 / Anthropic 新闻口径**；未在本文独立复测包下载面板。量级可作生态热度参考，精确值不写入硬结论。

### 3.3 编码场景先跑通「可自动核验」

编译器与测试提供廉价客观反馈，故编码代理先成为付费与工程样板。客服、办公等反馈更模糊，落地更慢。厂商按 token 计费与 agent 高消耗一致，说明有宣传动力；但与 2023 年相比，能力和接口是**新增实物条件**。

### 3.4 反向事实

Building effective agents 仍强调：多数成功实现用简单可组合模式，而非复杂框架。行业热词是 agent，一线建议常是「能 workflow 别 agent」。看到「我们上了 agent」时，先问循环里的决定权是否真在模型手里。

---

## 四、外部研判

| 层 | 判断 | 理由 |
|---|---|---|
| 概念 + 最小实现 | 立刻掌握 | 几十行代码；读懂 2026 年多数 AI 产品形态的钥匙 |
| Tool / system prompt 设计 | 跟进 | loop 质量第一决定因素 |
| LangChain / LangGraph 等框架 | 按需 | 先裸写理解机制；要持久化 / 中断恢复再上 |
| Multi-agent | 多数人缓行 | 长时 + 高侵入才触发；见 Anthropic 实践篇 |

对本站可复盘动作：Edge 环境最小 loop demo；跟踪 METR 仪表盘与 MCP registry；若「超长上下文单次调用」在公开编码评测上稳定追平多步 loop，则 3.1 阈值论要重写。

风险：失败诊断变成新工种；token 随步数上升；模型拥有真实副作用时，权限与沙箱不是可选项。

---

## 五、信息来源与持续验证

资料复核截至 **2026-11-04（北京）**。

**官方 / 一手**

- [Building effective agents — Anthropic](https://www.anthropic.com/research/building-effective-agents)
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [MCP 发布](https://www.anthropic.com/news/model-context-protocol) / [AAIF 成立（Linux Foundation）](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [LangChain & LangGraph 1.0](https://www.langchain.com/blog/langchain-langgraph-1dot0)
- [ReAct](https://arxiv.org/abs/2210.03629) / [RAG](https://arxiv.org/abs/2005.11401)
- [METR time horizons](https://metr.org/time-horizons/) / [TH1.1](https://metr.org/blog/2026-01-29-time-horizon-1-1/)

**站内交叉**

- [chat → agent loop 实践](/articles/research/topics/chat-to-agent-loop-anthropic-practice)
- [多 Agent 框架对比](/articles/research/topics/multi-agent-frameworks-comparison)
- [Cloudflare Edge Agents 实践](/articles/research/topics/cloudflare-edge-agents-practice)

**持续验证**

- METR 若更换任务分布导致「近年倍增加快」趋势逆转，第三节 3.1 需改写。
- MCP 下载与 server 数若只有新闻口径、长期无仪表盘，生态热度论据降为弱证据。
- Managed Agents 若从 beta 进入明确 GA 与定价，第四节「托管层」权重上调。
