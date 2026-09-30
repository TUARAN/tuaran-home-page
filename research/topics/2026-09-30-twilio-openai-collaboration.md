---
title: Twilio 与 OpenAI 合作调研：从验证码客户到实时语音分发层
category: topics
topic_type: market
date: 2026-09-30
time: 09:11
tags: [Twilio, OpenAI, ChatGPT, Realtime API, GPT-Live, Voice AI, Agent Connect, CPaaS]
subjects: [business_market]
summary: Twilio 与 OpenAI 的关系同时包含客户采购、产品集成和开发者分发：OpenAI 使用 Twilio 的身份验证与通信网络，Twilio 把 OpenAI 模型接入 Segment、Voice 和 Agent Connect；双方没有公开排他、股权或收入分成安排。
tldr: 双方合作已经从 2022 年 Twilio Verify 支撑 ChatGPT 注册，延伸到 2023 年 GPT-4 与 Segment、2024 年 Realtime API 与 Voice、2026 年 GPT-Live-1 与 Agent Connect。Twilio提供号码、运营商网络、会话和企业交付层，OpenAI 提供模型与推理层。这是一组持续加深的产品集成和双向客户关系，公开资料不足以把它写成排他性战略联盟。
content_type: analysis
assistance: codex
model: gpt-5
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **合规提示：** AI 外呼、录音、转写和客户数据处理受目标国家或地区的通信、隐私、营销同意与退订规则约束。产品能够接通电话，不代表企业已经取得合法外呼或处理数据的权限。

Twilio 与 OpenAI 的合作很容易被压缩成一句“OpenAI 负责大模型，Twilio 负责打电话”。公开资料显示，两家公司之间至少有三条并行关系：OpenAI 是 Twilio 客户，Twilio 是 OpenAI 模型的集成和分发渠道，双方还共同维护面向开发者的实时语音接入路径。

## 一、先给结论

- **合作已经持续四年，但没有公开成一份排他性大协议。** 双方从 2022 年的账号安全客户关系，逐步走到 GPT-4、Realtime API 和 GPT-Live-1 的产品集成。公开公告没有披露股权投资、最低采购额、收入分成、排他条款或多年合同金额。
- **Twilio 给 OpenAI 补的是“现实世界入口”。** 电话号码、PSTN/SIP、运营商路由、SMS、身份验证、会话状态、录音分析和人工转接，都在模型推理之外。OpenAI 可以借这些能力把 ChatGPT 和 API 模型送到普通电话及企业呼叫流程。
- **OpenAI 给 Twilio 补的是“对话智能”。** GPT-4 最初用于生成内容和客户个性化；Realtime API 与 GPT-Live 随后把合作重点推向低延迟语音 Agent。Twilio 因此能从通信管道向会话编排、记忆和智能分析收取更多软件费用。
- **双方都保留替代选项。** OpenAI 的 GPT-Live 合作伙伴目录同时列出 LiveKit、Twilio、Telnyx 和 Daily/Pipecat，并支持直接 SIP；Twilio 的 Agent Connect 也支持 OpenAI 之外的模型和 Agent 框架。这更接近开放生态中的重点集成伙伴关系。
- **能确认产品采用，暂时不能确认财务贡献。** Twilio 披露 OpenAI 使用 Verify、1-800-ChatGPT 及其他工作负载，但没有单列来自 OpenAI 的收入。Twilio 2025 年 10-K 只说明没有任何单一客户贡献超过总收入的 10%。

一句话概括：OpenAI 让 Twilio 的电话和消息具备实时理解与生成能力，Twilio 让 OpenAI 的模型进入受运营商、号码、身份和企业流程约束的通信世界。

## 二、合作是怎样一步步形成的

| 时间 | 已确认事项 | 关系的变化 |
|---|---|---|
| 2022 年 11 月前后 | OpenAI 已是 Twilio Account Security 客户；ChatGPT 上线流量激增时使用 Twilio Verify，随后扩大承诺 | OpenAI 采购 Twilio，先解决注册验证、欺诈与扩容 |
| 2023 年 8 月 | Twilio 宣布在 Segment / Engage 中接入 GPT-4，给营销内容与客户互动加入生成能力；Sam Altman 参加 SIGNAL 2023 | 从单向采购扩展成联合产品集成 |
| 2024 年 10 月 | OpenAI 发布 Realtime API，双方同步宣布与 Twilio Voice 集成，支持 GPT-4o 流式语音到语音 | 合作重心由文本生成转向实时语音 Agent |
| 2024 年 12 月 | OpenAI 推出 1-800-CHATGPT，电话和当时的 WhatsApp 入口由 Twilio 提供通信能力 | OpenAI 既向 Twilio 提供模型，也直接使用 Twilio 触达消费者 |
| 2026 年 5 月 | Twilio Agent Connect 正式可用，统一 Voice、SMS、WhatsApp、RCS、Chat 与外部 Agent | Twilio 开始把模型接入收成标准中间件 |
| 2026 年 9 月 | GPT-Live-1 进入 OpenAI API；Agent Connect 新增原生 `GPTLiveProvider`，Twilio 同步提供 Python、Node.js 与样例仓库 | 实时语音集成进入全双工模型与后端推理分工阶段 |

