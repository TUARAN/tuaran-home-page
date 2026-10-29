---
title: 智能体为什么要发消息、打电话：海外产品设计逻辑与发布视频
category: topics
topic_type: product
subjects: [product_experience]
content_type: analysis
date: 2026-10-29
time: 10:05
tags: [智能体, 产品视频, 发消息, 打电话, AI 通信, 产品体验]
summary: 比较 Friend、Humane、Duplex、Gemini、OpenClaw、Cal.ai 与 Televox 的通信设计：谁拥有关系、谁发起联系、智能体能代表谁行动，发布片又怎样呈现这些选择。
tldr: 智能体通信产品分化为陪伴、手机操作、任务代办和企业接待。消息与电话的价值，取决于产品把智能体放在人际关系中的哪个位置。
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

同样是“智能体发消息、打电话”，Friend 让智能体给佩戴者发消息，Gemini 帮用户联系已有联系人，Google Duplex 替用户给商家拨号，企业语音智能体则代表商家接待客户。它们调用相似的通信动作，却把智能体放在四个不同的位置。产品的入口、权限、交互节奏和宣传片故事，都由这个位置决定。

## 一、先给结论

从产品设计看，可以先分清四个问题：**用户在与谁建立关系、谁发起联系、智能体代表谁说话、完成后由谁确认结果**。据此，案例形成四种路线：

1. **陪伴关系：** Friend 把智能体设计成能主动给用户发消息的对象。消息本身承载关系，不以完成外部事务为目标。
2. **手机操作：** Gemini 借助现有联系人、WhatsApp 和设备权限，让自然语言成为发消息、拨号的入口。通信关系仍属于用户。
3. **任务代办：** Duplex 接受明确目标，再给第三方打电话，最后把可核对的结果交还用户。电话是完成任务的手段。
4. **企业接待：** Cal.ai 和 Televox 让智能体代表企业联系或接待客户。前者围绕预约电话，后者强调电话、WhatsApp 与短信之间的连续服务。

Humane Ai Pin 还提供一个硬件方向：把通话、消息和 AI 助手放入独立的可穿戴设备，减少用户回到手机屏幕的需要。它的服务已经停止，仍可用于研究当时的设计取舍。

## 二、逐个产品看设计逻辑

### Friend：把智能体设计成一个会联系用户的对象

