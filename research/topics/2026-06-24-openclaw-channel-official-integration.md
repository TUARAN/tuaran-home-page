---
title: 如何让一个 channel 被 OpenClaw 官方集成：调研——四档分发机制与贡献路径
category: topics
date: 2026-06-24
time: 17:40
tags: [OpenClaw, channel, 插件, plugin-SDK, ClawHub, 官方集成, 贡献指南, bundled-plugin, 开源治理, 飞书, Feishu, Twilio]
summary: 拆解「我怎么做一个 channel、并让它被 OpenClaw 官方集成」——结论先行：默认你只能做第三方插件，能不能往「核心原生 / bundled / 官方外部 / 社区」四档里上爬，取决于是否有 maintainer 接管。本文据核心仓库 CONTRIBUTING、插件文档与 channel 源码逐项标注证据。
tldr: OpenClaw 的 channel 就是插件。做出来不难（manifest + 契约 + 发 ClawHub），难的是「被官方集成」——官方明说「多数功能不接受、应做第三方插件」。四档分发：核心原生 / bundled（随核心发行）/ 官方外部 / 社区；想进 bundled 实质条件是有领域 maintainer 愿意接管维护，飞书就是这么进的。
topic_type: tech
assistance: claude-code
model: claude-opus-4-8
pv: 0
---

> **写在前面**：本文据 OpenClaw 核心仓库 CONTRIBUTING、插件文档与 channel 源码，整理「如何做 channel + 四档分发 + 如何被官方集成」，属外部观察与操作梳理、非官方承诺；标注「未核实」处为公开渠道未确认。

## 一、先给结论

**如果只记住一句话：在 OpenClaw 里做一个 channel 不难（它就是个插件），难的是「被官方集成」——官方默认让你做第三方插件，能不能往上爬到「随核心发行」那一档，实质取决于有没有领域 maintainer 愿意接管维护。**

- **做出来**：写一个带 `openclaw.plugin.json` manifest、声明 `channel` 契约（id / 配置 schema / 入站 / 出站 / allowlist）的插件，发到 **ClawHub**（或 npm），用户 `openclaw plugins install` 即可用。这条路对任何人开放。
- **被官方集成**：CONTRIBUTING 原文——「**Most features are not accepted and should be third party plugins instead**」。所以「进核心」是例外，不是默认。它分四档（见第三节），越往核心越要 maintainer 背书。
- **关键变量不是代码质量本身，而是「有没有人在核心侧愿意为它负责」**：OpenClaw 设了领域 maintainer（如 Channels、甚至专门的「中文 channel」维护者），一个 channel 进 bundled 档，往往对应某位 maintainer 把它纳入了职责。

---

## 二、前提：在 OpenClaw 里，channel 就是插件

要回答「怎么被集成」，先得知道 channel 在架构上是什么：它不是核心写死的特性，而是**构建在公开 plugin-SDK 上的插件**，通过 Gateway 接入。每个 channel 声明一个 `channel` 契约：

- **`openclaw.plugin.json` manifest**：每个原生插件**必须**在根目录带它，OpenClaw 用它**在不执行插件代码的前提下**校验配置；manifest 缺失/非法直接判为插件错误。
- **channel 字段**：`id`（命名空间唯一键）、`label`、`docsPath`、配置 schema、入站（webhook / WebSocket）、出站（send）、allowlist / pairing、group policy。
- **分发**：发到 **ClawHub**（官方 Skill + Plugin 注册表，负责列表、版本史、扫描状态、安装提示）或 npm。

正因为 channel = 插件，「把一个 channel 并入官方」在工程上就是「加一个符合契约、过测试的插件包」——这是个有明确门槛的标准动作，而不是玄学。

---

## 三、四档分发机制（事实层）

`docs/channels/index.md` 给每个 channel 都标了分发档位。归并后是**四档**（官方文档实际用了 bundled / official / downloadable / external 几个标签，本文按「离核心远近」收敛为四档）：

| 档位 | 含义 | 编译产物在哪 | 怎么得到 | 谁维护 | 代表 channel |
|---|---|---|---|---|---|
| **① 核心原生** | 写进核心、无独立插件包 | 核心 `src/` | 核心自带 | 核心团队 | Discord、Telegram、Slack、Signal、WhatsApp、iMessage、IRC |
| **② bundled plugin** | 源码在核心 `extensions/*`，**编译产物随核心一起打包发货** | 进 OpenClaw 安装包 | **装好 OpenClaw 就在里面** | 核心 + 领域 maintainer | **飞书**、QQ Bot、MS Teams、Twitch、Zalo、Synology、Nostr、Tlon |
| **③ 官方外部 / downloadable** | 源码**同样在核心 `extensions/*`**，但 `bundledDist:false` → 产物不进盒子，发布为独立包 | 独立 npm / ClawHub 包 | **要单独 `openclaw plugins install`** | 核心或受信方 | **SMS（Twilio）**、Google Chat、LINE、Matrix、Mattermost |
| **④ 社区 / external** | 厂商或社区自维护，独立分发 | 任意 repo / npm / ClawHub | 单独安装 | 厂商或个人 | **微信、元宝（腾讯）**、Zalo ClawBot、Raft，以及 ClawHub 上一切第三方 |

