---
title: AI 会怎样反向冲击中心化软件
category: topics
date: 2026-10-20
time: 10:12
tags: [AI, Agent, SaaS, 平台经济, 软件商业模式]
summary: AI Agent 正把一部分操作入口从软件界面移到用户侧，但数据、交易、权限与协作网络仍由原平台掌握；不同软件承受的冲击强度相差很大。
tldr: 几乎所有依靠用户逐页操作的中心化软件都要面对 Agent 改写入口的压力。界面和重复工作流最容易被压价；掌握权威数据、真实供给、交易履约与组织权限的软件仍有强位置。平台还可能通过开放接口或自建 Agent 吸收这股变化。
topic_type: thesis
subjects: [business_market, ai_dev]
content_type: analysis
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

用户要完成的是一项任务，过去需要自己打开多个软件、理解各自的菜单，再把数据和结果搬来搬去。AI Agent 开始从用户这一侧接管跨软件的查找、填写、比较与执行。软件仍在提供数据和服务，但不再必然拥有用户完成任务时的第一入口。

由单一运营方控制账号、数据、规则或交易流程的软件，都可能被用户侧 Agent 通过网页、API 或协议调用。用户不必逐一进入原有界面，软件的操作入口、工作流和分发优势随之承压。冲击会落到几乎所有可被 Agent 操作的软件上，但用户流失和收入下降取决于它们掌握的数据、供给与交易能力。

变化已沿四条路径出现：