最早一层常被后续的 AI 叙事盖住。Twilio 在 2022 年第四季度业绩材料中说，OpenAI 在 ChatGPT 发布前已经使用其账号安全产品；用户量暴涨时 Verify 承担了验证和反欺诈流量，并促成更大规模的客户承诺。[Twilio 2022 Q4 prepared remarks](https://investors.twilio.com/static-files/0915e345-5f7a-4a9e-89ef-37882cd3221f)

2023 年的正式集成仍以文字和客户数据为主。Twilio 计划让 Engage 使用 GPT-4 生成内容，Segment 则把企业的一方客户数据整理成可供模型使用的上下文。其商业逻辑是让同一个模型根据客户画像、历史行为和渠道差异生成不同内容。[Twilio：2023 年 OpenAI 集成公告](https://www.twilio.com/en-us/press/releases/twilio-to-deliver-customer-aware-generative-ai-through-new-opena)

真正改变产品边界的是 2024 年 Realtime API。OpenAI 首发公告明确写到与 Twilio 合作，把 Realtime API 接到 Twilio Voice APIs；Twilio 的同步公告则强调录音、通话分析、AI Operators 和企业语音工作流。[OpenAI：Introducing the Realtime API](https://openai.com/index/introducing-the-realtime-api/) · [Twilio：Realtime API 集成公告](https://www.twilio.com/en-us/press/releases/openai-integration)

1-800-CHATGPT 又把关系翻转了一次。OpenAI 不只向 Twilio 客户出售模型，也成为 Twilio 通信网络的直接使用者。Twilio 投资者材料称，团队为上线当天 **6000% 的吞吐量增长**做过准备；这一数字覆盖 2024 年 12 月 18 日至 2025 年 1 月 10 日的早期电话与消息数据，属于公司案例材料，不能外推为长期业务规模。[Twilio：1-800-ChatGPT 案例](https://investors.twilio.com/static-files/218e9165-cd58-49dd-b578-437fb1ad3460)

## 三、2026 年最新集成到底接了什么

GPT-Live-1 把实时语音拆成前后两部分：前端模型持续听、说、处理停顿与插话；遇到检索、推理或工具调用时，再把任务委托给后端模型或企业自己的 Agent。OpenAI 将其称为 delegation。语音层按会话时长计费，当前为每分钟 0.05 美元，后端模型和工具另行收费。[OpenAI：GPT-Live-1 发布公告](https://openai.com/index/introducing-gpt-live-1-in-the-api/) · [OpenAI：GPT-Live-1 模型页](https://developers.openai.com/api/docs/models/gpt-live-1)

Twilio 的原生接法位于 Agent Connect。Python SDK 2.4.0 之后的 `GPTLiveProvider` 可以把 Twilio Voice Media Streams 的音频直接接到 GPT-Live-1，电话两端使用相同的 8kHz μ-law 格式，开发者少写一层音频转码、打断处理和 WebSocket 胶水。业务仍需自行配置 OpenAI 与 Twilio 凭证、公开服务、提示词、工具权限、错误恢复和数据策略。[Twilio：GPT-Live-1 集成资源](https://www.twilio.com/en-us/blog/developers/twilio-openai-gpt-live-1-api-resources) · [Twilio：Agent Connect Python 教程](https://www.twilio.com/en-us/blog/developers/tutorials/integrations/tac-gpt-live-voice-ai-agent-python)

当前可以选择三条主要链路：

| 路线 | 音频与控制路径 | 适合什么团队 |
|---|---|---|
| Agent Connect + GPT-Live | Twilio Media Streams → Agent Connect → OpenAI Live API | 希望复用 Twilio 多渠道会话、记忆和人工转接，又不想手写音频桥接 |
| Twilio Elastic SIP + OpenAI SIP | 电话经 Twilio SIP Trunk 直接进入 OpenAI，业务后端用 webhook / sideband 控制 | 已有 SIP 与企业电话体系，希望缩短媒体路径 |
| ConversationRelay + OpenAI 文本模型 | Twilio 完成 STT、轮次和 TTS，应用把文本发给 OpenAI | 需要选择不同 STT/TTS 供应商，或保留文本式 Agent 架构 |

这三条路线会并存。GPT-Live 的全双工体验更自然，直接 SIP 的媒体路径更短，ConversationRelay 则让企业分别控制转写、模型和合成语音。OpenAI 的电话文档把 Twilio 列为 SIP trunking provider 示例；Twilio 的 OpenAI 集成页也同时保留三套方案。[OpenAI：Telephony and SIP](https://developers.openai.com/api/docs/guides/voice-sip) · [Twilio：OpenAI integrations](https://www.twilio.com/en-us/integrations/open-ai)

## 四、两家公司各自得到什么

### Twilio：守住通信出口，并向上卖软件

模型公司可以提供语音理解和推理，仍要解决电话号码、运营商互联、国家路由、呼入呼出、录音、身份、同意、退订、会话历史和人工接管。Twilio 已经拥有这些入口。与 OpenAI 的集成会增加 Voice 分钟、号码和 SIP 使用量，也给 Conversation Memory、Orchestrator、Intelligence、Flex 等软件产品创造交叉销售机会。

Twilio 还可以把“支持最新 OpenAI 模型”当作开发者获客渠道，同时保持模型中立。客户将来换后端模型，号码、通信路由和坐席体系仍可留在 Twilio。

### OpenAI：进入电话网络和企业工作流

OpenAI 的模型能力可以直接覆盖浏览器和 App，电话网络是另一套基础设施。Twilio 把普通手机、呼叫中心、SIP trunk 和企业号码接入 OpenAI API，降低模型进入客服、预约、销售、通知及无障碍场景的门槛。

1-800-CHATGPT 还验证了一条消费者分发路径：用户可以不安装 App，直接拨打电话号码使用 ChatGPT。它同时暴露出渠道依赖——WhatsApp 或运营商政策变化，会影响入口是否继续可用；模型提供商无法单独控制整条分发链。

### 开发者：集成变短，责任没有消失

原生 SDK 可以减少音频格式、WebSocket、轮次与打断代码。生产系统仍要处理身份校验、工具授权、重复 webhook、幂等、延迟、失败降级、人工转接、数据留存和成本上限。OpenAI 的 delegation 文档也明确把权限、确认、业务记录和任务状态留给应用负责。[OpenAI：GPT-Live delegation and tools](https://developers.openai.com/api/docs/guides/live-delegation)

## 五、这是不是“战略合作”

“合作”可以确认，“排他性战略联盟”缺少证据。

支持合作关系的材料很充分：双方公告互相引用；OpenAI 官方文档把 Twilio 列为 GPT-Live 电话合作伙伴；Twilio 为 OpenAI 模型维护原生 Provider、教程和样例；OpenAI 自己也是 Twilio 的 Verify 与通信客户。

公开资料没有给出下列内容：

- 双方合同期限、最低采购或收入分成；
- OpenAI 对 Twilio 的股权投资，或 Twilio 对 OpenAI 的股权投资；
- 模型、云通信或电话渠道的排他条款；
- OpenAI 为 Twilio 带来的单独收入与毛利。

双方的产品选择也显示关系并不排他。OpenAI 的 GPT-Live 合作伙伴页面同时列出 LiveKit、Twilio、Telnyx、Daily/Pipecat；Twilio 又与 AWS、Microsoft 及其他模型和语音厂商合作。[OpenAI：GPT-Live partner integrations](https://developers.openai.com/api/docs/guides/live-partner-integrations) Twilio 2025 年 10-K 只披露，2023—2025 年没有任何单一客户超过总收入的 10%，因此不能把 OpenAI 描述成已经决定 Twilio 财务表现的核心客户。[Twilio 2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/1447669/000144766926000021/twlo-20251231.htm)

## 六、外部研判

双方合作已经明确了 Voice Agent 的产业分工，价值也由这套分工决定：

1. OpenAI 管实时对话、推理和工具委托；
2. Twilio 管电话号码、运营商网络、渠道、会话与企业交付；
3. 企业自己管客户授权、业务规则、工具权限、数据和最终责任。

这套分工会让语音 Agent 更快进入真实业务，同时也限制双方的议价权。OpenAI 正在提供直接 SIP，并接入多家电话或媒体伙伴；Twilio 则主动保持模型中立。任何一方都在防止自己退化成完全可替换的单层供应商。

对 Twilio 来说，真正需要验证的是软件附加收入能否比底层通话成本更快增长。对 OpenAI 来说，需要验证的是企业客户是否愿意把实时电话交互、客户上下文和工具操作稳定地放进同一条模型链路。双方已经证明“能接通”，尚未公开证明这套组合在大规模企业部署中的单位经济、任务成功率和合规成本。

## 七、信息来源与持续验证

主要事实优先采用 OpenAI、Twilio 官方公告与文档，以及 Twilio 向 SEC 提交的定期报告；资料截至 2026 年 9 月 30 日。站内相关背景可继续看 [Twilio 公司观察](/articles/research/companies/twilio)、[Twilio AI+通信进展](/articles/research/topics/twilio-ai-communications) 和 [Twilio Agent Connect 调研](/articles/research/topics/twilio-agent-connect)。

持续验证：

- 双方若披露合同金额、期限、排他性或收入贡献，会直接改变“重点产品集成伙伴、但非排他战略联盟”的判断。
- GPT-Live-1 与 Twilio Voice、SIP、Agent Connect、后端模型及工具的完整账单尚无官方统一样例，企业单位成本需要按国家、通话方向、号码和任务链重新计算。
- 大规模生产案例目前以双方材料为主；独立的任务成功率、平均延迟、人工转接率与合规事故数据仍有限。
