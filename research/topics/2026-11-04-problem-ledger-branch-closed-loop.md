---
title: 问题台账 → 分支求解 → 闭环：AI 并行迭代的方法底座
category: topics
topic_type: thesis
tech_type: agents_automation
subjects: [ai_dev]
content_type: practice
date: 2026-11-04
updated: 2026-11-05
time: 12:37
tags: [Issue 优先, 问题台账, 闭环, 分支求解, AI 迭代, 多智能体, 状态管理, OpenClaw, trunk-based, 工程方法]
summary: 任何求解都应先把问题记进台账（Issue／待办），再开分支或任务求解，核验后关单；这就是正常更新迭代。AI 场景下提出与并行求解可由多智能体承担，前提是状态管理齐全；核心是用 AI 迭代自身。
tldr: 先记问题、再求解、再闭环。Issue 首先是共享、可检索的状态。本站 Issue 优先 runbook（#93/#94）与 OpenClaw「非琐碎／代理改动先 Issue」同构；公开 tracker 与 trunk-based 只支撑「短生命周期分支对准问题」这一层，不发明多智能体产能数字。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

对任何事物的求解，正常节奏是：**先提出并记录问题（台账／「填衣袖子」／Issue）→ 开分支或任务去求解 → 核验后关单并回写状态**。这就是正常的更新迭代。

目前能看清的几点：

1. **台账先于改动**：共享、可检索的问题记录（Issue、待办、分诊标签）是后续并行与协作的前提；聊天里的口头需求还不算状态。
2. **本站刚落地的 Issue 优先流程**（Issue #93、PR #94 中的 runbook）与公开工程惯例同构：非琐碎事先有 Issue；小修可直开 PR，但仍应链上已有上下文。
3. **OpenClaw 现行 CONTRIBUTING** 对「agent-authored or otherwise non-trivial work」明确要求先建或复用 Issue，再对着它开 PR——代理参与时，台账纪律应更紧。
4. **AI 场景的增量**在于：提出问题与并行求解可以由多智能体分担；真正卡住的是**状态是否齐全、关单条件是否可核验**。换哪套 multi-agent 框架解决不了缺台账。
5. **核心表述**：用 AI 迭代自身。没有问题台账与闭环，并行只会放大半成品与重复劳动。

主轴是「问题台账与闭环」，不重写 agent loop、MCP 或框架横评；相关专文只作指针。

## 二、事实层

资料核对日：初稿 2026-11-04；runbook 路径重核 2026-11-05（北京）。

### 2.1 本站 Issue 优先（`main` 上的 runbook）

