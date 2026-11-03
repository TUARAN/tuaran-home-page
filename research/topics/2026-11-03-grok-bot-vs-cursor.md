---
title: Grok Bot 和 Cursor 差在哪
category: topics
date: 2026-11-03
time: 11:20
updated: 2026-11-03T11:30:00+08:00
tags: [Grok Bot, Cursor, Cloud Agents, 套餐, 智能体]
summary: Cursor 云端模式和 Grok Bot 都在云里跑，合上电脑也会继续。Cloud Agents 为一次代码改动准备环境并交出草稿 PR；Grok Bot 把登录、文件和例程留在同一台电脑上。
tldr: 不用开电脑，Cloud Agents 和 Grok Bot 都行。改代码、云端验证、交 PR，用 Cloud Agents。登录和例程要留到下一回，再用 Grok Bot。Plus 两者都不含。
topic_type: product
subjects: [ai_dev]
entity_type: product
content_type: analysis
assistance: cursor
model: grok-4.7
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> 适用范围：比较 2026-11-03 公开文档中的 Cursor 编程产品（编辑器 Agent、CLI、Cloud Agents）和 Grok Bot。Grok 聊天、Imagine、语音和 API 不在比较范围内。标价不含税。

Cursor 和 Grok Bot 挂在同一套订阅上。笔记本合上之后，Cloud Agents 和 Grok Bot 都会继续跑。

## 一、先给结论

Cloud Agents 不要求本机在线。它在隔离虚拟机里克隆仓库、跑测试，也能操作远程桌面和浏览器来验证这次改动，做完交出草稿 PR。Grok Bot 同样在云端跑。它多出来的是一台会留下来的电脑：登录、文件、浏览器会话和例程留在同一个用户名下，下一回接着用。

- **不用开电脑，两边都成立。** Cloud Agents 的文档写明，本机不必连着网。Grok Bot 的文档写明，合上笔记本不停止后台回合和例程。
- **任务结束时留下的东西不同。** Cloud Agent 留下分支、diff 和草稿 PR，虚拟机跟着这次任务走。Grok Bot 留下的是那台电脑上的登录、文件，以及可以按日程重跑的路径。
- **Cloud Agent 的浏览器用来验证改过的软件。** 它会出截图、录像和日志，人也可以接管远程桌面自己点。Grok Bot 的浏览器和已连接应用用来操作人平时用的工具。官方举例是从 CRM 拉名单、起草外联、留给人批准。
- **新套餐从 Premium 才同时有两边。** Plus 每月 8 美元，有编辑器里的 Agent，没有 Cloud Agents，也没有 Grok Bot。Premium 每月 30 美元起，两边都有，并吃同一个每周用量池。
- **判断：改代码并在云端跑完，跟进 Cloud Agents。** 登录和例程要留在同一台电脑上，再跟进 Grok Bot。不跟进把 Grok Bot 当成第二个编程器。只有聊天需求，也不跟进。

## 二、事实层

