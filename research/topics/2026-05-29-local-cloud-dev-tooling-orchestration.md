---
title: Agent 开发时代的链路：本地工具 vs 云端服务的分工与协同调度
category: topics
topic_type: tech
date: 2026-05-29
tags: [Cursor, Claude Code, Codex, GitHub, Cloudflare, Vercel, DevOps, 工作流, AI 编程]
summary: 把 Cursor / Claude Code / Codex 这类本地工具，和 GitHub / Cloudflare / Vercel 这类云端服务放在同一条开发链路里，区分各自最擅长的场景，并给出一套可落地的协同调度节奏；结合「博主联盟」「前端周刊」两个项目举例。
tldr: 本地工具是「手术台」——同步、高上下文、随便试错；云端服务是「流水线与电网」——异步、持久、影响他人。最优实践不是二选一，而是用 PR 当闸门，把判断留在本地，把执行与交付交给云端。
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

> **写在前面**：这篇不讨论「哪个工具更强」，而是讨论「同一件事该在哪一层做」。
> 工具选错层级，比工具本身弱更致命：在本地手搓本该让 CI 跑的回归测试，是浪费注意力；
> 在生产环境直接调本该在本地验证的逻辑，是拿用户当测试机。

---

## 一、是什么

进入 Agent 开发时代，写代码的主力已经从「人逐行敲」变成「人指挥 Agent 生成、自己负责判断」。这里讨论的本地工具（Cursor、Claude Code、Codex）本质都是 **AI 编码 Agent**；而云端侧也出现了能在 GitHub Actions / 后台并行跑的 Agent。于是「本地 vs 云端」的分界正在从「装在哪」转向「同步有人盯 vs 异步无人值守」。

在此前提下，把日常开发用到的东西分成两类，区别不在「装在哪」，而在**交互模式、状态归属、责任边界**：

**本地工具（你的工位 / 手术台）**

- 代表：Cursor、Claude Code、Codex、本地终端、本地 dev server。
- 特征：**同步、低延迟、高上下文、人在回路（human-in-the-loop）**。你看着它一步步改，随时打断、回退、追问。
- 状态是**易失且私有**的：未 commit 的改动只在你这台机器上，关机/换机即丢，也不影响任何人。
- 成本计量单位是**你的注意力 + token**，不是服务器资源。

**云端服务（流水线 + 电网）**

- 代表：GitHub（代码托管 / PR / Actions）、Cloudflare（Pages / Workers / CDN / DNS）、Vercel（构建 + 边缘部署）。
- 特征：**异步、事件驱动、持久、共享**。你提交一个事件（push、merge、cron），它在你睡觉时也照跑。
- 状态是**持久且共享**的：一次 push 进主分支、一次生产部署，所有协作者和所有用户立刻可见。
- 成本计量单位是**资源**：构建分钟、带宽、请求数、Workers 调用次数，以及——**事故的爆炸半径**。

一句话概念区分：**本地工具优化的是「单位时间内的判断密度」，云端服务优化的是「无人值守的可靠交付」**。

## 二、为什么重要

很多人把这两类混着用，凭手感而非凭原则，于是出现两种典型浪费：

1. **把云端的事拽回本地做**：在本地反复手动跑全量构建、手动截图回归、手动同步多环境配置。这些是机器该在 push 后自动做的，却消耗了你最贵的资源（注意力）。
2. **把本地的事推到云端做**：没在本地跑通就 push 上去靠 CI 报错来调试，把 GitHub Actions 当 REPL 用。一次构建几分钟，调十次就是大半小时，而且把噪声 commit 留进了历史。

更深一层的原因是 **可逆性梯度不同**：

| | 改动失败的代价 | 可逆性 |
|---|---|---|
| 本地 Cursor / Claude Code / Codex 改代码 | 几乎为零，Ctrl+Z / git checkout | 极高 |
| push 到分支 / 开 PR | 低，可强推或关 PR | 高 |
| merge 进主分支 | 中，需 revert commit | 中 |
| 部署到生产（Cloudflare/Vercel） | 高，用户可见、可能影响数据 | 取决于回滚机制 |

**判断该在哪一层做事，本质是在判断「这一步出错我能不能轻松收回」**。这条线划清楚，工具协同的节奏自然就出来了。

## 三、关键玩家与生态

**本地侧（AI 编辑器 / Agent）**

- **Cursor**：VS Code 派生，强在「编辑器内的多文件上下文编辑 + 即时预览」，交互式 vibe coding 体验最顺。
- **Claude Code**：终端原生 Agent，强在「跨文件大改、可脚本化、可接入 MCP / 钩子 / 子 Agent」，适合把一段较复杂的工程任务整体交给它跑。
- **Codex**：OpenAI 的编码 Agent，同样是终端/CLI 形态，强在「把一个任务整体丢出去后台跑」，并能在云端环境并行执行；本地 CLI 与云端任务两种形态并存，是「本地/云端界线模糊」的典型代表。
- 三者边界正在模糊：Claude Code、Codex 都能在 IDE 里用、也都能跑在云端，Cursor 也有 Agent 模式。选择更多看「你这次是想盯着改，还是想交出去」，而非品牌。

