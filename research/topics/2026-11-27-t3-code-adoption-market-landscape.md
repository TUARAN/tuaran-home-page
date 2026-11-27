---
title: T3 Code 用量、口碑与同类产品：开源 Agent 控制台的头部之争
category: topics
date: 2026-11-27
time: 12:45
tags: [T3 Code, Theo, Coding Agent, Paradev, Emdash, Vibe Kanban, Conductor, 开源]
summary: 在「统一调度多个 Coding Agent 的开源桌面/网页控制台」这一细分品类里，T3 Code 的 star、下载和社区体量都排第一，领先第二名数倍；放到整个 AI 编程市场，它是建在 Claude Code、Codex 之上的一层界面，体量与底层工具差两个数量级。
tldr: T3 Code 约 8.1 万 star、1,398 名贡献者，稳定版安装包累计约 130 万次下载，npm 周下载约 3.8 万。细分品类里头部地位明确；用户夸体验和迭代速度，主要不满集中在遥测、安全默认值和早期稳定性。同类可看 Paradev、Emdash、Vibe Kanban，闭源方向有 Conductor，以及 Codex、Claude 官方桌面端。
topic_type: product
content_type: analysis
assistance: claude-code
model: claude-opus-5-5
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

T3 Code 只在「多 Agent 控制台」这一细分里坐头把交椅。它不训练模型，也不自带 Agent，用户要先装好 Claude Code、Codex、Cursor 等工具，T3 Code 负责线程、worktree、PR 和手机端调度。

- **用量**：GitHub 约 8.1 万 star、1.43 万 fork、1,398 名贡献者，已合并 PR 约 1.39 万个。v0.1.11 一个版本的安装包下载约 22 万次（含 Windows 自动更新）。npm 包 `t3` 周下载约 3.8 万。
- **细分品类排名**：同类开源项目里 star 最多的是 Vibe Kanban（2.9 万）、opcode（2.2 万）、Paradev（1.7 万），T3 Code 是它们的 3–5 倍；最新版下载量与 Paradev、Emdash 差两个数量级。
- **整体市场位置**：Codex CLI 的 npm 周下载约 2,800 万，Claude Code 约 1,700 万。T3 Code 的体量约为它们的千分之一到千分之二，属于底层 Agent 之上的选配层。
- **口碑**：赞的是 UX、worktree 默认隔离、线程收件箱、手机端和发版说明的透明度；骂的是默认遥测、安全默认值偏松、早期版本卡顿和数据库膨胀。
- **判断**：[!good]跟进[/!good]，作为个人多 Agent 工作台可以用，先关遥测、不开 `--lan`。同类里 Paradev 和 Emdash 值得留作备选。

## 二、事实层

### 2.1 开源使用量

数据取自 GitHub API 与 npm registry，抓取时间 2026-11-27。

| 指标 | 数值 | 说明 |
|---|---|---|
| 仓库创建 | 2026-02-08 | 3 月 7 日公开，HN 首帖 6 分 |
| Star / Fork | 81,155 / 14,329 | 不到 10 个月 |
| 贡献者（含匿名） | 1,398 | 合并 PR 约 13,882 个，issue 累计约 10,900 条 |
| 11 月新开 issue | 约 4,200 条 | 社区反馈密度很高 |
| 发版节奏 | 累计 882 个 release，nightly 每天 2–4 个 | v0.1.0 于 10 月 15 日发布 |
| 稳定版安装包累计下载 | 约 130 万次 | dmg / exe / AppImage / deb 合计 |
| v0.1.11（11 月 20 日）安装包 | 约 22 万次 | 其中 macOS arm64 dmg 约 6.1 万次 |
| npm `t3` 下载 | 周 3.8 万，近 30 天 15.6 万 | 8 月峰值 16.9 万，之后逐月回落 |

下载数要打折看。Windows 的 exe 同时承担自动更新，会把老用户的升级也算进去；macOS 的自动更新走 zip，dmg 的数字更接近新装机。`latest-mac.yml` 的 68 万次是更新检查请求，反映的是轮询次数，不能当用户数。

npm 月下载曲线有两次台阶：4 月（6.8 万）和 8 月（16.9 万）。之后 9 月 15.8 万、10 月 14.3 万、11 月截至 26 日 12.7 万，逐月小幅回落。star 还在涨，CLI 侧的新增已经见顶。npm 只覆盖用 `npx t3` 启动的人，桌面版用户不在这个数里。

### 2.2 用户反馈

正面反馈集中在 HN 和个人博客，比较有代表性的几条：

