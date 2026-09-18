---
title: WorkBuddy SkillHub 上的短信技能：搜得到，发得少
category: topics
topic_type: market
subjects: [workbuddy]
entity_type: product
content_type: analysis
date: 2026-09-18
time: "12:30"
updated: 2026-09-18
tags: [WorkBuddy, SkillHub, 短信, SMS, 5G消息, 中移互联网, 创蓝, Twilio, Telnyx]
summary: SkillHub 用「短信」能召回 899 条，真正能发短信的条目下载量多在数百级；搜索热度被防骗大师（42.8 万次下载）和海外 CPaaS 占据。中移互联网的「短信通知」2026-09-16 上架，只发给本人移动号码。
tldr: 2026-09-18 SkillHub 公开接口 `keyword=短信` 召回 899 条，水分很大。能发短信的头部是创蓝两份同名「AI短信发送工具」（775 / 668 次下载）和中移「短信通知」（46 次）；下载第一的「防骗大师.Skill」有 42.8 万次，做的是识别诈骗短信。
assistance: cursor
model: grok-4.6
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

SkillHub 用「短信」能列出几百条结果；真正把短信发出去的技能，下载量仍停在数百次，而且两份创蓝工具标题完全一样。

## 一、先给结论

1. **上架已经够密。** 2026-09-18，SkillHub 列表接口 `keyword=短信` 返回 **899** 条，其中大量只是描述里出现「短信」或日文「決算短信」。WorkBuddy 把 SkillHub 嵌在技能市场里，同一批条目会出现在「添加技能」的搜索结果中。
2. **用量分层极陡。** 「防骗大师.Skill」**428,146** 次下载、21 星，处理的是可疑短信和诈骗话术。真正走运营商或云通信网关发送的条目，头部只有创蓝两份同名工具（775、668）和阿里云 / 腾讯云短信（618、317）。
3. **国内可发通道刚出现官方主体。** 中移互联网有限公司 2026-09-16 发布 `@chinamobileinternet/sms-notify`（展示名「短信通知」），宣称优先走 5G「新消息」，失败再转短信，**只发给本人中国移动号码**；截至当日 **46** 次下载、0 星、0 次 installs。
4. **重复上架是常态。** 「AI短信发送工具」至少两份：`sms-send`（ClawHub `chuanglanyunzhi`）和 `send-sms`（ClawHub `xiaoweige1101`），摘要都是「通过创蓝短信平台发送模板短信」。Twilio、Telnyx、Google Messages 也各有多份镜像。
5. **下载次数不能当成 WorkBuddy 活跃用户。** ClawHub 同步过来的条目同时给出 `downloads` 和 `installs`，后者通常只有前者的 2%–9%。企业认证条目的 `installs` 经常为 0。公开接口没有会话调用量或成功送达条数。

对行业观察：**跟进**，把 SkillHub 当公开货架快照，每季对一次发送类下载和官方主体。对「用 WorkBuddy 给自己发强提醒」：**可以跟进实测**中移「短信通知」，前提是接收号是中国移动。对群发、营销、未授权触达：**不跟进**。把创蓝双份同名工具当主通道：**观望**。

资质与通道边界见[WorkBuddy + SMS / 5G 消息](/articles/research/topics/workbuddy-sms-rcs-channel)、[短信操纵本地 WorkBuddy](/articles/research/topics/workbuddy-sms-personal-agent)；本机 ACP 注入见[手机短信注入当前对话](/articles/research/topics/workbuddy-5g-sms-acp-current-session)。Skill 和 Channel 的分工见[用 Skill 实现 Channel](/articles/research/topics/workbuddy-skill-channel-architecture)。

## 二、事实层

### 2.1 货架入口

