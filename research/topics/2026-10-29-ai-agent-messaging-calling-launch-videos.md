---
title: 智能体怎么发消息、打电话：ChatGPT、谷歌、Muse、Instinct 和 Grok 的产品设计
category: topics
topic_type: product
subjects: [product_experience]
content_type: analysis
date: 2026-10-29
time: 10:05
tags: [智能体, 产品发布视频, 发消息, 打电话, AI 通信, 产品体验]
summary: 看 ChatGPT dots、Google、Muse、Instinct 和 Grok 的发布视频，弄清楚它们让 AI 发消息、打电话时，分别想解决什么事。
tldr: 同样叫“AI 打电话”，可能是你跟 AI 说话、AI 帮你拨通联系人，也可能是 AI 自己打给商家。先分清谁在和谁说话，才能看懂产品设计。
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

让 AI “发消息、打电话”，听起来是一件事，实际有三个层次：**你给 AI 发消息或打电话；AI 主动联系你；AI 替你联系别人。** 第三种最难，因为一条消息或一通电话会影响到真实的人。看产品视频时，先看清楚屏幕另一头是谁。

## 先看结论

- **ChatGPT dots** 把 AI 做成一个能长期联系的助手。你能给它发消息、和它语音通话；它也会找你确认事情。短信已进入美国部分用户测试。
- **Google** 同时给出了两条路：Gemini 帮你用手机里的 WhatsApp 联系人；Duplex 则替你给商家打电话，直接完成预约。
- **Muse 和 Instinct** 都想让“找 AI 办事”像找一个人。Muse 放进 WhatsApp；Instinct 把短信和电话当成主要入口。
- **Grok Bot** 更像工作群里的同事：给它发消息交代任务，它做完再回来汇报或请你批准。

## ChatGPT dots：把 AI 放进你每天会看的对话里

