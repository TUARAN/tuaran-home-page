---
title: OpenClaw 仓库现状快照（2025-11 → 2026-06）与外部贡献者提 PR 经验
category: topics
topic_type: tech
date: 2026-06-03
tags: [OpenClaw, AI Agent, 开源贡献, MCP, 多渠道 Gateway, ClawSweeper]
summary: 把 OpenClaw 从 warelay 原型到 2026.6.2 的演化拆成七个月度主节点，附一份"外部贡献者怎么稳过一单 PR"的实操清单。
tldr: OpenClaw 的主线已经从"消息中继"换成"多渠道 AI agent runtime + 插件 SDK + Gateway 安全边界"。外部贡献者要稳过 PR，关键是看 ClawSweeper 标签、做纯函数级小修、按格式写 Real behavior proof。
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

> **写在前面**：本文是一个时间切片快照。OpenClaw 的提交节奏极快，5 月一个月超过 7000 commit；任何"当前主线"的判断都只对 2026-06-03 这一刻成立。若你在更晚的时间读，先去看 `CHANGELOG.md` 最新一段，再回来对照。

## 一、是什么

**OpenClaw** 是一个把"多渠道消息接入 + AI Agent runtime + 插件 SDK + Gateway 安全边界"装进同一个仓库的开源项目。它的形态在过去七个月里发生过两次根本性转换：

1. **warelay 阶段（2025-11）**：起点是一个 WhatsApp/Twilio 消息中继。核心目标是把 Claude CLI 的输出经由 Twilio webhook、Tailscale Funnel、WhatsApp Web/Baileys 送出去，再把回复收回来。这阶段的关键词是 CLI、webhook、轮询、tmux relay、自动回复命令。
2. **AI Agent runtime 过渡（2025-12）**：会话、heartbeat、同号模式、媒体、命令执行、恢复机制开始堆叠，提交量明显上升。架构从"原型"进入"持续产品化"。
3. **OpenClaw 阶段（2026-01 起）**：项目名与定位换成 **openclaw**——多渠道 AI Gateway、CLI、插件、Agent runtime。`CHANGELOG.md` 改用 `2026.1.5` 这种日历版本。当前版本是 **2026.6.2**。

简单说：**它不是 "WhatsApp bot"，是一套要在 Telegram / Slack / Matrix / LINE / Discord / iMessage / 语音通话 / Realtime Talk 多渠道一致跑 AI agent 的运行时**。

## 二、为什么重要

值得跟进的三个理由：

- **多渠道一致接入是个真实痛点**。现有方案要么绑死某个 IM（钉钉机器人、企业微信 bot），要么把渠道留给用户自己 hack。OpenClaw 在做的事情是把渠道当成 plugin（channel kernel + plugin SDK），跟 LangChain 把 LLM 当 plugin 是一个意思——不一定能赢，但方向是对的。
- **MCP transport 与 Gateway 安全边界在 3 月之后明显成熟**。HTTP transport、SSE transport、tool namespacing、token rotation、operator scope、node pairing 都已经进主线。如果你在搭自己的 agent gateway，OpenClaw 的实现路径有参考价值。
- **它真的在快速迭代**。5 月单月超过 7000 commit；6 月开始进入"发布后稳定化"阶段——CI 加边界、子进程清理、Gateway 健康诊断。说明项目过了"堆功能"的早期阶段，开始重视工程质量。

值得警惕的两个理由：

- **强单一主作者驱动**。提交节奏、设计风格、文档约束都带强烈"独立维护者"色彩。外部贡献者的活动空间被严格定义（见第六节）。
- **本地开发链对外部贡献者并不友好**。pnpm 自管理切换易坏、Bun 与 Vitest 兼容性坑、国内 corepack 拉不到 npm registry。新人不读 AGENTS.md 直接动手会被 ClawSweeper 打回多次。

## 三、关键玩家与生态

| 角色 | 说明 |
|---|---|
| **OpenClaw 核心仓库** | `openclaw/openclaw`，monorepo，包含 CLI、Gateway、Agent runtime、Control UI、SDK、Doctor、Workboard、Skill Workshop |
| **ClawSweeper 机器人** | 自动审 issue / PR，给标签、打回不合格 PR body、防止重复劳动。外部贡献者最重要的"红绿灯" |
| **官方外部插件** | GitHub Copilot agent runtime、Tokenjuice 等已经作为独立插件发布；Baileys image backends 也在外部化 |
| **渠道厂商** | Twilio、Telnyx、Slack、Matrix、Telegram、LINE、Discord、Google Meet、iMessage——这些渠道的原生能力和审批/进度体验在 3 月之后陆续补齐 |
| **MCP 上游** | Anthropic 主推的 Model Context Protocol。OpenClaw 已支持 HTTP / SSE transport，并加了 tool namespacing |
| **Sibling repo** | `../codex`（OpenAI Codex sibling）——根 AGENTS.md 明确"必须亲自读 sibling codex 源码"才能下任何相关结论，外部基本无法参与 |

