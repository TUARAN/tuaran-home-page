---
title: "Muse 与 Instinct：个人 Agent 开始接管消息和电话，能力边界在哪里"
category: topics
topic_type: product
date: "2026-10-16"
tags: [Muse, Instinct, Meta, 个人智能体, AI Agent, 短信, 电话, WhatsApp]
subjects: [ai_dev, business_market]
summary: "从消息入口、代拨电话和近期产品更新看 Muse 与 Instinct：两家都在让 Agent 办事，但普通 SMS、电话开放范围和人工参与程度需要分别核对。"
tldr: "Instinct 允许用户发消息或打电话给 Agent，并推出代拨电话的 Concierge；Muse 以应用和 WhatsApp 为入口，面向美国商家的代拨电话仍处测试阶段。两者均未公开证明可普遍代用户向任意号码发送运营商 SMS。"
content_type: analysis
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

Muse 和 Instinct 都在把个人 Agent 从聊天框推进到现实事务：读邮件、安排日程、下单、与商家沟通。**Instinct 把给 Agent 发消息和打电话做成了直接入口；Muse 以自家应用和 WhatsApp 承接对话，并扩展到小企业工具。**两者都宣布了代拨电话能力，开放范围与执行方式仍有差别。[Instinct 官网](https://instinct.com/)；[Meta 产品公告](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)

判断“原生通信能力”时，至少要分清三件事：用户怎样联系 Agent；Agent 能否联系第三人；实际由 AI、人工还是混合流程完成。应用内聊天、WhatsApp、iMessage 和运营商 SMS 也各有传输与权限边界。公开材料足以确认前两家的主要产品入口及代拨电话方向，**不足以确认两者都能像手机号码一样，面向任意联系人稳定收发普通 SMS、接听任意来电**。

近期最值得留意的更新有四项：9 月 23—24 日 Meta 宣布 Muse 将进入 AI 眼镜，并获得自己的邮箱地址；9 月 29 日 Muse 扩到小企业场景；9 月 28 日 Instinct 公布 10 亿美元 C 轮融资；10 月 12 日 Meta 发布 Muse Wonder 模型，但它尚未全面成为 Muse 产品的底层模型。后者尤其容易被误读成“所有 Muse 用户已经用上新模型”。[Meta Connect 汇总](https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/)；[Muse for Small Business 公告](https://about.fb.com/news/2026/09/introducing-muse-small-business)；[Instinct 融资公告](https://www.businesswire.com/news/home/20260928153437/en/)；[Muse Wonder 公告](https://about.fb.com/news/2026/10/introducing-muse-wonder-models/)

## 二、最近发生了什么

| 时间 | 事件 | 对产品判断的影响 |
|---|---|---|
| 9 月 8 日 | Meta 推出 Muse，在美国通过 iOS、Android 和网页逐步开放，支持在 Muse 应用或 WhatsApp 中对话。 | Muse 的基础入口是应用与互联网消息。9 月 29 日的小企业公告又将可用区域表述为美国和加拿大，地域以用户实际账户开放情况为准。 |
| 9 月 16 日 | 两家扩展代拨电话功能：Muse 测试拨打美国商家；Instinct 推出 Concierge，先向部分早期用户开放。 | “会打电话”已进入产品测试与服务阶段，不能据此推断任意号码、任意地区都能拨打。 |
| 9 月 23—24 日 | Meta 宣布 Muse 将进入 AI 眼镜，还将拥有独立邮箱地址、语音模式和更多连接器。 | 眼镜端属于未来数月的计划；眼镜本身能接电话，也不等于 Muse 已支持普通电话拨入。 |
| 9 月 28 日 | Instinct 公布由 Sequoia、Benchmark 和 Coatue 参与的 10 亿美元 C 轮，公告标题给出 100 亿美元估值。 | 资金与产品扩张获得支持；公告未给出任务完成率、留存或单位成本。 |
| 9 月 29 日 | Muse for Small Business 增加 Facebook、Instagram 商业账号，以及 Shopify、QuickBooks、Slack、Zoom 等连接器。 | Muse 开始覆盖商家经营数据和工作流程，权限管理的重要性随之增加。 |
| 10 月 12 日 | Meta 发布 Muse Wonder 与 Muse Wonder Full。 | Wonder 已面向 API、Muse Code 用户开放，Meta 表示将来才会逐步用于 Muse 产品。 |

来源：[Meta 首发公告](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)、[Meta Connect 汇总](https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/)、[Muse 商业版公告](https://about.fb.com/news/2026/09/introducing-muse-small-business)、[Muse Wonder 公告](https://about.fb.com/news/2026/10/introducing-muse-wonder-models/)、[Instinct 融资及产品公告](https://www.businesswire.com/news/home/20260928153437/en/)。9 月 16 日两家电话功能的初期开放范围见 [TechCrunch 同日报道](https://techcrunch.com/2026/09/17/rival-ai-agents-instinct-and-metas-muse-both-add-the-ability-to-make-calls/)。

## 三、短信、消息、打电话：逐项核对

| 场景 | Muse | Instinct |
|---|---|---|
| 用户发消息给 Agent | Meta 官方列出 Muse 应用和 WhatsApp。 | 官网明确写明可以给 Instinct 发文字消息；公司公告单独提到 iMessage 位置共享。 |
| 用户用普通电话呼入 Agent | 官方产品页未列出普通电话拨入入口。 | 官网及公司公告明确写明可以打电话给 Instinct。 |
| Agent 替用户拨打电话 | 已测试拨打美国商家，开放给部分用户。 | Concierge 覆盖餐厅订位、牙医候补、账单事务等高接触场景；公告称产品仍处早期开放阶段。 |
| Agent 替用户向第三人发普通 SMS | 未查到 Meta 对通用 SMS 发件能力的明确说明。 | 官方的“text”没有逐项定义 SMS、iMessage 等通道，也没有给出向任意第三人发送 SMS 的完整能力边界。 |
| 独立电话号码与完整电信能力 | Meta 未把 Muse 描述为自带可供任意拨入、收发 SMS 的手机号码。 | 官网说 Instinct 能使用电话，但没有公布号码分配、国际覆盖、任意来电接听等完整规格。 |

Instinct 的[官网](https://instinct.com/)写明用户可以“发文字消息或打电话”，[融资公告](https://www.businesswire.com/news/home/20260928153437/en/)进一步列出 Concierge、iMessage 位置共享和 Agent 间通信。[服务条款](https://instinct.com/terms)另有 SMS 章节，但该章节讨论的是登录验证码及服务通知；不能把这段法律文本当作“Agent 可向所有联系人发送普通短信”的产品证明。Meta 的[首发公告](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)明确列出应用与 WhatsApp，没有把 SMS 列为 Muse 的默认聊天入口。

电话还存在一层容易忽略的执行差异。Meta 工程人员公开表示，Muse 面向美国商家的外呼处于测试；[404 Media 查看 Meta 内部材料后的报道](https://www.404media.co/meta-tests-muse-ai-agent-calls-that-are-actually-made-by-humans-in-a-call-center/)称，Meta 曾测试把部分电话请求交给受训人员处理，报道也写明不清楚转交比例。Meta 对媒体回应称这是内部测试，将在准备妥当并作适当披露后才推出相关功能。**因此，“Muse 可以代拨电话”描述的是用户请求与结果交付，不能自动推出每通电话都由 AI 独立完成。** Instinct 的 Concierge 使用“白手套服务”表述，其[公司公告](https://www.businesswire.com/news/home/20260928153437/en/)同样没有公开每通电话的人工参与比例。

## 四、两条产品路线

Muse 的优势来自 Meta 已有的应用、账号和商家连接。它运行在用户专属的云端虚拟机上，能够调用浏览器与连接器；Meta 声称关键外部操作经过独立的 Sentinel 权限层，用户可以查看活动记录、设置连接器权限。[Meta 技术说明](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse)列出了虚拟机、凭据隔离和网络出口控制。9 月下旬的商业版进一步把广告账号、店铺、账务和办公工具纳入工作范围。[Muse for Small Business 公告](https://about.fb.com/news/2026/09/introducing-muse-small-business)

Instinct 把“给助手发消息、打电话”放在最前面，再让 Agent 使用自己的电话和电脑完成任务。融资公告列出 Concierge、可信联系人网络、Agent 间文件传输和 iMessage 位置共享。这个路线减少了用户切换应用的动作，也把成功与否压在执行链上：能否找到正确联系人、等待接通、把约定写准、在权限范围内付款或修改订单。[Instinct 官网](https://instinct.com/)；[融资公告](https://www.businesswire.com/news/home/20260928153437/en/)

两家公司公开的是能力与架构说明，还没有可直接对比的长期任务完成率、每项任务的人工介入率、误操作率和成本数据。因此，100 亿美元估值说明资本市场愿意为 Instinct 的机会投入资金，**不能代替产品可靠性指标**；Meta 的连接器数量和新模型发布，也不能代替同一组真实任务下的完成质量比较。

## 五、使用时该看什么

如果需求是“给 Agent 发个消息，让它处理日程、购物和邮件”，两者都有明确路径：Muse 用应用或 WhatsApp，Instinct 用文字消息；具体服务和地区仍要看账户权限。如果需求是“让 Agent 打电话订位”，应先确认账户是否获得外呼资格、目标是否为支持地区的商家，以及电话中是否可能有人接手。若需求是“替我向任意手机号发 SMS，或者接听我的电话”，当前公开资料不能给出两家均已原生支持的结论。

对个人 Agent 更有用的比较方法，是给同一类任务记录五项结果：是否完成、用了多久、修改或付款前是否征得同意、最终确认信息是否正确、失败后能否说明原因并恢复。消息渠道决定进入门槛；这些结果决定能否把真实事务持续交给它。

## 信息来源与持续验证

资料截至 **2026 年 10 月 16 日**。主要依据为 [Meta Muse 首发公告](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)、[Meta Connect 更新](https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/)、[Muse for Small Business 公告](https://about.fb.com/news/2026/09/introducing-muse-small-business)、[Muse Wonder 公告](https://about.fb.com/news/2026/10/introducing-muse-wonder-models/)、[Muse 安全架构说明](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse)、[Instinct 官网](https://instinct.com/)、[Instinct 融资公告](https://www.businesswire.com/news/home/20260928153437/en/)及[服务条款](https://instinct.com/terms)。电话测试及人工协助争议分别参考 [TechCrunch](https://techcrunch.com/2026/09/17/rival-ai-agents-instinct-and-metas-muse-both-add-the-ability-to-make-calls/) 与 [404 Media 的原始报道及 Meta 回应](https://www.404media.co/meta-tests-muse-ai-agent-calls-that-are-actually-made-by-humans-in-a-call-center/)；两篇报道中的测试状态不能扩写成所有账户的现状。

持续验证：Muse 外呼何时全面上线、覆盖哪些号码及人工接手如何披露；Instinct 是否公布普通 SMS 的收发范围和呼入规则；两家是否公开可复核的任务完成率与人工介入数据。
