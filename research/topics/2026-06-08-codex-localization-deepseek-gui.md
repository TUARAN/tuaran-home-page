---
title: DeepSeek-GUI 与 Codex / Claude Code 国产化开源谱系
category: topics
date: 2026-06-08
tags: [DeepSeek, Codex, Claude Code, Qclaw, OpenClaw, 国产模型, 开源工具]
summary: DeepSeek-GUI 把 Codex 风格的终端 agent 体验做成桌面 app，Code 和 Claw 双模共用一个 DeepSeek runtime。把它放进 2026 年的国产化谱系里看，能清晰看到「GUI 封装 / 协议路由 / 配置切换 / 本地复刻」四条路线，以及每条路线最具代表性的 7-8 个开源项目。
tldr: DeepSeek-GUI（XingYu-Zhong，721★）是一个 Electron 桌面 app，把 Code（项目工作台）+ Claw（自动化 agent）打包到一个 UI 里，专门跑 DeepSeek。同期还有 Qclaw（OpenClaw 的桌面封装，2.8k★，已停更）、claude-code-router（26.4k★，把 Claude Code 请求转发到 DeepSeek/Qwen/Kimi）、cc-switch（Codex 的本地协议翻译网关）、OpenCode（Provider-agnostic CLI agent）。四类工具的差异在于：直接做 GUI vs 拦截原生 CLI；自带 runtime vs 借用其它 agent；闭源生态绕过 vs 协议改写。
topic_type: tech
assistance: claude
model: claude-opus-4-7
---

## 一、是什么