1. Agent 已能通过视觉界面操作网页和应用；软件没有提供专用接口，也不能保证用户必须亲自点完每一步。技术可用性已有产品证据，复杂任务的稳定性仍有限。[OpenAI 的 Computer-Using Agent](https://openai.com/index/computer-using-agent/)与[Anthropic 的 computer use](https://www.anthropic.com/news/3-5-models-and-computer-use)均展示了这条路径。
2. 连接标准和应用接口使用户可以在一个 Agent 入口调度多个服务。[MCP](https://www.anthropic.com/news/model-context-protocol)把数据源和工具接入 AI 客户端，[Figma 的 MCP 服务](https://www.figma.com/blog/design-context-everywhere-you-build/)展示了原软件主动把设计上下文带到外部工作流。
3. 交易也开始离开原来的浏览页面。Stripe 与 OpenAI 的 [Agentic Commerce Protocol](https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce)支持在 AI 入口发起购买，同时商家保留定价、履约和商户身份；Shopify 与 Google 的 [Universal Commerce Protocol](https://www.shopify.com/news/ai-commerce-at-scale)体现了平台主动争取这条新渠道。
4. 原平台掌握的数据真实性、供给、协作关系、权限和责任不会因为界面被 Agent 接管而自动消失。企业 Agent 仍须遵守源系统权限，[Microsoft 的 Copilot 连接器文档](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-connectors)对此写得很明确。

## 二、冲击从哪里发生

### 入口：用户先说目标，软件退到执行层

搜索商品、比较条件、填写表单、整理文件和更新工单，原先都被各软件的导航、筛选器与编辑器分开。Agent 若能理解目标并调用多个工具，用户就可能先打开 Agent，再由 Agent 访问软件。OpenAI 的 ChatGPT agent 已把浏览器操作和连接器放在同一任务流程里；这证明跨应用入口在产品层面存在，尚不能证明它已成为多数用户的日常习惯。[来源：OpenAI 产品说明](https://openai.com/index/introducing-chatgpt-agent/)。

对于靠广告、推荐位、站内搜索排序或复杂订阅升级路径获利的软件，入口改变可能削弱部分分发能力。协议上线还不足以说明相关收入已经下降。平台也可能在 Agent 结果里购买流量、接入新渠道，或把自己的服务嵌入 Agent。

### 工作流：标准操作更容易被重组

当软件主要把一组通用步骤包装成界面，例如搬运数据、套模板生成内容、按规则录入、跨系统汇总，Agent 有机会在多个产品之间重新组合这些步骤。单个软件的“流程封装”价值因此受到考验。

但重组工作流仍要调用底层系统。企业 CRM 中的客户记录、权限、审计轨迹和审批责任，无法靠模型生成一份相似文本来替代。Salesforce 的 [Agentforce 权限与信任说明](https://help.salesforce.com/s/articleView?id=ai.copilot_trust.htm&language=en_US&type=5)也表明，现有系统可以把 Agent 纳入自身控制层。由此可见，先受压的通常是人工操作层，系统记录层可能因 Agent 高频调用而更重要。

### 交易：渠道权与履约权开始分开

用户在 AI 对话里挑选和下单，商家的站内浏览时长可能缩短；商品、库存、支付、售后仍须由有权限的实体负责。Stripe 的 ACP 明确让商家保持商户身份及商品、订单控制权。Shopify 推出 UCP 和多 AI 渠道的中心化管理，说明平台正在把自身从“唯一购物入口”调整为“多入口交易基础设施”。这些资料证明交易链路正在改造，尚不能推出平台抽成必然下降。

### 新的集中：Agent 自己也可能成为平台

如果大量用户把任务交给少数 Agent，需求分发、身份授权、支付方式和结果排序会在 Agent 层重新集中。原软件可能丧失部分入口权，用户也可能从一个平台迁移到另一个平台。OpenAI 的[企业共享 Agent 产品](https://openai.com/index/introducing-workspace-agents-in-chatgpt/)已把连接数据源、组织权限和团队复用放进统一工作区；这是一条值得跟踪的再集中路径。

## 三、哪些软件更脆弱，哪些更稳

| 软件掌握的主要价值 | Agent 带来的直接压力 | 仍需观察的关键点 |
|---|---|---|
| 通用界面、模板和重复录入 | 用户可以通过 Agent 跨产品完成步骤，原界面的使用频次可能降低 | Agent 完成率、人工接管率、单位任务成本 |
| 内容聚合与导购入口 | 问答和比价可能前移到 Agent，原站曝光及广告位承压 | 原站流量、成交转化、渠道成本如何变化 |
| 权威业务记录与独有数据 | 外部 Agent 增加调用和议价压力 | 平台是否保住数据质量、权限、审计与计费权 |
| 双边市场和实时供给 | 发现入口可能被聚合，供给和履约仍留在市场内 | 供给是否可多平台接入，平台如何收费 |
| 高风险、强协作软件 | Agent 可辅助操作，最终决策、权限和责任链继续限制自动执行 | 错误责任、组织采购、安全与监管要求 |

这个表按价值来源分类。现实产品往往兼具多种价值，不能仅凭“中心化”三个字预测赢家和输家。

## 四、为什么现在还不能下终局判断

Agent 的跨软件操作已可用，但可靠性和安全边界仍在演进。OpenAI 在 2025 年公布的 CUA 测试中，OSWorld 完成率为 38.1%；这是特定模型、任务和测试条件下的结果，不能外推为今天所有 Agent 的通用成功率。[来源：OpenAI 测试说明](https://openai.com/index/computer-using-agent/)。真实工作还涉及登录、权限、验证码、变动中的界面、敏感数据和不可逆交易。OpenAI 对[提示注入](https://openai.com/safety/prompt-injections/)的说明也指出，外部内容可能诱导 Agent 偏离用户意图；敏感动作常需要确认。

目前缺少覆盖各类中心化软件的统一市场数据，Agent 带来的访问变化也尚未与软件收入变化可靠地对应起来。操作入口和重复工作流已经承压；用户、利润或独立性会流失多少，还要看具体产品掌握的资产和新渠道的实际表现。

更实用的检验方式，是为一个具体产品连续追踪五件事：用户任务从哪里发起；Agent 能独立完成多少；底层数据和交易由谁控制；平台从新渠道获得多少收入；失败或争议由谁负责。入口、利润和责任若分属不同主体，软件的商业位置才真正发生了变化。

## 五、信息来源与持续验证

资料截至 **2026 年 10 月 20 日**。主要依据为 OpenAI、Anthropic、Microsoft、Salesforce、Stripe、Shopify、Figma 的产品说明和技术文档。它们能够证明能力、协议和产品策略，不能单独证明整个软件行业的收入迁移。

持续验证：

- 主要软件品类中，经 Agent 发起的任务量、成交额和平台原生流量是否持续分化。
- Agent 渠道的收入分成、商家获客成本、平台抽成和用户留存是否发生可重复观察的变化。
- 长链路任务的完成率、人工接管率及安全事故成本，是否足以让企业把核心流程迁出原软件界面。
