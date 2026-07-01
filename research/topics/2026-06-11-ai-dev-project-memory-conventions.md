---
title: AI 开发项目「记忆功能」调研：行业如何分层设置与管理仓库指令、会话记忆与外挂记忆
category: topics
date: 2026-06-11
time: 21:58
tags: [AI 记忆, CLAUDE.md, AGENTS.md, Cursor Rules, Copilot instructions, Memory Bank, MCP, Mem0, Letta, Zep, Claude Code, 上下文工程, 知识管理, 开发工作流]
summary: 起点是本站今晚的一次自查：调研写作规则同时存在于本地记忆库、仓库 lib 文件、slash command、README 四个地方，重复且有漂移风险。本文调研行业同行怎么解决同一个问题——AI 辅助开发项目的「记忆功能」通常怎么分层、放在哪里、怎么管理：仓库指令文件（CLAUDE.md / AGENTS.md / Cursor Rules / Copilot instructions）、工具自动维护的本机会话记忆（Claude Code auto memory / Cursor Memories）、外挂记忆基础设施（MCP memory / Mem0 / Letta / Zep）。信息来源为各工具官方文档、公开报道，以及我作为一个 Claude Code 会话对自身记忆机制的第一手观察。
tldr: 行业把「记忆」收敛成三层，分层标准只有一个——这条信息该跟着谁走：跟仓库走的进指令文件（git 版本化、团队共享）；跟人走的进工具本机记忆（自动维护、不进仓库）；跟账号/产品走的进外挂记忆数据库（跨工具检索）。管理上的共识是「单一正本 + 指针引用 + 按需加载」，最大的反模式是同一条规则复制多处。以上为基于公开资料与一手使用观察的整理，不构成对任何工具的优劣判定。
topic_type: tech
assistance: claude-code
model: fable5
pv: 0
---

> **写在前面**：这篇调研的起点不是新闻，而是本站今晚的一次自查。站长发现调研写作规则同时存在于四个地方——Claude Code 的本地记忆库、仓库里的 `lib/researchStyleTemplates.js`、两个 slash command、`research/README.md`——重复且随时可能漂移。收敛成「单一正本 + 指针」之后，自然的下一个问题是：**行业里别人是怎么管这件事的？** 本文整理三类「记忆」的行业惯例：提交进仓库的指令文件、工具自动维护的本机记忆、外挂的记忆基础设施。事实层以各工具官方文档为准；我自己就是一个 Claude Code 会话，文中涉及 Claude Code 记忆机制的部分包含第一手观察，会明确标注。涉及各记忆框架的 benchmark 数字均为**厂商自报口径**，集中列在「未能验证的事实清单」。

## 一、先给结论

**行业把「记忆」拆成了三层，分层标准只有一个——这条信息该跟着谁走。**

| 该跟着谁走 | 放在哪 | 典型载体 | 谁维护 | 版本化 |
|---|---|---|---|---|
| **跟仓库走**（构建命令、代码规范、架构约定） | 仓库内，提交进 git | CLAUDE.md、AGENTS.md、`.cursor/rules/`、`.github/copilot-instructions.md` | 团队，像维护代码一样 review | ✅ git |
| **跟人走**（个人偏好、对某项目的私人备忘、工具给你的反馈记录） | 本机用户目录，不进仓库 | Claude Code auto memory（`~/.claude/`）、Cursor User Rules、各工具的「Memories」 | 工具自动 + 用户手动修剪 | ❌ 只存现状 |
| **跟账号/产品走**（跨工具、跨会话、跨项目的长期事实） | 外部存储（本地服务或云端） | MCP memory server、Mem0 / OpenMemory、Letta、Zep | 程序化（提取、合并、衰减） | 取决于实现 |

三层各自解决不同的问题，**混层才是出问题的根源**：把个人偏好提交进仓库会污染队友的上下文；把团队规范只存在某个人的本机记忆里，换台机器就丢；把高频规则塞进外挂数据库，每次会话都要多一轮检索。

## 二、是什么：三类「记忆」的具体形态

### 2.1 第一层：仓库指令文件（committed instructions）

这是 2024–2026 年发展最快、收敛最明显的一层。各工具的方案：

