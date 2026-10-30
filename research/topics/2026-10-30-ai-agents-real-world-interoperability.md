---
title: 智能体走出自己的聊天框：互联互通的两条路与市场机会
category: topics
topic_type: market
subjects: [business_market, technology]
content_type: analysis
date: 2026-10-30
time: 15:12
tags: [智能体, 互联互通, MCP, A2A, 智能体商业, 外部世界]
summary: 智能体要创造可验证的价值，必须接触真实的人、系统和交易。比较把别人带进自己的入口，以及主动进入别人的工作流这两条路。
tldr: 接口数量说明接入意愿，已完成且可追责的外部任务才说明价值。近期机会集中在有明确任务、授权、结果回执和异常处理的场景。
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

一个智能体可以把行程安排得很漂亮。到了订票这一步，它要知道真实库存和价格，取得付款授权，收到订单号；如果航班变动，还得有人能改签。少了这些连接，对话再流畅，也只能停在建议层。

## 先给结论

智能体的互联互通有两个产品方向：**把外部的人与服务带进自己的任务空间**，或**让自己的能力进入别人已经使用的入口和流程**。两者都要经过身份、授权、执行、回执和异常处理，才能把一次对话变成一件完成的事。

- **现有系统的接入比智能体之间“互相聊天”更迫切。** 用户的账户、库存、日历、订单、付款和客服都在外部系统。MCP 降低工具与数据接入成本，A2A 处理跨智能体的任务协作；它们覆盖的环节不同。
- **入口决定谁能发起任务，系统记录决定任务是否完成。** 聊天、电话、浏览器和应用内插件可以带来需求，订单、工单和日历中的状态变化才是交付证据。
- **市场还在验证阶段。** 麦肯锡 2025 年全球调查中，23% 的受访者表示所在组织已在至少一个职能扩展智能体系统，另有 39% 正在试验；这不是智能体互联互通的付费渗透率。调查同时指出，单一职能中报告规模化使用的受访者均不超过 10%。[来源](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025)
- **更可能先收钱的是完整结果。** 预约成功、工单解决、订单完成、客户问题得到处理，可以核算收益和责任。通用协议与连接器降低接入成本，但单独提供一个接口很难证明客户获得了多少价值。

## 两条路：拉进来，或走进去

| 方向 | 用户在哪里开始 | 智能体需要掌握什么 | 最容易卡住的一步 | 已有例子 |
| --- | --- | --- | --- | --- |
| 把别人带进来 | 智能体自己的聊天、电话或任务空间 | 对方身份、加入意愿、参与边界、共享状态 | 对方为什么要进入一个新入口，进入后谁有权决定 | ChatGPT 的应用让外部服务在对话中提供数据和动作；电话助手可直接把商家接入当前任务 |
| 主动走进去 | 企业软件、消息平台、搜索、商家结算或别人的智能体 | 平台规则、用户授权、外部 API、交易状态 | 权限能否取得，以及外部系统是否承认执行结果 | MCP 工具接入、A2A 任务委派、商家接入 AI 购物结算 |

第一条路的优势是可以设计完整体验：用户在一个地方交代任务、看进度、批准动作。代价是要解决分发和网络效应。外部参与者已有自己的邮箱、微信、企业系统和客服流程；每增加一次注册或切换，任务完成率就可能下降。

第二条路借用既有流量和信任关系。比如商家把商品与结算能力接入 AI 购物入口，企业把工单系统开放给授权的智能体。代价是受平台审核、权限范围、接口变化和商业分成约束。入口方也可能拥有用户关系与推荐位置。

两条路可以从同一任务的不同阶段接合：用户在助手里提出“周五下午找个维修师傅”；助手从服务商获取报价，邀请用户批准；服务商在自己的系统接单；最终把订单号和服务状态送回助手。**人可以留在熟悉的界面里，任务状态必须跨系统对得上。**

## 已经铺到哪里