WorkBuddy 官方文档把技能市场拆成「推荐技能」和「已安装」，并写明可搜索关键词；第三方技能建议核验来源、权限和脚本。[技能说明](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) 同时提醒：Skill 可能把输入发往第三方，优先用官方推荐。手机端文档把 [SkillHub](https://www.skillhub.cn/) 列为安装更多技能的社区入口，复制安装指令贴回对话即可。[添加附件与技能](https://www.workbuddy.cn/docs/workbuddymini/features/Attachments-and-Skills)

SkillHub 列表接口 `GET https://api.skillhub.cn/api/skills` 在 2026-09-18 的返回：

| 查询 | `data.total` | 说明 |
|---|---:|---|
| 无关键词（全站） | 156,234 | 与官网「约 13.9 万」同一数量级，接口更新更快 |
| `keyword=短信` | 899 | 分词召回，含日文财报「決算短信」、办公套话、防骗 |
| `keyword=SMS` | 166 | 英文缩写，仍有 slug 误伤 |
| `keyword=创蓝` | 70 | 真正标题含创蓝的发送工具只有两份，其余为误召回 |
| `keyword=Twilio` | 36 | 含语音、WhatsApp、验证 |
| `keyword=Telnyx` | 12 | 含存储、TTS、10DLC 等非短信包 |
| `keyword=5G消息` | 3 | 几乎没有以 5G 消息为名的独立技能 |
| `keyword=阿里云短信` | 4 | |
| `keyword=腾讯云短信` | 5 | |

899 是分词命中，不宜写成「短信技能有 899 个」。

SkillHub 条目的 `source` 常见三类：`clawhub`（从 [ClawHub](https://clawhub.ai) 同步）、`enterprise`（企业认证发布者）、`community`（社区）。短信发送类头部几乎都是 `clawhub`；中移「短信通知」、智雨「短信沟通办公助手」、蚂蚁「短信工资条生成器」、硕软「短信通知群发」是 `enterprise`。

### 2.2 名称或摘要含「短信」的相关条目

接口里与短信直接相关、且能核验下载量的条目如下。Tdnet 因日文「決算短信」（财报）被召回，列在表内以免误读。

| 展示名 | slug | 下载 | 星 | 来源 | 实际做什么 |
|---|---|---:|---:|---|---|
| 防骗大师.Skill | `anti-fraud` | 428,146 | 21 | community | 识别可疑短信 / 诈骗话术，不发送 |
| Google Messages | `google-messages` | 3,408 | 0 | clawhub | 用 messages.google.com 收发 SMS/RCS |
| AgentCall | `agentcall` | 3,055 | 0 | clawhub | 给 Agent 真实号码，含短信、OTP、语音 |
| Skill（AgenticMail） | `agenticmail` | 2,139 | 2 | clawhub | 邮件 + 短信 + 存储，自称 63 个工具 |
| 诉讼信息中枢系统 | `litigation-hub` | 1,837 | 3 | community | 接收法院短信并归档、催期限 |
| Tdnet Disclosure Mcp | `tdnet-disclosure-mcp` | 1,795 | 0 | clawhub | 东京交易所適時開示；日文「決算短信」= 财报 |
| Telnyx Cli | `telnyx-cli` | 1,772 | 0 | clawhub | Telnyx CLI：短信、邮件、WhatsApp、号码 |
| 法院短信识别与文书下载 | `court-sms` | 1,064 | 0 | clawhub | 解析法院送达短信并下载文书 |
| AI短信发送工具 | `sms-send` | 775 | 0 | clawhub · chuanglanyunzhi | 创蓝模板短信 |
| AI短信发送工具 | `send-sms` | 668 | 1 | clawhub · xiaoweige1101 | 创蓝模板短信，文案与上一份相同 |
| ios smssdk integration | `ios-smssdk-integration` | 538 | 1 | clawhub · MobTech | 给 iOS 工程接短信验证 SDK |
| 物流延迟检测 & 安抚短信 | `logistics-care` | 402 | 0 | clawhub | 查物流后经阿里云 / 腾讯云发安抚短信 |
| 支持国际短信批量群发 | `upkuajing-sms-tool-zh` | 261 | 0 | clawhub | 跨境营销 / 通知群发 |
| 短信沟通办公助手 | `twilio-sms` | 221 | 0 | enterprise · 智雨科技 | 名称和 slug 带短信 / Twilio，摘要是白领办公套话 |
| 短信文案精简压缩｜简诗 AI | `sms-text-optimizer` | 109 | 0 | community | 把文案压到 160 字 |
| 短信验证自动发送管理｜简诗 AI | `twilio-sms-automation` | 103 | 0 | community | 调 Twilio 发验证 / 模板短信 |
| 短信工资条生成器 | `mayi-sms-payslip-gen` | 102 | 0 | enterprise · 蚂蚁工资条 | 生成短信格式工资条文本 |
| 短信通知 | `sms-notify` | 46 | 0 | enterprise · 中移互联网 | 新消息优先，失败转短信，只发本人移动号 |

创蓝两份加中移「短信通知」，下载量合计 **1,489** 次，仍低于 Google Messages 单独一份。

同名 slug `anti-fraud` 在接口里至少两份：展示名「防骗大师.Skill」（428,146 次、21 星）和展示名 `anti-fraud`（约 16.9 万次、0 星）。

### 2.3 发送类头部：海外 CPaaS 仍比国内网关热

按「名称或摘要明确对接短信网关 / 云通信 / 手机短信客户端」筛选后，2026-09-18 接口里下载较高的发送与通道条目如下。`installs` 仅 ClawHub 同步条目较完整。

| 名称 | slug | 下载 | installs | 密钥 | 通道 |
|---|---|---:|---:|---|---|
| Twilio | `twilio-api` | 5,143 | 470 | 需要 | Twilio 短信 / 语音，OAuth |
| Telnyx Toolkit | `telnyx-toolkit` | 4,494 | 144 | 需要 | Telnyx 工具包，短信只是其中一块 |
| Twilio | `twilio` | 3,504 | 114 | 需要 | Twilio HTTP API |
| Google Messages | `google-messages` | 3,408 | 111 | 否 | 网页 SMS/RCS |
| AgentCall | `agentcall` | 3,055 | 90 | 需要 | 号码 + 短信 + OTP + 语音 |
| AgenticMail | `agenticmail` | 2,139 | 59 | 需要 | 邮件为主，含短信 |
| Telnyx Cli | `telnyx-cli` | 1,772 | 53 | 需要 | Telnyx 多通道 CLI |
| 10DLC Registration | `telnyx-10dlc` | 1,567 | 47 | 需要 | 美国 10DLC 注册，不是发送器 |
| Ravi inbox | `ravi-inbox` | 1,363 | 37 | 需要 | 读邮件 / 短信收件箱 |
| Send Usms Uspeedo | `send-usms-uspeedo` | 959 | 25 | 需要 | 国际 SMS |
| rcs-message | `rcs-message` | 871 | 23 | 需要 | RCS |
| AI短信发送工具 | `sms-send` | 775 | 16 | 需要 | 创蓝 |
| AI短信发送工具 | `send-sms` | 668 | 15 | 需要 | 创蓝 |
| 阿里云短信 | `alibabacloud-sms-send-short-message` | 618 | 13 | 需要 | 阿里云 SMS |
| ios SMSSDK | `ios-smssdk-integration` | 538 | 11 | 需要 | MobTech 验证码 SDK |
| 物流安抚短信 | `logistics-care` | 402 | 4 | 需要 | 阿里云 / 腾讯云 |
| 腾讯云短信 | `tencentcloud-sms-skill` | 317 | 3 | 需要 | 腾讯云 SMS |
| 国际短信批量群发 | `upkuajing-sms-tool-zh` | 261 | 0 | 需要 | 跨境群发 |
| 短信沟通办公助手 | `twilio-sms` | 221 | 0 | 否 | 企业认证，摘要未写出发送协议 |
| 短信通知 | `sms-notify` | 46 | 0 | 否 | 中移互联网，发给本人 |

阿里云条目发布者 handle 为 `sdk-team`，腾讯云条目为 `tencent-adm`，接口未给出与中移同等的 `certifiedName` 企业认证块。是否官方团队直发，只能标为「handle 看起来像官方，未见到与中移相同的认证字段」。

### 2.4 中移通知与两份创蓝工具

| 项 | 短信通知 | AI短信发送工具 | AI短信发送工具（另一份） |
|---|---|---|---|
| 页面 | [skillhub.cn/skills/sms-notify](https://skillhub.cn/skills/sms-notify) | [sms-send](https://skillhub.cn/skills/sms-send) | [send-sms](https://skillhub.cn/skills/send-sms) |
| 命名空间 | `@chinamobileinternet/sms-notify` | `@clawhub_chuanglanyunzhi/sms-send` | `@clawhub_xiaoweige1101/send-sms` |
| 发布者 | 中移互联网有限公司（`verified: true`） | ClawHub 用户 chuanglanyunzhi | ClawHub 用户 xiaoweige1101 |
| 详情页所有者 | 蒋品 | chuanglanyunzhi | xiaoweige1101 |
| 首次发布 | 2026-09-16 10:10（北京时间） | 2026-05-08 | 2026-05-07 |
| 版本 | 1.0.0，changelog「Initial release」 | 1.0.0，「Synced by skillhub pipeline」 | 1.0.7，同样标注 pipeline 同步 |
| 需要 API Key | 否 | 是 | 是 |
| 安全扫描 | 科恩实验室、云鼎实验室均为「安全，无风险」 | 同左口径 | 同左口径 |
| 产品边界（官方摘要） | 自定义提醒发到**本人**手机；优先新消息，不支持则转短信；**仅中国移动号码** | 创蓝平台模板短信 | 创蓝平台模板短信 |

中移「短信通知」把接收方收口到本人，主通道写成 5G 新消息。第三方文档里，pushplus 已把中国移动「新消息 ClawBot」做成 `channel=cmcc` 的免费推送，同样只服务移动号码。[新消息 ClawBot 说明](https://www.pushplus.plus/doc/channel/cmcc.html)

创蓝两份的上游分别是 `https://clawhub.ai/chuanglanyunzhi/sms-send` 与 `https://clawhub.ai/xiaoweige1101/send-sms`。SkillHub 中文名、摘要逐字相同，版本号和作者不同。公开资料看不到创蓝官方是否认领其中任何一份。

### 2.5 时间线（公开字段）

| 日期 | 事件 |
|---|---|
| 2026-03 | Twilio、Telnyx、AgentCall、AgenticMail 等 ClawHub 通信技能集中出现，随后被 SkillHub 镜像 |
| 2026-05-03 | `court-sms` 上架 |
| 2026-05-07 / 05-08 | 两份创蓝「AI短信发送工具」先后出现 |
| 2026-05-23 | MobTech iOS SMSSDK 技能 |
| 2026-05-28 | 阿里云发送短消息技能 0.0.2 |
| 2026-06-07 | Google Messages 网页通道 |
| 2026-06-17 | 物流延迟检测 & 安抚短信 |
| 2026-06-19 | 腾讯云短信技能 |
| 2026-07-17 | 跨境短信群发工具 |
| 2026-07-27 / 07-28 | 简诗 AI 的文案压缩与 Twilio 验证发送 |
| 2026-08-03 / 08-04 | 蚂蚁工资条、智雨「短信沟通办公助手」 |
| 2026-09-02 | 硕软·短信通知群发 |
| 2026-09-16 | 中移互联网「短信通知」1.0.0 |
| 2026-09-18 | SkillHub 列表与详情接口对表 |

## 三、结构分析

### 3.1 「短信」召回四种生意

| 类型 | 用户要的动作 | 货架代表 | 下载量级 |
|---|---|---|---|
| 识别与风控 | 这封短信是不是诈骗 / 法院文书 | 防骗大师、法院短信、诉讼中枢 | 十万到百万、或千级垂直 |
| 海外 CPaaS / 网页通道 | 给 Agent 接 Twilio、Telnyx、Google Messages | `twilio-api`、Telnyx、Google Messages | 数千 |
| 国内云通信模板发送 | 有签名、有模板、有 API Key 再发 | 创蓝双份、阿里云、腾讯云、物流安抚 | 数百 |
| 发给自己 | 锁屏提醒，不碰陌生人 | 中移短信通知；另有 pushplus 新消息通道 | 数十（中移，上架 2 天） |

WorkBuddy 把 SkillHub 嵌进「添加技能」，这四类会挤在同一搜索结果里。下载排序会把防骗和海外 CPaaS 顶到前面，国内发送工具看起来像长尾。

### 3.2 「能发」的安装代理远小于「能看」

发送类普遍 `requires_api_key: true`，还要企业短信签名、模板审核、余额。防骗类是纯提示词 / 本地分析，安装后即可使用。官方技能文档把第三方 API 调用列为明确风险面，这会压低随便装发送技能的意愿。

ClawHub 镜像带过来的 `downloads` 统计的是全生态下载事件，包含 OpenClaw、其它客户端、同步流水线和重复拉取。`installs` 更接近「曾经装上过」：创蓝 `sms-send` 是 775 对 16，约 2.1%；`twilio-api` 是 5,143 对 470，约 9.1%。中移、智雨、蚂蚁等企业条目 `installs` 为 0，不能据此说没人装，只能说这个字段对它们没有有效计数。

### 3.3 官方主体进场：先发自己

中移「短信通知」满足企业认证、安全扫描、不填第三方 API Key 三条，和创蓝 / Twilio 技能的形态相反。它同时把业务收得很窄：本人、移动号、新消息优先。这和 2026 年国内短信监管结构一致——对个人开发者，「发给陌生人」在签名和同意上走不通，发给自己、走 5G 消息应用号，才是运营商愿意上架的形态。

智雨科技那份 `twilio-sms` 说明了另一类企业上架：认证主体真实，slug 借用 Twilio，摘要却是通用办公助手。搜索「短信」会命中它，列表卡片看不出能不能发出一条短信。

### 3.4 Skill 仍旧不是 Channel

货架上的发送技能默认假设：用户已经在 WorkBuddy 对话里，再去调网关。外部手机先发一条指令进来，仍然要靠连接器、MCP、ACP 或常驻进程。Google Messages、AgentCall、Telnyx CLI 更接近通道适配；创蓝模板工具更接近「对话里点一次发送」。中移「短信通知」写的是下行提醒，公开摘要没有承诺把上行短信写进当前 WorkBuddy 会话。

## 四、外部研判

一种可能的外部解读是：SkillHub 对「短信」完成了**目录铺货**，还没有完成**可用发送能力的集中**。海外 CPaaS 因为 ClawHub 同步而显得热闹；国内能用的是「有密钥的云通信模板」加「运营商发给自己」。中移 9 月 16 日这条，把第二种从民间 pushplus / 新消息 ClawBot 配置，推进到了 SkillHub 企业认证货架。

| 目标 | 判断 | 下一步 |
|---|---|---|
| 观察货架和官方主体 | **跟进** | 以中移 `sms-notify`、创蓝双份、阿里云 / 腾讯云为固定样本，记录下载和认证字段 |
| 给自己的移动号发强提醒 | **跟进实测** | 在 WorkBuddy 安装 `sms-notify`，看是否真走新消息、失败是否转短信、非移动号如何报错 |
| 把创蓝 / Twilio 当国内主通道 | **观望** | 先核对签名、模板、是否官方认领；两份同名创蓝至少要分清装哪一份 |
| 群发、跨境营销、未授权触达 | **不跟进** | 监管和投诉成本在技能列表之外，下载量也不能证明合法可运营 |
| 用搜索下载量评估 WorkBuddy 短信用户数 | **不跟进** | `downloads` 跨客户端，且防骗类会污染「短信」关键词 |

2026 年 6 月的判断是：个人把短信当 WorkBuddy 对外通道，监管和签名过不去。[SMS / 5G 消息可行性](/articles/research/topics/workbuddy-sms-rcs-channel) 9 月多了一个运营商认证的「发给自己」技能；发给别人的结构没有被这批上架改写。


## 五、信息来源与持续验证

**主要资料**

- SkillHub 列表接口 `https://api.skillhub.cn/api/skills`（`keyword`、`sortBy=score`、`pageSize=50`），全站 total=156,234；关键词 total 见 2.1。
- 详情接口 `https://api.skillhub.cn/api/v1/skills/{slug}`，用于 `sms-notify`、`sms-send`、`send-sms`、`anti-fraud`、`twilio-sms`。
- 技能页：<https://skillhub.cn/skills>、<https://www.skillhub.cn/>。
- WorkBuddy 技能文档：<https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market>。
- WorkBuddy 手机端安装 SkillHub 说明：<https://www.workbuddy.cn/docs/workbuddymini/features/Attachments-and-Skills>。
- 企业版技能入口：<https://cloud.tencent.com/document/product/1831/134432>。
- pushplus 新消息 ClawBot：<https://www.pushplus.plus/doc/channel/cmcc.html>。

「搜索热度不等于发送能力」来自技能功能与下载量对照，不是平台官方解读。installs / downloads 比值只说明两个字段量级不同，不能换算独立用户。

持续验证：任何技能的真实发送条数、送达率和金额消耗都没有公开；创蓝两份 skill 是否得到官方授权，公开材料对不上。

资料截至 2026-09-18 15:30（北京时间）。SkillHub 的 `updated_at` 几乎每条都在当日被 pipeline 刷新，下载量会继续变。
