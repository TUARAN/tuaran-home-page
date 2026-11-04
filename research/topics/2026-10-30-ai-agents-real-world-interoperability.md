---
title: 智能体走出聊天框：互联互通的两条路与可核验边界
category: topics
topic_type: market
subjects: [business_market]
content_type: analysis
date: 2026-10-30
time: 15:12
updated: 2026-11-04
tags: [智能体, 互联互通, MCP, A2A, 智能体商业, 外部世界, 协议]
summary: 智能体要交付可追责的外部结果，必须接上真实系统。比较「把别人带进自己的入口」与「走进别人的工作流」两条产品路，并把 MCP / A2A 等协议证据与未验证的市场口号分开。
tldr: 接口数量说明接入意愿；已完成且可追责的外部任务才说明价值。协议层可核验的是 MCP（工具/数据）与 A2A（智能体协作）的官方定位；IBM ACP 已并入 A2A，不宜再当并行现行标准。市场渗透与「独立市场规模」缺同口径公开数，本稿不加。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **互联互通有两条产品方向**：把外部的人与服务拉进智能体自己的任务空间；或让智能体能力进入别人已经在用的入口与流程。两者都要经过身份、授权、执行、回执与异常处理，对话才能变成办完的事。
2. **协议层目前能钉住的分工**：MCP 解决 agent↔工具/数据；A2A 解决 agent↔agent。官方与基金会材料反复强调二者互补，而不是二选一。[A2A 站点](https://a2a-protocol.org/latest/) · [MCP 2026-07-28 发布说明](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
3. **ACP 不再作为并行现行标准论述**：IBM Agent Communication Protocol（ACP）已于 2025-08 宣布与 A2A 合并，开发收缩并迁入 A2A；新互联工作应以 A2A 为准，ACP 仅作历史路径。[LF AI & Data 公告](https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/) · [IBM Research ACP 页](https://research.ibm.com/projects/agent-communication-protocol)
4. **采用调查与下载量不能直接换算成互联互通付费渗透**。麦肯锡 2025 全球 AI 调查、MCP 官方博客的 SDK 下载口径、A2A「150+ 组织支持」都是各自口径的生态信号，不是跨平台已完成任务量或收入。
5. **更可能先形成可核算价值的，是带状态回执的完整结果**（预约成功、工单关闭、订单号落地），而不是「又多了一个协议连接器」。

## 二、事实层：协议与平台证据（可点开）

### 2.1 MCP：工具与数据面

MCP `2026-07-28` 规范把协议内核改成无状态请求/响应，并配套 MRTR、标准请求头、缓存提示与授权加固；官方博客同时给出 Tier 1 SDK「接近每月 5 亿次下载、TS/Python 累计各超 10 亿」的**项目方自述**。[博客](https://blog.modelcontextprotocol.io/posts/2026-07-28/) · [changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)

这些下载数包含 CI 与重复拉取，**不能**换算活跃智能体数、企业客户数或付费任务数。本稿只把它标成生态热度信号。

Cloudflare 文档展示 Agents 作为 MCP **客户端**接入远程工具，以及托管 MCP server 目录；那是平台实现，不是「全市场互操作已完成」的证明。[Agents MCP](https://developers.cloudflare.com/agents/tools/mcp/)

### 2.2 A2A：智能体协作面

Linux Foundation 2026-04-09 新闻稿称：A2A 支持组织超过 **150** 家，并称已进入多家云平台与部分行业生产部署；同时明确 A2A 与 MCP 互补（跨组织协作 vs 内部工具/数据）。[LF 新闻稿](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)

「支持组织数」与「生产部署存在」≠ 可加总的跨企业成交额。A2A 的 Agent Card、任务状态与认证机制回答的是发现、交办与进度语义；对方是否被允许碰客户数据、能否履约，仍由业务系统与双方组织决定。

2026-08 前后，A2A 进入 Agentic AI Foundation（AAIF）Growth Stage 的公开叙述出现在协议方博客与报道中；治理归属变化不自动改变协议职责边界，但会影响后续规范入口，跟踪时以 a2a-protocol.org / AAIF 现行页为准。

### 2.3 进入大平台与交易闭环（举例，非排行）

公开材料可核对的路径包括：

- OpenAI：基于 MCP 的 Apps / 连接器进入 ChatGPT 的开发者说明与管理员控制口径（开放范围以平台现行页为准）。
- 购物/结算：OpenAI Agentic Commerce 与 Google UCP 一类「目录—购物车—结算—订单事件」设计，把互联推进到订单状态；个案更新不能外推全行业交易规模。

电话与浏览器仍是无结构化 API 时的补缺手段。它们更接近人的操作环境，结果核验成本更高；提示注入等风险在浏览器智能体安全研究中被单独讨论，本稿不展开未复核的漏洞清单。

### 2.4 企业采用调查（边界）

麦肯锡 *State of AI 2025*：23% 受访者称所在组织已在至少一个职能扩展智能体系统，另有 39% 正在试验；单一职能中报告规模化使用的均不超过 10%。这是**组织采用阶段**调查，不是智能体互联互通的付费渗透率。[McKinsey](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025)

Gartner 关于「到某年多少企业软件含智能体能力 / 多少项目取消」的表述属于**预测**，本稿不把它写成已发生的互联市场规模。

## 三、结构：两条产品路与卡住判断的一层

| 方向 | 用户从哪里开始 | 智能体需要掌握什么 | 最容易卡住的一步 |
|---|---|---|---|
| 把别人带进来 | 智能体自己的聊天、电话或任务空间 | 对方身份、加入意愿、参与边界、共享状态 | 对方为何进入新入口；进入后谁拍板 |
| 主动走进去 | 企业软件、消息平台、搜索、商家结算或别人的智能体 | 平台规则、用户授权、外部 API、交易状态 | 权限能否取得；外部系统是否承认结果 |

两条路可以在同一任务的不同阶段接合：助手里提出需求 → 服务商系统接单 → 订单号与状态回写。人可以留在熟悉界面；**任务状态必须跨系统对得上**。

真正卡住外部价值判断的，通常是责任链是否闭环（协议存在本身不够）：

1. **发现与选择**：能力描述、价格、可用性、履约记录是否可比较。
2. **身份与授权**：用户授权「订一张票」不等于任意改单或任意外发资料；高影响动作需要明确批准与范围。
3. **执行与回执**：发送请求只是过程态；预约号、订单号、工单状态、付款结果才是结果。重试需要幂等。
4. **异常与争议**：拒单、变价、延迟、模型误解时，谁接手、如何撤销/退款、审计能否定位步骤。

因此运营上更有用的指标是：获授权任务数、外部动作成功率、最终完成率、重复执行率、人工接管率、单次完成成本、争议率——且必须按场景拆开。

## 四、外部研判

按「客户愿意为什么付钱」粗分四层（**结构观察，不是市场规模测算**）：连接与治理、场景执行、商家接入、线下/人工交接。大平台会内建通用连接；场景执行层要承担异常与服务质量；商家接入层的分发与佣金由入口方约束。

更看好两类切口：**已有系统记录但操作分散的重复任务**（工单、预约）；以及**已有购买意图但商品/结算状态分散的交易**。它们能拿到明确前后状态。「任意智能体与任意智能体聊天」的平台若没有稳定任务流与结果数据，容易停在演示——这是外部观察，不是对某一厂商的命运判决。

估算某个细分时，可用「目标客户每月真实任务量 × 当前无法完成比例 × 接入后可新增完成比例 × 每单可分配价值」，再扣模型、接口、人工接管、获客与争议成本。这是方法，不是公开市场规模。

## 五、信息来源与持续验证

资料复核至 **2026-11-04（Asia/Shanghai）**；原稿日期 2026-10-30 保留为首次发布日。

- [MCP 2026-07-28 规范发布说明](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [Linux Foundation A2A 一周年新闻稿](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)
- [A2A Protocol](https://a2a-protocol.org/latest/)
- [ACP 并入 A2A（LF AI & Data）](https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/)
- [麦肯锡 State of AI 2025](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025)

### 持续验证

- 若出现可比的跨平台「已完成外部任务量 / 交易额 / 净收入」披露，第四节机会分层可改写为带数量级的测算。
- 若 A2A / MCP 的治理入口或稳定版本号再次迁移（例如规范站点改址），事实层链接需同步替换；职责分工句只有在官方改口时才改。