## 四、版本时间线快照（2025-11 → 2026-06-03）

> 主节点按月梳理。日历版本号格式 `YYYY.M.D`，从 2026.1.5 开始进入仓库 CHANGELOG。

### 2025-11：warelay 原型

- 初始项目 **warelay**，核心目标 WhatsApp/Twilio 消息中继。
- 完成 CLI、Twilio webhook、Tailscale Funnel、WhatsApp Web/Baileys provider。
- 自动回复命令、Claude CLI 输出解析、媒体收发、轮询、tmux relay、配置校验、Vitest 覆盖。
- 0.1.x → 1.2.x 早期发布节奏。

### 2025-12：从消息中继走向 AI 助手运行时

- 从单一 WhatsApp/Twilio relay 扩展为更完整的 AI agent 消息运行时。
- 强化会话、heartbeat、同号模式、媒体、命令执行、恢复机制。
- 提交量明显上升——架构从原型进入持续产品化阶段。

### 2026-01：OpenClaw 形态成型

- `CHANGELOG.md` 从 **2026.1.5** 开始进入日历版本体系。
- 项目改名 **openclaw**，定位转向多渠道 AI Gateway、CLI、插件、Agent runtime。
- 发布节奏、文档体系、运行时模块边界开始稳定。

### 2026-02：多渠道与 Gateway 扩张

- 渠道、插件、Gateway、provider 范围快速扩大。
- 重点从"能收发消息"转为"多渠道一致接入、统一运行时、统一配置和会话管理"。
- 单月提交量 **超过 7000**——核心能力快速堆叠期。

### 2026-03：插件化与安全边界成为主线

- 重大主节点：
  - `feat(mcp): add HTTP transport support and tool namespacing`
  - `feat(mcp): add SSE transport support for remote MCP servers`
  - 插件运行时解耦，provider/channel 策略迁到插件侧。
  - Slack、Matrix、Telegram、LINE 等渠道补齐原生能力与审批/进度体验。
- 月底主线全面转向**安全**：Gateway auth、token rotation、operator scope、node pairing、HTTP ingress 权限收紧。

### 2026-04：SDK、插件运行时、Control UI 工程化

- 重大主节点：`feat: add OpenClaw SDK package`。
- 插件体系进入工程化：
  - SQLite plugin state store；
  - bundled runtime deps 规划、镜像、修复、加载路径重构；
  - channel turn kernel 迁移，渠道入站分发统一化。
- Gateway 性能/稳定性强化：模型 catalog 不再阻塞请求路径、startup advertise/discovery 加边界、session/store clone 内存增长优化。
- Control UI 开始具备完整的多语言、移动端、配置和聊天体验。

### 2026-05 上旬：Doctor、SQLite、Code mode、Talk/Realtime

- 重大主节点：
  - `feat: add native sqlite Kysely dialect`
  - `refactor: move runtime state to SQLite`
  - `feat: add generic code mode runtime`
  - `feat: add unified talk gateway sessions`
- runtime 状态从文件/分散存储向 **SQLite** 收敛。
- Doctor 增加 post-upgrade、JSON、plugin manifest drift、entry unresolved 等诊断。
- Realtime Talk、voice-call、Telnyx、Discord voice、Google Meet 等实时语音/通话路径开始统一。

### 2026-05 中旬：移动端、i18n、技能、Agent 能力扩张

- Android v2 UI 大规模重建：chat、voice、settings、cron、providers、agents、usage、skills。
- iOS 增加 realtime talk relay、推送、后台 presence。
- Skills 支持 git/local/global install，出现完整的 skill runtime。
- Agent 支持 per-agent bootstrap profiles、本地模型 lean mode、上下文预算状态。
- Control UI 增加 text size、auto-scroll、usage/provider quota 等体验能力。

### 2026-05 下旬：Workboard、发布工程、插件外部化

- 重大主节点：
  - **Workboard** 从会话捕获走向 SQLite-backed board，再到 orchestration primitives 与 agent coordination tools。
  - GitHub Copilot agent runtime、Tokenjuice 等作为**官方外部插件**发布。
  - **SecretRef** plugin manifest contract 加入，插件/provider 集成边界更清晰。
- 发布工程显著强化：release CI、Docker smoke、cross-OS、plugin prerelease、ClawHub/npm 验证；大量超时/日志/artifact/credential lease/GitHub API polling 加边界。
- 版本节点：**2026.5.26 / 2026.5.27 / 2026.5.28**。

