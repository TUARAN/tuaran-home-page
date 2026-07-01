---
title: OpenClaw 的短信（SMS）能力由谁提供：调研——官方内置 Twilio channel，Telnyx 与社区补位
category: topics
date: 2026-06-24
time: 16:16
tags: [OpenClaw, SMS, 短信, Twilio, Telnyx, Plivo, ClawdTalk, AI-Agent, CPaaS, 语音通话, 验证码, clawphone]
summary: 拆解「OpenClaw 的 SMS 是哪家提供」这个问题——结论先行：OpenClaw 现在（2026.6.10 起）官方内置了一方 SMS channel `@openclaw/sms`，后端是 Twilio；此外 Telnyx 自己写了一方 channel，社区还补了大量 Twilio/自建方案与发短信 skill。本文按核心仓库与官方文档逐项标注证据状态。
tldr: 「OpenClaw 的短信」现在有官方答案：核心仓库内置的 `@openclaw/sms` channel 默认走 Twilio（2026-05-31 加入、随 2026.6.10 发行）。Telnyx 是另一条由 Telnyx 公司自建的一方 channel；要 Agent 主动外发的 skill、以及更省/托管路线，则靠生态。判断落在「内置默认 vs 自选 vs 社区」「channel vs skill」上。
topic_type: tech
assistance: claude-code
model: claude-opus-4-8
pv: 0
---

> **写在前面**：本文梳理 OpenClaw 短信能力的官方与生态路径，依据官方文档、GitHub 仓库与服务商页面等公开信息整理，属外部观察，不构成接入建议；标注「未对外披露 / 未核实」处为未能从公开渠道确认。

## 一、先给结论

**OpenClaw 现在（`2026.6.10` 起）官方内置了一方 SMS channel `@openclaw/sms`，后端是 Twilio——这就是「哪家提供」的官方默认答案；Telnyx 是另一条由 Telnyx 公司自己写的一方 channel，社区还补了大量 Twilio/自建方案和发短信 skill。**

> **更正**：本文初稿曾判断「OpenClaw 官方内核不自带 SMS channel、短信全靠生态」——经核心仓库核验，该结论已过时。`openclaw/openclaw` 的 `extensions/sms` 自 2026-05-31「feat: add Twilio SMS channel」起内置了一方 Twilio SMS channel，随 `2026.6.10` 版发行。下文按此更正。

很多人问「OpenClaw 的 SMS 是哪家的」，现在有分层答案：

- **官方内置默认：Twilio**。核心仓库 `openclaw/openclaw` 的 `extensions/sms`（包名 `@openclaw/sms`）是一方 channel，UI 里显示「SMS (Twilio)」，收发都走 Twilio。这是「盒子里」的默认。
- **官方语音另有插件**：`@openclaw/voice-call` 支持 Twilio / Telnyx / Plivo / Mock 四个 provider，但只做语音；短信由上面的 `@openclaw/sms` 单独负责。
- **第二条一方 channel：Telnyx**——由 Telnyx 公司（team-telnyx 组织）自己写的外部插件 `telnyx-openclaw-sms-channel`（SMS/MMS via Telnyx Messaging API，⭐0 早期）；另有自述「Powered by Telnyx」的托管品牌 **ClawdTalk**。
- **社区补位**：大量 Twilio channel/网关（clawphone 等）、自建 Android 网关（sms-gate.app），以及让 Agent 主动外发的 **skill**（Twilio outreach、Vonage、smsbao…）。

换句话说，**内置默认是 Twilio，但「哪家」仍是分层的**。下文把每条路径的证据、时间线和取舍逐项摊开。

---

## 二、背景：OpenClaw 是什么，以及为什么会冒出「短信谁提供」这个问题

### 2.1 OpenClaw 的来历与节奏

OpenClaw 是一个开源的自主 AI Agent 框架，作者是 Peter Steinberger（PSPDFKit 创始人）。它最早作为个人项目发布，随后短时间内连续改名、迅速蹿红。按维基百科口径的关键节点：

