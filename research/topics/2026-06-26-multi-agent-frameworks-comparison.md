---
title: 多 Agent 框架横向对比调研：AgentScope 2.0 / LangGraph / AutoGen / LangChain（附 AgentScope × OpenClaw 框架与 Skill 对比）
category: topics
topic_type: tech
date: 2026-06-26
time: 16:50
tags: [AI, Agent, 多智能体, AgentScope, LangGraph, AutoGen, LangChain, OpenClaw, MCP, Skill, 渐进式披露, 工程化, 框架选型, Microsoft Agent Framework, 编排, 本地优先]
summary: 从「开发主体、核心定位、多 Agent 原生支持、生产工程化、消息通信、记忆、安全沙箱、编排、生态、MCP、学习门槛」十一个维度，横向对比 AgentScope 2.0、LangGraph、AutoGen、LangChain 四个框架；并延伸对比 AgentScope 与 OpenClaw（框架整体 + Skill 技能系统两层）。立场是按官方文档与公开仓库做外部观察，不替任一项目做命运判断；并据官方信息校订三处易错事实——AutoGen 已进入维护模式（后继者 Microsoft Agent Framework）、LangChain MCP 为官方一方适配、OpenClaw 的 Skill 同样采用渐进式披露（非「全量预加载」）。
tldr: 四个框架不在同一层：LangChain 是单 Agent 工具库，LangGraph 是流程/状态编排引擎，AgentScope 2.0 偏企业级多 Agent 运行时，AutoGen 是对话式多 Agent 原型框架（官方已转维护、后继者 MAF）。延伸看 AgentScope × OpenClaw：前者是「企业级多 Agent 运行时框架/SDK」，后者是「本地优先、单设备 AI 执行网关产品」——一个解决「多 Agent 怎么协作上生产」，一个解决「AI 怎么在本机动手」。两处需校正的外部说法：OpenClaw 的 Skill 同样是渐进式披露（非全量预加载），且本文未证实存在「AgentScope 把 OpenClaw 当节点调度」的官方集成。星级为相对侧重、非绝对评分；版本与维护状态以各项目官方为准。
assistance: claude-code
model: claude-opus-4-8
pv: 0
---

# 多 Agent 框架横向对比调研：AgentScope 2.0 / LangGraph / AutoGen / LangChain

> **写在前面**：本文基于各项目官方文档与公开仓库做横向对比，属外部观察；版本与维护状态以官方为准，星级表示相对侧重、非绝对评分，不构成选型承诺或商业建议。

---

## 一、先给结论

这四个名字经常被并排比较，但它们其实不在同一抽象层——先判断「你要的是一个工具库、一个编排引擎，还是一个生产运行时」，比纠结谁的星更多更重要。

一句话定位：

| 框架 | 一句话定位 | 它最适合的问题 |
|---|---|---|
| **LangChain** | 单 Agent 工具开发库 | 快速把「模型 + 工具 + 提示」串起来、做单体应用与 PoC |
| **LangGraph** | 单 / 多 Agent 流程状态编排引擎 | 需要显式分支、循环、可中断与可恢复的有向图工作流 |
| **AgentScope 2.0** | 企业级多 Agent 工程运行时 | 生产级多 Agent 系统：要沙箱、权限、可观测、可部署 |
| **AutoGen** | 对话式多 Agent 原型框架 | 群聊式多 Agent 自动协商的快速验证（注意维护状态，见 2.1） |

**选型建议（详见第三节研判）**：

- 要**生产级多 Agent 工程化**（沙箱 / 权限 / 审计 / K8s）：优先评估 **AgentScope 2.0**。
- 要**显式流程控制**（状态机、分支循环、人审中断）：优先 **LangGraph**。
- 只是**单 Agent + 工具**的轻应用或原型：**LangChain** 上手最快。
- 已有 **AutoGen** 群聊原型、或在微软技术栈内：建议把目光转向其官方后继者 **Microsoft Agent Framework**，并评估迁移成本。

