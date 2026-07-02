---
title: Agent Loop 深度调研：把决定权交给模型的一次换代，为什么发生在现在
category: topics
topic_type: tech
date: 2026-07-02
time: 23:08
tags: [Agent, Agent Loop, Prompt Engineering, RAG, LangChain, MCP, Tool Use, ReAct, METR, 范式演化, 技术调研]
summary: Agent loop 改的是控制权：LLM 应用六年来第一次把「下一步做什么、什么时候算完成」的判定权从开发者代码交到模型手里。本文沿这条控制权移交线梳理三代范式（Prompt 时代 → RAG/框架时代 → Agent loop 时代）与「上一代主角降级为新范式组件」的规律，并回答为什么结构 2022 年就有的循环，火在 2024-2026：模型单步准确率过阈值、MCP 标准化工具接口、编码场景先完成商业验证。
tldr: Agent loop 的最小形态只是一个 while 循环：模型调工具、看结果、自己决定何时停。它与 prompt、RAG、LangChain 等生态名词的关系是换代关系——每一代的组织范式把上一代的主角吸收成自己的组件：prompt 工程转型为 system prompt 与工具描述设计，RAG 从架构中心降为 loop 里的检索工具，LangChain 干脆把 1.0 版核心重构成 agent loop。循环结构 2022 年（ReAct）就有、2023 年 AutoGPT 失败过一轮；这轮成立靠三件事同时到位：METR 口径下模型可完成任务时长翻倍周期从 7 个月加速到 4 个月、MCP 把工具集成从 N×M 变成 N+M、编码代理先赚到验证。
assistance: claude-code
model: claude-fable-5
pv: 0
---

> **写在前面**：本文是概念与生态层调研，基于 Anthropic / LangChain / METR 等官方文档、论文与公开报道整理，属外部观察；涉及厂商动机与市场规模的部分均标注为研判或未验证，不构成选型承诺。

## 一、先给结论

**Agent loop 改的是控制权：LLM 应用六年来第一次把「下一步做什么、什么时候算完成」的判定权从开发者代码交到模型手里。** 此前的每一代技术——prompt 工程、RAG、chain 编排——都在替模型铺路，但方向盘始终握在开发者手里：问什么、查什么、走哪条分支，全由代码预先写死。Agent loop 换的是握方向盘的人，其余生态名词的位置变化都是这次移交的连锁反应。

要点：

1. **LLM 应用开发六年换了三代组织范式**：Prompt 时代（一次调用怎么问）→ RAG / 框架时代（怎么给调用喂知识、怎么把调用串成管道）→ Agent loop 时代（把「下一步做什么」的决定权交给模型）。每一代都有一个组织中心，其余技术围绕它站位。
2. **换代的通用规律：上一代的主角不会死，会降级成新范式里的组件。** prompt 工程转型为 system prompt 与工具描述设计；RAG 从默认架构降为 loop 里的一个检索工具；LangChain 自己把 1.0 版核心重构成 agent loop。向量库、function calling、LlamaIndex、Dify……全部生态名词都能用「它在哪一代当过主角、现在在 loop 里当什么组件」这一个问题定位。
3. **Agent loop 结构本身是旧的**。学术源头 ReAct 发表于 2022 年 10 月，AutoGPT 2023 年春就把循环跑给所有人看过，然后失败了——当时模型的单步准确率撑不起多步循环。
4. **这轮火起来靠三件事同时到位**：模型能力过阈值（METR 测得可完成任务时长的翻倍周期从 7 个月加速到约 4 个月）、工具接口标准化（MCP 从 2024-11 发布到 2026-03 月下载量近亿）、编码场景先完成商业验证（Claude Code、Cursor 类产品）。
5. 对个人开发者的判断放在第四节：**概念和最小实现值得立刻掌握（几十行代码的事），框架观望，multi-agent 大多数人不需要**。

## 二、事实层

### 2.1 Agent loop 是什么：最小形态

Anthropic 在 [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)（2024-12）里给了目前引用最多的区分：