[DeepSeek-GUI](https://github.com/XingYu-Zhong/DeepSeek-GUI) 是 2026 年 5 月前后出现的一个开源桌面应用，作者 XingYu-Zhong（个人开发者）。定位很明确：把 Codex / Claude Code 那套「在终端跑长任务、看推理流、审核工具调用、批准敏感操作」的体验，做成一个长期开着的桌面 app，专门给 DeepSeek 用。

它的核心设计是 **三模并存**，左上角 sidebar 切换：

- **Code 模式**：开发工作台。绑定本地项目目录，读 / 写文件、跑命令、审 diff，权限分级从「只读」到「完全访问」
- **Write 模式**：长文写作工作流，session / workspace / 布局独立维护
- **Claw 模式**：自动化 agent 模式，借鉴了 OpenClaw（原 Clawbot / Cline）那套自主任务循环

三模共用同一个 DeepSeek runtime 和 settings，但 session / workspace / 布局完全隔离——按任务类型切，不混淆上下文。

这是相当中国本土化的一次产品决策：**Codex 风格的工作流 + Claw 风格的自动化 + 只跑 DeepSeek**——直接砍掉 provider 切换的复杂度，换来「打开即用」的低门槛。

## 二、为什么重要

DeepSeek-GUI 看起来只是「又一个 LLM 客户端」，但它代表的是 2026 年中国开源 AI Coding 工具的一个分水岭：**从「把官方 CLI 翻译成中文 + 教程」转向「直接做一个国产用得起的产品形态」**。

背景三条线：

1. **官方 CLI 国内不可用 / 不好用**。Claude Code 国内访问需要科学上网或第三方中转；Codex 现在只接受 Responses API，DeepSeek 只有 Chat Completions 端点，两边对不上。
2. **国产模型 V4 量级跟上了**。DeepSeek V4 Pro 1.6T 参数 / 49B 激活，V4 Flash 284B / 13B 激活，[全部 MIT 开源](https://www.thepaper.cn/newsDetail_forward_33057893)。OpenClaw 2026.4.24 把 V4 Flash 设为默认模型，[相比之前的闭源默认降本 17-21 倍](https://www.ithome.com/0/943/615.htm)。
3. **从「平替」到「原生」的产品差异。** 前一波工具（claude-code-router、cc-switch）都是「让国产模型伪装成 Claude / Codex」的协议适配层。DeepSeek-GUI 是相反方向——**不再伪装，直接以 DeepSeek 为一等公民来设计 UI**。

这套路线和 [yzfly/claude-code-deepseek-quickstart](https://github.com/yzfly/claude-code-deepseek-quickstart) 那种「教 Claude Code 怎么接 DeepSeek」的轻量手册形成对比：**轻量手册解决可用性，DeepSeek-GUI 解决产品化**。

## 三、关键玩家与生态

### 主角

[**XingYu-Zhong/DeepSeek-GUI**](https://github.com/XingYu-Zhong/DeepSeek-GUI)

| 维度 | 值 |
|---|---|
| Star | 721（截至本文写作；几周前还是 315，增速明显）|
| 作者 | XingYu-Zhong（个人开发者）|
| 形态 | Electron 桌面 app（macOS / Windows / Linux）|
| 模式 | Code / Write / Claw 三模 |
| Runtime | 只跑 DeepSeek 系列 |
| 协议 | DeepSeek OpenAI 兼容端点（Chat Completions）|
| 工程 | 本地项目绑定、diff 审查、权限分级、tool call stream |
| 适用 | 想要长会话、桌面级 agent、不愿配 CLI 的开发者 |

### 同类——四条路线的代表项目

把当前国产化 / 开源 AI Coding 工具按思路分四类：

| 路线 | 核心思路 | 代表项目 | 备注 |
|---|---|---|---|
| **A. 直接做 GUI**（自带 runtime）| 不依赖任何官方 CLI，独立产品 | **DeepSeek-GUI**、Qclaw（已停更）| 启动成本高，体验上限高 |
| **B. 拦截原生 CLI 转发**（Proxy）| 装 Claude Code / Codex，请求拦下来发给国产模型 | claude-code-router、cc-switch、9router、y-router | 体验依赖上游 CLI，跟随官方更新 |
| **C. 协议翻译网关**（Adapter）| 在本地起一个网关做协议格式转换 | cc-switch local routing（v3.16+）、ccx、CodexBridge | 解决「Responses ↔ Chat Completions 不兼容」的硬问题 |
| **D. 重写 CLI agent**（Provider-agnostic）| 自己实现一个 CLI agent，不绑任何家 | OpenCode、CodeWhale、claude-code-from-scratch | 工程量最大，灵活度最高 |

下面把每个具体项目拆开：

#### [qiuzhi2046/Qclaw](https://github.com/qiuzhi2046/Qclaw)

| 维度 | 值 |
|---|---|
| Star | 2.8k |
| 形态 | Electron + React + TypeScript + Mantine + Tailwind |
| License | Apache-2.0 |
| 状态 | **已停更**（2026 年 4 月声明）|

最早把 OpenClaw（前身 Clawbot / Cline）的复杂 CLI 配置封装成「小白也能玩」的桌面 UI。OpenClaw 自己后来发布官方安装包后，Qclaw 主动收摊：「我们决定暂停 Qclaw 的更新了」。这是中国开源工具圈罕见的"知道自己使命完成了"的退场——值得记一笔。

DeepSeek-GUI 某种意义上是 Qclaw 思路的延续：**桌面化的 Claw 模式**仍然是市场需求，只是这一次把它绑定到 DeepSeek 而不是去封装 OpenClaw。

#### [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)

| 维度 | 值 |
|---|---|
| Star | **26.4k**（路由系绝对头部）|
| 思路 | 装 Claude Code → 起一个本地代理 → 把请求路由到 OpenRouter / DeepSeek / Ollama / Gemini |
| 关键能力 | 按场景路由（background / thinking / long context 各走不同模型）|
| 适用 | 想留在 Claude Code UI、但不想用 Anthropic 账号的人 |

把 Claude Code 当做"前端"，模型当做可替换的"后端"。这是当前**最务实的妥协方案**——既享受 Anthropic 持续优化的 CLI，又用上 DeepSeek 的价格。

#### [farion1231/cc-switch](https://github.com/farion1231/cc-switch)

参见本站[另一篇专门拆解](/articles/research/topics/codex-deepseek-via-cc-switch)：cc-switch v3.16+ 内置 local routing，把 Codex 的 Responses API 在本机翻译成 DeepSeek 的 Chat Completions。这是路线 B + C 的混合——既切配置又做协议翻译。

#### OpenCode（[opencode-ai/opencode](https://github.com/opencode-ai/opencode)）

| 维度 | 值 |
|---|---|
| 形态 | 终端原生 CLI agent（Go + bubbletea TUI）|
| 思路 | Provider-agnostic，从一开始就不绑定任何模型厂商 |
| 国产模型 | 直接连任意 OpenAI 兼容端点（DeepSeek、Qwen 私有部署、Ollama 本地）|

不是"伪装成 Claude Code"，而是从设计上就承认"CLI agent 是 commodity"。[Walter Fan 的实测博客](https://www.fanyamin.com/claude-code-ping-ti-opencode-deepseekqwen.html)展示了 opencode + DeepSeek 的实际工作流。

#### [Hmbown/CodeWhale](https://github.com/Hmbown/CodeWhale)

定位是**「DeepSeek + MiMo 双模型的终端 coding agent」**——MiMo 是小米开源的代码模型，CodeWhale 把它和 DeepSeek 组合起来在终端跑。属于路线 D（重写 CLI agent），但更小众，偏研究性质。

#### [Windy3f3f3f3f/claude-code-from-scratch](https://github.com/Windy3f3f3f3f/claude-code-from-scratch)

不是工具而是**教学项目**：用 ~4000 行 TypeScript/Python 从零复刻 Claude Code 核心架构。13 章教程覆盖 Agent Loop / 13 个 tool / 四层上下文压缩 / 语义记忆召回 / Skill 系统 / 多 Agent / MCP 集成。

这是"路线 D 的极致形态"——不做产品，做认知反向工程。对想理解 coding agent 内部机制的人价值极高。

#### [decolua/9router](https://github.com/decolua/9router)

把 Claude Code / Codex / Cursor / Cline / Copilot / Antigravity 六个 agent 同时挂到 40+ free provider 上，自动 fallback。**最激进的"白嫖工具"**，但策略激进意味着稳定性差。

### 谁不在这张表上

| 项目 | 为什么没单独列 |
|---|---|
| Aider | 不算"国产化"项目，海外社区主导 |
| Cursor / Trae / Tongyi Lingma | 闭源商业产品，不在本文范围 |
| Continue.dev | 偏 IDE 插件，不算 CLI/GUI agent |
| llama-coder / tabby | 偏代码补全（FIM），不是 agent |

## 四、几条路线的对比

如果同时摆在桌面上选一个，差异在四个维度：

| 维度 | A 直接做 GUI | B 拦截 CLI | C 协议网关 | D 重写 CLI |
|---|---|---|---|---|
| **代表** | DeepSeek-GUI | claude-code-router | cc-switch | OpenCode |
| **上手** | 装 .dmg / .exe | 装两件（CLI + router）| 改 config 文件 | 装一个 CLI |
| **跟随官方更新** | 不跟 | 跟得很紧 | 中等（协议翻译要追）| 不跟 |
| **国产模型支持** | 原生 | 配置项 | 配置项 + 协议翻译 | 原生 |
| **agent 能力上限** | 受作者实现限制 | 上游天花板 | 上游天花板 | 受作者实现限制 |
| **闭源生态依赖** | 无 | 强 | 中 | 无 |
| **可见性 / 审计** | 桌面 UI 直观 | 终端流 | 终端流 + 网关日志 | 终端流 |
| **多任务 / 长会话** | UI 加成大 | CLI 历史 | CLI 历史 | TUI 中等 |

简单结论：

- **想要桌面长会话**：DeepSeek-GUI
- **离不开 Claude Code 体验**：claude-code-router
- **必须用 Codex 的 Responses API**：cc-switch
- **不想被任何官方绑架**：OpenCode

四条路线**不互斥**——很多人同时装 claude-code-router + cc-switch + 一个 GUI，按任务切。

## 五、DeepSeek-GUI 自己的争议与风险

回到主角：

1. **Electron 体积大、内存吃**。Code + Write + Claw 三模在同一个进程里，长会话场景对内存敏感的开发者会有压力。
2. **只跑 DeepSeek 是选择也是限制**。如果未来想加 Qwen / Kimi / GLM，要么作者写适配，要么用户自己 fork。**反观 claude-code-router**——多 provider 是设计目标。
3. **作者是个人开发者**。721 star 体量还在早期，长期维护承诺未知。可以参考 Qclaw 的轨迹：上来 2.8k 也保不住，使命达成就停。
4. **Claw 模式的 prompt / agent loop 是否复刻 OpenClaw**。如果只是封装 prompt 而没有 OpenClaw 的核心 agent loop，"Claw 模式"会名不副实。需要看源码确认（目前 README 信息不够）。
5. **Code 模式 vs Cursor 的差距**。Cursor 是 IDE，DeepSeek-GUI 是独立桌面 app——后者没有代码上下文索引、跨文件 reference 这些 IDE 级能力。

## 六、个人结论

**一句话定性**：DeepSeek-GUI 是 Qclaw 之后第二个值得跟进的国产 AI Coding 桌面 app；与 Qclaw 不同的是，它不依赖任何外部 agent runtime，是真正的「DeepSeek 原生」UI 实验。

**是否值得跟进**：

- **作为日常工具**：暂时不替代 claude-code-router + Claude Code 的组合（后者生态成熟 + 上游能力强）
- **作为观察对象**：必装。它代表了「国产 GUI agent」这条新路线的可能性
- **作为开源参与机会**：处于上升期、作者活跃、社区小——是参与 review / 提 PR 的好时机

**几条建议给个人开发者**：

1. **想配 Claude Code 国产模型用**：先装 [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)，配 DeepSeek + Kimi 双模型
2. **想配 Codex 用国产模型**：装 [farion1231/cc-switch](https://github.com/farion1231/cc-switch) v3.16+ 加 DeepSeek
3. **想要桌面 app 体验**：装 [XingYu-Zhong/DeepSeek-GUI](https://github.com/XingYu-Zhong/DeepSeek-GUI)，但保留 fallback 工具
4. **想从零理解 agent 内部机制**：跟 [Windy3f3f3f3f/claude-code-from-scratch](https://github.com/Windy3f3f3f3f/claude-code-from-scratch) 的 13 章教程，~4000 行代码读完受益匪浅

**下一步观察点**：

- DeepSeek-GUI 是否会加 multi-provider 支持（变成 B 路线）
- OpenClaw 官方桌面 app 是否会主动支持 DeepSeek 一等公民地位（Qclaw 的退场逻辑被反复印证）
- Codex 协议升级到 Responses v2 之后，cc-switch 翻译层能否跟上
- 国产 IDE（Trae / 通义灵码）会不会反过来 fork 这些开源 CLI agent

## 七、信息来源

- [XingYu-Zhong/DeepSeek-GUI](https://github.com/XingYu-Zhong/DeepSeek-GUI)
- [DeepSeek-GUI README.en.md](https://github.com/XingYu-Zhong/DeepSeek-GUI/blob/master/README.en.md)
- [XingYu-Zhong 个人主页](https://github.com/XingYu-Zhong)
- [qiuzhi2046/Qclaw](https://github.com/qiuzhi2046/Qclaw)
- [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)
- [Claude Code Router 官网](https://musistudio.github.io/claude-code-router/)
- [farion1231/cc-switch](https://github.com/farion1231/cc-switch)
- [Hmbown/CodeWhale](https://github.com/Hmbown/CodeWhale)
- [Windy3f3f3f3f/claude-code-from-scratch](https://github.com/Windy3f3f3f3f/claude-code-from-scratch)
- [yzfly/claude-code-deepseek-quickstart](https://github.com/yzfly/claude-code-deepseek-quickstart)
- [decolua/9router](https://github.com/decolua/9router)
- [luohy15/y-router](https://github.com/luohy15/y-router)
- [DeepSeek V4 成 OpenClaw 默认模型 · IT 之家](https://www.ithome.com/0/943/615.htm)
- [DeepSeek V4 + OpenClaw 全球 AI 圈 · 澎湃](https://www.thepaper.cn/newsDetail_forward_33057893)
- [Walter Fan：opencode + DeepSeek/Qwen 实测](https://www.fanyamin.com/claude-code-ping-ti-opencode-deepseekqwen.html)
- [桃之夭夭：Claude Code + DeepSeek V4 Pro + Qwen VL 视觉链路](https://blog1-reimu.vercel.app/2026/05/10/claude-code-deepseek-qwen-vision/)
- [《DeepSeek 版 Claude Code》Github 2.3k 星 · 量子位](https://www.qbitai.com/2026/05/412914.html)
- [Claude Code 接入四大国产编程模型 DeepSeek/GLM/Qwen/Kimi 全指南 · 知乎](https://zhuanlan.zhihu.com/p/1944667171704779382)
- [Codex 升级后 wire_api=chat 不再支持 · GitHub Discussion #7782](https://github.com/openai/codex/discussions/7782)
- 本站[另一篇拆解：用 cc-switch 在 Codex 中接入 DeepSeek](/articles/research/topics/codex-deepseek-via-cc-switch)
