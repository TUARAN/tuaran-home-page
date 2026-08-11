---
title: 七月底智能体通信生态快照：Skills 约 150 万，OpenClaw 主包月下载约 1056 万
category: topics
topic_type: market
subjects: [ai_dev]
content_type: analysis
date: 2026-08-11
time: 09:31
tags: [AI Agent, OpenClaw, ClawHub, Skills, Channel, 通信, 即时通信, npm, 开发者生态]
summary: 截至 2026 年 7 月 27 日，通信类 Skills 在 ClawHub 的累计下载约 150 万；官方 openclaw 主包滚动 30 天 npm 下载为 1055.6 万，npm API 可观测累计为 4897.1 万，官方仓库通信 Channel 子包同期合计约 80.1 万。社区 fork、厂商适配与延伸版本均未计入 OpenClaw 官方口径。
tldr: 通信 Skills 从 6 月初到 7 月 27 日约增长 25%。npm 侧需要分开看：官方 openclaw 主包滚动 30 天下载为 1055.6 万，API 可观测累计 4897.1 万；同一官方仓库内可单独统计的通信 Channel 子包约 80.1 万，较 6 月初同口径下降约 4%。原“Channel 约 130 万、增长约 30%”混入延伸版本后无法代表 OpenClaw 官方仓库，已删除。
assistance: codex
model: gpt-5
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

截至 2026 年 7 月 27 日，通信类 Skills 在 ClawHub 的累计下载约 **150 万次**。

npm 侧有两种容易混淆的数字：

- 官方 `openclaw` 主包在 6 月 28 日至 7 月 27 日的下载为 **10,556,342 次**，约 1055.6 万；
- npm downloads API 在 2025 年 1 月 27 日至 2026 年 7 月 27 日记录到主包 **48,971,022 次**下载，可写作“可观测累计约 4897.1 万次”；
- 源码位于 `openclaw/openclaw` 官方仓库的通信 Channel 子包，同期合计 **801,344 次**，约 80.1 万。

主包衡量 OpenClaw 整体分发，Channel 子包衡量可独立发布的官方通信扩展。社区 fork、厂商适配和名称带有 `openclaw` 的延伸版本没有计入这两组数据。

下载量包含首次安装、升级、CI、镜像与自动化拉取。为避免把 npm 的事件计数写成独立用户，统一称为“月下载”或“安装代理”，不称“月安装用户”。

## 1、三组数字