> 跟进判断（topics 惯例）：**AgentScope 2.0 — 建议跟进**（多 Agent + 工程化是当前缺口最对位的一类）；**LangGraph — 建议跟进**（编排层事实标准之一）；**LangChain — 维持了解**（作为工具库与生态入口）；**AutoGen — 观望 / 转向后继者**（官方维护模式，新项目谨慎新建）。下一步见 3.4。

---

## 二、事实层：四框架基础对照

> 本节为公开可查信息。每行尽量标注状态：**已确认**（有官方文档 / 仓库支撑）/ **自我披露**（项目方口径）/ **未对外披露 / 待核**（本文未能从一手来源确认）。星级为相对侧重，非绝对评分。

总览（在用户给定维度基础上，据官方信息做了校订，校订处在下文小节说明）：

| 对比维度 | AgentScope 2.0 | LangGraph | AutoGen | LangChain |
|---|---|---|---|---|
| 开发主体 | 阿里通义实验室（`agentscope-ai`） | LangChain 官方 | 微软（**官方已转维护模式**） | LangChain Inc |
| 核心定位 | 企业级多 Agent 工程运行时 | 单 / 多 Agent 流程状态编排 | 对话式多 Agent 群聊框架 | 单 Agent 工具开发库 |
| 多 Agent 原生支持 | ⭐⭐⭐⭐⭐ MsgHub 消息广播原生 | ⭐⭐ 需自行封装通信层 | ⭐⭐⭐⭐ 群聊对话原生 | ⭐ 无原生多 Agent 抽象 |
| 生产工程化 | ⭐⭐⭐⭐⭐ 内置沙箱 / 权限 / 可观测 / 可部署 | ⭐⭐⭐ LangSmith 观测，未内置沙箱 / 权限 | ⭐⭐ 偏原型，生产运维需自补 | ⭐ 基础封装为主 |
| 消息通信模型 | 类型化消息，支持分组 / 私聊 / 广播 | 无统一消息层，依赖共享状态 | 自由对话消息，元数据约束弱 | 无消息总线概念 |
| 记忆体系 | 分层记忆（短时 / 任务 / 长期） | 自定义状态存储，无分层封装 | 对话记忆为主，长期检索需自补 | 基础对话记忆，向量库需另接 |
| 安全沙箱 / 权限 | Workspace 隔离、分级工具权限、文件沙箱 | 未内置沙箱，需自行实现 | 未内置安全隔离 | 未内置安全管控 |
| 编排方式 | 协调者 Agent + 事件流驱动 | 有向图状态机，显式分支 / 循环 | 自由对话自动协商 | 链式调用 |
| 语言生态 | Python + Java 双栈 | 以 Python 为主 | 以 Python 为主 | Python / JS 双栈 |
| MCP 协议支持 | 据官方文档支持（以官方为准） | 经官方 `langchain-mcp-adapters` 适配 | 经扩展 / 后继框架支持 | 官方维护 `langchain-mcp-adapters` |
| 学习门槛 | 中（工程概念多） | 中高（图状态抽象复杂） | 中（对话逻辑灵活、过程难管控） | 低（单 Agent 快速上手） |

### 2.1 开发主体与维护状态（本文重点校订）

- **AgentScope**：官方组织为 `agentscope-ai`（源自阿里通义 / ModelScope 生态）。2.0 的关键变化是把原本独立的 **AgentScope-Runtime**（工具沙箱、Agent-as-a-Service、全栈可观测）**整合进主框架**。**已确认**（官方仓库 + 文档）。
- **LangGraph / LangChain**：均由 LangChain 团队维护，分属「编排引擎」与「工具库」两层。**已确认**。
- **AutoGen**：起于微软研究院。**据官方信息，2026 年 AutoGen 与 Semantic Kernel 已进入维护模式**（继续修 bug / 安全补丁，不再加新特性），微软在 2026-04 推出 **Microsoft Agent Framework（MAF）1.0**，将二者统一并加入图式多 Agent 工作流；社区另有分叉 **AG2**（`ag2ai/ag2`）延续旧版 GroupChat 风格。**已确认**（微软 Learn 迁移指南 / 发布博客）。
  - 校订说明：用户给定表中「维护放缓」一项，据官方实际更接近「**已转维护模式 + 官方后继者 MAF**」。对新项目，这条比星级更影响决策。