**云端侧**

- **GitHub**：事实标准的代码托管 + 协作中枢（PR / Review / Issues），并通过 **Actions** 提供 CI/CD 编排。它是「本地」与「线上」之间的**交接闸门**。
- **Cloudflare**：Pages（静态 / 全栈站点托管）、Workers（边缘函数）、CDN、DNS、R2。强在边缘网络覆盖、免费额度慷慨、与自有域名/DNS 一体化。
- **Vercel**：Next.js 母厂，强在「零配置部署 + 每个 PR 自动 Preview URL + 构建体验」，前端 DX 标杆，但用量上去后成本敏感。

**正在出现的「云端 Agent」搅局者**：Claude Code 可以跑在 GitHub Actions 里（被 issue/PR 评论触发），云端的后台 Agent 能并行处理任务。这让「本地 / 云端」的界线从「物理位置」彻底转向「同步 vs 异步、有人盯 vs 无人值守」。

## 四、技术 / 实施细节：一套可落地的协同节奏

### 4.1 基准回路（普遍路径）

市面上绝大多数个人 / 小团队项目，稳定下来都收敛成同一条回路：

```
本地探索/生成 (Cursor / Claude Code / Codex)
   ↓  在本地 dev server 验证（看得见才算数）
git commit  →  push 到 GitHub 分支
   ↓  开 PR
GitHub Actions 跑 CI（lint / typecheck / test / build）
   ↓  通过后，Cloudflare Pages / Vercel 自动生成 Preview 部署
人工 Review + 看 Preview
   ↓  merge 进 main
自动部署生产
   ↓  线上观测（日志 / 分析 / 报错）
   └────────── 回到本地 ──────────┘
```

这条回路的关键是 **PR 作为闸门**：闸门以左是「随便试错的私有空间」，闸门以右是「会影响别人的共享空间」。AI 在闸门左侧可以放开手脚，闸门右侧必须有人拍板。

### 4.2 任务该丢给哪一层？一张分诊表

| 任务类型 | 放本地（Cursor/Claude Code/Codex） | 放云端（Actions/Pages/Vercel） |
|---|---|---|
| 探索性改动、不确定方案 | ✅ 同步盯着改 | ❌ |
| 跨多文件的大重构 | ✅ Claude Code 整体交付 | ❌ |
| lint / typecheck / 单测 / 构建校验 | 仅 commit 前快速自查 | ✅ 作为门禁强制跑 |
| 多环境 / 多浏览器回归 | ❌ 别手动 | ✅ CI 矩阵 |
| 预览给他人看 | ❌ 你的 localhost 别人访问不到 | ✅ Preview URL |
| 定时任务（抓取、周报生成） | ❌ 你不可能一直开机 | ✅ Actions cron / Workers Cron |
| 边缘缓存 / 全球加速 | ❌ | ✅ Cloudflare/Vercel CDN |
| 一次性脚本、数据清洗草稿 | ✅ 本地跑完即弃 | ❌ 别污染 CI |

经验法则三连问：
1. **要不要别人也看到 / 用到？** 要 → 云端。
2. **要不要在我离线时也跑？** 要 → 云端。
3. **这一步我需要边看边改吗？** 需要 → 本地。

### 4.3 调度节奏（什么时候切换层）

- **早上 / 大块时间**：本地高强度交互——用 Cursor/Claude Code/Codex 做需要判断的探索和重构，这是注意力最该投入的地方。
- **改完一个完整单元**：立刻 commit + push，把「校验」这件机械活交给 CI，自己不要在本地反复手跑全量。
- **等 CI / 等部署的间隙**：这是天然的「异步窗口」，去做 Review、写文案、回消息，而不是干等。
- **可并行的杂活**：能脚本化、能无人值守的（截图、依赖升级 PR、内容抓取），尽量推给云端 Agent / Actions，让它们在后台跑。

核心心法：**把「需要我判断的」留在本地同步做，把「不需要我判断的」推到云端异步做。** 注意力是唯一不可再生的资源。

## 五、结合项目举例

### 5.1 前端周刊（frontendnext.com）：内容/情报站

特征：**内容更新频繁、读多写少、对全球访问速度和构建自动化敏感**。

- **本地（Cursor/Claude Code/Codex）**：写 / 改文章组件、调样式、做交互式排版预览；用 Claude Code / Codex 批量整理一期周刊的素材结构、生成摘要草稿（人再审校）。这些都要「边看边改」，留在本地。
- **云端**：
  - 内容是 Markdown/静态优先，最适合 **SSG + 边缘缓存**——Cloudflare Pages 或 Vercel 一 push 自动构建，CDN 全球分发，读者访问命中边缘节点。
  - **定时任务**（如每周定点抓取前端/AI 资讯、生成候选清单）放 **Actions cron 或 Cloudflare Workers Cron**，绝不靠你本地开机。
  - 每篇新文章走 PR + Preview URL，发布前自己或编辑在 Preview 上终审，再 merge 上线。