| 观察对象 | 6 月初同口径 | 截至 7 月 27 日 | 变化 | 含义 | 明细来源 |
|---|---:|---:|---:|---|---|
| 通信类 Skills（ClawHub 累计） | 约 120 万次 | 约 150 万次 | 约 +25% | 通信任务能力的累计下载 | [ClawHub API](https://clawhub.ai/api/v1/skills?limit=200&sort=downloads)；基线由约数反推 |
| `openclaw` 官方主包（滚动 30 天） | 5,797,389 次 | 10,556,342 次 | +82.1% | OpenClaw 整体分发活跃度 | [基期 API](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/openclaw) · [本期 API](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/openclaw) |
| 官方通信 Channel 子包（滚动 30 天） | 835,025 次 | 801,344 次 | -4.0% | 可独立下载的官方通信扩展 | 见第 5 节逐包宽表 |

Skills 的 6 月初基线由约数反推：`150 ÷ 1.25 ≈ 120`。npm 两行都直接来自 npm downloads API：6 月初采用截至 6 月 1 日的滚动 30 天窗口（5 月 3 日至 6 月 1 日），7 月底采用截至 7 月 27 日的滚动 30 天窗口（6 月 28 日至 7 月 27 日）。

三个数字不能相加。ClawHub 与 npm 的事件定义不同，OpenClaw 主包还会包含 Channel 运行所需的核心能力，同一个开发者也可能同时下载主包和多个扩展。

## 2、统计过程：从问题到可复核数字

这组统计先后经历了四次口径拆分。

第一步，拆开“用户”和“下载”。公开资料没有给出 OpenClaw 的累计独立安装用户数。npm 记录的是下载事件，升级、重装、CI、镜像和多台机器都会重复计数。由千万级月下载推算“200 万至 400 万安装用户”缺少可验证的重复系数，只能作为情景估计，不能写进事实栏。

第二步，拆开“主包、Skill、Channel”。`openclaw` 主包代表整体项目分发；ClawHub Skill 代表可执行的通信任务能力；Channel npm 子包代表独立发布的通信连接器。三者的统计对象、时间口径和重复机制不同，不能相加，也不能互相换算。

第三步，冻结时间和归属。ClawHub 采用截至 7 月 27 日的累计下载；npm 月下载统一用两个滚动 30 天窗口。Channel 还要回到 7 月 27 日的官方仓库历史提交，先确认源码和包名，再查 npm；名称相似、兼容 OpenClaw 的社区包不进入官方口径。

第四步，逐项取数并复算。每个 npm 包分别查询 downloads point API，保留起止日、包名和返回值，再汇总官方 Channel。主包使用同一 API 校验月度与可观测累计数量级。按这套流程，主包“累计约 4000 万至 5000 万”的早期区间判断可被精确到 48,971,022 次；“安装用户约 300 万”仍然无法由公开数据验证。

最终把证据分成三层：API 直接返回值属于可复核事实；由约数和增幅反推的 Skills 基线属于计算值；独立用户、启用量与真实调用量属于未知或估算。这样可以保留推导线索，又不会让估算看起来像官方披露。

## 3、Skills 统计口径

Skills 代表智能体“怎样完成通信任务”。统计范围包括名称或描述明确指向以下平台、协议或通信动作的 ClawHub Skills：

- 邮件：Gmail、Email；
- 消费级与跨境即时通信：WhatsApp、Telegram、微信、QQ、LINE、Zalo；
- 团队协作与社区通信：Slack、Discord、Feishu/Lark、DingTalk、企微、Matrix、Teams、Google Chat；
- 电信能力：SMS、Phone Call；
- 通用动作：Notification、Message Sending、Push 等通知与消息发送能力。

汇总时按唯一 slug 去重，再对 ClawHub 展示的 `downloads` 字段求和。带有平台名称、但只处理文档、内容发布、账号验证或文案生成的条目，不因关键词命中自动归入通信类。

一个 Gmail Skill 可能同时支持读取、总结、归档和回复邮件。只要它明确执行收件、发件或回复，本口径将其整体纳入。分类仍包含人工判断，因此 150 万按约数披露。

## 4、怎样确认是 OpenClaw 官方仓库

“兼容 OpenClaw”“OpenClaw Channel”或包名带有 `openclaw`，都不能证明源码来自官方仓库。

本次以 2026 年 7 月 27 日末之前的 `openclaw/openclaw` 官方仓库提交 `9871eadeb91c65d7a4fa4bbb3cf1b90f61625351` 为冻结点。一个 Channel 子包需要满足：

1. 对应源码在该提交的 `extensions/<channel>/` 中；
2. `package.json` 的包名与 npm 查询包名一致；
3. npm 或仓库元数据可追溯到 `github.com/openclaw/openclaw`；
4. 对源码已在官方仓库、但 `package.json` 没有单独填写 repository 的包，以历史提交路径作为归属证据；
5. npm 在观察期内确实能查询到该包。

按这套规则纳入的通信包为：

`@openclaw/whatsapp`、`@openclaw/discord`、`@openclaw/slack`、`@openclaw/feishu`、`@openclaw/qqbot`、`@openclaw/matrix`、`@openclaw/msteams`、`@openclaw/googlechat`、`@openclaw/line`、`@openclaw/zalo`、`@openclaw/signal`、`@openclaw/imessage`、`@openclaw/sms`、`@openclaw/voice-call`。

`extensions/telegram` 当时存在于官方仓库，但 npm downloads API 返回 `package @openclaw/telegram not found`，因此没有把它补成零，也没有用其它 Telegram 包替代。

DingTalk、微信/企微和其它社区或厂商包即使兼容 OpenClaw，只要源码不属于上述官方历史快照，就不进入“OpenClaw 官方 Channel”统计。这样会缩小覆盖范围，但能避免把延伸版本的下载算到官方项目名下。

## 5、官方通信 Channel 下载明细宽表

下表每一行都同时给出官方仓库路径和两个 npm API 原始结果。变化率按 `(7 月底窗口 ÷ 6 月初窗口) - 1` 计算；基期为零的包标记为“新增”，不计算百分比。

| Channel | npm 包 | 官方仓库归属 | 5/3–6/1 下载 | 6/28–7/27 下载 | 变化 | npm 明细来源 |
|---|---|---|---:|---:|---:|---|
| WhatsApp | `@openclaw/whatsapp` | [extensions/whatsapp](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/whatsapp) | 128,497 | 59,318 | -53.8% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fwhatsapp) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fwhatsapp) |
| Discord | `@openclaw/discord` | [extensions/discord](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/discord) | 219,551 | 274,085 | +24.8% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fdiscord) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fdiscord) |
| Slack | `@openclaw/slack` | [extensions/slack](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/slack) | 50,285 | 104,782 | +108.4% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fslack) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fslack) |
| Feishu/Lark | `@openclaw/feishu` | [extensions/feishu](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/feishu) | 254,653 | 230,833 | -9.4% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Ffeishu) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Ffeishu) |
| QQ | `@openclaw/qqbot` | [extensions/qqbot](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/qqbot) | 66,240 | 31,991 | -51.7% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fqqbot) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fqqbot) |
| Matrix | `@openclaw/matrix` | [extensions/matrix](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/matrix) | 10,533 | 5,853 | -44.4% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fmatrix) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fmatrix) |
| Microsoft Teams | `@openclaw/msteams` | [extensions/msteams](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/msteams) | 22,947 | 28,118 | +22.5% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fmsteams) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fmsteams) |
| Google Chat | `@openclaw/googlechat` | [extensions/googlechat](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/googlechat) | 20,541 | 10,531 | -48.7% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fgooglechat) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fgooglechat) |
| LINE | `@openclaw/line` | [extensions/line](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/line) | 16,210 | 20,480 | +26.3% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fline) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fline) |
| Zalo | `@openclaw/zalo` | [extensions/zalo](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/zalo) | 13,219 | 7,061 | -46.6% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fzalo) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fzalo) |
| Signal | `@openclaw/signal` | [extensions/signal](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/signal) | 0 | 7,450 | 新增 | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fsignal) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fsignal) |
| iMessage | `@openclaw/imessage` | [extensions/imessage](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/imessage) | 0 | 0 | 持平 | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fimessage) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fimessage) |
| SMS | `@openclaw/sms` | [extensions/sms](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/sms) | 0 | 4,522 | 新增 | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fsms) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fsms) |
| Voice Call | `@openclaw/voice-call` | [extensions/voice-call](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/voice-call) | 32,349 | 16,320 | -49.6% | [基期](https://api.npmjs.org/downloads/point/2026-05-03:2026-06-01/%40openclaw%2Fvoice-call) · [本期](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Fvoice-call) |
| **合计** | **14 个可查询包** | [冻结提交](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions) | **835,025** | **801,344** | **-4.0%** | 各行 API 返回值求和 |

Telegram 没有进入合计：[官方源码目录](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351/extensions/telegram)存在，但 [`@openclaw/telegram` 查询](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/%40openclaw%2Ftelegram)返回包不存在。用其它 Telegram 包补位会破坏官方仓库口径。

## 6、OpenClaw 主包为什么单独看

npm 上的 `openclaw` 包元数据将 repository 指向 `git+https://github.com/openclaw/openclaw.git`，homepage 与 issue 地址也指向同一官方仓库。它可以作为 OpenClaw 整体分发的最清楚代理。

截至 7 月 27 日的滚动 30 天下载为 1055.6 万，比 6 月初同口径高 82.1%。[2025 年 1 月 27 日至 2026 年 7 月 27 日的 API 合计](https://api.npmjs.org/downloads/point/2025-01-27:2026-07-27/openclaw)为 48,971,022 次，与先按月度区间推导出的“累计 4000 万至 5000 万”一致。这个增长不能拆成某个 Channel 的采用量。主包同时包含 Gateway、CLI、插件 SDK、模型连接和其它运行时能力，用户下载主包后也未必启用任何通信平台。

因此，“OpenClaw 月下载”回答整体项目被 npm 拉取了多少次；“官方 Channel 子包月下载”回答独立通信扩展被拉取了多少次。两者不能互相替代。

## 7、增长信号

### 观察一：通信 Skills 仍在扩张

通信 Skills 从 6 月初约 120 万累计下载增至约 150 万，阶段增幅约 25%。邮件处理、跨平台通知、主动发送、电话和短信，把智能体接到了客户跟进、协作提醒、预约确认与异常通知等工作流。

累计下载上升说明供给与关注度继续增长。它无法证明真实调用量，也不能说明有 150 万名用户。

### 观察二：OpenClaw 整体分发增长快于独立 Channel 包

官方主包滚动 30 天下载增长 82.1%，同期官方通信 Channel 子包合计下降约 4%。两条曲线方向不同，说明主包下载不能用来代替 Channel 采用。

一种可能的外部解读是，更多 Channel 被随主包分发、按需启用，或者新增下载集中在核心运行时和其它能力。npm 数据无法区分首次安装、升级与 CI，也无法验证用户实际启用了哪个 Channel。

### 观察三：130 万与 +30% 不属于官方仓库口径

将兼容包、厂商包和社区延伸版本一起搜索，可以得到更大的 Channel 下载量，也可能得到不同的增长方向。按 7 月 27 日官方仓库冻结清单复算，滚动 30 天合计为 80.1 万，较 6 月初同口径下降约 4%。

因此，原“Channel 约 130 万、增长约 30%”不能继续标注为 OpenClaw 官方数据。若未来需要研究广义生态，可以另设“OpenClaw 兼容 Channel”指标，并与官方仓库指标并列展示。

## 8、仍需保存的数据

后续快照至少应保存：

1. 每个 Skill 的 slug、分类、累计下载、可观测安装和抓取时间；
2. 每个官方 Channel 的仓库提交、扩展目录、npm 包名、统计起止日与下载量；
3. 官方仓库、厂商一方适配、社区插件和 fork 四类归属；
4. 含邮件与排除邮件的 Skills 分组；
5. 新增条目、存量自然增长、包迁移与分类规则调整各自贡献。

原始快照、包清单和分类规则需要一起冻结。只保存汇总值，后续很难判断变化来自真实下载、样本扩容还是包迁移。

## 9、未能验证

- 6 月初 Skills 快照的精确日期和逐条清单尚未随约数一并保存。
- ClawHub 下载事件的重复下载与自动化抓取规则不足以支持用户数换算。
- npm 不公开某次下载对应首次安装、升级、CI 或镜像同步，也不提供 Channel 启用状态。
- 官方仓库内的 Channel 分发方式会随版本变化；主包内置、bundled、独立 npm 包之间的迁移会影响跨期可比性。
- 目前没有官方 MAU、活跃连接数、消息发送量、任务完成率、留存率与付费收入。

## 10、信息来源与说明

- [ClawHub 公共 Skills API](https://clawhub.ai/api/v1/skills?limit=200&sort=downloads)：用于获取公开 Skill 条目与下载字段，再按通信口径分类汇总。
- [ClawHub HTTP API 文档](https://docs.openclaw.ai/clawhub/http-api)：用于确认公共目录接口、分页与限流边界。
- [OpenClaw 官方仓库 7 月 27 日冻结提交](https://github.com/openclaw/openclaw/tree/9871eadeb91c65d7a4fa4bbb3cf1b90f61625351)：用于核对 Channel 源码归属和 npm 包名。
- [npm：openclaw 官方主包](https://www.npmjs.com/package/openclaw)：包元数据的 repository、homepage 与 issue 地址均指向 `openclaw/openclaw`。
- [npm downloads API：截至 7 月 27 日的 openclaw 滚动 30 天下载](https://api.npmjs.org/downloads/point/2026-06-28:2026-07-27/openclaw)：返回 10,556,342 次。
- [npm downloads API：截至 7 月 27 日的 openclaw 可观测累计](https://api.npmjs.org/downloads/point/2025-01-27:2026-07-27/openclaw)：返回 48,971,022 次。
- [共享对话：估算通信技能安装次数](https://chatgpt.com/share/6a7a83b4-6bb0-83ea-a149-78ead6c09ae9)：用于还原“区分用户与下载、用月度锚点估累计、再校验量级”的分析过程；其中估算结论已用 npm API 复核或降级标注。
- [OpenClaw Chat Channels](https://docs.openclaw.ai/channels)：用于理解 Channel 名单与分发方式；最终归属仍以冻结提交和包元数据为准。
- 资料观察截止日：2026 年 7 月 27 日。文章修订于 2026 年 8 月 11 日。