| 来源 | 要点 |
|---|---|
| HN 用户 viraptor（10 月） | 默认按命名空间开 worktree、steer / queue 消息、跨线程引用和派发子任务、收件箱式线程管理，「比见过的其他方案都合理」 |
| HN 用户 joshka（10 月，自述曾在 OpenAI 做 Codex TUI） | 开发者需要的 UX 比 Claude、Codex 官方客户端强；issue 有人回，发版说明直接链到 PR；Codex 与 Claude 模型可以互相当子 Agent |
| Unbeholden 博客（11 月 4 日） | 在每个 dev container 里跑一个 T3 Code 服务，内置浏览器让作者撤掉了全部端口映射；几天内替换了 herdr 和自写启动脚本 |
| Tech Stackups 实测（11 月 2 日） | 5 个并行 issue 全部上线用时 3.8 分钟，快于 Herdr（5.3）和 Amp（7.7）；作者提醒单次测试不能定速度排名 |

负面反馈分三类：

| 类别 | 具体问题 | 来源 |
|---|---|---|
| 隐私与信任 | PostHog 遥测默认开启，首页「不开启遥测」承诺在 6 月撤下；v0.1.11 首次启动发送哈希后的 OpenAI、Claude 账号 ID，维护者已表示改为随机安装 ID | issue #4123、HN 抓包帖、[上一篇复盘](/articles/research/topics/t3-code-controversy-open-source-influencers) |
| 安全默认值 | `--lan` 模式 30 天明文 cookie、配对令牌默认全权限（含终端）、不受信仓库的 hook 继承 `GITHUB_TOKEN` | before-you-install-t3code 审计仓库（争议当事方所写，[!warn]单方说法[/!warn]）；Unbeholden 博客也提到令牌默认全权限 |
| 稳定性与资源 | 早期版本同任务比 Codex 慢数倍（issue #695）；大仓库 checkpoint 超时（#26227）；删除的线程仍留在 SQLite，有人报到 41.6 GB；nixpkgs 包约 3.7 GiB | GitHub issue、审计仓库、Unbeholden 博客 |

点赞最多的 issue 几乎都是「接入更多 Agent」：Pi（198）、GitHub Copilot CLI（185）、WSL（145）、OpenCode（130）。这些需求大多已关闭并落地。用户要的是一个界面管所有 Agent，T3 Code 的定位踩中了这一点。

### 2.3 同类产品

开源项目数据抓取于 2026-11-27。

| 产品 | 形态 | 许可 | Star | 最新版安装包下载 | 特点 |
|---|---|---|---|---|---|
| T3 Code | 桌面 + 网页 + 手机 | MIT | 8.1 万 | 约 22 万（v0.1.11） | 多 Provider、worktree、PR、T3 Connect 远程、`t3` CLI |
| Vibe Kanban（BloopAI） | 网页看板 | Apache-2.0 | 2.9 万 | npm 周 1 万 | 按看板卡片派任务给 Agent |
| opcode（winfunc） | 桌面 | AGPL-3.0 | 2.2 万 | — | 只服务 Claude Code，偏自定义 Agent 与会话管理 |
| Paradev（原 Superset） | 桌面 + 手机 + 网页 | MIT | 1.7 万 | 约 1,000（v2.0.12，官网另有下载渠道） | 自称「开源版 Codex App / Conductor」，支持云端与远程机，暂无 Windows |
| CloudCLI（claudecodeui） | 网页 / 手机 | AGPL-3.0 | 1.5 万 | — | 侧重手机和浏览器远程看 Agent |
| Claude Squad | 终端 | AGPL-3.0 | 0.9 万 | — | tmux 式多会话 |
| Emdash（YC W26） | 桌面 | Apache-2.0 | 0.6 万 | 约 2,000–3,000 / 版 | 三平台齐全，接 Linear、Jira、GitHub 等工单系统 |
| Herdr | 终端 | Apache-2.0 | 未核 | — | Rust 写的 Agent 状态感知 tmux |

闭源与官方方向：

- **Conductor**：Mac 端多 Agent 工作台，Paradev 和社区替代品清单都拿它当参照。官网和文档本次抓取返回 403，用户量与融资没有核到。
- **官方客户端**：OpenAI 的 Codex App、Anthropic 的 Claude 桌面端都在做多线程和 worktree。它们只服务自家 Agent，但装机基数远大于任何第三方控制台。
- **Amp**：自带 Agent 的付费方案，云端「orb」按小时计费，只管理 Amp 自己的线程。

## 三、结构分析

### 3.1 头部地位来自哪里

T3 Code 的领先有三个来源，可以从数据里看到：

- **作者分发力**：3 月公开时 HN 首帖只有 6 分，之后 HN 上也没有出现高分讨论。一种可能的外部解读是，star 增长主要来自 Theo 自己的 YouTube 和 X 渠道。
- **迭代速度**：每天 2–4 个 nightly、1.39 万个合并 PR。HN 上有人提到它在 10 月把 1.8 万个 PR、4,000 个 issue 同步到 GitCafe，规模本身说明了开发强度。
- **Provider 中立**：同时支持 Claude Code、Codex、Cursor、OpenCode、Pi、Antigravity，并开了 ACP 适配层。官方客户端做不到跨厂商，这是第三方控制台唯一稳定的空间。

