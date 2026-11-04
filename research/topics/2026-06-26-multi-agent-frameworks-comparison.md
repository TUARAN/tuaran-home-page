---
title: 多 Agent 框架横向对比：AgentScope 2.0 / LangGraph / AutoGen / LangChain（附 OpenClaw Skill）
category: topics
topic_type: tech
tech_type: agents_automation
subjects: [ai_dev]
content_type: analysis
date: 2026-06-26
time: 16:50
updated: 2026-11-04
tags: [AI, Agent, 多智能体, AgentScope, LangGraph, AutoGen, LangChain, OpenClaw, MCP, Skill, 渐进式披露, Microsoft Agent Framework]
summary: 按官方文档与公开仓库，把 AgentScope 2.0、LangGraph、AutoGen、LangChain 放回各自抽象层；并对照 OpenClaw Skill 的渐进式披露。维护状态与 MCP 适配以 2026-11-04 复核为准。
tldr: 四者分层：LangChain 是单 Agent 工具库，LangGraph 是流程/状态编排，AgentScope 2.0 偏企业多 Agent 运行时，AutoGen 是对话式多 Agent 原型（微软以 Agent Framework 为后续主线）。OpenClaw Skill 同样渐进式披露。「AgentScope 调度 OpenClaw 节点」仍未从官方资料证实。星级只表示相对侧重。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

这四个名字经常被并排比较，但它们不在同一抽象层。先判断要工具库、编排引擎，还是生产运行时，比纠结谁的星更多更有用。

| 框架 | 一句话定位 | 更适合的问题 |
|---|---|---|
| LangChain | 单 Agent 工具开发库 | 把模型、工具、提示串成单体应用或 PoC |
| LangGraph | 单 / 多 Agent 流程状态编排 | 显式分支、循环、可中断与可恢复的有向图 |
| AgentScope 2.0 | 企业级多 Agent 工程运行时 | 沙箱、权限、可观测、可部署的多 Agent 系统 |
| AutoGen | 对话式多 Agent 原型框架 | 群聊式协商的快速验证；新项目应同时评估 Microsoft Agent Framework |

选型要点：