### 2.2 多 Agent 与通信

| 维度 | AgentScope 2.0 | LangGraph | AutoGen | LangChain |
|---|---|---|---|---|
| 多 Agent 抽象 | 原生（多 Agent 是一等公民） | 以图节点表达，多 Agent 需自行组织 | 原生（群聊 / 角色协商） | 无原生抽象 |
| 通信机制 | **MsgHub** 消息广播中心，支持动态增删参与者、分组 / 私聊 / 广播 | 共享 State，节点间通过状态读写传递 | 对话消息流，自由协商 | — |

- AgentScope 的 **MsgHub** 在官方文档中定位为「多 Agent 对话的消息广播中心」，免去手写消息转发。**已确认**。
- LangGraph 的协作以**共享状态**为中介，而非独立消息总线；多 Agent 更多是「多个图 / 子图」的组织问题。**已确认**。

### 2.3 工程化与安全

这一节是四者差异**最大**的地方，也是「框架」与「运行时」的分水岭。

| 能力 | AgentScope 2.0 | LangGraph | AutoGen | LangChain |
|---|---|---|---|---|
| 工具 / 代码沙箱 | 内置 Workspace 沙箱（本地 / Docker / E2B 后端） | 未内置 | 未内置 | 未内置 |
| 权限体系 | 细粒度工具 / 资源权限 | 未内置 | 未内置 | 未内置 |
| 可观测 | 内置全栈可观测 | LangSmith（同生态商业产品） | 基础日志 | 基础日志（多接 LangSmith） |
| 多租户 / 多会话 | 内置隔离 | 需自建 | 需自建 | 需自建 |

- AgentScope 2.0 自我披露的生产能力包括：**事件系统、权限系统、多租户 / 多会话服务、Workspace / 沙箱**（local / Docker / E2B）。**自我披露 + 官方文档**。
- 其余三者**未内置**安全沙箱 / 权限隔离，需要使用方自行补齐——这是中性的能力边界描述，不代表它们「做不到」，而是「不在框架默认职责内」。

### 2.4 记忆与编排

| 维度 | AgentScope 2.0 | LangGraph | AutoGen | LangChain |
|---|---|---|---|---|
| 记忆 | 分层（短时 / 任务 / 长期）原生封装 | 自定义状态存储（持久化由 checkpointer 提供） | 对话记忆为主 | 基础对话记忆 + 可接向量库 |
| 编排范式 | 协调者 Agent + 事件流 | **有向图状态机**（显式分支 / 循环 / 中断 / 恢复） | 自由对话自动协商 | 链式函数调用 |

- LangGraph 的强项是**把流程显式画成图**：可中断（human-in-the-loop）、可恢复（checkpoint）、可回放，适合需要强过程控制的场景。**已确认**。
- AutoGen 的群聊式自动协商在**快速验证**上灵活，但「过程可控性」相对弱——这是范式取舍，不是优劣定论。

### 2.5 生态与 MCP

| 维度 | AgentScope 2.0 | LangGraph | AutoGen | LangChain |
|---|---|---|---|---|
| 语言栈 | Python + Java 双栈 | Python 为主 | Python 为主 | Python / JS 双栈 |
| MCP 支持 | 官方文档支持（以官方为准） | 经 `langchain-mcp-adapters` | 经扩展 / 后继 MAF | **官方维护** `langchain-mcp-adapters` |