### 3.2 天花板在哪里

T3 Code 要求用户已经在用至少一个 CLI Agent。它的潜在用户是「同时用两个以上 Agent、或要在手机上管 Agent」的那部分人。npm 周下载 3.8 万对比 Codex CLI 的 2,800 万，说明这个人群目前很小。

官方客户端的追赶是主要压力。Codex 和 Claude 的桌面端一旦把 worktree、PR 面板、手机端补齐，只用单一厂商的用户就没有理由多装一层。T3 Code 守得住的是多厂商混用的用户，以及要自托管、跑在 dev container 和远程机上的用户。

### 3.3 信任成本

遥测和安全默认值的问题在 11 月集中爆发。这些问题对头部位置的影响有限：star 仍在增长；v0.1.12 发布后两天安装包下载约 8.8 万次，日均与 v0.1.11 接近。影响落在两个地方：企业或合规敏感用户会因此跳过它；社区替代品清单开始流传（Paradev、Emdash、Conductor 等都被点名），竞品拿到了一次曝光窗口。

## 四、外部研判

在开源多 Agent 控制台这个细分里，T3 Code 是头部，领先幅度大到短期内不会被追上。Paradev 和 Emdash 的下载量与它差两个数量级。

放到更大的 AI 编程工具市场，它是 Claude Code、Codex、Cursor 之上的一层，自己没有模型和计费入口，商业模式目前只看到 T3 Connect 中继。官方客户端补齐功能的速度，决定这一层还有多大空间。

| 对象 | 判断 | 下一步 |
|---|---|---|
| T3 Code | [!good]跟进[/!good] | 个人多 Agent 场景可用；先设 `T3CODE_TELEMETRY_ENABLED=false`，配对令牌加 `--scope`，不在公网开 `--lan` |
| Paradev | [!warn]观望[/!warn] | 功能最接近 T3 Code，MIT 许可；等 Windows 版和下载数据 |
| Emdash | [!warn]观望[/!warn] | 工单系统集成最全，适合团队派工；体量还小 |
| Vibe Kanban | [!mute]不跟进[/!mute] | 看板模式适合批量派任务，最近一次发版在 11 月 15 日，节奏放缓 |
| Conductor | [!warn]观望[/!warn] | 闭源 Mac 端，数据待核 |

## 五、信息来源与持续验证

资料截至 2026-11-27。

来源：

- [pingdotgg/t3code 仓库](https://github.com/pingdotgg/t3code) 与 [Releases](https://github.com/pingdotgg/t3code/releases)（star、贡献者、各版本下载，经 GitHub API 抓取）
- [T3 Code 官网](https://t3.codes/)
- [npm 下载统计 API](https://api.npmjs.org/downloads/point/last-week/t3)（`t3`、`@openai/codex`、`@anthropic-ai/claude-code`、`vibe-kanban` 等）
- [HN：T3 Code now synced between GitHub and GitCafe](https://news.ycombinator.com/item?id=50175075)（用户评价）
- [HN：T3 Code v0.1.11 sends hashed OpenAI and Claude account IDs](https://news.ycombinator.com/item?id=50636552)（抓包测试）
- [Tech Stackups：Herdr vs T3 Code vs Amp](https://techstackups.com/comparisons/herdr-vs-t3-code-vs-amp/)，2026-11-02
- [Unbeholden：T3 Code in every dev container](https://unbeholden.dev/blog/t3-code-in-every-dev-container)，2026-11-04
- [before-you-install-t3code](https://github.com/realchendahuang/before-you-install-t3code)（争议当事方的审计，单方说法）
- [ParadevAI/Paradev](https://github.com/ParadevAI/Paradev)、[generalaction/emdash](https://github.com/generalaction/emdash)、[BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban)、[winfunc/opcode](https://github.com/winfunc/opcode)、[siteboon/claudecodeui](https://github.com/siteboon/claudecodeui)、[smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad)
- [上一篇：T3 Code 争议复盘](/articles/research/topics/t3-code-controversy-open-source-influencers)

持续验证（会改变结论的项）：

- Conductor 的用户量和融资：如果它的付费用户规模接近或超过 T3 Code，「头部」需要限定在开源范围内。
- 遥测争议后两周的 dmg 下载与 npm 周下载：连续下滑说明信任问题开始影响增长。
- Codex App、Claude 桌面端是否上线跨厂商支持或手机端远程：这会直接压缩第三方控制台的空间。