- **Workflow**：LLM 和工具按开发者预先写好的代码路径执行，分支由代码控制；
- **Agent**：LLM 自己决定调用什么工具、走什么路径、什么时候停。

Agent loop 就是后者的运行时形态，伪代码只有几行：

```
messages = [user_task]
while True:
    reply = model(messages, tools)
    if reply.没有工具调用:
        return reply          # 模型自己判定任务完成
    result = 执行(reply.工具调用)
    messages.append(reply, result)
```

三个要素：一组工具定义、一个循环、一个停止条件（模型不再调工具，或步数/预算上限兜底）。代码量小，难点全在别处：任务边界怎么划、失败时如何诊断是第几步偏航、副作用如何兜底。站内 [从 chat 任务到 agent loop：Anthropic 一线工程实践](/articles/research/topics/chat-to-agent-loop-anthropic-practice) 专门写过这条升级路径，本文不重复。

### 2.2 三代范式：每个生态名词都有自己的年代

外部能观察到的换代线索（代表技术只是样本，同代还有很多）：

| 代 | 大致年份 | 组织中心的问题 | 当过主角的技术（举例） | 换代后的去向 |
|---|---|---|---|---|
| **第一代：Prompt** | 2020-2022 | 一次调用里怎么问，才能榨出模型能力 | prompt 工程、few-shot、chain-of-thought | 转型为 system prompt / 工具描述设计，仍是质量第一决定因素 |
| **第二代：RAG + 框架管道** | 2022-2024 | 模型知识不够、单次调用不够，怎么喂知识、怎么串管道 | RAG、向量库（Pinecone/Milvus…）、embedding、LangChain 的 chain、LlamaIndex、Dify 类低代码编排 | 检索降为 loop 里的一个工具；管道编排退守「路径可预知」的场景；框架换核（见 2.5） |
| **第三代：Agent loop** | 2024- | 谁决定下一步——把路径决策权交给模型 | tool use / function calling、ReAct 循环、MCP、编码代理、computer use、multi-agent | 现在进行时 |

三点补充，防止把表读死：

- **换代不等于淘汰**。生产系统里三代并存：客服首响用第一代的单次调用最便宜，文档问答用第二代的预检索管道最稳，只有路径无法预知的任务才值得上第三代。Anthropic 官方建议本身就是「能简单别复杂」。
- **每一代的主角在下一代都变成了组件**。这是给生态名词定位的最快办法：见到一个名词，先问它在哪一代当过组织中心、现在在 loop 里承担什么角色，位置就清楚了。
- **function calling 是横跨二三代的枢纽**。2023-06 OpenAI 把工具调用做成 API 原生能力时，多数人拿它做第二代的管道增强；它真正的作用是给第三代备好了地基——没有可靠的结构化工具调用，loop 转不起来。

### 2.3 时间线：这个循环被发明过两次半

