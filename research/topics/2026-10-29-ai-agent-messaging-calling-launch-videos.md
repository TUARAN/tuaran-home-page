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

Dots Phone 是**独立开发者做的插件**，不是 OpenAI 官方发布的 dots 原生功能。它需要额外配置电话服务。这里的设计逻辑是：很多商家的信息还锁在电话菜单里，AI 要替你查，得能拨号、按键、听结果。视频页面提供下载按钮，但视频文件对当前下载请求返回了访问限制；可以从[演示页直接观看](https://phone.gabea.nyc/demo/)。

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

## 这些产品到底在设计什么

| 产品 | 你怎么找 AI | AI 怎么找你 | AI 怎么联系别人 |
| --- | --- | --- | --- |
| ChatGPT dots | ChatGPT 消息、语音；部分用户可用短信 | 发进度、问题和确认请求 | 可借助第三方 Dots Phone 拨号；不属于 OpenAI 官方原生电话功能 |
| Google Gemini / Duplex | 对 Gemini 说需求 | 返回消息或预约结果 | Gemini 帮你拨通 WhatsApp 联系人；Duplex 自己和商家通话 |
| Meta Muse | Muse 应用、WhatsApp 消息 | 在对话里继续任务和征求确认 | 发邮件等动作按权限执行；电话能力以官方具体发布为准 |
| Instinct | 短信、电话 | 通过原对话回复 | 创始人称能使用电话和电脑；公开演示细节仍需逐项核对 |
| Grok Bot | 手机、电脑消息或语音聊天 | 回报进度、请求批准 | 可在连接的应用里办事；未见官方普通电话拨号演示 |

这些发布片最值得学的一点是：**让用户始终知道谁在说话、谁会收到消息、哪一步要自己确认**。消息和电话一旦发出去，就会影响真实的人。产品越想替人办事，越要把这些动作交代明白。

## 主要来源与持续验证

资料核对至 **2026 年 10 月 29 日**。主要依据 [OpenAI dots 发布页](https://openai.com/index/introducing-dots/)及[使用帮助](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot)、[Google Gemini 帮助](https://support.google.com/gemini/answer/15574928?hl=en)与[Duplex 发布介绍](https://blog.google/products-and-platforms/products/assistant/io18/)、[Meta Muse 发布页](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)、[Instinct 创始人发布帖](https://x.com/noahrshinn/status/2092691344456351744)、[xAI Grok Bot 发布页](https://x.ai/news/introducing-grok-bot)和 [Dots Phone 演示说明](https://phone.gabea.nyc/demo/)。

- Instinct 和 Muse 的外部电话能力仍要以可复现的官方演示、开放范围及具体版本继续核对。
- dots 短信、电话插件和 Grok Bot 的开放范围可能变化，使用前以各产品当前说明为准。