### 2026-05-31：Skill Workshop 与 Workboard 成为产品主面

- Skill Workshop 成为明显的新产品面：proposal store、proposal files、revision dialog、today view、searchable preview files、reusable session handoff。
- Workboard 增加 worker dispatch、task-backed board runs、coordination metadata。
- 同期继续强化 iOS native iPad、Twilio SMS、typed presentation command actions、MCP code-mode API。

### 2026-06-01 → 2026-06-03：2026.6.2 发布后加固

- 当前版本 **2026.6.2**，`package.json` 项目名 **openclaw**。
- 主线已不是单点新功能，而是**发布后稳定化**：
  - Gateway health/auth diagnostics；
  - Codex startup timeout cleanup；
  - Telegram progress draft reasoning；
  - Discord/Telegram progress compositor 共享；
  - Workboard keyboard movement 与 card operations；
  - Usage dashboard lazy load；
  - Baileys optional image backends externalize；
  - release、CI、E2E、Crabbox、Testbox、Docker、RPC readiness 全面加边界。
- 这一阶段关键词：**稳定、限时、清理子进程、降低启动成本、避免 CI/发布链路 hang**。

### 主节点一句话回顾

| 时间 | 主节点 |
|---|---|
| 2025-11 | WhatsApp/Twilio relay 原型 |
| 2026-01 | OpenClaw 日历版本体系成型 |
| 2026-03 | MCP、插件 SDK、Gateway 安全边界成熟 |
| 2026-04 | OpenClaw SDK、插件运行时、channel kernel、Control UI 工程化 |
| 2026-05 上 | SQLite runtime、Doctor、Code mode、Realtime Talk |
| 2026-05 下 | Workboard、Skill Workshop、官方外部插件、发布工程 |
| 2026.6.2 | 发布后稳定化，Gateway/渠道/CI/release 链路加固 |

## 五、争议与风险

- **本地测试链对外部贡献者不友好**。pnpm 自管理版本切换易坏、国内 corepack 拉不到 `registry.npmjs.org`、`node scripts/run-vitest.mjs` 在 Node 下因为 `import.meta.main` 是 Bun 专属而静默退出、`bun scripts/run-vitest.mjs` 默认 threads pool 会炸（要 `--pool=forks`）。
- **强约束的 PR 流程**。AGENTS.md 硬要求 Real behavior proof 六字段逐字对齐，ClawSweeper 会直接打回不合格 PR。这降低了无效 PR，但对新人门槛偏高。
- **维护者操作边界严格**。外部贡献者不能加 label / 改 title / rebase 别人的 PR、不能贴 ClawSweeper 风格审核结论、不能 close 别人的 issue、不能动 release/版本号。
- **sibling codex 依赖**。任何牵涉 `../codex` 的 issue 外部基本做不了——必须亲自读 OpenAI Codex 源码。
- **节奏极快**。任何"现状"判断的有效期很短，五月单月 7000+ commit，今天看到的模块边界三周后可能就重构了。

## 六、外部贡献者提 PR 经验总结

> 一份"怎么稳过一单"的实操清单。

### 1）选 issue：靠 ClawSweeper 标签筛

OpenClaw 的每个 issue 都被机器人 **ClawSweeper** 审过，给出一组结构化标签。这些标签是你能不能"稳过一单"的关键信号。

**只挑这种组合**：

- `clawsweeper:fix-shape-clear` — 修法明确
- `clawsweeper:queueable-fix` — 小、可独立排队
- `clawsweeper:source-repro` — 仓库内可复现（不需要真实账号/通道）

**坚决跳过**：

| 标签 | 含义 |
|---|---|
| `clawsweeper:no-new-fix-pr` | 维护者已表态不要再开新 PR |
| `clawsweeper:linked-pr-open` | 已经有人在做 |
| `clawsweeper:needs-product-decision` | 等产品决策，PR 容易白做 |
| `clawsweeper:needs-maintainer-review` | 维护者还没定调 |
| `clawsweeper:needs-live-repro` | 需要真实环境（Telegram/iMessage/WhatsApp 这类通道几乎都中招） |

**额外硬避坑**：

- 任何牵涉 `../codex`（OpenAI Codex sibling repo）的 issue。根 AGENTS.md 写明"必须亲自读 sibling codex 源码"才能下任何结论，外部贡献者基本做不到。
- 改 dependency / config 默认值 / fallback 行为——被定义为兼容性敏感，外部 PR 几乎必须先有 issue 共识。

### 2）改动越纯越好，CI 是你最大的盟友

最重要的认知：**纯函数 + 手算可验断言的小修，不要死磕本地测试**。

OpenClaw 这个仓库本地测试链对外部贡献者特别不友好：