OpenAI 在 [dots 发布页](https://openai.com/index/introducing-dots/) 展示的是一个长期做事的助手。你可以在 ChatGPT 里发消息、打语音电话给自己的 dot。工作中也可以通过 Slack 或 Teams 找它。它做事时能发进度、提问题，遇到要你决定的步骤再来找你。

**它的设计逻辑很简单：** 办一件事往往要来回沟通。你告诉 dot 目标，它继续处理；缺资料时来问你；做完把结果送回来。消息和语音电话都是跟同一个助手说话的方式，过去的对话不会因为换个入口就丢掉。

::video[OpenAI dots 官方发布片](https://vimeo.com/1231177365)

**短信走到哪一步？** OpenAI 的[使用帮助](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot)列出短信功能，现阶段只向美国部分 Pro 用户开放测试：用户可用手机短信联系自己的 dot，dot 也能回短信。它说的是**你和 dot 之间**的短信，不等于 dot 已经能给任何人发短信。

### Dots Phone：让 dot 真的拨号查询

另一个值得看的演示是 [Dots Phone 的一分钟视频](https://phone.gabea.nyc/demo/)。用户问洗衣机什么时候送到，dot 准备好订单信息后，拨打测试号码，按电话语音菜单输入订单号，听完配送时间，再把结果告诉用户。这才是“AI 替你给别人打电话”。演示使用的是自有测试号码和虚构订单。

Dots Phone 是**独立开发者做的插件**。这段代拨电话演示通过插件接入 Twilio，并在用户自己的电脑上运行。OpenAI 官方也提供 dot 短信测试，但[只说使用第三方短信服务商](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot)，没有说是不是 Twilio，也没有公布 dot 通信有多少比例使用 Twilio。这里的设计逻辑是：很多商家的信息还锁在电话菜单里，AI 要替你查，得能拨号、按键、听结果。视频页面提供下载按钮，但视频文件对当前下载请求返回了访问限制；可以从[演示页直接观看](https://phone.gabea.nyc/demo/)。

## Google：先帮你拨通，再尝试替你说完

Google 的两个案例刚好说明“AI 打电话”有多种意思。

**Gemini 帮你用 WhatsApp 联系人。** 在 Android 手机上，你可以让 Gemini 给某个联系人发 WhatsApp 消息或发起 WhatsApp 通话，还能先修改消息内容。电话接通后，和对方说话的仍是你。它沿用手机里的联系人和 WhatsApp，省去找人、打开应用、输入消息的步骤。[Google 的使用说明](https://support.google.com/gemini/answer/15574928?hl=en)也写明：目前这个能力不在 Gemini Live 对话中使用，Gemini 不能直接读取完整 WhatsApp 聊天记录。

**Duplex 替你给商家说话。** 你提出预约餐馆或理发店，Google Assistant 可以拨通商家电话，询问时间、应答对方，最后把预约结果给你。这是一种更进一步的设计：用户只交代目标，电话中的交谈由 AI 完成。Google 在 [2018 年 I/O 发布介绍](https://blog.google/products-and-platforms/products/assistant/io18/)中展示了这个流程。

::video[Google Duplex 官方发布演示：AI 打电话预约](https://www.youtube.com/watch?v=-qCanuYrR0g)

把两个视频放在一起看，差别很直观：Gemini 负责**帮你联系到人**；Duplex 负责**替你和人把事说完**。

## Meta Muse：在 WhatsApp 里找助手，重要动作再确认

Muse 的入口是人们已经在用的聊天工具。Meta 在[官方发布页](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)说，用户可以在 Muse 应用或 WhatsApp 给它发消息，让它处理日常任务。它能在自己的虚拟电脑上操作，但发邮件、购买等可能影响外部世界的动作，要按用户设定的权限确认。

这套设计想减少学习成本：想办事就像给朋友发一条消息，后续事情由助手继续做。**消息入口只是开始，关键是它能否把任务做到需要你拍板的那一步。** 官方发布片侧重展示这个整体体验。至于 Muse 替用户拨打外部电话，官方这篇发布资料没有给出足够清楚的通用能力说明，因此不能把它和 Duplex 的商家通话演示当成同一类已确认功能。

::video[Meta Muse 官方发布片：从聊天到办事](/research-media/agent-communication/muse-launch.mp4)

视频来源：[Meta 官方发布页](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)。

## Instinct：直接给 AI 发短信、打电话

Instinct 创始人在[公开发布帖](https://x.com/noahrshinn/status/2092691344456351744)中把入口说得很直白：不用先学一个新界面，给它发消息或打电话就能交代事情。产品声称能像人一样使用电话和电脑，早期用户用它规划出行、买东西、取消订阅。

Instinct 的设计逻辑是把 AI 放进最熟悉的通讯方式里。你想到一件事，发条消息给它；想说得更快，就打电话。任务处理完，它再从对话里回复。这里要分清两通电话：**你打给 Instinct** 是输入任务；**Instinct 打给商家** 才是替你办事。创始人展示过处理餐厅订位的 [Concierge 视频](https://x.com/noahrshinn/status/2100262985491231101)，但它没有说明整通电话由 AI 独立完成，不能据此推断每个用户都能让 AI 自动打给商家。

::video[Instinct 创始人发布的 Concierge 订位视频](https://x.com/noahrshinn/status/2100262985491231101)

## Grok Bot：像给同事发消息一样交代工作

xAI 的 [Grok Bot 发布页](https://x.ai/news/introducing-grok-bot)把它描述为一个能持续工作的队友。你在电脑或手机上给 Bot 发消息，它可以使用自己的电脑和已连接的应用做事；需要决定或批准时，再回来找你。手机端还支持语音聊天，适合口头交代任务。[手机端说明](https://docs.x.ai/grok-bot/mobile)把这件事写得比较清楚。

它的设计逻辑是沿用团队工作里的沟通习惯：交代任务、收到进度、看结果、批准下一步。这里的“语音聊天”是**你和 Bot 说话**。在已核对的官方资料里，没有看到 Grok Bot 像 Duplex 那样直接拨通普通电话号码、与商家对话的发布演示。

::video[Grok Bot 官方发布片](https://media.x.ai/v1/website/260810_2245_bw_dr_cursor_bot_edit_v8-60724aba.mp4)

## 其他产品：把某一种联系做得更直接

[Friend 的发布短片](https://x.com/AviSchiffmann/status/1818284595902922884)展示了另一条路：随身设备听到日常场景后，给佩戴者发一条像朋友发来的消息。它卖的是“AI 主动找你聊天”的感觉，和替你联系商家办事是两种用途。

::video[Friend 官方发布短片](https://x.com/AviSchiffmann/status/1818284595902922884)

## 五款重点产品：谁给谁发消息、打电话

| 产品 | 你怎么跟它说话 | 它怎么回你 | 它能怎么联系别人 |
| --- | --- | --- | --- |
| ChatGPT dots | 打开 ChatGPT App 或网页版，给自己的 dot 发消息；也能在对话里点电话按钮，直接和它说话。美国部分 Pro 用户接入后，还能用手机短信给 dot 发消息。 | 它会在对话里告诉你进度；缺资料或需要你决定时，会发消息来问。开通短信后，它也能给你的手机回短信。目前它不能主动打电话给你。 | 目前这段“dot 替人打客服”的演示，是独立开发者用 Dots Phone 插件接入 Twilio 做出来的。OpenAI 没有公布 dot 的通信服务有多少比例经过 Twilio；官方短信测试使用第三方服务商，但未说明是哪一家。 |
| Google Gemini / Duplex | 在 Android 手机的 Gemini App 里打字或说话，让它帮你联系某人。Google 的 Duplex 发布视频则演示了：向 Google Assistant 说出餐馆、时间和人数。 | Gemini 在手机上给你回复；Duplex 演示中，助手打完预约电话后把结果通知你。 | Gemini 可以通过你手机上的 WhatsApp 发消息或发起通话，接通后由你自己说话。Duplex 发布视频里，AI 自己打给商家，替你交谈并完成预约。 |
| Meta Muse | 在 Muse App 或 WhatsApp 的聊天窗口里给 Muse 发消息，告诉它想办什么事。 | 它在同一段对话里回复你；需要你决定或批准时，会回来问你。 | 你给了相应权限后，它可以用连接的应用发邮件。官方发布资料没有明确展示它替用户拨打普通电话的通用功能。 |
| Instinct | 按创始人的介绍，你可以给 Instinct 的号码发短信，或直接拨电话，把要办的事告诉它。 | 它在原来的消息对话里回复你，告诉你结果或继续问你。 | 创始人说它能使用电话和电脑办事；公开的订位视频没有说明整通电话是否都由 AI 独立完成。 |
| Grok Bot | 打开 Grok Bot 的手机或电脑 App，给 Bot 发消息交代工作；手机端也能开启语音聊天，直接对它说。 | 它在对话里报告进度和结果；碰到要你批准的步骤，就来问你。 | 它能在你连接的应用里办事。官方发布资料没有展示它自己拨打普通电话号码、与商家交谈。 |

## 其他产品：发消息与打电话怎么配合

个人助手产品中的“你”是使用者本人；企业产品中的“你”是设置智能体的商家。视频栏只写查到的官方影片或产品演示，找不到发布片就直接标明。

| 智能体产品 | 视频演示 | 你怎么找 AI | AI 怎么找你或你的客户 | AI 怎么联系别人 | 设计逻辑 |
| --- | --- | --- | --- | --- | --- |
| [Tab](https://tab.bot/)（个人助手，内测） | 官网有[短信和代拨电话的场景说明](https://tab.bot/)；暂未找到官方发布片。 | 给 Tab 发短信，直接说“帮我改酒店预订”，也能把截图、文件发给它。 | 它在同一个短信对话里追问、报进度，办完再把结果发回来。 | 官网称它可以自己打给酒店、诊所或餐馆，等接通后询问、改约。 | **一条短信交代整件事。** 用户不用守在电话旁等客服接听。 |
| [Lindy](https://www.lindy.ai/product/phone)（个人与团队助手） | [官网电话场景演示](https://www.lindy.ai/product/phone) | 可以给 Lindy 发短信、语音留言、邮件，或在 Slack 里交代任务。 | 它能用短信或 Slack 告诉你谁来过电话、对方要什么、约到了什么时间。 | 它有自己的号码，可以替你给牙医或商家打电话，也能替你接听来电。官网说明目前电话以美国号码和通话为主。 | **给助手一个号码。** 它既替你打出去，也替你接进来，再把结果发回原来的沟通渠道。 |
| [Poke Human](https://poke.com/docs/release-notes)（个人助手加真人协助） | [官方发布视频](https://x.com/interaction/status/2070186007299772700) | 在 Apple Messages、WhatsApp 或 Telegram 给 Poke 发消息，说明想订餐厅、叫车等。 | Poke 在消息对话里回复你；需要真人处理时，会把具体任务交给工作人员。 | 需要电话或线下操作的事，Poke Human 可以安排**真人**去做，不能把这些电话说成 AI 自己打的。 | **消息由 AI 接，难办的电话交给真人。** 它把交代任务的入口留在聊天窗口。 |
| [Cal.ai](https://cal.com/ai)（企业预约助手） | [官方宣传视频](https://www.youtube.com/watch?v=3nwW7X-9WO0) | 商家在 Cal.com 设置：有人预约、爽约或临近会议时，让 AI 打电话。客户也可以拨打测试号码体验。 | 预约和通话结果留在 Cal.com；商家还可以把短信提醒接进同一套预约流程。 | AI 按设定给预约人打电话，确认、改期或提醒。短信是 Cal.com 工作流里的另一项动作。 | **围绕预约打电话。** 每通电话都由一次明确的预约事件触发，结果回到日历。 |
| [Televox](https://televox.ai/demo/videos)（商家接待助手） | [真实接听演示](https://youtu.be/j0A3y9GkeGo)、[电话与消息宣传片](https://youtu.be/eZfGJ78F3vo) | 商家设置接待号码；顾客可以直接打电话，也能从 WhatsApp 发消息或语音便条。 | AI 在电话或 WhatsApp 回顾客，订位后还可发短信确认；商家在后台看记录。 | 它主要代表商家**接听顾客来电**，回答问题、查空位、完成预约。 | **同一个接待员管多个入口。** 电话里谈好的时间，随后用短信确认，商家后台也能看到。 |
| [PolyAI](https://poly.ai/use-cases/call-routing)（企业客服助手） | [官方银行案例，含通话介绍](https://poly.ai/customers/savings-bank)；该页不是发布片。 | 商家把客服来电接给 PolyAI；顾客照常拨打客服电话。 | AI 在电话里回答顾客；需要查看网页或表单时，可以给来电人发短信链接。 | 它接听来电、弄清顾客的问题，再回答或转给人工客服。 | **电话说不完的内容，用短信补上。** 顾客不必在通话里记网址。 |
| [Humane Ai Pin](https://vimeo.com/882968794)（历史产品，已停服） | [官方发布片](https://vimeo.com/882968794) | 当年用户可通过佩戴设备的语音和触摸操作，给联系人打电话、发消息。 | 来电和消息会在设备上提醒，用户可用语音和手势处理。 | 当年的设计是让用户通过佩戴设备联系真实的人。[服务已于 2025 年停止](https://techcrunch.com/2025/02/18/humanes-ai-pin-is-dead-as-hp-buys-startups-assets-for-116m/)，不能当作现在可用的功能。 | **把通信入口从手机屏幕移到身上。** 发布片适合看交互方式，不适合作为现有产品选型。 |

Poke、Cal.ai 和 Televox 三条片子适合连着看：Poke 展示**真人接手电话任务**，Cal.ai 展示**预约触发 AI 外呼**，Televox 展示**AI 接电话后再发短信确认**。

::video[Poke Human 官方发布片：AI 把电话任务交给真人](https://x.com/interaction/status/2070186007299772700)

::video[Cal.ai 官方宣传片：预约触发 AI 电话](https://www.youtube.com/watch?v=3nwW7X-9WO0)

::video[Televox 官方宣传片：电话、WhatsApp 和短信接续](https://youtu.be/eZfGJ78F3vo)

这些发布片最值得学的一点是：**让用户始终知道谁在说话、谁会收到消息、哪一步要自己确认**。消息和电话一旦发出去，就会影响真实的人。产品越想替人办事，越要把这些动作交代明白。

## 主要来源与持续验证

资料核对至 **2026 年 10 月 29 日**。主要依据 [OpenAI dots 发布页](https://openai.com/index/introducing-dots/)及[使用帮助](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot)、[Google Gemini 帮助](https://support.google.com/gemini/answer/15574928?hl=en)与[Duplex 发布介绍](https://blog.google/products-and-platforms/products/assistant/io18/)、[Meta Muse 发布页](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)、[Instinct 创始人发布帖](https://x.com/noahrshinn/status/2092691344456351744)、[xAI Grok Bot 发布页](https://x.ai/news/introducing-grok-bot)和 [Dots Phone 演示说明](https://phone.gabea.nyc/demo/)。

其他产品以 [Tab 官网](https://tab.bot/)、[Lindy 电话产品页](https://www.lindy.ai/product/phone)、[Poke 更新说明](https://poke.com/docs/release-notes)、[Cal.ai 产品页](https://cal.com/ai)、[Televox 视频页](https://televox.ai/demo/videos)、[PolyAI 客服案例](https://poly.ai/customers/savings-bank)和 [Humane 官方发布片](https://vimeo.com/882968794)为依据。Poke Human 的电话任务由真人执行；Tab 仍是内测产品；Humane 已停服。

- Instinct 和 Muse 的外部电话能力仍要以可复现的官方演示、开放范围及具体版本继续核对。
- dots 短信、电话插件和 Grok Bot 的开放范围可能变化，使用前以各产品当前说明为准。
