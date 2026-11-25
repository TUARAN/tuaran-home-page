---
title: T3 Code 争议复盘：商标、遥测与「网红带节奏」之争
category: topics
date: 2026-11-25
time: 18:00
tags: [T3 Code, Theo, 开源治理, 遥测, 商标, oh-my-pi, pi, Coding Agent]
summary: T3 Code 两条争议线索的证据强度差别很大：商标纠纷已经结案，遥测争议仍在进行；「网红祸害开源」缺少直接证据，omp 与 pi 的差别则能从贡献政策上查到。
tldr: 商标一线 19 分钟收口，遥测一线（默认开启、承诺撤下、无界面开关）有 commit 与 issue 佐证，仍未了结。Theo 评价 omp 的原话没有查到公开出处。omp 与 pi 的差别在贡献门槛：pi 对新人 PR 默认关闭，omp 目前试行全开放。
topic_type: product
content_type: analysis
assistance: claude-code
model: claude-sonnet-5-5
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险提示：** 社交平台发言和评论区转述多数无法在原站复核，文中标注「待核」的条目没有查到一手出处，引用前请回查原帖。

## 一、先给结论

T3 Code 这一周同时挂着两件事：魔改版商标纠纷，以及默认遥测的信任问题。前者已经收口，后者还在发酵。把两件事合并成「Theo 这类网红祸害开源」，证据不够。

- 商标纠纷（11 月 20–24 日）：魔改版 19 分钟内改名，当事人公开表示与 Theo 没有矛盾。争议后来升级成国籍与情绪之争，核心事实没有分歧。
- 遥测争议（3 月至今）：默认开启、首页「不开启遥测」承诺在 6 月被撤下、界面内没有开关，这三点有 commit、归档页面和 issue 佐证。这是项目治理与用户信任问题，影响比商标纠纷大。
- 评论区转述的「Theo 说 omp 是垃圾」：[!warn]待核[/!warn]，检索未找到公开原文。
- omp 与 pi 的差别能核实：omp 当前试行向所有人开放 issue 与 PR；pi 默认自动关闭新贡献者的 issue 和 PR，批准后才能提 PR。
- 判断：T3 Code 观望，等遥测开关落地；omp 值得跟进，pi 生态是它的上游。

## 二、事实层

### 2.1 T3 Code 是什么

| 项 | 内容 | 来源口径 |
|---|---|---|
| 定位 | 统一调度多个 Coding Agent 的开源控制面，已支持 Claude Code、Codex、Cursor、OpenCode、Antigravity、Pi 等，接 ACP 的 Agent 也可使用 | [!good]已核验[/!good]（仓库 README） |
| 许可 | 源码 MIT；README 注明许可不含名称、标识、图标等商标与品牌 | [!good]已核验[/!good] |
| 体量 | 约 7.76 万 star、1.32 万 fork（抓取时） | [!good]已核验[/!good] |
| 运营主体 | T3 Tools, Inc.，创始人 Theo（t3.gg） | [!good]已核验[/!good] |

### 2.2 商标事件时间线

冯若航的文章给出了完整过程，各节点引用的 X 帖本次没能逐条打开，时间以该文为准。

| 日期 | 事件 |
|---|---|
| 11 月 20 日 | 「开源小新」发布基于 T3 Code 魔改的「T3 星尘版」，简介注明自己改过，仓库名、软件名、图标仍沿用 T3 |
| 11 月 23 日下午 | 博主把魔改版当作官方版发帖吐槽（同屏两个输入框、会话重复） |
| 当晚 | Theo 转发，称为 “Chinese knockoff”，随后补一句 “Temu3 Code”；小新表示会考虑改名，Theo 回复要求立刻改，否则申请封号 |
| 19 分钟后 | 仓库改名「星尘 Agent」，清除 T3 名称与图标，标明非官方；吐槽的博主下载官方版实测后公开道歉 |
| 11 月 24 日 | 中文社区围攻，指控种族歧视与双标；Theo 硬刚并发表针对中国开发者的气话；仓库补入 TRADEMARK.md，README 改为「以你自己的品牌 fork」 |

商标规则本身没有争议。MIT 授权代码，不授权商标。Debian 的 Iceweasel、Valkey、OpenTofu、OpenSearch 是同类先例。

### 2.3 遥测争议时间线