| 时间 | 事件 | 证据状态 |
|---|---|---|
| 2025-11-24 | 初版发布（早期名 Warelay） | 维基词条，二手来源存出入 |
| 2026-01-02 | 更名 Clawdbot | 维基词条 |
| 2026-01-27 | 因 Anthropic 商标顾虑更名 Moltbot | 维基词条 |
| 2026-01-30 | 定名 OpenClaw（沿用至今） | 维基词条 |
| 2026-02-14 | Steinberger 宣布加入 OpenAI，治理移交 OpenClaw Foundation | 维基词条 |
| 2026-03-02 | GitHub 约 247,000 stars / 47,700 forks | 维基词条、二手报道 |

> 命名与早期日期在不同二手来源（维基 vs 多家 SEO 博客）之间有出入：有的把「Clawdbot」记为 2025-11 的初名、把「正式发布」记为 2026-01-25。本文以维基词条为主线，差异点列入第六节未能验证清单。

### 2.2 为什么 Agent 需要短信

OpenClaw 的定位是连接 WhatsApp / Telegram / Discord / Slack 等十余个消息通道的助理。但这些都是「互联网消息」。一旦要让 Agent **触达物理世界**——给真人发提醒短信、对外注册服务收验证码、回落到没有 App 的人——就需要一个真正的电话号码与短信通道。这正是「短信谁提供」会成为一个具体工程问题的原因：**框架本身不发短信，要发就得外接电信能力（CPaaS 或自建网关）**。

---

## 三、事实层：OpenClaw 短信路径全景（逐项标注证据）

> 下表区分三种状态：**已确认**（有官方文档 / 仓库 / 服务商页面直接佐证）、**自我披露**（来自服务方自述）、**未对外披露**（公开渠道未见）。

| 路径 | 提供方 / 底层 | 是否含短信 | 官方/社区 | 关键事实 | 证据状态 |
|---|---|---|---|---|---|
| **`@openclaw/sms`（核心内置 channel）** | **Twilio** | ✅ 收 + 会话内回复 | **OpenClaw 一方内置** | 就在核心 monorepo `openclaw/openclaw` 的 `extensions/sms`，UI 显示「SMS (Twilio)」；2026-05-31 加入、随 `2026.6.10` 发行 | 已确认（核心仓库 + 源码） |
| `@openclaw/voice-call` 官方插件 | Twilio / Telnyx / Plivo / Mock | ❌ 仅语音，**不含 SMS** | OpenClaw 一方 | npm 包 `@openclaw/voice-call`；provider：Twilio(Programmable Voice+Media Streams)、Telnyx(Call Control v2)、Plivo(Voice API)、Mock | 已确认（官方文档） |
| `telnyx-openclaw-sms-channel` | **Telnyx** | ✅ SMS/MMS via Telnyx Messaging API | Telnyx 公司一方（外部仓库） | Telnyx 官方 GitHub 组织（team-telnyx）自建的 OpenClaw 短信 channel 插件，建仓 2026-04-26、仍在更新；⭐0，处早期阶段 | 已确认（仓库 + 提交记录） |
| **ClawdTalk** 托管服务 | 自述 **Powered by Telnyx** | 自述含语音 + WhatsApp + SMS | 第三方托管品牌 | clawdtalk.com「一号三通道」给真实号码；自述 beta + 免费档 100 条/日 SMS。与 team-telnyx 一方插件是否同一团队，未对外明确披露 | 自我披露（页面）；与官方组织关系未核实 |
| **clawphone** | **Twilio** | ✅ 语音 + 短信 | 社区（ranacseruet） | Node.js 网关，桥接 Twilio 语音/短信到 OpenClaw；TwiML 轮询避开 WebSocket；v1.2.0（2026-04-05） | 已确认（GitHub） |
| **openclaw-sms-gateway** | **sms-gate.app + 安卓手机** | ✅ 短信收发 | 社区（zacharypodbela） | 把一台安卓手机变成发信通道，不依赖传统 CPaaS API；v1.0.0（2026-02-21） | 已确认（GitHub） |
| A2H 协议（Twilio Labs） | Twilio Labs | ⭕ 非短信通道，是「人机授权」层 | 实验/提案 | Agent-to-Human 协议，给 Agent 操作加「带证据的同意」（JWS 签名、Face ID）；发布约 2026-02-19 | 已确认（Twilio 博客） |

### 3.1 官方这一层：内置 `@openclaw/sms`（Twilio）+ 语音 `@openclaw/voice-call`