- 生产级多 Agent（沙箱 / 权限 / 审计 / 服务化）：优先评估 **AgentScope 2.0**。
- 显式流程控制（状态机、人审中断、checkpoint）：优先 **LangGraph**。
- 单 Agent + 工具的轻应用：**LangChain** 抽象更薄。
- 已有 AutoGen 原型或微软技术栈：读官方 [AutoGen → Agent Framework 迁移指南](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/)，评估迁移成本；社区另有 [AG2](https://github.com/ag2ai/ag2) 延续旧版 GroupChat 风格。

跟进判断（外部观察，非商业承诺）：AgentScope 2.0、LangGraph 建议跟进；LangChain 维持了解；AutoGen 存量可维持，新项目优先对照 MAF。

---

## 二、事实层（复核截至 2026-11-04）

> 每行尽量标明：**已确认**（官方文档 / 仓库）/ **自我披露**（项目方口径）/ **未核实**。星级为相对侧重，不是绝对评分，也不是基准测试。

| 对比维度 | AgentScope 2.0 | LangGraph | AutoGen | LangChain |
|---|---|---|---|---|
| 开发主体 | `agentscope-ai`（通义 / ModelScope 生态） | LangChain 官方 | 微软（仓库仍开放；后续主线见 MAF） | LangChain Inc |
| 核心定位 | 企业级多 Agent 运行时 | 流程 / 状态编排引擎 | 对话式多 Agent 群聊 | 单 Agent 工具库 |
| 多 Agent 原生 | 相对高（MsgHub 等） | 中（图节点自行组织） | 相对高（群聊原生） | 低（无原生多 Agent 抽象） |
| 生产工程化 | 相对高（沙箱 / 权限 / 服务化） | 中（LangSmith 观测，沙箱需自补） | 偏原型 | 基础封装为主 |
| 消息通信 | MsgHub 广播 / 动态参与者 | 共享 State | 自由对话消息 | 无消息总线概念 |
| 编排方式 | 协调者 + 事件 / 管线 | 有向图状态机 | 自由协商 / Team | 链式调用 |
| 语言生态 | Python + Java | 以 Python 为主 | 以 Python 为主 | Python / JS |
| MCP | 官方文档：统一 `MCPClient`（STDIO / HTTP） | 经 LangChain MCP 适配层 | 经扩展 / MAF | 官方 MCP 适配（见 2.5） |
| 学习门槛 | 中 | 中高 | 中 | 低 |

### 2.1 维护状态（重点校订）

- **AgentScope**：官方组织 `agentscope-ai`。2.0（文档称 2026-05-25 起）重建消息、工具、权限、中间件与服务层；近期 release notes（如 2.0.11，2026-10-27）仍活跃。**已确认**（[agentscope](https://github.com/agentscope-ai/agentscope)、[docs](https://docs.agentscope.io)）。
- **LangGraph / LangChain**：同属 LangChain 团队，分属编排层与工具库层。**已确认**。
- **AutoGen**：GitHub 仓库 `microsoft/autogen` 截至 2026-11-04 **未标记 archived**，仍有公开更新。微软 Learn 将 **Microsoft Agent Framework** 定位为「going forward」的新基础，并由 AutoGen / Semantic Kernel 核心团队推进，提供正式迁移指南。**已确认**（仓库 API + [迁移指南](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/)）。对新建项目，后继主线比星级更影响决策；是否称「维护模式」以微软当期产品页措辞为准，本文不另发明状态标签。

### 2.2 多 Agent 与通信

- AgentScope **MsgHub** 在官方教程中定位为多 Agent 消息广播上下文管理器，支持 `add` / `delete` / `broadcast`。**已确认**（[Pipeline / MsgHub](https://doc.agentscope.io/tutorial/task_pipeline.html)）。
- LangGraph 以**共享状态**为中介；多 Agent 更多是多图 / 子图组织问题。**已确认**。
- AutoGen 的 Team / GroupChat 与实验性 GraphFlow 偏控制流广播；MAF 的 Workflow 偏类型化数据流图。**已确认**（迁移指南对照表）。

### 2.3 工程化与安全

| 能力 | AgentScope 2.0 | LangGraph | AutoGen | LangChain |
|---|---|---|---|---|
| 工具 / 代码沙箱 | 文档披露 Workspace 等隔离 | 未内置 | 未内置 | 未内置 |
| 权限体系 | 文档披露细粒度工具权限 | 未内置 | 未内置 | 未内置 |
| 可观测 | 文档披露 Studio / Trace 等 | LangSmith | 基础 / OTel 扩展 | 多接 LangSmith |
| 多租户 / 多会话 | 文档披露隔离与服务化 | 需自建 | 需自建 | 需自建 |

未内置沙箱不等于「做不到」，只说明不在框架默认职责内。

### 2.4 记忆与编排

- LangGraph 强项是把流程画成图：人审中断、checkpoint、回放。**已确认**。
- AutoGen 群聊在快速验证上灵活，过程可控性相对弱——这是范式取舍。
- AgentScope 文档描述分层记忆与管线编排；持久化后端细节未逐项实测，见文末持续验证。

### 2.5 生态与 MCP（2026-11-04 校订）

- **LangChain MCP**：现行文档入口为 [`langchain.mcp.MCPAdapter`](https://docs.langchain.com/oss/python/langchain/mcp)（`langchain[mcp]>=1.4.0`，标注 beta）。文档说明若此前使用 `langchain-mcp-adapters`，应按「Migrate from langchain-mcp-adapters」迁移。LangGraph 侧继续通过同一生态接入 MCP。**已确认**。
- **AgentScope MCP**：文档提供统一 `MCPClient`（stateful STDIO/HTTP 与 stateless HTTP），经 `Toolkit(mcps=[...])` 注册。**已确认**（[MCP 文档](https://docs.agentscope.io/en/versions/2.0.9/building-blocks/tool/mcp)）。
- **OpenClaw MCP**：兼容范围本文未逐项对照，列入持续验证。

---

## 三、结构分析：先分清层，再谈选型

```
应用层职责自上而下：
  运行时（沙箱 / 权限 / 可观测 / 部署）  ← AgentScope 2.0 主打
  编排（流程 / 状态 / 分支 / 恢复）      ← LangGraph 主打
  多 Agent 协商（群聊 / 角色）            ← AutoGen 范式（后续主线见 MAF）
  工具库（模型 + 工具 + 提示）            ← LangChain 主打
```

| 主要诉求 | 首选 | 机制理由 |
|---|---|---|
| 生产多 Agent，要安全与运维 | AgentScope 2.0 | 沙箱 / 权限 / 服务化在框架文档职责内 |
| 强流程控制、可中断可恢复 | LangGraph | 有向图 + checkpoint |
| 单 Agent + 工具轻应用 | LangChain | 抽象薄、生态入口广 |
| 群聊式快速验证 | AutoGen → 评估 MAF | 范式灵活；官方迁移指南指向 MAF |

三条比星级更硬的约束：

1. **后继主线**：AutoGen 新建前先读 MAF 迁移指南与 AG2 社区线差异。
2. **安全边界谁来担**：涉及代码执行 / 危险工具时，要么选自带沙箱方案，要么预留自建成本。
3. **语言栈**：需要 Java 时，AgentScope 双栈是现成选项之一。

---

## 四、外部研判

一种外部读法是：多数团队最终是「库 + 编排 + 自建运行时」的拼装；运行时层（隔离、权限、多租户、观测）往往是自建成本最高的一段。AgentScope 2.0 的价值集中在这一层是否开箱可用；LangGraph 的价值集中在流程是否可审计、可恢复。

星级表容易制造「全五星 vs 全一星」的错觉。LangChain 的「多 Agent 低分」是定位，不是失败。

---

## 五、延伸：AgentScope × OpenClaw

### 5.1 品类不同

- **AgentScope**：企业级多 Agent **框架 / SDK**，给开发者搭后端协作系统。
- **OpenClaw**：本地优先的 **AI 执行网关产品**，主打本机通道、文件、浏览器与定时任务。

拿运行时多租户标准去要求本地网关，属于跨品类比较。

### 5.2 集成关系（仍未证实）

外部说法偶见「AgentScope 把 OpenClaw 当本地执行节点调度」。截至 2026-11-04，本文仍**未能**从任一方官方文档证实该官方集成。OpenClaw 自带的 Agent Harness 方向是把外部编码 harness 接进 OpenClaw，与「被 AgentScope 调度」相反。组合方案可视为自建设想，不是现成能力。

### 5.3 Skill：两边都是渐进式披露

OpenClaw 官方 Skills 文档写明：合格 skill 以紧凑 XML（name / description / location）注入系统提示；完整指令经 `skills_read` 等按需加载；Skill diet 会把过长 `SKILL.md` 拆到 `references/` 并保留索引。这与「发现阶段只露摘要、用时再读全文」的渐进式披露一致。**已确认**（[docs.openclaw.ai/tools/skills](https://docs.openclaw.ai/tools/skills)、Skill Workshop / diet 说明）。

AgentScope 侧文档与 Java 多 Agent 概览同样把 Skills 描述为按需加载 `SKILL.md`。**已确认**（文档口径）。

真正差异更在工程化深度与运行边界：AgentScope 偏沙箱 / 权限 / 多后端技能资产；OpenClaw 偏本机自然语言指令与通道执行。

| 对比项 | AgentScope Skill（文档口径） | OpenClaw Skill（文档口径） |
|---|---|---|
| 加载 | 渐进式披露 | 渐进式披露（非全量预加载） |
| 结构 | 工程包（指令 + 工具代码 / 资源 / 权限等） | 以 `SKILL.md` 为主，可选脚本与 references |
| 运行边界 | Workspace / 多租户方向 | 以当前 OS 用户与系统授权为主 |
| 分发 | 库 / 工作区 / 文档所述后端 | 工作区、ClawHub、managed library 等 |

---

## 六、信息来源与持续验证

资料复核截至 **2026-11-04（北京）**。

**主要来源**

- AgentScope：<https://github.com/agentscope-ai/agentscope> ｜ <https://docs.agentscope.io> ｜ MsgHub / MCP 文档
- LangGraph：<https://langchain-ai.github.io/langgraph/> ｜ <https://github.com/langchain-ai/langgraph>
- LangChain MCP：<https://docs.langchain.com/oss/python/langchain/mcp>
- AutoGen：<https://github.com/microsoft/autogen>（API：`archived=false`，2026-11-04）
- Microsoft Agent Framework 迁移指南：<https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/>
- AG2：<https://github.com/ag2ai/ag2>
- OpenClaw Skills：<https://docs.openclaw.ai/tools/skills>

**持续验证（只列可能改结论者）**

- AutoGen 当期产品页是否改用「维护 / 归档」等明确标签；MAF 与 AG2 的功能差集。
- LangChain `MCPAdapter` beta 是否稳定，以及 `langchain-mcp-adapters` 仓库是否停更。
- AgentScope「分层记忆」持久化后端与检索能力的逐项对照。
- **「AgentScope 调度 OpenClaw 节点」**：仍无官方一手证据；出现官方集成文档前不写入结论。
- OpenClaw 对 MCP 的兼容边界、以及 Skill 多后端细节。