`docs/runbooks/issue-first-workflow.md` 已随 PR [#94](https://github.com/TUARAN/tuaran-home-page/pull/94) 合入 `main`（对应 Issue [#93](https://github.com/TUARAN/tuaran-home-page/issues/93)）。下文摘自 2026-11-05 核对的 `main` 原文；引文与初稿依据的 PR 分支字句一致。

runbook 开篇写明：

> 非琐碎改动先有 Issue，这条顺序参考 OpenClaw 对代理改动的要求。本站没有多维护者路由：分诊标签决定能不能开工，合并只等站长说「合」。

标准流程可压缩为：提出需求 → 搜重（open／closed Issue 与相关 PR）→ 开或复用 Issue（问题、影响、建议动作、阻塞、来源聊天摘要）→ 打分诊标签 → 仅当 `priority:now` 且无 `needs:*` 时开 PR（`Closes #N` 或 `Related: #N`）→ 站长说「合」后才 squash。

例外三条（可直开 PR）：纯笔误；只修已红的 CI；站长当次明确说「直接改」／「别开 Issue」。命中例外仍要在 PR 写明依据，已有相关 Issue 仍应链接。

分诊约定：至少一个 `type:*`，恰好一个 `priority:*`；缺设计／决策／素材时追加 `needs:*`，此时停在 Issue，不开投机 PR。`priority:now` 不能压过 `needs:*`。

内容稿可带 `review_ready: false` 入库；助手不擅自改成 `true`，也不代替后台发布。

### 2.2 OpenClaw CONTRIBUTING（可复核原文）

上游仓库：[openclaw/openclaw `CONTRIBUTING.md`](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)（2026-11-04 拉取）。

「How to Contribute」路由：

- Bugs & small fixes → 可直接开 PR；
- New features / architecture → 先开 GitHub Issue 或先在 Discord 讨论。

同文件「Issue, PR, and Contact Routing」段有一句对代理场景特别关键的英文原句：

> For agent-authored or otherwise non-trivial work, create or reuse the issue first, then open the PR against it. Bugs and very small fixes may go straight to PR, but still link existing context when it exists and fill out the PR template.

本站 runbook 所说「参考 OpenClaw 对代理改动的要求」，对应的就是这一条可核验表述（中文「非琐碎事先 Issue」是站内转述，引证时以英文原文与 URL 为准）。

### 2.3 经典 tracker 与短生命周期分支（公开文档）

- **GitHub Docs — About issues**：Issues 用于 track ideas、feedback、tasks 或 bugs；可在仓库里 plan、discuss、track work。[About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)
- **GitHub Docs — Linking a pull request to an issue**：可把 PR／分支链到 Issue，以表示修复进行中，并在合并时**自动关闭** Issue；关键词包括 `close`／`closes`／`closed`、`fix`／`fixes`／`fixed`、`resolve`／`resolves`／`resolved`（例如同仓 `Closes #10`）。[Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- **Trunk-Based Development**（[trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/)）：一行摘要是——开发者在称为 trunk 的单一分支上协作，并抵制长生命周期开发分支；小团队可短生命周期功能分支，但目标仍是频繁合回 trunk，避免 merge hell。本稿只用其「短分支、快合回」这一层，不展开 GitFlow 论战。

这三份材料共同支撑的事实很窄：**问题有编号与元数据；求解物（PR／短分支）应显式对准问题；合并可关闭问题。** 它们不声称「多智能体」或任何并行产能数字。

### 2.4 与站内既有专文的边界（指针，不重写）

| 问题 | 去哪篇 |
|---|---|
| 模型在工具反馈里决定下一步／何时停止 | [Agent Loop 深度调研](/articles/research/topics/agent-loop-why-now) |
| AgentScope／LangGraph／AutoGen／LangChain 抽象分层 | [多 Agent 框架横向对比](/articles/research/topics/multi-agent-frameworks-comparison) |
| 仓库里 AGENTS.md／rules 等可提交记忆约定 | [AI 开发的项目记忆约定](/articles/research/topics/ai-dev-project-memory-conventions) |
| 问题如何进台账、何时开分支、如何关单 | **这一篇** |

## 三、结构分析：真正卡住的一层

### 3.1 「填衣袖子」：台账首先是共享状态

把问题写进 Issue（或等价待办），等于给后续求解提供**可寻址状态**：编号、标签、阻塞原因、与旧单的 `Related`。搜重规则存在，是因为同一症状重复开单会拆散证据；`needs:*` 存在，是因为缺决策时硬开 PR 只会制造半闭环。

聊天摘要进 Issue 正文，是把瞬时对话压成可复用事实；密码与私人联系方式禁止写入——状态管理包含**什么不能进台账**。

### 3.2 分支／任务对准问题；关单完成闭环

「开分支求解」在工程上通常落成：一 Issue 范围内的短分支 + 指向该 Issue 的 PR。GitHub 的关闭关键词把「合并」与「问题解决」绑在同一动作上；本站额外要求站长说「合」才 squash，并把 UI 预览、内容 `review_ready` 与发布动作拆开——闭环的定义可以比「CI 绿」更严，但**仍须先有问题编号可关**。

部分推进用 `Related: #N`、做完用 `Closes #N`：这是状态粒度上的约定。

Trunk-based 在此只起约束作用：分支应为短命且对准一个连贯问题；长分支脱离台账，等于把状态藏回个人工作区。

### 3.3 AI 并行提出与求解：状态管理是前提

在 AI 设定下，可以并行做两件事：

1. **提出／澄清问题**（从日志、巡检、用户反馈、对话里整理成 Issue 五段）；
2. **对着已分诊的 Issue 求解**（编码、改文案、跑检查、写证据）。

多智能体适合放大这两步的**吞吐形状**（多条独立 Issue 同时推进）。公开资料里没有可复核的「某固定数量 agents 并行吞吐」指标；不发明该类数字。能写成判断的只有结构关系：

**没有台账，并行没有合流点**——各代理各自开无编号改动，搜重失效，关单条件无法共享，迭代变成发散。

项目记忆约定（AGENTS.md 等）回答「代理进仓读什么」；问题台账回答「工作项如何被登记、求解与关闭」。二者互补：前者是仓库级指令状态，后者是任务级问题状态。

### 3.4 「用 AI 迭代自身」落在何处

对个人站点或小团队，「用 AI 迭代自身」落成可执行习惯：

- 把缺陷、增强、内容与运维诉求**持续写入**可检索台账；
- 让助手／代理在 `priority:now` 且无阻塞时开短分支求解；
- 核验后关单，并让下一次提出建立在已关闭与仍打开的状态之上。

自迭代的飞轮卡在**状态是否完整**，不卡在是否采用某一 multi-agent 产品名。框架横评与 agent loop 专文讨论的是执行层与控制权；台账与闭环讨论的是**工作项如何进入与离开系统**。

## 四、外部研判

一种可能的外部解读是：2024–2026 编码代理与多代理编排变容易之后，组织最先感受到的瓶颈，会从「会不会写 prompt」转向「有没有共享问题状态」。Issue 优先在无 AI 时已是成熟习惯；有 AI 之后，它从「礼貌与可审」升级为「并行是否可合流」的硬前提。

对本站读者，可操作的收敛是：

- 非琐碎事先有 Issue；代理起草也不能跳过搜重与分诊。
- 并行只对**已编号且无 `needs:*` 阻塞**的项加压；不要对同一模糊诉求复制多个无关联 PR。
- 关单条件写进 Issue／PR（验证步骤、预览、`review_ready`），避免「代码合了但问题定义仍飘着」。

不据此断言「所有团队必须 GitHub Issues」：等价物可以是其他 tracker 或结构化待办，只要具备可寻址、可搜重、可链接求解物、可关闭。

## 五、信息来源与持续验证

### 主要来源（截至 2026-11-05）

- 本站 [`docs/runbooks/issue-first-workflow.md`](https://github.com/TUARAN/tuaran-home-page/blob/main/docs/runbooks/issue-first-workflow.md)（`main`；由 PR [#94](https://github.com/TUARAN/tuaran-home-page/pull/94) / Issue [#93](https://github.com/TUARAN/tuaran-home-page/issues/93) 落地）
- 本站调研选题 Issue [#95](https://github.com/TUARAN/tuaran-home-page/issues/95)
- [openclaw/openclaw CONTRIBUTING.md](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)
- [GitHub Docs: About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)
- [GitHub Docs: Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)

### 持续验证

- runbook 已在 `main`；若日后改写「非琐碎先 Issue／分诊／例外」段落，需重核第二节引文与流程摘要。
- OpenClaw CONTRIBUTING 若改写「agent-authored or otherwise non-trivial work」句，第二节引文与本站「参考 OpenClaw」表述需同步重核。
- 若出现带明确统计方法的公开「多智能体并行求解」产能或吞吐数据，可补进事实层；在那之前不写具体 N 或速率。