综合 GitHub issue #4123、仓库提交和第三方整理（Sulat 的时间线标注了哪些是核对过的 diff，哪些来自评论者转述）：

| 日期 | 事件 | 口径 |
|---|---|---|
| 3 月 5 日 | PR 174 加入 PostHog 遥测，默认开启；关闭用环境变量，当时未写入文档 | [!good]已核验[/!good] |
| 3 月 25 日 | 有人提 issue 要求关闭开关 | [!good]已核验[/!good] |
| 5 月 14 日 | 归档页面里首页仍写着「No telemetry. Unless you opt in. Full stop.」 | [!good]已核验[/!good] |
| 6 月 17 日 | 提交删除首页该承诺，标题未提及遥测 | [!good]已核验[/!good] |
| 6 月 23 日 | 要求更易关闭的 issue 以「不计划」关闭 | [!good]已核验[/!good] |
| 7 月 18 日 | issue #4123 开出，质疑承诺与实际不符 | [!good]已核验[/!good] |
| 9 月 4 日 | 遥测文档出现（评论者说法） | [!warn]待核[/!warn] |
| 11 月 1 日 | 管理员策略（managed policy）合入 | [!good]已核验[/!good] |
| 11 月 17 日 | 界面内开关的 PR 被关闭 | [!good]已核验[/!good] |
| 11 月 24–25 日 | 争议再起；Theo 发帖称将移除读取登录文件的用法，并公布自己约 100MB、95,789 条事件的遥测数据；界面开关 PR #27077 重新出现 | 部分已核验 |

文档称收集的内容包括 Provider、模型、推理强度、权限模式、回合结果、耗时、发布通道和主 Agent 的 token 总量，不含提示词、回复、文件内容和认证令牌；事件发往 ingest.t3.codes，转 PostHog，中继连接追踪另发 Axiom。关闭方式目前是环境变量 `T3CODE_TELEMETRY_ENABLED=false`，或管理员策略。

有争议的是标识符：第三方整理指出，事件里的哈希覆盖 T3 账号、OpenAI 登录（Codex `user_id`）、Claude 登录（`accountUuid`）和随机设备 ID，哈希为不加盐 SHA-256，持有原始 ID 的人可以重算比对。目前没有看到有人这样做过。

### 2.4 评论区提到的另外几条

| 评论说法 | 能否核实 |
|---|---|
| 遥测「关不掉、裸传」 | 与环境变量可关、字段经哈希的资料不符，属夸大 [!risk]不成立[/!risk] |
| 「被人举报到欧盟」 | 有人在 X 上称向德国数据保护机构投诉，未见受理或结论 [!warn]待核[/!warn] |
| 「Theo 说 omp 是垃圾，喜欢 pi」 | 没有查到出处 [!warn]待核[/!warn] |
| 推「干净版」的人动机不纯 | 评论转述，无从核实 [!warn]待核[/!warn] |

## 三、结构分析

### 3.1 两条线索的性质不同

商标线索是一次误认引发的纠纷：魔改版的 Bug 被算到官方头上，Theo 要求改名在开源惯例之内，改名也在 19 分钟内完成。升级的部分是措辞与情绪，与代码、协议无关。

遥测线索涉及项目的公开承诺。承诺写在首页，默认行为与承诺不符，承诺被撤下时提交说明没有写明。这类问题的成本落在信任上：用户可以接受遥测，更难接受自己不知情。评论区「刚用两天就卸载」「遥测忍不了」说明这一点已经在影响留存。

Theo 的辩护点有技术依据：界面开关难以覆盖管理员策略和多环境，环境变量更适合自动化。反方的要点是，普通用户不会去设环境变量，默认开启加上无界面开关，选择权实际落在运营方手里。两边都有道理，真正能解决的是默认值和可见入口。

### 3.2 pi 与 omp：贡献门槛的两种取舍

| 项 | pi（badlogic/pi-mono） | omp（can1357/oh-my-pi） |
|---|---|---|
| 关系 | 上游，作者 Mario Zechner | pi 的分支，作者 Can Bölük，Stencil Labs |
| 定位 | 极简核心，功能走扩展 | 内置 LSP、调试器、子 Agent、Rust 原生核心 |
| 外部贡献 | 新贡献者的 issue 和 PR 默认自动关闭；维护者回复 `lgtm` 后才能提 PR | 试行期向所有人开放；README 写明此前的准入机制暂停，之后可能恢复 |
| 许可 | 以仓库 LICENSE 为准（未抓到） | MIT |
| 体量 | 未核 | 约 3.98 万 star、4.6k fork |