- MCP 一行的校订：LangChain 官方维护 **`langchain-mcp-adapters`** 适配库，LangGraph 共用该库——因此二者对 MCP 的支持是**官方一方适配**，而非纯第三方插件。**已确认**（官方仓库）。
- AgentScope 在官方文档中提到 MCP 支持，但「底层原生」的具体程度本文未逐项核实，列入第五节。

---

## 三、研判：四类需求，四种选择

> 以下为外部观察者的一种解读，落在「能力结构与职责边界」上，不对任一项目做命运预测或商业判断。

### 3.1 核心矛盾：它们不在同一层

把四者并排打星，容易制造「AgentScope 全五星、LangChain 全一星」的错觉。但 **LangChain 的「一星多 Agent」不是缺陷，而是定位**——它本就是单 Agent 工具库；拿运行时的标准去要求一个库，等于拿卡车的载重去苛责一辆轿车。更有用的读法是：**先确定你站在哪一层**。

```
应用层职责自上而下：
  运行时（沙箱/权限/可观测/部署） ← AgentScope 2.0 主打
  编排（流程/状态/分支/恢复）     ← LangGraph 主打
  多 Agent 协商（群聊/角色）       ← AutoGen 范式（官方转维护）
  工具库（模型+工具+提示）         ← LangChain 主打
```

### 3.2 按场景选

| 你的主要诉求 | 首选 | 理由（落在机制上） |
|---|---|---|
| 生产级多 Agent，要安全与运维 | AgentScope 2.0 | 沙箱 / 权限 / 多租户 / 可观测在框架内，少自建 |
| 强流程控制、可中断可恢复 | LangGraph | 有向图 + checkpoint 把过程显式化 |
| 单 Agent + 工具的轻应用 / PoC | LangChain | 抽象薄、上手快、生态广 |
| 群聊式多 Agent 快速验证 | AutoGen → 评估 MAF | 范式灵活，但官方维护已转向 MAF |

### 3.3 三条「比星级更硬」的约束

1. **官方维护状态**：AutoGen 新建项目前，先读微软的「AutoGen → Agent Framework 迁移指南」，评估是用 AG2 社区线还是直接上 MAF。
2. **安全边界谁来担**：若上生产且涉及代码执行 / 工具调用，沙箱与权限是硬需求——要么选自带（AgentScope 2.0），要么预留自建成本（LangGraph / LangChain）。
3. **语言栈**：需要 **Java** 的团队，AgentScope 的双栈是少见的现成项；其余三者以 Python 为主。

### 3.4 跟进 / 不跟进 / 观望 + 下一步

- **AgentScope 2.0 — 跟进**：下一步可跑通 MsgHub 多 Agent + Workspace 沙箱的最小样例，验证「沙箱 / 权限」是否如文档所述开箱即用。
- **LangGraph — 跟进**：作为编排层事实标准之一，值得掌握其图 / checkpoint / 中断恢复模型。
- **LangChain — 维持了解**：作为工具库与生态入口与 MCP 适配来源持续关注，不必作为多 Agent 主力。
- **AutoGen — 观望 / 转向**：存量原型可维持，新项目优先评估 **Microsoft Agent Framework**。

---

## 四、行业横向参照

> 以下为同类「Agent 框架分层」的通用结构参照，非针对上述任一项目的实测数据。

当前 Agent 框架生态大致可分三层，常被混为一谈：

| 层 | 职责 | 该层常见形态 |
|---|---|---|
| 工具库层 | 把模型、工具、提示、记忆封装成可调用件 | 单 Agent 库（如本文 LangChain 类） |
| 编排层 | 定义多步 / 多 Agent 的流程、状态、分支与恢复 | 图 / 状态机引擎（如本文 LangGraph 类） |
| 运行时层 | 沙箱、权限、多租户、可观测、部署 | 企业级运行时（如本文 AgentScope 2.0 类，及各云厂商 Agent 平台） |