Cursor 现在作为 The X Subscription 的一部分销售，一份订阅覆盖 Grok、Cursor 和 X。编辑器里的 Agent 用 `Cmd+I` 打开，能搜代码、改文件、跑终端，这台路径用的是本机。同一套 Agent 也在 CLI 里，有 Agent、Plan、Ask 三种模式。Cloud Agents 换到云端隔离虚拟机：克隆仓库、装依赖、跑测试，在单独分支上改完后交出草稿 PR。文档写明，可以并行很多个，本机不必连着网。触发点包括桌面端、[cursor.com/agents](https://cursor.com/agents)、iOS、Slack、GitHub 或 Bitbucket 评论、Linear 和 API。Cloud Agents 以前叫 Background Agents。虚拟机里也能操作桌面和浏览器，用来查看和验证改过的软件，并留下截图、录像和日志；人可以接管那台远程桌面自己点，再把控制权交回去。它还可以通过 MCP 接外部工具和数据源。[Cursor Agent](https://cursor.com/docs/agent/overview) · [Cloud Agents](https://cursor.com/docs/cloud-agent)

Grok Bot 给每个 Bot 名字、职责和跨会话留下来的上下文。桌面和手机应用是薄客户端，真正干活的是 Cursor 云里的一台电脑，带浏览器、文件系统和终端。合上应用、笔记本或手机，不停止后台回合和例程。这台电脑属于账号，该用户名下的 Bot 共用它的文件、浏览器会话和应用登录。同一用户的 Bot 可以并行、互相传话、在群聊里交接任务。走一遍多步操作后，可以把路径存成 skill，按日程重跑。桌面端覆盖 macOS（Apple 芯片和 Intel）、Windows（x64 和 Arm64）、Linux（x64 和 Arm64）；手机端是 iOS 18 及以上和 Android 9 及以上。X 账号连上 Grok 账号后，可以在帖子里 @bot 把任务交给主 Bot，这个入口还没有覆盖全部地区。[Grok Bot 概述](https://cursor.com/docs/grok-bot) · [SpaceXSI 文档](https://docs.x.ai/grok-bot/overview)

| | Cursor | Grok Bot |
| --- | --- | --- |
| 开口的地方 | 编辑器、CLI、网页、Slack、GitHub、Linear、API | 桌面和手机对话；部分地区可在 X 上 @bot |
| 本机要不要开着 | 编辑器 Agent 用本机。Cloud Agents 不用 | 不用 |
| 一件工作 | 仓库里的一处改动，可跨多个仓库 | 一句话任务，或一个常驻角色 |
| 云端电脑的寿命 | 每个 Cloud Agent 一台隔离虚拟机，跟着这次任务 | 每个用户一台，名下 Bot 共用，登录和文件留着 |
| 交回来的东西 | 分支、diff、草稿 PR、验证用的截图和日志 | 对话里的结果：草稿、表格、已填的网页、待批准的邮件 |
| 人怎么卡住 | 合并前看 PR；CLI 跑命令前要批准 | 敏感动作走批准和 Auto Review；登录、双因素、付款交给人 |
| 模型 | 自己选。Premium 起可用第三方模型，按 API 标价从预付额度扣 | 产品自己选模型 |
| 留下来的东西 | 仓库、规则、这条对话 | 偏好、角色、既往工作摘要；文件和浏览器会话在那台电脑上 |

套餐以 [Models & Pricing](https://cursor.com/docs/models-and-pricing) 和 [Grok Bot FAQ](https://docs.x.ai/grok-bot/faq) 为准。年付为 Plus 80 美元、Premium 300 美元、Super 1,000 美元、Ultra 2,000 美元。

| 档位 | 标价 | Cursor | Grok Bot |
| --- | --- | --- | --- |
| Free | 0 | Agent 和 Chat，用量有限 | 不含 |
| Plus | 8 美元/月 | 自有模型上的 Agent：Grok 4.7、4.6、4.5 和 Composer 2.5，Fast 关闭、effort 为 medium、Grok 4.7 上下文 256k。另有 Grok Chat、Voice、Imagine、Build 和 Grok API | 不含 |
| Premium | 30 美元/月 | Plus 的 4 倍用量，加上 Cloud Agents、Automations、Origin、Bugbot、按 API 标价使用的第三方模型 | 包含 |
| Super | 100 美元/月 | Premium 的能力，用量为 Plus 的 15 倍，高峰时优先用模型 | 包含 |
| Ultra | 200 美元/月 | Super 的能力，用量为 Plus 的 50 倍 | 包含 |
| Teams | 每席 30 / 100 / 200 美元/月 | 与对应个人档相同；第三方模型另加 Cursor Token Rate | 自助 Teams 默认打开 |
| Enterprise | 定制，用量池化 | 另有优先支持和更细的安全控制 | 管理员从后台打开 |

付费档有一个每周刷新的用量池，覆盖编辑器 Agent、CLI、Cloud Agents、Grok Bot 和 Grok 应用。池子用的是 Cursor 自有模型。第三方模型从第一次请求就按 API 标价走预付额度，不进这个池。周池用完后，预付额度按同一套 token 价格继续计。Grok 4.7 超出周池后的价格是每百万 token 输入 2 美元、缓存读取 0.50 美元、输出 6 美元；输入超过 256k 时按 2 倍计，上限 500k。Grok API 另计，不进周池。Teams 没有单独的 Grok Bot 花费上限，账号级的超额控制同时管着它。

旧版 Cursor 账号（Pro、Pro+、Ultra、Start，以及旧的 Teams Standard / Premium）仍按原来的两个按月用量池和 on-demand 计费。FAQ 写明：旧版每个付费个人套餐和自助 Teams 都含 Grok Bot；也可以绑定个人 SuperGrok、SuperGrok Plus、SuperGrok Heavy 或 X Premium+，或用已分配席位的自助 Grok Business 账号登录。两份订阅不会把用量加在一起，Grok Bot 取其中周用量更高的那一档。The X Subscription 上没有这道绑定，直接用当前套餐的共享周池。

## 三、结构分析

合上电脑继续跑，两边都成立。卡住判断的是虚拟机活多久，以及人最后验收什么。用量池是第二层：长任务会互相占用。

Cloud Agent 的虚拟机跟着一次编码任务走。Cursor 负责准备仓库、依赖、密钥、启动命令和网络。人看的是分支和 PR。远程桌面和浏览器用来验证这次改过的软件，环境不保留成下一回还能登录的业务电脑。密钥放在 Cloud Agents 的 Secrets 里，在 Agent 启动时注入。自托管机器存在，机器由用户自己付费和运维。

Grok Bot 的电脑跟着用户走。每个用户一台 Firecracker microVM，有自己的内核、内存和虚拟设备，用户之间到不了对方的电脑。电脑目前在美国运行。同一个用户名下，Bot 分开的是对话和学到的上下文，共用的是文件、浏览器会话和应用登录。官方要求把放上这台电脑的登录和文件，当成该用户每一个 Bot 都能碰到。需要另一套凭证时，要另开一个 Cursor 用户。共享 Bot 是例外：在成员自己的私聊里，它通常用该成员的电脑和该成员的用量；在 Slack 频道、线程、群聊里，共享 Bot 用它自己的一台电脑。

因此一次交接的成本不一样。Bot 之间传文件和登录很便宜，因为本来就在同一台电脑上。一次 Bot 跑偏，爆炸半径也是这台电脑上的全部登录。Cloud Agent 一次任务结束，环境就丢掉，记忆靠仓库和 PR，爆炸半径停在这次分支。

写代码时，Grok Bot 可以再转给 Cloud Agents。团队开关默认开着，转过去的任务跑在另一台电脑上，沿用现有的 Cloud Agent 控制。关掉开关，Bot 就不能再派这种任务。这条路径多一跳：人先在对话里交代，Bot 再启动一次编码任务，人最后仍在 PR 上验收。

模型选择权也分开。Cursor 里人指定模型，Premium 及以上可以把 Claude、GPT、Gemini 等按标价接进来。Grok Bot 自己决定用哪个模型，团队的模型允许列表管不到它。

批准也分开。Grok Bot 对敏感动作使用独立的审查模型 Auto Review。密码、卡号和安全码从 Vault、密码管理器或 Secure Form 填进页面，模型看不到这些值。单点登录和通行密钥会把电脑交还给人。旧版 Privacy Mode（Legacy）会直接挡住 Grok Bot，启用前要先换掉这个设置。Enterprise 才有审计日志、操作录制、网络允许列表和强制 Auto Review。自助 Teams 看不到这些开关。

## 四、外部研判

**改代码、在云端验证、交 PR：跟进 Cloud Agents。** 本机不用开着。远程桌面、浏览器和截图是为了看这次改动。这件事不用再开一个 Grok Bot。

**把 Grok Bot 当成云端编程的入口：不跟进。** 它能把编码任务派给 Cloud Agents，交付物仍是那次 Cloud Agent 的分支和 PR。中间多一次转交，模型还不能自己选。

**登录、文件和例程要留在同一台电脑上：跟进 Grok Bot。** 官方举例是从 CRM 拉名单、跳过已在触达序列里的人、查前五个客户、起草外联并留给人批准。没有 API 的网站也可以用浏览器去做，站点拦截自动化或会话过期时，Bot 把这一步交还给人。稳定流程可以存成 skill，按日程重跑。Cloud Agent 做完一次任务，这套登录和路径不会留在下一台虚拟机上。

**只有聊天、搜资料、做图：不跟进 Grok Bot。** 这些在同一订阅的 Grok 应用里。Plus 已经包含 Grok Chat、Voice、Imagine 和 Build。

用量上，长任务会互相挤。一个 Bot 通宵跑例程，扣的是和编辑器 Agent 同一个周池。周池清空后要么等下周刷新，要么用预付额度按 token 继续。没有单独的 Grok Bot 预算帽。

新客户若只需要编辑器里的 Agent，Plus 就够。需要 Cloud Agents 或 Grok Bot，档位是 Premium 起，个人每月 30 美元，或 Teams 的对应席位。

## 五、信息来源与持续验证

资料截至 2026-11-03，均来自当时可打开的官方文档。

- [Grok Bot](https://cursor.com/docs/grok-bot)，以及 [SpaceXSI 概述](https://docs.x.ai/grok-bot/overview)
- [Grok Bot FAQ：要不要单独订阅、多少钱](https://docs.x.ai/grok-bot/faq)
- [Models & Pricing](https://cursor.com/docs/models-and-pricing)
- [Cloud Agents](https://cursor.com/docs/cloud-agent)
- [Cursor Agent](https://cursor.com/docs/agent/overview)
- [Grok Bot for Teams and Enterprise](https://cursor.com/docs/grok-bot/teams)
- [Grok Bot security](https://cursor.com/docs/grok-bot/security)、[security FAQ](https://cursor.com/docs/grok-bot/security-faq)

持续验证：

- `cursor.com/docs/grok-bot` 和团队页仍有「每个付费个人套餐都包含」的句子。FAQ 和套餐页把新客户写成 Plus、Free 不含，旧版付费套餐才全含。若套餐页改口，Premium 这个购买档位要重看。