**OpenClaw 核心团队自己内置了一方 SMS channel，后端是 Twilio。** 它就在核心 monorepo `openclaw/openclaw` 的 `extensions/sms`（包名 `@openclaw/sms`），与 discord/slack/telegram/whatsapp/signal 这些一方 channel 并列；README 自述「Official OpenClaw channel plugin for SMS」，channel 选择器里显示 **「SMS (Twilio)」**。它由 [PR #88476「feat: add Twilio SMS channel」](https://github.com/openclaw/openclaw/pull/88476) 于 2026-05-31（北京时间下午）merge 进 main，随 `2026.6.10` 版发行——这也是「OpenClaw 的短信是哪家」最直接的官方答案：**默认 Twilio**。（源码：[`openclaw/openclaw` › `extensions/sms`](https://github.com/openclaw/openclaw/tree/main/extensions/sms)）

机制（读 `extensions/sms/src` 源码）：

- **要的凭证**：Twilio `accountSid` + `authToken` + `fromNumber`（或 `messagingServiceSid`）+ `publicWebhookUrl` + `allowFrom` 白名单；
- **入站**：Twilio 把收到的短信 POST 到该 channel 的 webhook，默认**校验 Twilio 签名**（要关得显式开 `dangerouslyDisableSignatureValidation`）；
- **出站**：POST 到 `https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`，用 `Basic base64(SID:authToken)` 鉴权，在会话里回复；fetch 带 SSRF 防护，E.164 号码处理，支持多账号。

语音是另一个模块：`@openclaw/voice-call` 支持 Twilio / Telnyx / Plivo / Mock 四个 provider，但只做出/入站通话、实时音频、流式转写——**短信不归它管，归 `@openclaw/sms`**。

> 「内置」的分寸：`@openclaw/sms` 是**一方内置 channel（随官方发行、出现在 channel 列表 / quickstart）**，但和其它 channel 一样仍需各用户填 Twilio 凭证才启用，README 也给了 `openclaw plugins install @openclaw/sms`。所以「预装」准确说是「官方在盒子里、核心维护的默认 SMS channel」，而非「零配置自动开」。

### 3.2 Telnyx 这一层：托管路线的承运方

Telnyx 在 OpenClaw 短信上有**两条需要区分**的呈现：

1. **Telnyx 一方插件（有提交记录）**：官方 GitHub 组织 `team-telnyx` 维护着一组 OpenClaw 插件，其中 `telnyx-openclaw-sms-channel`（描述「OpenClaw channel plugin: SMS/MMS via Telnyx Messaging API」，建仓 2026-04-26、仍在更新）就是短信通道，另有 `clawtalk-plugin`（语音/SMS，2026-03-09 建）与 `telnyx-openclaw-voice-call`。这是「Telnyx 提供 OpenClaw 短信」最硬的证据——但都还是 ⭐0–1 的早期阶段。
2. **ClawdTalk 托管品牌（仅自我披露）**：`clawdtalk.com` 对外宣称给 OpenClaw 一个真实号码、语音/WhatsApp/SMS 三通道共用同一 Agent，标注「Powered by Telnyx」，beta + 免费档（含 100 条/日 SMS）。它与上面 team-telnyx 一方插件是否同一团队，未对外明确披露。

> **更正说明**：本文初稿曾引用一个名为 `team-telnyx/clawdtalk-client`、描述「Voice calling and SMS for Clawdbot」的仓库作为证据——经核验该仓库不存在（404），那段描述实属无关个人仓库 `blkluv/clawdtalkd`（⭐0）。已替换为真实存在的 `team-telnyx/telnyx-openclaw-sms-channel`。另有 `clawdtalk.com` 与 `clawtalk.com`（后者页面偏重语音）两个站点命名歧义，同样列入第六节未能验证清单。

### 3.3 Twilio 这一层：自建拼装的默认选择

不走托管、自己接电信能力时，公开做法与社区插件最常落到 **Twilio**：语音和短信同一账号、同一号码，出站短信走 Twilio REST API。代表项目是社区的 **clawphone**——一个把 Twilio 语音/短信桥接到 OpenClaw 的 Node.js 网关，用 TwiML 轮询的方式避开 WebSocket 复杂度，明确定位为官方 `@openclaw/voice-call` 之外「更省事、基建更轻」的替代。

### 3.4 自建这一层：不接 CPaaS 的安卓网关

`openclaw-sms-gateway` 走的是另一条路：**不接任何云 CPaaS**，而是把一台安卓手机经 sms-gate.app 变成出/入信网关。好处是用自己的手机号与套餐、对路由有完全控制；代价是要常驻一台安卓设备。适合「不想为短信单独开 Twilio/Telnyx 账号、也不在意合规批量」的个人自托管场景。

---

## 四、第二条一方 channel：Telnyx 自建插件——机制、公司背景与 vs Twilio

> 区分两个「官方」：核心内置默认是 **`@openclaw/sms`（OpenClaw 官方写、Twilio 后端，见 §3.1）**；本节讲的 `telnyx-openclaw-sms-channel` 是 **Telnyx 公司自己写的另一条一方 channel**（不在核心仓库）。「channel」不等于「OpenClaw 自己发短信」——是某家有发短信资质的公司把它的 API 接成一个 OpenClaw channel。本节回答「Telnyx 凭什么也能做、它和 Twilio 啥区别」。

### 4.1 机制：插件只是把 Telnyx Messaging API 包成一个 channel

`telnyx-openclaw-sms-channel` 仓库 README 自我定位为 **「Official Telnyx SMS/MMS channel for OpenClaw」**（这里的「Official」指 Telnyx 官方，不是 OpenClaw 内置）。工作方式（README 要点，已确认）：

- 前提：一个 **Telnyx 账号 + API v2 key（`KEY...`）+ 一个具备 SMS/MMS 能力的 Telnyx 号码 + Messaging Profile**；
- 插件用这把 key 自动发现号码、Messaging Profile、webhook 公钥，并安全配置 Telnyx webhook（默认不覆盖已有第三方集成）；
- 入站短信经 Telnyx webhook 推来，插件先验 **Ed25519 签名**再派发给 Agent；出站走 Telnyx Messaging API；默认 allowlist 白名单模式；
- 美国 A2P 流量需 **10DLC** 审批；要求 OpenClaw `2026.4.21+`。

**关键点：OpenClaw 内核不发短信，发短信的是 Telnyx。** 插件只是适配层——把「Telnyx 能发短信」接进 OpenClaw 的 channel 抽象。所以「内置渠道」成立的前提是：背后那家公司本身具备发短信的资质与 API。

### 4.2 凭什么是 Telnyx：它本身是持牌运营商 + 自有网络

Telnyx 能做这件事，不是因为它转接了别人的短信通道，而是**它自己就是一家持牌电信运营商（CPaaS），拥有自有 IP 网络、能直接签发号码并收发短信**。公司背景（公开信息）：

| 维度 | Telnyx | 证据状态 |
|---|---|---|
| 成立 | 2009 年，芝加哥；David Casem（CEO）/ Ian Reither（COO） | 已确认（多来源） |
| 演进 | 2010–2013 从呼叫中心咨询 → 转售话务 → 取得持牌运营商资质，2013 注册 Telnyx LLC | 已确认 |
| 自有网络 | 2015 起自建全球私有 IP 通信网，布 PoP、与 Tier-1 运营商直连；2016 上线 Mission Control Portal + Telnyx API | 已确认 |
| 资本 | Techstars（2014）；投资方含 Founders Fund（Thiel）、Drive Capital、Pritzker；披露融资约 \$11M，以自举为主 | 已确认（口径见来源） |
| 形态 | 未上市，约 270 人；近年把 AI 推理与电信层并置（语音 AI / 推理） | 自我披露 + 二手 |

一句话：**Telnyx 不是「短信中间商」，而是「自己持牌、自己建网、用 API 卖出去」的运营商**——这正是它有底气写一个「官方内置 channel」、而不必再去接别人通道的原因。

### 4.3 Telnyx vs Twilio：两家在 OpenClaw 里的角色差异

短信生态的另一极是 Twilio。两家都能给 OpenClaw 发短信，但出身与在 OpenClaw 里的姿态不同：

| 维度 | Telnyx | Twilio |
|---|---|---|
| 成立 / 总部 | 2009，芝加哥 | 2008，旧金山（Jeff Lawson） |
| 上市状态 | 未上市，~270 人，偏自举 | 上市（NYSE: TWLO，2016 IPO），体量大得多 |
| 网络 | 自有私有 IP 骨干 + 持牌运营商，AI 推理与电信层并置 | CPaaS，编排合作运营商通道、外接第三方语音 / AI |
| 美国 SMS 单价（公开口径） | ~\$0.004/条 | ~\$0.0083/段（约 2 倍） |
| MMS（出 / 入） | \$0.015 / \$0.005 | \$0.022 / \$0.0165 |
| 100 万条/月（美国）量级 | ~\$4,000 | ~\$8,300 |
| 生态广度 | 较窄，主打价格 + 自有网络 | 最广、最成熟，集成生态最大 |
| 在 OpenClaw 的姿态 | **一方官方插件**（team-telnyx：sms-channel / voice-call / …） | 社区插件（clawphone）+ A2H 协议（Twilio Labs）；官方 voice-call 插件把 Twilio 列为 provider 之一 |

> 上表价格为各家公开费率的量级横向参照，会随号段、目的地、10DLC 合规与套餐变动，**不代表 OpenClaw 任何具体接入的实付价格**。

> 以下是我作为外部观察者的一种解读，不代表两家公司的真实定位。**一种外部解读**：Telnyx 亲自下场写自有 channel 插件（+ 自有网络 + 低单价），更贴近把短信当成本项、追求量大的场景；Twilio 则是被 **OpenClaw 核心团队选作内置 `@openclaw/sms` 的后端**（核心团队写、Twilio 公司本身在 OpenClaw 上更多停在 A2H 协议层），胜在生态广与成熟、上手门槛低。选哪家落在「用内置默认（Twilio）还是换 Telnyx」「省钱还是要生态」这组结构性取舍上。

### 4.4 channel 还是 skill：两家官方各做到哪一层

OpenClaw 里「发短信」有两个不同方向，别混：

- **channel（入站为主、可在会话内回复）**：别人发短信到 Agent 的号码，Agent 收到并回复——「让人能用短信跟 Agent 对话」。
- **skill（Agent 主动发起的能力 / 工具）**：Agent 把「发一条短信给某人」当成动作去调用，可单发、批量、查状态——「让 Agent 能主动往外发短信」。

这里有**三个不同的「官方」**，别混（GitHub 核验）：

| 谁 | SMS channel | 「发短信」skill | 备注 |
|---|---|---|---|
| **OpenClaw 核心**（openclaw/openclaw） | ✅ `@openclaw/sms`，**后端 Twilio**（收 + 会话内回复） | ❌ 核心不内置发短信 skill | 这是「盒子里」的默认；Twilio 是被核心团队选作后端，不是 Twilio 公司写的 |
| **Telnyx 公司**（team-telnyx 组织） | ✅ `telnyx-openclaw-sms-channel`（自建一方，外部仓库） | ❌ 未见独立发短信 skill（该组织唯一的 Skill 是 `openclaw-skill-video-creator`，做视频不是短信） | 还出了 voice-call / tts / stt / embeddings / intelligence 等一方 provider 插件 |
| **Twilio 公司**（twilio-labs 组织） | ❌ Twilio 公司未自建 OpenClaw SMS channel | ❌ 未见官方发短信 skill | 只出了 A2H 协议（`Agent2Human`）+ 被列进官方 voice-call 的 provider |

**结论：短信的官方答案在 OpenClaw 核心这一侧（`@openclaw/sms` → Twilio），而不是 Twilio 公司自己做的。** Telnyx 是唯一「公司亲自下场写 SMS channel」的 provider，但同样**没做发短信 skill**；Twilio 公司在 OpenClaw 上更靠协议层与 provider 层。**「让 Agent 主动外发短信」的 skill，三方官方都没做，全靠社区。**

补一条硬证据：核心仓库顶层 `skills/`（内置 agent skills：1password / github / weather / apple-notes / `imsg` …）里**没有任何 twilio / sms / phone 名义的内置 skill**——唯一与消息相关的内置 skill 是 `imsg`（iMessage，苹果生态，非 Twilio 短信）。即 **OpenClaw 默认内置了 Twilio SMS *channel*，但没有内置任何 Twilio/SMS *skill***。

短信的 skill（以及 Twilio 这边的 channel）几乎全由**社区**补齐，数量很多（GitHub 同名仓库一大把，多为 ⭐0–1）：

- Telnyx skill 侧：`pcitalian/telnyx-sms-openclaw`（含 allow-list 管理 skill）、`mnjbold/telnyx-tools`（SMS/Voice 工具集）。
- Twilio 侧：channel 有 `clawSean/openclaw-twilio-sms`、`DJTSmith18/openclaw-twilio`（含 MMS/RCS/群发）、`tspen/openclaw-twilio-sms-bridge` 等；skill 有 `mrnsmh/openclaw-skill-twilio-outreach`（单发 / CSV 批量 / 收件箱 / 状态）、`DovieW/twilio-sms-skill`。
- 其他玩家也各做了 skill：Vonage（`pardel/openclaw-vonage-sms`）、sms-gate.app（`minstn/sms-gateway`）、VirtualSMS、smsbao（中文「龙虾机器人短信技能」）等。

> 以下是外部观察者的一种解读。**姿态差异很清楚**：Telnyx 公司亲自下场写一方插件（自有 channel + 一堆 provider），主动把自己嵌进 OpenClaw 运行时；Twilio 公司自己更像站在标准与 provider 层（A2H 协议 + voice provider），但**它的短信反而被 OpenClaw 核心团队选作内置 `@openclaw/sms` 的默认后端**——即「Twilio 不主动嵌、却因生态最广被官方默认采用」。这是结构性路线差异，不代表哪条更优。

---

## 五、时间线：短信生态是怎么长出来的

| 时间 | 节点 | 与短信的关系 |
|---|---|---|
| 2026-01-30 | OpenClaw 定名 | 框架走红，外接能力需求开始集中 |
| 2026-02-19 | Twilio Labs 发布 A2H 协议（约） | Twilio 侧介入 Agent「人机同意」层，非短信通道但属同一阵营 |
| 2026-02-21 | `openclaw-sms-gateway` 建仓 v1.0.0 | 最早的「自建安卓短信网关」社区方案（建仓记录） |
| 2026-02-21 | clawphone 建仓 | Twilio 语音+短信网关起步（建仓记录） |
| 2026-03-09 | team-telnyx 建 `clawtalk-plugin`（语音/SMS） | Telnyx 一方介入 OpenClaw 短信/语音（建仓记录） |
| 2026-04-05 | clawphone v1.2.0 release | Twilio 网关迭代成形（release 记录确认） |
| 2026-04-26 | team-telnyx 建 `telnyx-openclaw-sms-channel` | Telnyx 公司自建一方短信通道（建仓记录，⭐0 早期） |
| **2026-05-31** | **核心仓库 PR #88476 `feat: add Twilio SMS channel` merge** | **OpenClaw 把短信收进官方：内置 `@openclaw/sms`，后端 Twilio** |
| 2026-06-10 | `@openclaw/sms` 随 `2026.6.10` 发行 | 官方内置 Twilio SMS channel 进入正式版本 |

**这一阶段的核心特征是：先有社区与 Telnyx 各自补位（2 月起），到 5-31 OpenClaw 核心团队把短信正式收进框架——内置 `@openclaw/sms` 并选 Twilio 作后端。于是格局变成「官方内置默认（Twilio）+ Telnyx 自建一方 + 社区大量补位」。**

---

## 六、研判：所以「OpenClaw 的 SMS 是哪家提供」该怎么回答

> 以下是我作为外部观察者的一种解读，不代表 OpenClaw、Twilio、Telnyx 或任何项目方的真实定位或承诺。

### 6.1 正确的回答方式：先选路径，再谈服务商

把「哪家提供」当成单选题会得不到答案。它更像一棵决策树：

```
要短信？
├─ 用官方内置默认（最省心、核心维护）
│     └─ @openclaw/sms → 后端 Twilio（填 Twilio 凭证即用）
├─ 想换 Telnyx（自有网络 / 低单价）、走一方插件
│     └─ team-telnyx/telnyx-openclaw-sms-channel（有提交记录，但 ⭐0 早期）
├─ 想要托管号（一号多通道，自述）
│     └─ ClawdTalk → 自述 Powered by Telnyx（与官方组织关系未核实）
├─ 要 Agent 主动外发（skill，而非 channel）
│     └─ 社区 skill：mrnsmh/...twilio-outreach、Vonage、smsbao…（官方未做）
└─ 不想开 CPaaS 账号、有一台安卓常驻
      └─ openclaw-sms-gateway → sms-gate.app + 安卓手机
```

- **官方内置默认** → `@openclaw/sms`，后端 **Twilio**（核心维护，盒子里就有）。
- **想换承运 / 压单价** → **Telnyx** 自建一方 channel（或托管的 ClawdTalk）。
- **要主动外发** → 这是 **skill** 不是 channel，目前只有社区做。
- **极简、零云账号** → 安卓自建网关。

差异落在结构上：**谁出号、谁担合规与运营商对接、谁向你收钱**。内置默认这条，号与账单在你自己的 Twilio 控制台、插件由 OpenClaw 核心维护；换 Telnyx 则把承运换成 Telnyx 自有网络。

### 6.2 跟进 / 不跟进 / 观望

对站长自己的项目（个人站 + Cloudflare 边缘）而言：

- **结论：观望偏不跟进（短期）。** 站内既有的短信/通道能力已由 [WorkBuddy 的 SMS/RCS 通道调研](/articles/research/topics/workbuddy-sms-rcs-channel) 与 [Resend 邮件 OTP](/articles/research/topics/resend-email-otp-cloudflare-d1) 覆盖了「触达 + 验证码」的现实需求，没有非接 OpenClaw 短信不可的场景。
- **若哪天确需收发短信**：直接用官方内置 `@openclaw/sms`（填 Twilio 凭证），不必再找社区插件；要更低单价或自有网络再换 Telnyx 一方 channel。
- **若要 Agent 主动外发（skill）**：官方未做，需用社区 skill（如 `mrnsmh/openclaw-skill-twilio-outreach`）或自己包一层，接入前先评估其维护状态（多为 ⭐0–1）。
- **下一步（如要动手）**：先跑通官方 `@openclaw/sms` + Twilio 的入站 webhook 签名校验；再评估把短信收发做成 Cloudflare 边缘路由（与站内既有 D1/Edge 范式一致），而非常驻一台安卓设备。

---

## 七、行业横向参照 & 未能验证清单

### 7.1 第三家：Plivo（仅横向参照，非 OpenClaw 实付数据）

Telnyx / Twilio 的对比见第四节。生态里还有第三家 **Plivo**——它是官方 `@openclaw/voice-call` 插件列出的语音 provider 之一，但短信能力需自接（官方插件那一层只给语音）。Plivo 美国出站 A2P SMS 公开费率量级约 \$0.005/条起，定位与 Telnyx 接近（价格导向的 CPaaS）。

> 价格为公开费率量级，随号段、目的地、10DLC 合规与套餐变动，**不代表 OpenClaw 任何具体接入的实付价格**。

### 7.2 未能验证的事实清单

- OpenClaw 早期命名与发布日（Warelay / Clawdbot 谁先、2026-01-25 vs 01-30），维基与多家 SEO 博客口径不一，未取到一手提交记录佐证。
- `clawdtalk.com` 与 `clawtalk.com` 是否同一团队、短信是否两边都开放——未对外明确披露。
- **ClawdTalk 托管品牌与 Telnyx 官方组织（team-telnyx）的关系**：前者自述「Powered by Telnyx」，后者维护一方插件 `telnyx-openclaw-sms-channel`，但两者是否同一团队、托管号是否就跑在这套插件上，未对外披露。（注：初稿误引的 `team-telnyx/clawdtalk-client` 仓库经核验不存在，已更正。）
- ClawdTalk 免费档「100 条/日 SMS」「\$12 / \$30 月费」为服务方自述，未做实测；beta 期条款可能变动。
- team-telnyx 的 OpenClaw 插件均为 ⭐0–1 的早期仓库，是否进入稳定可用、是否有官方支持承诺，未对外披露。
- ~~是否存在官方短信插件~~ —— **已确认存在**：核心仓库 `extensions/sms`（`@openclaw/sms`，Twilio 后端，2026-05-31 加入）。本文初稿曾误判「官方不带 SMS channel」，已据此全面更正。
- `@openclaw/sms` 是否在某些发行/平台上「零配置自动启用」，还是一律需手填 Twilio 凭证——本文按 README 的 install 口径理解为后者，未在所有客户端实测。
- 中国大陆号段 / 国内运营商短信合规路径，本文未覆盖（上述 Twilio/Telnyx/Plivo 均以海外 A2P 为主）。
- 各社区插件的活跃度与维护承诺（clawphone、openclaw-sms-gateway）仅看了版本号与 commit 数，未评估长期可维护性。

---

## 八、收口

**一种外部解读**：到 2026.6.10，「OpenClaw 的短信是哪家」有了官方答案——核心内置 `@openclaw/sms`，后端 **Twilio**（2026-05-31 收进框架）。在它之外，Telnyx 公司自建了另一条一方 channel（自有网络、低单价），托管的 ClawdTalk 自述 Powered by Telnyx，社区还补了大量 channel 与「主动外发」的 skill。所以更准确的说法不是「没官方」，而是「**官方内置默认是 Twilio，换承运 / 要 skill / 要托管再往生态走**」。这也提醒一点：OpenClaw 迭代极快，结论要以核心仓库当前版本为准——本文已据此从「官方缺位」更正为「官方内置 Twilio」。以上为分析视角，不是预测，也不是建议。

### 信息来源

**OpenClaw 一手 / 官方**
- [GitHub · openclaw/openclaw 核心仓库 `extensions/sms`（`@openclaw/sms`，Twilio SMS channel）](https://github.com/openclaw/openclaw/tree/main/extensions/sms)
- [GitHub · PR #88476「feat: add Twilio SMS channel」（2026-05-31 merge）](https://github.com/openclaw/openclaw/pull/88476)
- [OpenClaw 官方文档 · SMS channel](https://docs.openclaw.ai/channels/sms)
- [OpenClaw 官方文档 · Voice call plugin](https://docs.openclaw.ai/plugins/voice-call)
- [OpenClaw 官方文档 · Messages](https://docs.openclaw.ai/concepts/messages)
- [npm · @openclaw/voice-call](https://www.npmjs.com/package/@openclaw/voice-call)
- [Wikipedia · OpenClaw](https://en.wikipedia.org/wiki/OpenClaw)

**短信 / 电信生态**
- [Telnyx · Voice calls for OpenClaw with ClawdTalk](https://telnyx.com/resources/openclaw-phone-calls)
- [ClawdTalk 官网](https://www.clawdtalk.com/)
- [GitHub · team-telnyx/telnyx-openclaw-sms-channel（SMS/MMS via Telnyx Messaging API，一方插件）](https://github.com/team-telnyx/telnyx-openclaw-sms-channel)
- [GitHub · team-telnyx/clawtalk-plugin（voice/SMS）](https://github.com/team-telnyx/clawtalk-plugin)
- [GitHub · ranacseruet/clawphone（Twilio voice/SMS 网关，v1.2.0 / 2026-04-05）](https://github.com/ranacseruet/clawphone)
- [GitHub · zacharypodbela/openclaw-sms-gateway（安卓 + sms-gate.app）](https://github.com/zacharypodbela/openclaw-sms-gateway)
- [Twilio · Agent-to-Human (A2H) Protocol with OpenClaw](https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/agent-to-human-protocol-with-openclaw)

**Telnyx 公司背景 / 与 Twilio 对比**
- [Telnyx Help Center · What is Telnyx](https://support.telnyx.com/en/articles/1130637-what-is-telnyx)
- [Crunchbase · Telnyx 公司档案与融资](https://www.crunchbase.com/organization/telnyx)
- [Telnyx · Telnyx vs Twilio for SMS](https://telnyx.com/resources/telnyx-vs-twilio-sms)
- [Plivo · Telnyx vs Twilio 对比](https://www.plivo.com/blog/telnyx-vs-twilio/)
- [SuprSend · Telnyx vs Twilio: Which SMS API to Choose in 2026](https://www.suprsend.com/post/telnyx-vs-twilio)

**站内交叉**
- [WorkBuddy 的 SMS / RCS 通道调研](/articles/research/topics/workbuddy-sms-rcs-channel)
- [Resend 邮件 OTP + Cloudflare D1](/articles/research/topics/resend-email-otp-cloudflare-d1)
- [OpenClaw 主流化落地的现实核对](/articles/research/topics/openclaw-mainstream-adoption-reality-check)
- [OpenClaw 仓库快照与提 PR 指南](/articles/research/topics/openclaw-repo-snapshot-pr-guide)