- **节奏**：本地集中写作 → push → CI 校验链接/构建 → Preview 终审 → 合并自动上线。抓取类脏活全程无人值守。

### 5.2 博主联盟（blogger-alliance.cn）：连接 AI 产品方与技术博主的增长平台

特征：**有真实业务逻辑与数据（撮合、博主资源、产品需求），写操作多、涉及他人数据、爆炸半径大**。

- **本地（Cursor/Claude Code/Codex）**：开发撮合逻辑、表单/后台、API 拼装；用 Claude Code / Codex 做跨模块重构。**关键**：涉及权限边界、计费、博主/产品数据一致性的逻辑，必须在本地 dev + 本地/预览数据库上验证通过，绝不靠 CI 报错来调试。
- **云端**：
  - **Workers / 边缘函数**承载轻量 API 与鉴权；**CI 门禁**对涉及数据写入的 PR 强制跑测试，这一层不能省。
  - **Preview 环境必须接隔离的测试数据**，而不是生产库——这是和「前端周刊」最大的不同：内容站 Preview 出错无所谓，撮合平台 Preview 误写生产数据是事故。
  - 生产部署要有**明确回滚路径**（Cloudflare/Vercel 的即时回滚），因为这里 merge 进 main 的可逆性已经从「中」掉到「高代价」。
- **节奏**：本地把「判断密集」的业务规则磨通 → PR + 跑数据相关测试 + 隔离 Preview 验证 → 人工 Review 重点看权限与一致性 → 受控合并 → 生产 + 备好回滚。

**两个项目的分层对照**：

| 维度 | 前端周刊 | 博主联盟 |
|---|---|---|
| 主要风险 | 构建/链接坏、加载慢 | 越权、数据不一致、计费错 |
| 本地侧重点 | 排版与内容交互 | 业务规则与边界判断 |
| 云端侧重点 | SSG + CDN + 定时抓取 | CI 门禁 + 隔离 Preview + 可回滚 |
| AI 放手程度 | 可较激进 | 业务核心处必须人工兜底 |

## 六、争议与风险

- **「云端 Agent 全自动」的诱惑**：让 Claude Code 在 Actions 里自动改代码、自动合并听起来很爽，但**无人值守地跨过 PR 闸门，等于把判断权也外包了**。可逆性低的环节（生产、数据写入）坚决保留人工拍板。参见 [AI 时代的判断力结构](/articles/research/topics/vibe-coding-judgment-structure)：执行被平权，但判断责任不能外包。
- **Vercel vs Cloudflare 的成本/锁定**：Vercel 的 DX 最好，但带宽/函数用量上去后费用陡增，且对 Next.js 有一定生态绑定；Cloudflare 免费额度大、边缘网络强，但全栈能力（尤其非 Next 框架的 SSR）配置更琐碎。选型应按项目形态而非品牌偏好。
- **本地与云端环境漂移**：「本地能跑，CI 挂了」往往源于 Node 版本、环境变量、依赖锁文件不一致。这不是工具问题，是**纪律问题**——锁版本、把环境差异显式化。
- **AI 工具把「试错成本低」误导成「不用想」**：本地试错便宜不等于可以不判断方案。便宜的是「改」，不便宜的是「错误方案被一路放行到生产」。
- **过度工程化**：个人/小项目别一上来就上 K8s、多环境、复杂 CI 矩阵。普遍路径（push→CI→Preview→部署）对绝大多数场景已经足够，复杂度要按真实需要逐步加。

## 七、个人结论

**一句话定性**：本地工具与云端服务不是「替代关系」而是「分层关系」——本地负责「判断密集、需我盯着、可随便试错」的部分，云端负责「无人值守、可靠交付、影响他人」的部分，**PR 是两者之间唯一应该认真守的闸门**。

**判断：跟进并固化为默认工作流。** 这不是要不要学的新技术，而是已经在用的工具如何摆正位置的问题。

**下一步行动**：
1. 把前端周刊的内容发布链路标准化为「本地写 → push → CI → Preview 终审 → 自动上线」，把资讯抓取改成 Actions/Workers 定时任务，彻底脱离本地开机依赖。
2. 给博主联盟的 Preview 环境接**隔离测试数据**，并对涉及数据写入的 PR 设强制 CI 门禁 + 人工 Review 关口；确认生产部署的一键回滚可用。
3. 个人侧形成切换纪律：大块时间留给本地交互式判断，等 CI/部署的间隙做异步杂活，能无人值守的脏活一律推云端。

## 八、信息来源

- [Cursor 官方文档](https://docs.cursor.com/)
- [Claude Code 官方文档](https://docs.claude.com/en/docs/claude-code/overview)
- [Claude Code GitHub Actions 集成](https://docs.claude.com/en/docs/claude-code/github-actions)
- [OpenAI Codex 文档](https://developers.openai.com/codex/)
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Vercel 部署文档](https://vercel.com/docs/deployments/overview)
- [Vercel Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)
- 站内相关：[Vibe Coding 真香也真险：AI 时代的判断力结构](/articles/research/topics/vibe-coding-judgment-structure)（与本文「闸门由人守」呼应）