> **②和③的唯一实质区别**：两者源码都在核心仓库、都是官方维护、都发 ClawHub；差别只在 `package.json` 的 `build.bundledDist` 一个开关——飞书（②）产物**随 OpenClaw 一起发货、开箱即在**；SMS（③，`bundledDist:false`）产物**不进盒子、要单独装**。类比：② 是手机出厂预装 App，③ 是官方出品但要去应用商店点安装的 App——都官方，区别只是「默认带」还是「按需取」。SMS 做成③的可观察理由：发短信需付费 Twilio 账号 + webhook + 10DLC，用的人少，按需装能让基础安装更轻、也能独立于核心发版更新。

> 另一个反直觉点：**「谁写的」不等于「哪一档」**。腾讯的微信、元宝由厂商自维护，是第④档 external；飞书由核心团队主导维护，是第②档 bundled。决定档位的是「核心是否把它纳入自己的维护边界」，不是作者身份。

**上爬路径**：④社区 →（被 maintainer 采纳）→ ②bundled / ③官方外部 →（核心改写）→ ①核心原生。对外部贡献者来说，现实天花板通常是 ②/③——前提是有人接。

---

## 四、从 0 做一个 channel（能装的最小路径）

操作层面（据插件文档）：

1. **建插件包**：根目录放 `openclaw.plugin.json`（plugin identity + 配置 schema + UI 提示），`package.json` 的 `openclaw.channel` 里声明 `id` / `label` / `docsPath` 等。
2. **实现 channel 契约**：配置 schema（zod）、入站处理（webhook 或长连）、出站 `send`、allowlist / pairing、必要的 group policy。对照 `extensions/sms`（Twilio：`accountSid`/`authToken`/`fromNumber` + 入站验签 + 出站 REST）或 `extensions/feishu`（WebSocket bot）抄结构最快。
3. **本地测**：`pnpm build && pnpm check && pnpm test`；插件专用快车道 `pnpm test:extension <name>`；动了共享 channel 面要跑 `pnpm test:contracts:channels`。
4. **发 ClawHub**：`openclaw plugins install clawhub:<name>` 让用户装；ClawHub 负责列表、版本史、安全扫描状态。

到这一步，你已经是**第④档社区插件**——能用、能被搜到、能被装。下一步才是「被官方集成」。

---

## 五、如何让它被官方集成（门槛 + 流程 + 治理）

这一节的核心矛盾是：**核心默认不接收新功能进核心，你要主动越过这道门，并找到愿意接管的 maintainer。**

### 5.1 先认清官方的默认立场

CONTRIBUTING 写得很直白：

- 「**Most features are not accepted and should be third party plugins instead using our plugin SDK.**」——新功能默认应做第三方插件。
- 新功能/架构改动 → **先开 Issue 或去 Discord 谈**，别直接甩 PR。
- 每作者 **最多 20 个开放 PR**（硬上限，超了自动关）。

### 5.2 PR 的硬门槛（据 CONTRIBUTING）

- PR 正文必须写 **What Problem This Solves** + **Evidence**（测试 / CI / 截图 / 日志）。
- 跑过：`pnpm build && pnpm check && pnpm test`；插件改动跑 `pnpm test:extension`、共享面跑 `pnpm test:contracts` / `:channels`；还有 import 边界检查脚本。
- 开 **Allow edits by maintainers**（让 maintainer 能直接接手改）；**别动 `CHANGELOG.md`**（落地时 maintainer/机器人加）。
- 有条件先跑 `codex review --base origin/main`（官方视其为当前最高标准的 AI 评审）。
- 机器人（ClawSweeper / Codex / Barnacle）会要证据，要在 PR 描述里补，而非只回评论。

### 5.3 治理结构：谁说了算

- **Peter Steinberger = Benevolent Dictator**（终裁）。
- 领域 maintainer 制，与 channel 直接相关的有：**Frank Yang（PR triage / Channels）**、**Sliverp（中文 channel：QQ / 微信 / 企微 / 元宝 / 钉钉 / 飞书）**、Shadow（ClawHub / 社区治理）等。
- **一个 channel 能进 bundled，实质是某位 maintainer 把它纳入了自己的维护职责**——这就是「被官方集成」的真正开关。

---

## 六、案例 + 研判：飞书凭什么进了 bundled，你该怎么定位

> 以下是我作为外部观察者的一种解读，不代表 OpenClaw 团队的真实决策依据。

### 6.1 飞书案例（可观察事实 + 合理推断）