| 时间 | 事件 | 意义 |
|---|---|---|
| 2020-05 | [RAG 论文](https://arxiv.org/abs/2005.11401)（Lewis et al., Facebook AI） | 检索增强生成成为「给模型喂外部知识」的标准答案 |
| 2022-10 | [ReAct 论文](https://arxiv.org/abs/2210.03629)（Yao et al.） | Reason + Act 交替循环首次成文，agent loop 的学术源头 |
| 2022-10 | LangChain 开源 | 把 prompt / 检索 / chain 封装成框架，成为第二代的默认脚手架 |
| 2023 春 | AutoGPT、BabyAGI 爆红后退潮 | 第一次大众化的 agent loop 尝试；GPT-4 撑不住多步循环，跑偏、死循环、烧 token |
| 2023-06 | OpenAI function calling 上线 | 工具调用从「prompt 里求模型输出 JSON」变成 API 原生能力 |
| 2024-11 | Anthropic 发布 [MCP](https://www.anthropic.com/news/model-context-protocol) | 模型连外部工具/数据的开放标准，工具接入从定制开发变成装插件 |
| 2024-12 | [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) | workflow / agent 的官方区分 + 「能简单别复杂」的工程共识 |
| 2025 前半 | Claude Code 正式发布、编码代理集中上量；OpenAI 于 2025-03 采用 MCP | agent loop 第一次有了规模化付费场景 |
| 2025-10 | [LangChain / LangGraph 1.0](https://www.langchain.com/blog/langchain-langgraph-1dot0) | LangChain 把框架核心重构为 agent loop（`create_agent`，ReAct 范式跑在 LangGraph 运行时上） |
| 2025-12 | Anthropic [把 MCP 捐给 Linux 基金会旗下 Agentic AI Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)，Anthropic / Block / OpenAI 共同发起 | 工具接口层进入中立治理，Google / Microsoft / AWS / Cloudflare 站台 |
| 2026-03 | MCP 月 SDK 下载量约 97M（第三方统计，见「未能验证」） | 从 2024-11 发布时约 2M 涨了近 50 倍 |

说「两次半」：ReAct 是学术上的第一次，AutoGPT 是大众化的半次（结构对了、模型不行），2024 年底至今是第二次——这次模型、接口、场景三样都在。

### 2.4 换代规律的三个样本

用三个最出名的名词各验证一遍「主角降级为组件」。同样的分析套在向量库、LlamaIndex、Dify 或任何生态词上都成立，这里不穷举。

**样本一：prompt 工程——工作对象换了，技能没作废。**

单次 prompt 的天花板是结构性的：无反馈（模型看不到自己输出的执行结果，错了没机会纠）、无中间状态（多步任务靠开发者手动粘结果）、上下文一次性塞满（所有资料预先塞进去，塞多了淹没重点）。Agent loop 把三条都翻过来：工具结果自动回喂、messages 数组就是状态、模型按需调工具取资料。

但 prompt 技能直接迁移到了三个新对象上：system prompt（agent 的行为边界与偏好）、工具描述（模型靠它决定调不调、怎么调，一句含糊的工具描述能让整个 loop 报废）、错误信息的回喂格式（决定模型能否自我纠偏）。Anthropic 官方把这块叫 [tool 设计](https://www.anthropic.com/engineering/writing-tools-for-agents)，文档篇幅比传统 prompt 技巧还多。

**样本二：RAG——从默认架构降为一个检索工具。**

2023-2024 年「LLM 应用」四个字接近等于 RAG：切块、向量化、检索、拼 prompt，管道由开发者写死，检索发生在模型开口前。Agent loop 改变了检索发生的位置：检索变成 loop 里的一个工具（`search` / `read_file` / `query_db`），什么时候查、查什么、查几轮由模型决定，查一次不够可以换关键词再查——这个模式被叫做 agentic retrieval。外部可观察的例子：Claude Code 这类编码代理没有向量库，靠 grep + 读文件的多轮循环做代码检索；LangChain 1.0 文档也把「retrieval as a tool」列为推荐模式。RAG 没死：延迟敏感（客服首响）、语料固定（文档问答）的场景，预检索管道仍然更便宜更稳。

**样本三：LangChain——框架自己换了核，比任何布道文都能说明风向。**

LangChain 两代都做过主角：2022-2024 核心抽象是 chain，开发者预先把「prompt 模板 → 模型 → 解析器 → 下一步」串成固定管道，这是第二代思路；2025-10 的 1.0 版官方博客明确写「refocus on the core agent loop」，核心 API 换成 [`create_agent`](https://docs.langchain.com/oss/python/langchain/agents)——传 model、tools、system_prompt 三个参数，返回一个跑在 LangGraph 运行时上的 ReAct 循环，原来那堆 chain 抽象大量废弃。一个靠 chain 起家的框架把 1.0 押在 agent loop 上，生态共识走到哪不言自明。四个主流框架的横评站内已有[单独一篇](/articles/research/topics/multi-agent-frameworks-comparison)，此处不展开。

## 三、结构分析：为什么火在 2024-2026，而不是 2023

结构 2022 年就有，AutoGPT 2023 年就试过，所以「为什么现在」的答案只能在结构之外找。外部能确认的因素有三个，按重要性排序。

### 3.1 模型单步准确率过了阈值——loop 的数学决定了这是突变不是渐变

Loop 的整体成功率约等于单步成功率的幂。单步 90% 时，20 步任务的完成率是 0.9^20 ≈ 12%，不可用；单步 99% 时是 82%，可用。单步能力的线性提升，会在某个点上让多步任务的可用性发生跳变——这解释了为什么 agent loop 给人的体感是「突然能用了」。

有第三方测量支撑这个跳变：[METR 的 time horizon 研究](https://metr.org/time-horizons/)用「模型以 50% 成功率能完成的人类任务时长」度量能力，2025-03 的原始报告测得 2019-2025 年该时长每约 7 个月翻倍；[2026-01 的 1.1 版更新](https://metr.org/blog/2026-1-29-time-horizon-1-1/)显示 2024-2025 年翻倍周期缩短到约 4 个月，最新旗舰模型的 50% 时长已到小时级甚至半天级（置信区间很宽，见「未能验证」）。2023 年的模型在「分钟级任务」区间，撑不起 AutoGPT 想做的事；现在的模型在「小时级」区间，一个几十步的编码任务落在能力范围内了。

### 3.2 工具接入成本坍缩——MCP 把集成从 N×M 变成 N+M

Loop 的价值随可用工具数增长，而 2024 年前每个工具都要为每个模型单独写集成。MCP（2024-11）把这变成标准件：工具方实现一次 MCP server，任何支持 MCP 的模型/客户端都能用。采用曲线见 2.3 时间线：OpenAI 2025-03 跟进，2025-12 进入 Linux 基金会中立治理，ChatGPT / Cursor / Gemini / Copilot / VS Code 均已接入。工具生态从「大厂专属」变成「个人开发者周末能写一个」，loop 里可调用的东西多了两个数量级。

### 3.3 编码场景先完成商业验证——反馈可自动核验的任务先跑通

Agent loop 需要「模型能自己判断这步做对没有」，编码天然满足：编译器、测试、类型检查提供免费且客观的反馈信号。所以编码代理（Claude Code、Cursor 等）成为第一个规模化付费场景并不意外——loop 在这里的每一步都有裁判。其他领域（客服、办公自动化）反馈信号模糊，落地明显更慢。

**一条标注为外部观察的补充**：agent loop 单任务的 token 消耗是单次 chat 的几十到几百倍，模型厂商按 token 计费，推广 agent 与其收入结构一致。这只说明厂商有动力宣传，不能推出「火是营销吹出来的」——上面两条硬性条件（能力、接口）是 2023 年那轮炒作里不存在的实物差异。

### 3.4 一个反向事实，防止把故事讲太顺

Anthropic 自己在 Building Effective Agents 里的头号建议仍然是「找最简单的方案，只在需要时增加复杂度」，且明确说多数成功案例用的是简单可组合的模式而非框架。行业热词是 agent，一线工程建议却是「能 workflow 别 agent」——热度和最佳实践之间有真实落差，「agent washing」（把写死的自动化包装成 agent 卖）在 2025-2026 的企业软件营销里被多家媒体点名。看到「我们上了 agent」时，先问循环里的决定权真在模型手里吗。

## 四、外部研判

以下为个人判断，标注置信度。

**总判断：跟进，高置信；但分层跟进，不是全栈跟进。**

| 层 | 判断 | 理由 |
|---|---|---|
| 概念 + 最小实现 | **立刻跟进** | 几十行代码，一个下午的事；这是理解 2026 年所有 AI 产品形态的钥匙 |
| Tool / system prompt 设计 | **跟进** | prompt 工程的存量技能直接迁移，且是 loop 质量的第一决定因素 |
| LangChain / LangGraph 等框架 | **观望，按需** | 框架 API 仍在快速换代（1.0 才半年多）；先裸写 loop 理解机制，需要持久化/中断恢复时再上 |
| Multi-agent | **多数人不跟** | 触发条件是长时任务 + 高侵入操作，个人项目很少满足；结论沿用站内[前文](/articles/research/topics/chat-to-agent-loop-anthropic-practice) |

**对本站的下一步**（可复盘项）：

1. 在 Cloudflare Edge 环境裸写一个最小 agent loop demo（模型 + 2-3 个工具 + while 循环），与站内已有的 [edge agents 实践](/articles/research/topics/cloudflare-edge-agents-practice)衔接；
2. 观察指标：METR 下一次 time horizon 更新（翻倍周期是否维持 4 个月）、MCP 官方 registry 的 server 数量走势；
3. 最大反证：如果 2026 下半年出现「长上下文 + 单次调用」方案在编码任务上追平 agent loop 的公开评测，第三节 3.1 的阈值论需要重写。

**风险提示**：loop 的失败诊断是新工种（错在第几步、为什么没纠偏）；token 成本随步数线性甚至超线性增长；模型在循环里拥有真实副作用（写文件、发请求），权限与沙箱不是可选项。

## 五、未能验证

- **MCP「97M 月下载」**：来自第三方博客（AI2Work）转述，未在 Anthropic 或 Linux 基金会官方口径中找到原始数据；量级可信（多来源交叉），精确数字存疑。
- **「AI agent 市场 2025 年 $7.6B」**：媒体引用的市场规模数字，未找到可核验的统计口径，仅作氛围参考，正文未采用。
- **METR 最新单点（旗舰模型 50% 时长约 12 小时）**：METR 自己标注置信区间横跨 5-65 小时，说明测量工具在长时长端接近失效；本文只采用「翻倍周期加速」的趋势结论，不采用单点数字下判断。
- **各编码代理的具体收入**：Claude Code / Cursor 的营收数字均无官方完整披露，正文只写「规模化付费场景」这一可观察事实。
- **「三代范式」的分期**：年份边界是外部归纳，行业无统一分期口径；生产系统三代并存，分期只用于定位概念，不用于判断某项技术「过时」。

## 六、信息来源

**官方 / 一手**

- [Building Effective Agents — Anthropic](https://www.anthropic.com/research/building-effective-agents)（2024-12）
- [Model Context Protocol 发布公告 — Anthropic](https://www.anthropic.com/news/model-context-protocol)（2024-11）
- [MCP 捐赠与 Agentic AI Foundation 成立 — Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)（2025-12）
- [Writing tools for agents — Anthropic Engineering](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [LangChain & LangGraph 1.0 发布博客](https://www.langchain.com/blog/langchain-langgraph-1dot0)（2025-10）
- [LangChain Agents 文档（create_agent）](https://docs.langchain.com/oss/python/langchain/agents)
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)（Yao et al., 2022）
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)（Lewis et al., 2020）
- [Task-Completion Time Horizons — METR](https://metr.org/time-horizons/) 及 [Time Horizon 1.1 更新](https://metr.org/blog/2026-1-29-time-horizon-1-1/)（2026-01）

**行业 / 二手**

- [AI agents arrived in 2025 — The Conversation](https://theconversation.com/ai-agents-arrived-in-2025-heres-what-happened-and-the-challenges-ahead-in-2026-272325)
- [MCP Hits 97M Installs as Linux Foundation Takes Over — AI2Work](https://ai2.work/blog/model-context-protocol-hits-97m-installs-as-linux-foundation-takes-over)（数字未独立核验）
- [Was 2025 really the year of the AI agent? — SDxCentral](https://www.sdxcentral.com/analysis/was-2025-really-the-year-of-the-ai-agent/)

**站内交叉**

- [从 chat 任务到 agent loop：Anthropic 一线工程实践 + 升级路径](/articles/research/topics/chat-to-agent-loop-anthropic-practice)
- [多 Agent 框架横向对比：AgentScope 2.0 / LangGraph / AutoGen / LangChain](/articles/research/topics/multi-agent-frameworks-comparison)
- [Cloudflare Edge Agents 实践](/articles/research/topics/cloudflare-edge-agents-practice)