一个常见的工程现实是：**很多团队最终是「库 + 编排 + 自建运行时」的拼装**，而运行时层正是多数自建方案踩坑最多、也是「自带运行时」框架价值最集中的地方。此为行业横向观察，不代表任一项目实际占比。

---

## 五、延伸对比：AgentScope vs OpenClaw（框架整体 + Skill 两层）

> 本节为对照 + 研判混合。OpenClaw 事实以其核心仓库 `openclaw/openclaw` 与官方文档为准；含两处对外部说法的校订，校订处标注。

### 5.1 核心矛盾：这两个也不在同一层

把 AgentScope 和 OpenClaw 放一起比，最容易得出「OpenClaw 处处不如」的错觉，但它俩的**品类不同**：

- **AgentScope** = 企业级**多 Agent 运行时框架 / SDK**，给开发者编码搭后端多 Agent 系统。
- **OpenClaw** = 本地优先、单设备的 **AI 执行网关产品**，开箱即用，主打「AI 在我这台电脑上动手」（iMessage / 文件 / 浏览器 / 定时脚本）。

**一句话**：AgentScope 解决「多 Agent 怎么协作、调度、隔离、上生产」；OpenClaw 解决「AI 怎么在本机软硬件上执行操作」。拿运行时框架的多 Agent / 多租户标准去要求一个本地网关产品，属于跨品类比较。

整体对照（在用户给定表基础上，据官方信息校订，校订见 5.2 / 5.3）：

| 维度 | AgentScope（阿里通义实验室） | OpenClaw（Peter Steinberger） |
|---|---|---|
| 核心定位 | 企业级分布式多 Agent 运行时框架 | 本地优先、单设备 AI 执行网关产品 |
| 开发语言 | Python + Java 双栈 | TypeScript / Node.js，单体网关 |
| 开源协议 | Apache 2.0 | MIT |
| 运行形态 | 分布式集群 / K8s / 多租户 Workspace | 单进程 Gateway（长驻后台），一机一用户 |
| 核心场景 | 多角色业务流水线、企业数据 Agent、智能体军团、Java 后端集成 | 个人桌面自动化、IM 机器人、本地文件 / 浏览器 / 定时任务 |
| 通信模型 | MsgHub 消息总线，多 Agent 协作是一等公民 | Channels 通道（对接 IM 渠道），主打人 ↔ Agent，多 Agent 需二次开发 |
| 安全隔离 | Workspace 沙箱、分级权限、工具中间件鉴权 | 以当前 OS 用户身份执行，依赖系统原生授权（如 macOS TCC），未内置多租户隔离 |
| 可观测 / 运维 | 内置 Studio、全链路 Trace、成本统计、审计、断点恢复 | 执行日志为主，未内置企业级监控 / 分布式追踪 |
| 产品形态 | 开发 SDK / 框架，需编码搭建 | 完整开箱即用产品，自带 WebUI / IM 网关，非开发者可配置 |

### 5.2 架构差异与一处集成校订

- **AgentScope**（多 Agent 内核）：Runtime / 事件总线 → Model 适配 → Agent 层（协调者 / 子 Agent）→ Skill 工具中间件 → Studio 观测。**已确认**（官方文档）。
- **OpenClaw**（本地执行网关）：Gateway（单进程、官方称「single source of truth」，默认 `ws://127.0.0.1:18789`，常以 launchd / systemd 长驻）→ Channels（IM 渠道，本质是插件）→ Skill 执行 → 本地记忆 / 会话。**已确认**（官方文档 + 站内既有 OpenClaw 调研）。