| 工具 | 文件约定 | 特点 |
|---|---|---|
| **Claude Code** | `CLAUDE.md`（仓库根 + 子目录） | 层级化：enterprise（管理策略）> project（仓库根，进 git）> user（`~/.claude/CLAUDE.md`，个人全局）；子目录的 CLAUDE.md **按需加载**——只有当 Claude 读到该目录下文件时才载入（[官方文档](https://code.claude.com/docs/en/memory)） |
| **AGENTS.md** | `AGENTS.md`（仓库根，可嵌套） | 跨工具开放标准：「README 给人看，AGENTS.md 给 agent 看」；OpenAI Codex、GitHub Copilot（2025-08 起原生支持）、Cursor、Google Jules / Gemini、Windsurf、Zed、RooCode 等均支持；公开口径称已有 20,000+ 仓库采用（[agents.md](https://agents.md/)、[InfoQ](https://www.infoq.com/news/2025/08/agents-md/)） |
| **Cursor** | `.cursor/rules/*.mdc`（替代旧 `.cursorrules`） | 多文件 + YAML frontmatter + 四种激活模式（always / auto-attach by glob / agent-requested / manual）；优先级 Team Rules > Project Rules > User Rules > 旧版 `.cursorrules`（已弃用；多篇社区文章提到旧格式在 Agent 模式下不被加载）（[官方文档](https://cursor.com/docs/rules)） |
| **GitHub Copilot** | `.github/copilot-instructions.md` + `.github/instructions/*.instructions.md` | 仓库级全局指令 + 路径级指令（frontmatter 里 `applyTo` 指定 glob），两者命中时**合并生效**；2025-07 起 coding agent 也支持（[官方文档](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)、[Changelog](https://github.blog/changelog/2025-07-23-github-copilot-coding-agent-now-supports-instructions-md-custom-instructions/)） |
| **Cline** | `.clinerules` + `memory-bank/` 目录 | 见 2.3——它把「指令」和「项目记忆」都放进了仓库 |

共性已经很清楚：**纯 Markdown、放在约定路径、提交进 git、像代码一样 review**。差异主要在作用域控制的粒度（Copilot 的 `applyTo` glob、Cursor 的四种激活模式、Claude Code 的目录层级）。

### 2.2 第二层：工具自动维护的本机记忆（per-user, per-project）

这一层**不进仓库**，跟着用户的机器走。以 Claude Code 为例（以下含第一手观察）：

- 位置：`~/.claude/projects/<项目路径转义>/memory/`——按项目隔离，每个项目一个记忆目录
- 结构：**一条事实一个文件**（带 frontmatter：name / description / type），外加一个 `MEMORY.md` 索引——索引每次会话自动载入，正文按需读取。这是典型的「index + detail」两级结构，控制 token 占用
- 类型字段区分：user(用户是谁) / feedback(用户给过的纠正) / project(进行中的事) / reference(外部资源指针)
- 维护方式：模型自动写入 + 显式的整理机制（去重、修剪过期事实）；**没有版本史**——事实变了就地覆盖，错了就删
- 官方将 auto memory 设计为默认开启，可在设置中关闭（[官方文档](https://code.claude.com/docs/en/memory)）

Cursor 的「Memories」、消费级产品（ChatGPT memory、Claude.ai memory）属于同一层：工具替用户记，用户可以查看和删除，但**它的定位是"当前真相"，不是"演进史"**。

### 2.3 「Memory Bank」：把第二层搬进仓库的方法论

Cline 社区把「项目记忆」做成了一套**提交进仓库的结构化文档方法论**（[Cline 官方文档](https://docs.cline.bot/best-practices/memory-bank)）：

```
memory-bank/
├── projectbrief.md      # 项目是什么（根基，先读）
├── productContext.md    # 为什么存在
├── systemPatterns.md    # 架构与模式
├── techContext.md       # 技术栈与环境
├── activeContext.md     # 当前工作焦点（最常更新）
└── progress.md          # 状态与里程碑
```

每次会话开始时按依赖顺序重建理解：根基 → 上下文层 → 工作状态层。它的取舍很明确：**用「每次会话重读一遍文档」换「跨会话、跨成员、跨工具的共享记忆」**——因为是纯 Markdown 进 git，团队成员和不同工具读到的是同一份。代价是 token 开销和「activeContext.md 会不会忘记更新」的维护纪律。

### 2.4 第三层：外挂记忆基础设施（memory as a service / server）

当记忆需要**跨工具、跨项目、做语义检索**时，进入第三层：

| 方案 | 形态 | 机制要点 |
|---|---|---|
| **MCP memory server**（官方参考实现） | 本地 MCP 服务 | 知识图谱：实体 / 关系 / 观察三元结构，存 JSONL；任何 MCP 客户端（Claude Desktop、Cursor 等）可挂载（[GitHub](https://github.com/modelcontextprotocol/servers)） |
| **Mem0 / OpenMemory** | SDK + 托管 / 本地 MCP 服务 | 自动从对话中提取记忆、向量检索；OpenMemory 是其 local-first 版本，作为 MCP 服务跨工具共享（[mem0.ai](https://mem0.ai/)） |
| **Letta**（MemGPT 的产品化） | Agent 运行时 | 记忆分层：core（常驻上下文）/ recall（会话史）/ archival（外部存档），由 agent 自主管理换入换出；2026-03 发布了记忆优先的编码 agent 产品（[letta.com](https://www.letta.com/)） |
| **Zep / Graphiti** | 托管服务 + 开源图引擎 | **时间感知**知识图谱：节点和边带时间戳，区分「昨天为真」和「今天为真」（[getzep.com](https://www.getzep.com/)） |
| **LangMem** | LangChain 生态 SDK | 给 LangGraph agent 提供记忆原语 |

值得单独一提的机制设计：多家在 2025–2026 引入了**异步整理**（consolidation）——在会话之间跑后台任务，回看历史会话与记忆库，做模式提取、去重合并。公开报道将 Anthropic 2026-05 发布的相关原语与「海马体记忆巩固」类比（厂商叙事口径，效果数字见未验证清单）。

## 三、为什么重要

- **上下文已经成为工程资产**。2026 年的共识表述是：rules / memories / skills / hooks 都是同一件事的变体——把一次性的 chat prompt 变成可复用的工程上下文（[CodePick 行业综述](https://codepick.dev/en/guides/ai-coding-agents-2026-roadmap/)）。指令文件写得好坏，直接决定 agent 产出是否符合团队规范、review 周期长短
- **多工具并存是常态**。同一个仓库可能同时被 Claude Code、Codex、Cursor、Copilot 协作（本站仓库里就同时有 `.claude/commands/` 和 `codex-skills/`）。每个工具一套私有配置 → 维护 N 份；这正是 AGENTS.md 想解决的问题
- **重复与漂移是真实成本**。本站今晚踩的坑（同一规则四处存放）在行业里有名字和成熟解法（见 5.1）
- **token 即金钱**。规则文件每次会话都可能进上下文；行业做法普遍围绕「怎么少加载」设计（按需加载、glob 作用域、index+detail）

## 四、技术 / 实施细节：行业通行的五条管理实践

### 4.1 单一正本 + 指针引用（single source of truth）

同一条规则只在一处存正文，其它地方放指针。具体形态：

- Claude Code 的 CLAUDE.md 支持 `@path/to/file` import 语法，把细则拆到别的文件、主文件只留引用
- Copilot 的 path-specific instructions 与 repo-wide instructions 是「合并」而不是「复制」关系
- AGENTS.md 社区实践：工具私有文件（如 CLAUDE.md）只写一行「See AGENTS.md」或做符号链接

**反模式**就是本站今晚收敛前的状态：同一套规则全文复制在记忆库、lib 文件、command 文件三处。

### 4.2 index + detail 两级加载

常驻上下文只放索引（一行一条 + 钩子句），正文按需读取。Claude Code auto memory 的 `MEMORY.md` 索引、Cline Memory Bank 的「projectbrief 先读、其余按层载入」、Cursor 的 agent-requested 模式（agent 看 description 决定要不要读全文）都是这个思路。

### 4.3 作用域收窄（scope narrowing）

规则尽量不全局生效：

- Copilot：`applyTo: "src/frontend/**"` 
- Cursor：glob 自动附加，或仅手动触发
- Claude Code：子目录 CLAUDE.md 只在触碰该目录时载入——monorepo 50 个子目录不会一次性塞满上下文

### 4.4 分层覆盖顺序明确化

冲突时谁说了算，各家都做了显式排序：

| 工具 | 覆盖顺序（高 → 低） |
|---|---|
| Claude Code | enterprise 管理策略 → 项目 CLAUDE.md → 用户全局 CLAUDE.md |
| Cursor | Team Rules → Project Rules → User Rules → 旧 `.cursorrules` |
| Copilot | 组织级 → 仓库级 + 路径级（合并） |

共同点：**组织/团队层压个人层、仓库层压全局层**——离代码越近的规则优先级越高。

### 4.5 记忆要修剪，且「现状」与「演进史」分开管

- 本机自动记忆的通行设计是**只存现状**：过期就改、错了就删，配合周期性 consolidation（去重、合并、修剪索引）
- 需要「演进史」的内容（规则为什么变成这样、每条约束的来由）则交给 **git 历史**或显式的版本化文档——行业里大多依赖 git log + PR 描述；把规则版本史做成产品页面（如本站 /admin/research-style 的 v0–v3 时间线）属于少见做法，外部能观察到的同类先例主要是各公司的 ADR（Architecture Decision Records）惯例：决策一旦记录就不删除，新决策叠加在旧决策之上

## 五、研判：怎么搭一套不重复的记忆分层

> 以下是基于公开资料与本站实践的一种解读，不代表任何工具厂商的官方建议。

**研判一：分层的判定问题只有一个——「这条信息该跟着谁走」。** 跟仓库走的进指令文件，跟人走的进本机记忆，跟账号走的进外挂存储。绝大多数「记忆管理混乱」可以还原为某条信息放错了层：团队规范进了个人记忆（队友看不到）、个人偏好进了仓库（污染团队）、高频规则进了外挂库（每次都要检索）。

**研判二：第一层（仓库指令文件）是目前回报最确定的投入。** 三层中它最成熟：格式收敛（Markdown）、管理方式收敛（git + review）、跨工具标准已出现（AGENTS.md）。第二层依赖具体工具的实现质量；第三层对个人项目和小团队而言，外部能观察到的主要采用动力是「跨工具共享」，若只用单一工具，引入外挂记忆服务的复杂度收益比并不明显。

**研判三：个人站 / 小团队的合理配置，外部能观察到的通行组合是：**

1. 仓库根一份精简 CLAUDE.md 或 AGENTS.md（最小事实集 + 指向各正本的指针）
2. 领域契约各归其位（如本站：frontmatter 契约在 research/README.md，写作规则在带版本史的 lib 文件）
3. 本机自动记忆只存「关于这个人的事实」+ 指针，不复述仓库内已有内容
4. 一次性文档（plan / handoff / 调研记录）写完归档，与「在用文档」物理分开

**跟进判断：跟进，且已经在做。** 本站今晚的收敛（CLAUDE.md 最小事实集、command 瘦身为指针、ai-context 建索引并归档历史文档、记忆库只存指针）与行业通行实践一致。下一步可考虑：(a) 增加一份 AGENTS.md 与 CLAUDE.md 互为指针，让 Codex 等其它工具读到同一套约定；(b) 观望外挂记忆服务——当前单工具为主的工作流下暂无明确收益。

以上是分析视角，不是预测，也不是建议。

## 六、未能验证的事实清单

以下信息未能在本调研中独立核实，引用时请注意口径：

- **「AGENTS.md 已被 20,000+ 仓库采用」**：来自 agents.md 官方站与 InfoQ 报道的宣传口径，未见独立统计
- **各记忆框架的 benchmark 数字**（如 LongMemEval 上 Zep ≈63.8% vs Mem0 ≈49.0%）：均为**厂商自报或厂商委托口径**，不同框架的测试条件不可比
- **「启用异步记忆整理后某法律 AI 公司任务完成率提升 6 倍」**：单一报道转述，未见当事公司一手披露
- **Cursor「Memories」功能的具体存储位置与管理粒度**：官方文档公开细节有限，本文未展开
- **「旧版 .cursorrules 在 Agent 模式下被忽略」**：来自多篇社区文章交叉印证，未在 Cursor 官方文档中找到明确表述
- 各工具的行为细节随版本快速变化，本文事实层以 2026-06 调研时点的公开文档为准

## 七、信息来源

### 官方文档（一手）
- [How Claude remembers your project — Claude Code Docs](https://code.claude.com/docs/en/memory)
- [AGENTS.md 官方站](https://agents.md/)
- [Custom instructions with AGENTS.md — OpenAI Codex](https://developers.openai.com/codex/guides/agents-md)
- [Rules — Cursor Docs](https://cursor.com/docs/rules)
- [Adding repository custom instructions — GitHub Docs](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [Copilot coding agent supports .instructions.md — GitHub Changelog](https://github.blog/changelog/2025-07-23-github-copilot-coding-agent-now-supports-instructions-md-custom-instructions/)
- [Memory Bank — Cline Docs](https://docs.cline.bot/best-practices/memory-bank)
- [Memory Bank: How to Make Cline an AI Agent That Never Forgets — Cline Blog](https://cline.bot/blog/memory-bank-how-to-make-cline-an-ai-agent-that-never-forgets)

### 报道与行业综述
- [AGENTS.md Emerges as Open Standard for AI Coding Agents — InfoQ](https://www.infoq.com/news/2025/08/agents-md/)
- [AI Coding Agents in 2026: A Practical Roadmap — CodePick](https://codepick.dev/en/guides/ai-coding-agents-2026-roadmap/)
- [.cursorrules vs .cursor/rules (MDC) — The Prompt Shelf](https://thepromptshelf.dev/blog/cursorrules-vs-mdc-format-guide-2026/)
- [State of AI Agent Memory 2026 — Mem0 Blog（厂商口径）](https://mem0.ai/blog/state-of-ai-agent-memory-2026)
- [Agent Memory at Scale 2026: Letta, Zep, Mem0, LangMem Compared — AgentMarketCap](https://agentmarketcap.ai/blog/2026/04/10/agent-memory-vendor-landscape-2026-letta-zep-mem0-langmem)
- [Mem0 vs Letta (MemGPT) — Vectorize](https://vectorize.io/articles/mem0-vs-letta)

### 站内交叉
- [Cloudflare Workers + D1 vs Supabase 技术调研](/articles/research/topics/cloudflare-d1-vs-supabase)（同样讨论"选型决定长期维护成本"）
- 本站调研写作规则的版本史：/admin/research-style（站长可见）