**工具与数据。** MCP 让智能体发现并调用外部服务暴露的能力。MCP 项目在 2026 年 7 月发布新版规范时称，Tier 1 SDK 合计月下载量接近 5 亿次，TypeScript 和 Python SDK 的累计下载量各超过 10 亿次。[MCP 官方发布说明](https://blog.modelcontextprotocol.io/posts/2026-07-28/) 这些是软件包下载量，包含自动构建和重复下载，不能换算为活跃智能体、企业客户或付费任务。Cloudflare 的[文档](https://developers.cloudflare.com/agents/tools/mcp/)展示了智能体作为 MCP 客户端接入远程工具的方式；它也开始提供企业侧的 MCP 流量识别和策略控制。[Cloudflare 产品说明](https://developers.cloudflare.com/changelog/post/2026-08-12-mcp-detection-and-dashboard/)

**智能体之间。** A2A 允许智能体声明能力、发现对方并委派任务。Linux 基金会 2026 年 4 月披露，A2A 已获得超过 150 家组织支持，并在多家云平台集成。[Linux 基金会公告](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year) 支持组织数量说明生态参与，不能说明跨企业任务的成交规模。A2A 的 Agent Card、任务状态与认证机制解决的是“找谁做、如何交办、如何知道进度”；对方是否被允许访问客户数据、能否履约，仍要由业务系统和双方组织决定。[Google 原始发布说明](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)

**进入大平台。** OpenAI 允许开发者用基于 MCP 的 Apps SDK，把服务的界面和动作放入 ChatGPT，并提交应用审核。[OpenAI 发布说明](https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/) 当前企业工作区的自定义 MCP 应用支持经过管理员控制的写入动作；开放范围、审核和授权条件由平台决定。[OpenAI 帮助文档](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt) 这条路给服务商带来需求入口，也让它必须争取被调用、被推荐和被用户授权。

**交易闭环。** OpenAI 的 Agentic Commerce Protocol 要求商家提供商品数据、结算会话与订单事件；商家保留订单、收款、履约和售后的责任。[协议说明](https://developers.openai.com/commerce/guides/key-concepts) Google 的 UCP 把商品目录、购物车、结算和身份关联做成可组合能力；2026 年 9 月已有零售商通过 UCP 在 Google 的搜索和 Gemini 场景销售。[Google 更新](https://blog.google/products-and-platforms/products/shopping/google-shopping-updates-holiday-shopping/) 这些案例把互联互通推进到真实订单，但尚不能据此推断全行业交易规模。

**没有结构化接口的外部世界。** 电话和浏览器仍是最后一段路。Google Duplex 展示过替用户拨打商家电话预约；今天的智能体也可以通过电话或网页处理尚未开放 API 的任务。电话与网页更接近人的操作环境，结果却需要额外核验：对方是否真的接受预约、页面是否显示最终确认、是否会有重复提交。网页还可能携带恶意指令；Anthropic 把提示注入列为浏览器智能体的重要风险，并说明即使防护进步，风险仍未消失。[Duplex 官方介绍](https://blog.google/products-and-platforms/products/assistant/io18/) · [Anthropic 安全研究](https://www.anthropic.com/research/prompt-injection-defenses)

## 难点在“谁负责”，也在状态对账

协议能传递请求，真实任务还需要一条完整的责任链。

1. **发现与选择。** 有多个服务商时，智能体依据什么选择？能力描述、价格、地理位置、实时可用性和历史履约记录都需要可比较的数据。能被发现不等于会被选中。
2. **身份与授权。** 用户让助手“订一张票”，并未自动授权它更改任意订单或把个人资料发给任意代理。权限应限定动作、对象、金额、时效和可访问数据；高影响动作需要明确批准。Google AP2 的授权凭证和 OpenAI 的委托支付设计，都在处理这一层。[Google 协议说明](https://developers.googleblog.com/developers-guide-to-ai-agent-protocols/) · [OpenAI 支付说明](https://developers.openai.com/commerce/guides/key-concepts)
3. **执行与回执。** “我已发送请求”只是过程状态。预约号、订单号、工单状态、付款结果和服务商确认才是结果。重试时还要有幂等标识，避免重复下单。OpenAI 的结算规范明确要求订单事件、签名和幂等处理。[结算规范](https://developers.openai.com/commerce/specs/checkout)
4. **异常与争议。** 外部世界会拒单、变价、延迟、取消，也会出现模型误解。需要能定位哪一步出错、由谁接手、退款或撤销怎么走。跨组织协作越多，审计日志和人工接管越值钱。

因此，“连接了多少智能体”只能衡量供给侧的准备程度。更有用的运营指标是：**获授权任务数、外部动作成功率、最终完成率、重复执行率、人工接管率、单次完成成本和争议率**。这些指标必须按场景拆开；一次信息查询和一次付款无法混成同一个完成率。

## 市场机会：从任务预算和交易责任出发

公开数据说明需求正在出现，却还不足以给“智能体互联互通”算出可靠的独立市场规模。麦肯锡的调查统计的是企业采用阶段；MCP 下载量和 A2A 支持方统计的是技术生态；Gartner 预计到 2028 年 33% 的企业软件应用会包含智能体能力，这属于**预测**，也不是互联互通公司的收入。[Gartner 预测原文](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027) Gartner 同一份公告还预测，2027 年底前超过 40% 的智能体项目会被取消，原因包括成本上升、业务价值不清和风险控制不足。

按客户愿意为什么付费，可以把机会分成四层：

| 市场层 | 谁付钱 | 可收费的交付物 | 主要竞争或约束 |
| --- | --- | --- | --- |
| 连接与治理 | 企业 IT、安全、平台团队 | 连接器、身份授权、策略、日志、审批与成本控制 | 大平台会内建通用连接能力；需证明跨平台管理价值 |
| 场景执行 | 客服、销售、运营、采购等业务部门 | 预约、工单、报价、线索处理等已完成任务 | 需打通行业系统，并承担异常处理与服务质量 |
| 商家接入 | 零售商、服务商、交易平台 | 可发现的商品与服务、实时库存、结算与售后接口 | 平台掌握分发；商品数据质量和佣金会影响收益 |
| 线下与人工交接 | 本地服务、呼叫中心、履约网络 | 电话接入、人工确认、上门履约、争议处理 | 单位成本高，地域和行业差异大 |

估算某个细分机会，先取**目标客户每月真实任务量 × 当前无法完成的比例 × 接入后可新增完成的比例 × 每单可分配价值**，再扣除模型、接口、人工接管、获客和争议成本。这是测算方法，不是公开市场规模。比如把“能查询库存”误算成“能完成采购”，会同时高估任务量和单次价值。

我更看好两类切口：**已有系统记录、但操作分散的重复任务**，例如企业工单与预约；以及**已有购买意图、但商品和结算状态分散的交易**。它们能拿到明确的前后状态。单纯“让任意智能体与任意智能体聊天”的平台，若没有稳定任务流量或结果数据，容易停在演示。

## 怎样验证一个机会

选一个有真实任务量的窄场景，跑通十到二十个可复核任务，比先搭一个通用智能体市场更能说明问题。记录每个任务的发起方、授权范围、外部系统、调用次数、确认回执、耗时、人工接管和最终状态。选择合作方时，优先找有稳定 API 或明确人工接单流程的系统；网页和电话可以补缺口，但要把确认与重试设计进去。

如果两条路都想尝试，顺序可以是：先在已有用户入口里完成一个高频任务，拿到可追踪的回执；再把同一任务能力开放给其他智能体或平台。由此才能检验外部分发是否带来新增完成量，也能看清用户关系、数据和责任如何分配。

## 主要来源与持续验证

资料核对至 **2026 年 10 月 30 日**。采用 [麦肯锡 2025 年全球 AI 调查](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025)、[MCP 规范发布说明](https://blog.modelcontextprotocol.io/posts/2026-07-28/)、[Linux 基金会 A2A 公告](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)、[OpenAI 商业协议文档](https://developers.openai.com/commerce/guides/key-concepts)、[Google UCP 更新](https://blog.google/products-and-platforms/products/shopping/google-shopping-updates-holiday-shopping/)与[Gartner 预测](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)。产品能力和开放范围按各官方页面当时描述；市场预测与已发生的采用数据分开处理。

- 若未来出现可比的跨平台任务完成量、交易额和净收入披露，可重新测算独立市场规模。
- 若平台大规模开放写入权限与结算，同时第三方服务商能保留客户关系，商家接入层的价值分配需要重估。

延伸阅读：[智能体怎么发消息、打电话：五类产品设计](/articles/research/topics/ai-agent-messaging-calling-launch-videos)。