- **它是 bundled 档**：文档原文「Feishu/Lark bot via WebSocket (bundled plugin)」，代码在核心 `extensions/feishu`。
- **核心团队亲自维护**：`extensions/feishu` 提交里 **@steipete（创始人）47 次、@vincentkoc（核心）21 次**，外加中文社区贡献者；不是「丢一个 PR 就不管」。
- **有对口 maintainer**：CONTRIBUTING 里 **Sliverp 专管中文 channel（含飞书）**——对口负责人存在，是它能留在核心的实质条件。
- **集成方式契合契约**：飞书走 **WebSocket bot**，自包含、状态轻，贴合 channel 契约；对比微信要 QR 登录、重会话态，后者更适合留在外部插件——这与「微信是 external、飞书是 bundled」的实际档位一致。
- **需求侧（外部可观察）**：OpenClaw 在中国采用度高，飞书/Lark 是国内协作头部平台，需求集中。

**一种外部解读**：飞书进 bundled，是「契约友好 + 核心愿意背维护（有对口 maintainer）+ 高需求」三者叠加的结果，而非单纯「代码写得好」。

### 6.2 给想做 channel 的人的判断（跟进 / 不跟进路径）

- **只想自用 / 小范围** → 做第④档社区插件发 ClawHub 就够，**别追求进核心**；官方本就鼓励这条。
- **想被官方集成** → 现实路径是：先把插件做扎实并有真实用户/证据 → 开 Issue / 去 Discord（#clawtributors）与对口 maintainer 谈 → 接受「有人接管才进 bundled」这个前提；越冷门的平台越难找到接管人。
- **对站长自己（2aran，个人站 + Cloudflare 边缘）**：**结论是「观望、不为进核心而做」**。若哪天要给 OpenClaw 加自有通道（如把站内 Edge 能力做成 channel），按第④档社区插件做、发 ClawHub 即可，投入产出最稳；进核心是可遇不可求的额外项，不应作为目标。
- **下一步（如要动手）**：照 `extensions/sms` / `extensions/feishu` 抄一个最小 channel 骨架，本地 `pnpm test:extension` 跑通契约测试，再决定是否发 ClawHub。

---

## 七、未能验证清单

- 「官方外部目录」（`official-external-channel-catalog.json`）的**准入标准**是否有成文规则、由谁审批——仅见结果列表，未见公开的准入流程文档。
- bundled 与「官方外部」之间是否有明确升降级机制（如社区插件被「提拔」进 `extensions/`）——未见成文政策，飞书的具体并入过程也未逐 PR 追溯。
- maintainer 接管一个 channel 的**触发条件**（需求量阈值？商务关系？纯个人意愿？）——未对外披露。
- CONTRIBUTING / 文档为 2026-06 当前快照，OpenClaw 迭代极快，门槛与档位标签可能变动。
- 本文未实测「从零发一个 channel 到 ClawHub」的完整链路，相关命令以文档口径为准。

---

## 八、收口

**一种外部解读**：OpenClaw 把 channel 设计成插件，于是「做一个 channel」对所有人开放，而「被官方集成」是一道由 maintainer 把关的窄门——四档分发（核心原生 / bundled / 官方外部 / 社区）本质是「核心愿意为它背多少维护责任」的刻度。想被集成，与其打磨代码，不如先确认有没有对口 maintainer 愿意接管；飞书能进 bundled，正是因为这三件事都凑齐了。以上为分析视角，不是预测，也不是建议。

### 信息来源

**OpenClaw 一手 / 官方**
- [GitHub · openclaw/openclaw · CONTRIBUTING.md](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)
- [OpenClaw 文档 · Chat channels（四档标签出处）](https://docs.openclaw.ai/channels/index)
- [OpenClaw 文档 · Building plugins](https://docs.openclaw.ai/plugins/building-plugins)
- [OpenClaw 文档 · Plugin manifest](https://docs.openclaw.ai/plugins/manifest)
- [OpenClaw 文档 · Community plugins（发布到 ClawHub）](https://docs.openclaw.ai/plugins/community)
- [GitHub · 核心 `extensions/feishu`（bundled 案例）](https://github.com/openclaw/openclaw/tree/main/extensions/feishu)
- [GitHub · 核心 `extensions/sms`（官方 Twilio channel 骨架参考）](https://github.com/openclaw/openclaw/tree/main/extensions/sms)

**站内交叉**
- [OpenClaw 的短信能力由谁提供（官方内置 Twilio channel）](/articles/research/topics/openclaw-sms-provider)
- [iMessage 作为 OpenClaw channel](/articles/research/topics/imessage-openclaw-channel)
- [OpenClaw 仓库快照与提 PR 指南](/articles/research/topics/openclaw-repo-snapshot-pr-guide)
- [OpenClaw 主流化落地的现实核对](/articles/research/topics/openclaw-mainstream-adoption-reality-check)