- pnpm 容易坏（自管理版本切换失败）；
- 国内 corepack 拉不到 `registry.npmjs.org`；
- `node scripts/run-vitest.mjs` 静默退出（脚本用 `import.meta.main`，Bun 专属，Node 下 main 不会被调用）；
- 用 `bun scripts/run-vitest.mjs` 默认 threads pool 会炸（Bun 的 `worker_threads` 跟 Vitest 不兼容，要 `--pool=forks`）。

如果改动是几行纯函数 + 断言都能手算（比如格式化函数、schema 补字段、key 形状对齐），**直接 push、让 PR 上的 CI 跑就行**。在 PR body 的 Real environment tested 字段诚实写 `No — <原因>`，比花一小时修环境强。

反过来：动到了 plugin 交互、有 IO/网络/状态、跨多个模块——本地必须跑过。

### 3）PR body 模板必须按规矩写

根 AGENTS.md 硬要求所有外部 PR 的 body 含 **Real behavior proof** 段，六个字段名要逐字一致：

```
- Behavior addressed: <修了什么行为>
- Real environment tested: <Yes / No — 原因>
- Exact steps or command run after this patch: <复现命令>
- Evidence after fix: <证据：测试断言 / 日志 / 截图链接>
- Observed result after fix: <实际看到的输出>
- What was not tested: <诚实列出未覆盖部分>
```

没有这段或字段名漏字，ClawSweeper 会直接打回。

### 4）提交与推送机制

| 操作 | 正确做法 | 错误做法 |
|---|---|---|
| 提交 | `scripts/committer "<msg>" <file...>` | 裸 `git commit` |
| Cross-fork PR | `gh pr create --repo openclaw/openclaw --base main --head <你的GH账户>:<branch>` | 在 fork repo 上提 |
| PR body 含反引号/`$`/代码块 | 写入 `/tmp/pr-body.md`，用 `--body-file` | `--body "..."` 内联 |
| Commit message | conventional 风格 + 末尾 `Refs #<issue>` | 散漫风格 |

- **`CHANGELOG.md` 不要碰**——release 机器人自动生成。
- **截图视频不要 commit 进仓库分支**——政策明令禁止，用 PR 评论或 Crabbox artifact。

### 5）网络容错

国内访问 GitHub API 经常蹦 `Post "https://api.github.com/graphql": EOF` 或 `SSL_ERROR_SYSCALL`，但这些大多是单次抖动。把 `git push` / `gh pr create` / `gh pr view` 用 3-5 次循环包起来，平均一两次就成。

### 6）首单建议

第一单选 issue **自带 "Candidate fix shape" 段** 的——这种 issue 报告者已经把修法、文件路径、测试断言都写好了，你照抄改一遍就行。比如格式化、schema 补字段、key 名对齐这类。

把首单做出来后续节奏就快了：选 issue 5 分钟、改代码 5 分钟、写 PR body 5 分钟、push + 重试 5 分钟，**理论上 20 分钟一个 PR**。

### 7）自我节制

外部贡献者**绝不要**做这些事：

- 不要主动给别人的 PR 加 label / 改 title / rebase；
- 不要在 PR/issue 下贴 ClawSweeper 风格的"审核结论"；
- 不要 close 别人的 issue；
- 不要碰 release 流程、版本号；
- 任何"维护者操作"（merge、land、批准）一律不动。

定位准了，PR 命中率才高。

## 七、个人结论

- **一句话定性**：OpenClaw 是 2025-11 那波 "AI 进入消息渠道" 浪潮里少数走到 SDK + 多渠道 Gateway + 插件运行时这一步的开源项目，2026.6.2 之后明显从"堆功能"切到"工程化"。
- **是否跟进**：**跟进 / 偶尔参与**。它的 MCP transport、channel kernel、Workboard、Skill Workshop 都值得作为多渠道 agent runtime 的参考实现读源码。
- **下一步行动**：
  1. 先读 `CHANGELOG.md` + 根 `AGENTS.md`，再读 `plugin SDK` 与 `channel kernel` 的接口；
  2. 想提 PR 就只看 `fix-shape-clear + queueable-fix + source-repro` 三标签组合的 issue；
  3. 不投入超过 30 分钟去修本地测试链——CI 是盟友；
  4. 任何牵涉 `../codex` 或渠道 live repro 的 issue 直接跳过。

## 八、信息来源

- OpenClaw 仓库 `CHANGELOG.md`（2026.1.5 起的日历版本体系）
- 根 `AGENTS.md`（PR body 六字段约束、sibling codex 政策、提交工具链约束）
- `package.json`（当前版本 2026.6.2、项目名 openclaw）
- ClawSweeper 自动审 issue 标签集
- 仓库提交历史（2025-11 → 2026-06-03）