pi 设门槛有明说的理由：Mario Zechner 公开讲过，自己的 tracker 被自治 Agent 提交的低质量 PR 淹没。omp 目前放开，评论区所说「欢迎所有人 PR」与 README 当前内容一致，但 README 同时说这是试行，可能收回。pi 的做法和 omp 的做法对应的是同一个问题的不同取舍：吞吐量与审核成本。

### 3.3 「网红带节奏」这个命题

能被证据支持的部分：

- 影响力大的人一句评价，确实会改变一个项目获得的关注和贡献。这在商标事件中表现为中文社区半天内集体表态。
- 争议升级的主要推动力在围观者一侧。冯若航的文章与评论区都指出，魔改版的错误被归到官方，是情绪升级的起点。

缺证据的部分：

- 「Theo 贬低 omp 导致 omp 贡献减少」没有数据。omp 目前 star 近 4 万、fork 4.6k，贡献通道是开放的。
- 「所以他祸害开源」是动机推断，不是可核验事实。

## 四、外部研判

商标一线可以翻篇，值得保留的是做法：fork 时先查商标政策，仓库名、包名、图标一次改干净，当事人改名速度是这次事件里唯一没有争议的亮点。

遥测一线会继续。可观察的信号有三个：界面内开关 PR #27077 是否合入；默认值是否改为需要明确同意；首页承诺是否恢复或明确改写。三项有两项落地，信任问题才算解决。

对评论区情绪化的转述，要区分三层：可查的事实（默认开启、承诺撤下）、夸大的版本（关不掉、裸传）、没出处的传闻（欧盟举报、omp 评价）。只有第一层适合拿去做决定。

| 对象 | 判断 | 下一步 |
|---|---|---|
| T3 Code | [!warn]观望[/!warn] | 试用时先设 `T3CODE_TELEMETRY_ENABLED=false`；等界面开关 PR 合入和默认值调整 |
| omp | [!good]跟进[/!good] | 关注试行期贡献政策是否收紧；评估与上游 pi 的同步成本 |
| pi | [!good]跟进[/!good] | 向它提 PR 前先按 CONTRIBUTING 取得 `lgtm` |
| 「网红祸害开源」命题 | [!mute]不下结论[/!mute] | 等到能查到 Theo 对 omp 评价的原帖再评 |

## 五、信息来源与持续验证

资料截至 2026-11-25。

来源：

- [pingdotgg/t3code 仓库 README](https://github.com/pingdotgg/t3code)（许可、品牌政策、支持的 Agent）
- [t3code issue #4123](https://github.com/pingdotgg/t3code/issues/4123)（遥测承诺与默认值争议）
- [t3code PR #27077：界面内关闭遥测](https://github.com/pingdotgg/t3code/pull/27077)
- [Theo 关于遥测的帖子](https://x.com/theo/status/2125332390239494211) 与 [公布遥测数据的帖子](https://x.com/theo/status/2125332956281749854)（本次未能打开原文，内容取自检索摘要）
- [Sulat：T3 Code 遥测时间线整理](https://news.sulat.com/2026/11/25/t3-code-telemetry/)（二手整理，作者说明未实际抓包）
- 冯若航（老冯云数）微信公众号文章《T3 Code 伤害中国开发者感情？》，2026-11-25（商标事件时间线；文中引用的 X 帖链接本次未逐条打开）
- [pi-mono CONTRIBUTING.md](https://github.com/badlogic/pi-mono/blob/main/CONTRIBUTING.md)
- [can1357/oh-my-pi 仓库](https://github.com/can1357/oh-my-pi)
- [Mario Zechner：Building pi in a World of Slop](https://ai.engineer/talks/RjfbvDXpFls-pi-coding-agent)

持续验证（会改变结论的项）：

- Theo 评价 omp / pi 的原始帖或视频：找到后才能评判「带节奏」一说。
- 界面开关 PR #27077 是否合入，默认值是否调整。
- 欧盟或德国数据保护机构投诉是否被受理。
- pi 的 LICENSE 与 omp 的贡献试行期是否结束。