> **校订①（集成关系）**：用户稿称「OpenClaw 是 AgentScope 可接入的本地执行 Harness 节点，AgentScope 可调度多个 OpenClaw 节点」。本文**未能从任一方官方资料证实**存在「AgentScope 编排 OpenClaw」的官方集成。需厘清的是：OpenClaw 自带 **Agent Harness SDK**，但方向相反——它用来把**外部编码 harness**（Claude Code / Cursor / Gemini CLI 等，经 ACP）接进 OpenClaw，而非被 AgentScope 当作节点调度。因此「AgentScope × OpenClaw 组合」目前应视为**一种可设想的自建架构**，而非现成的官方能力（列入第六节）。

### 5.3 Skill 两层对比（含一处机制校订）

两者的技能描述都以 `SKILL.md` 为载体，但工程化深度与运行边界不同。

> **校订②（加载机制）**：用户稿称 AgentScope 用「渐进式披露」、OpenClaw 用「全量预加载 / 关键词触发」。但据 OpenClaw 官方文档，**OpenClaw 的 Skill 同样是渐进式披露（懒加载）**：发现阶段只读每个 skill 的 name + description（约 30–50 token），激活时才读完整 `SKILL.md`，执行时再按需读 `scripts/ references/ assets/`。OpenClaw 的 `SKILL.md` 本就沿用 Anthropic skill 的渐进式披露范式——所以「渐进式披露」**并非 AgentScope 独有**，两者在这一点上机制相近。真正的差异不在「懒加载有无」，而在**工程化深度与运行边界**。

| 对比项 | AgentScope Skill | OpenClaw Skill |
|---|---|---|
| 加载机制 | 渐进式披露（懒加载） | **渐进式披露（懒加载）**（校订：非全量预加载） |
| 结构 | 工程包：`SKILL.md` + `tools/`(代码) + `resources/` + `hooks.py` + `permission.yaml` | 以 `SKILL.md`(自然语言指令)为主 + 可选少量脚本 |
| 存储 / 版本 | 多后端（本地 / Git / Nacos / MySQL），版本管理、热更新 | 本地文件为主（亦可经 ClawHub 分发） |
| 运行隔离 | Workspace 多租户沙箱 | 以当前 OS 用户身份执行，未内置任务隔离 |
| 权限 | 中间件细粒度鉴权 / 限流 / 审计 | 依赖系统原生授权（macOS TCC 等），未内置业务级权限 |
| 团队协作 | fork / 只读·编辑·执行三级共享 | 以单设备单用户为主 |
| 执行语言 | Python / Java，支持同步 / 异步 / 分布式 | JS 脚本 + 系统原生脚本（AppleScript / osascript 等） |
| 适用范围 | 云端 + 本地 + 分布式远程工具 | 以本机系统操作为主（IM / 文件 / 浏览器 / 定时） |
| MCP | 据官方文档支持 | 兼容程度本文未逐项核实（见第六节） |

**这一节的核心判断**：两者 Skill 的分野不是「懒加载 vs 预加载」，而是 **「工程化业务能力包（沙箱 / 权限 / 版本 / 团队共享 / 多语言执行）」 对 「自然语言驱动的本地自动化指令」**——前者服务多 Agent / 多租户的生产系统，后者服务单人本机的开箱即用。

### 5.4 选型与组合（研判）

> 以下为外部观察者的一种解读，落在能力边界与品类定位上。

- **选 AgentScope**：企业后端 / Java 集成、多 Agent 协作、分布式 / 多租户、云端 + 本地混合任务、对审计 / 权限 / 监控 / 断点恢复有要求、需长期沉淀团队技能资产。
- **选 OpenClaw**：个人 Mac 本地助手、IM 机器人与桌面 / 文件 / 浏览器 / 定时自动化、单人开箱即用、想用自然语言快速写 skill。
- **组合（设想，非现成官方方案）**：以一个多 Agent 编排层在云端调度业务、把每台 Mac 上的 OpenClaw 作为本地执行端，理论上可兼顾「云端多 Agent」与「本地软硬件操作」。**可行性需自建验证**——如 5.2 所述，目前无「AgentScope 官方把 OpenClaw 当节点」的一手证据，不宜当成开箱即用能力。