Friend 的 2024 年[发布广告](https://x.com/AviSchiffmann/status/1818284595902922884)从佩戴者的生活片段入手。设备感知到情境，智能体通过手机消息回应。产品首先要建立的是“它在场、记得我、会主动说话”的感受；消息既是交互界面，也是关系的证据。[发布片索引](https://echai.ventures/videos/friend-introducing-friend)记录了这支影片。

这个选择让产品不必抢占用户给朋友发消息的权限，也不必承担代办结果。代价是智能体发起联系的频率、时机和措辞会直接决定体验：消息过少，存在感消失；消息过多，就会变成打扰。以上是从产品定位推导的设计约束。片中没有展示 Friend 替用户给第三方发消息，更没有展示代拨电话。

### Humane Ai Pin：把通信从手机界面移到身体动作

[Humane 官方发布片](https://vimeo.com/882968794)把设备佩戴、语音指令和日常环境放在同一个画面里。Humane 在[发布资料](https://www.prnewswire.com/news-releases/humane-announces-ai-pin-now-available-nationwide-302114323.html)中将拨号、发消息和 AI 辅助撰写消息列为设备功能。它的设计假设是：用户仍要联系现实中的人，但可以少看屏幕、少切换应用，直接通过身上的设备完成动作。

这条路线把显示与确认变成关键问题。语音说出收件人和内容后，用户如何及时发现识别错误、修改消息、处理隐私场景？发布片中的自然动作展示了愿景，不能代替这些实际体验的验证。Humane 宣布 Ai Pin 于 **2025 年 2 月 28 日**停止连接服务器，相关通信服务终止；它如今是历史设计案例。[Humane 客户 FAQ 存档](https://archive.is/NUqbh)

### Gemini：保留现有联系人和应用，只改变操作入口

[Google 帮助文档](https://support.google.com/gemini/answer/15574928?hl=en)说明，Android 端 Gemini 可以调用 WhatsApp 给联系人打电话、发消息，也可以先协助拟写和修改消息。联系人关系、送达渠道与后续聊天仍留在 WhatsApp；Gemini 主要承担理解指令、选人、拟稿和发起动作的工作。这减少了让用户迁移到新通信网络的成本。

这种整合也受设备与应用权限约束。官方说明目前不能在 Gemini Live 对话中使用该 WhatsApp 集成，Gemini 也不能直接读取 WhatsApp 聊天历史。宣传这类产品时，画面应说清“通过哪个应用发送”以及用户在发送前能否检查内容，不能把一句语音命令拍成无边界的全能助手。

### OpenClaw：把聊天应用变成智能体的工作台

OpenClaw 让用户在常用消息渠道中与智能体交互；[官方消息投递文档](https://docs.openclaw.ai/tools/agent-send)还列出向 WhatsApp、Slack 等渠道发送结果的方式。聊天应用在这里就是智能体的日常入口。用户发来任务，智能体执行，再从同一对话送回进度或结果。

这类产品最重要的区分是“给智能体发消息”和“智能体代表我给另一个人发消息”。前者是任务入口，后者会影响第三方，需要确定收件人、内容、权限和发送记录。OpenClaw 的消息能力也不能自动推导出电话网络能力；电话需要另外接入服务和号码。

### Google Duplex：把电话当成完成外部任务的通道

[Google 的 Duplex 发布说明](https://blog.google/products-and-platforms/products/assistant/io18/)明确解释了产品选择电话的原因：部分商家没有在线预约系统，用户仍须拨号完成订位。Duplex 接收日期、时间等边界条件，再致电商家交涉；[官方视频](https://www.youtube.com/watch?v=-qCanuYrR0g)把这条委托链拍出来。任务结束后，Google 描述的交付物是通知、邮件和日历邀请。[后续产品说明](https://blog.google/products-and-platforms/products/assistant/book-table-google-assistant-across-country-more-devices/)

设计上的关键是**缩小授权范围**。用户授权的是一次订位，智能体只需围绕时间、人数和可接受的替代方案交谈；它不能因为能说话，就自行代表用户接受任意条件。电话比消息更有用的地方，是商家只接受实时对话时，智能体仍能推进任务。

### Cal.ai 与 Televox：企业分别追求完成率和渠道连续性

[Cal.ai 官方宣传片](https://www.youtube.com/watch?v=3nwW7X-9WO0)与[产品页](https://cal.com/ai)围绕预约提醒、确认和跟进展开。企业已掌握预约关系，智能体在特定触发条件下给参会者打电话。它的任务相对窄：确认是否出席、处理改期或跟进未预约的人。产品价值来自把已有工作流中的电话环节自动执行。

[Televox 官方短片](https://youtu.be/eZfGJ78F3vo)则把来电、WhatsApp 消息、语音便条和短信确认汇到同一个企业智能体。[视频页](https://televox.ai/demo/videos)描述了通话中订位与通话后确认。它解决的核心问题是客户换了渠道，企业仍能延续同一服务上下文。要判断这种设计是否成立，需要看电话里的承诺、消息里的确认和后台记录是否指向同一件事。

## 三、放在一起，差别在哪里

| 产品 | 智能体所在的位置 | 消息的作用 | 电话的作用 | 最需要控制的设计边界 |
|---|---|---|---|---|
| Friend | 用户的陪伴对象 | 智能体主动回应用户 | 原发布片未展示 | 主动联系的时机与打扰程度 |
| Humane Ai Pin | 用户身上的通信终端 | 用户与联系人通信 | 用户与联系人通话 | 无屏幕场景中的对象、内容确认 |
| Gemini | 手机上的操作助手 | 通过已有应用联系联系人 | 通过已有应用拨给联系人 | 应用权限、联系人匹配、发送确认 |
| OpenClaw | 聊天渠道里的任务执行者 | 接任务、回结果，也可向渠道投递 | 需另接电话能力 | 发送给第三方的授权与记录 |
| Google Duplex | 用户委托的电话代办者 | 任务完成后通知用户 | 致电商家完成预约 | 任务范围、可接受条件与结果核对 |
| Cal.ai | 企业预约工作流中的执行者 | 可与提醒流程配合 | 给参会者确认、跟进 | 触发条件、通话结果与日程一致 |
| Televox | 企业的多渠道接待者 | WhatsApp、短信确认和跟进 | 接听客户来电 | 跨渠道上下文、人工接管与记录 |

这里最容易混淆三件事：**用户给智能体发消息**是输入；**智能体给用户发消息**是反馈或陪伴；**智能体替用户给第三方发消息**是对外行动。同样地，用户打给智能体进行语音聊天，与智能体拨通商家或客户，是两种不同的电话产品。产品定位不同，权限和成功标准也不同。

## 四、发布视频如何呈现设计选择

这些影片是设计逻辑的可视化证据，适合对照观看：

| 视频 | 重点看什么 | 对应的设计选择 |
|---|---|---|
| [Friend 发布广告](https://x.com/AviSchiffmann/status/1818284595902922884) | 人物情境与手机消息出现的时机 | 智能体作为关系中的一方主动发言 |
| [Humane 发布片](https://vimeo.com/882968794) | 佩戴、语音与现实联系人如何同框 | 通信入口从手机屏幕移到身体动作 |
| [Google Duplex 官方视频](https://www.youtube.com/watch?v=-qCanuYrR0g) | 委托、商家接听、预约结果 | 智能体代表用户与第三方完成特定任务 |
| [Cal.ai 宣传片](https://www.youtube.com/watch?v=3nwW7X-9WO0) | 预约事件怎样触发电话 | 电话嵌入已有企业工作流 |
| [Televox 多渠道短片](https://youtu.be/eZfGJ78F3vo) | 来电、WhatsApp 与短信如何接续 | 同一客户关系跨渠道延续 |

从这些片子可归纳出一个拍摄判断：**画面要显示通信前后的状态变化**。Friend 需要让人看懂消息为何在此刻出现；Duplex 需要让人看到第三方怎样回应；Televox 需要让电话中的承诺出现在后续消息和后台记录中。用户若只看见“已发送”或听见一段合成语音，仍不知道智能体究竟完成了什么。

若一支新片同时主打“发消息”和“打电话”，可以用同一件事串联两个动作：用户授权联系某人，智能体先发消息；对方提出需要通话，智能体再拨号；最后把双方确认的结果交还用户。这里的切换由任务推进，观众也能分辨智能体代表谁行动。此段是基于案例提出的创作建议，未声称上述单一产品已经提供完整流程。

## 五、来源与持续验证

资料截至 **2026 年 10 月 29 日**。视频以 [Friend 发布原帖](https://x.com/AviSchiffmann/status/1818284595902922884)、[Humane 官方 Vimeo](https://vimeo.com/882968794)、[Google 官方 Duplex 视频](https://www.youtube.com/watch?v=-qCanuYrR0g)、[Cal.ai 官方产品页](https://cal.com/ai)和 [Televox 官方视频页](https://televox.ai/demo/videos)为准；设计与功能边界主要核对 [Google Gemini 帮助文档](https://support.google.com/gemini/answer/15574928?hl=en)、[OpenClaw 文档](https://docs.openclaw.ai/tools/agent-send)、[Google Duplex 发布说明](https://blog.google/products-and-platforms/products/assistant/io18/)及 [Humane 产品资料](https://www.prnewswire.com/news-releases/humane-announces-ai-pin-now-available-nationwide-302114323.html)。宣传片展示的是厂商选定的场景，不能单凭影片推断实际成功率。

持续验证：若目标产品要同时提供“代用户给第三方发消息”和“代用户给第三方打电话”，还需要同一产品的官方发布片或完整产品记录，核对两个动作如何共享授权、联系人与结果。现有案例分别覆盖了这条链路的不同部分。