---

## 六、未能验证的事实清单

- 各框架**截至本文检索的确切版本号**（AgentScope 2.0 / LangGraph / LangChain / AutoGen 0.7.x / MAF 1.0 的精确小版本与发布日期），以官方 release 为准。
- AgentScope **MCP「底层原生」的具体实现程度**（与适配库方案的差异），需以官方 MCP 文档逐项核实。
- AgentScope **分层记忆（短时 / 任务 / 长期）的持久化后端与检索能力**细节。
- AutoGen 各能力在**维护模式下的可用性边界**，以及 AG2 社区线与 MAF 的功能差集。
- 各项目星级为**主观相对评分**，非基准测试结果；不同任务下相对位次可能变化。
- **「AgentScope 把 OpenClaw 当本地执行 Harness 节点调度」**：本文未从任一方一手资料证实存在该官方集成；OpenClaw 的 Agent Harness SDK 是「把外部 harness 接进 OpenClaw」的反向能力。该「组合方案」属设想，需自建验证。
- **OpenClaw 对 MCP 的兼容程度**、其 Skill 是否有多后端 / 版本管理（ClawHub 之外）的细节，本文未逐项核实。
- 获取路径：四者官方文档 / GitHub release / CHANGELOG；微软 Learn 的 Agent Framework 迁移指南；OpenClaw 核心仓库 `openclaw/openclaw` 与 `docs.openclaw.ai`。

---

## 七、信息来源

**一手资料（官方文档 / 仓库）**

- AgentScope（主框架）：<https://github.com/agentscope-ai/agentscope> ｜ 文档 <https://doc.agentscope.io> ｜ Java <https://java.agentscope.io>
- AgentScope Runtime：<https://github.com/agentscope-ai/agentscope-runtime>
- AgentScope 1.0 论文：<https://arxiv.org/abs/2508.16279>
- LangGraph：<https://langchain-ai.github.io/langgraph/> ｜ 仓库 <https://github.com/langchain-ai/langgraph>
- LangChain：<https://python.langchain.com/> ｜ 仓库 <https://github.com/langchain-ai/langchain>
- LangChain MCP 适配：文档 <https://docs.langchain.com/oss/python/langchain/mcp> ｜ 仓库 <https://github.com/langchain-ai/langchain-mcp-adapters>
- AutoGen：<https://microsoft.github.io/autogen/> ｜ 仓库 <https://github.com/microsoft/autogen>
- Microsoft Agent Framework：概览 <https://learn.microsoft.com/en-us/agent-framework/overview/> ｜ AutoGen 迁移指南 <https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/>
- AG2（社区分叉）：<https://github.com/ag2ai/ag2>
- OpenClaw：核心仓库 <https://github.com/openclaw/openclaw> ｜ 文档 <https://docs.openclaw.ai> ｜ Skills <https://docs.openclaw.ai/tools/skills> ｜ Agent Harness 插件 <https://docs.openclaw.ai/plugins/sdk-agent-harness>

**站内交叉**

- [国内通用智能体（本地操作型 Agent）深度测评对比](/articles/research/topics/china-general-agents)
- [AGI-like Agent 用户图景](/articles/research/topics/agi-like-agents-users-landscape)
- [Cloudflare 边缘 Agent 实践](/articles/research/topics/cloudflare-edge-agents-practice)
- [Reasonix 深度技术调研：DeepSeek 原生 Coding Agent](/articles/research/topics/reasonix-deep-dive)
- [如何让一个 channel 被 OpenClaw 官方集成：四档分发机制](/articles/research/topics/openclaw-channel-official-integration)
- [OpenClaw 火爆半年后：普通人真的用了吗？](/articles/research/topics/openclaw-mainstream-adoption-reality-check)

---

> 以上为分析视角，不是预测，也不是建议。星级为相对侧重而非绝对评分；版本与维护状态以各项目官方发布为准。
