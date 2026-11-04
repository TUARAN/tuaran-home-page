---
title: AI 开发的项目记忆约定（可执行层）
category: topics
topic_type: tech
tech_type: agents_automation
content_type: guide
date: 2026-06-11
updated: 2026-11-04
tags: [AGENTS.md, CLAUDE.md, Cursor rules, 项目记忆, 编码代理, 约定]
summary: 机制综述见站内《Agent 记忆机制》；本稿只留可执行约定：仓库放什么文件、写多长、冲突时谁优先、与 Skills/钩子如何分工。
tldr: 用根目录 AGENTS.md（或团队选定的单一入口）写构建/测试/禁区；路径级规则放工具原生 rules；会话纠错进可提交文档而不是聊天。不在此重复各产品记忆架构长表。
subjects: [web_cloud]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **本稿范围**：团队能直接落地的**文件约定与写作纪律**。产品如何加载记忆、自动记忆、压缩后谁还在——见 [Agent 记忆机制](/articles/research/topics/agent-memory-mechanisms)，此处不重复。
2. **跨工具最小公约数**：[AGENTS.md](https://agents.md/) 是面向编码代理的开放格式（站点自称 steward 于 Agentic AI Foundation）；Claude Code 在无 `CLAUDE.md` 时可直接读 `AGENTS.md`，也可 `@AGENTS.md` 导入。[Claude Code Memory](https://code.claude.com/docs/en/memory)
3. **一层入口 + 分层细则**：根文件写「任何代理进仓先读」；子目录 / path rules 写局部；个人偏好进 gitignore 本地文件。
4. **短、可验证、无冲突**：具体命令优于形容词；两处矛盾等于未定义。

## 二、事实层：现行文件角色（2026-11-04）

| 文件 / 位置 | 谁写 | 典型用途 | 备注 |
|---|---|---|---|
| `AGENTS.md`（根或嵌套） | 人 | 构建、测试、风格、安全禁区 | 多代理共用；[agents.md](https://agents.md/) |
| `CLAUDE.md` / `.claude/CLAUDE.md` | 人 | Claude Code 项目指令 | 与 `AGENTS.md` 并存时默认优先 CLAUDE 系，可用设置改为同时读 |
| `CLAUDE.local.md` | 人 | 本机私有 | 应 gitignore |
| `.claude/rules/*.md` | 人 | 可带 `paths:` 的条件规则 | 按打开的文件加载 |
| Cursor rules（`.cursor/rules` 等） | 人 | Cursor 侧规则 | 以 Cursor 当日文档为准；勿与根约定抢写同一句互相打架的话 |
| 自动记忆 / 会话笔记 | 代理 | 纠错与偏好 | 机器本地；重要结论应**回写**可提交文档 |

Claude 文档建议单份 CLAUDE.md **目标约 200 行内**；过长降低遵循度，并可用 path rules / Skills 分流。

## 三、可执行约定（建议直接贴进仓库）

### 3.1 根 `AGENTS.md` 必有章节

1. **Setup**：安装与启动命令（可复制）。
2. **Test / Lint**：合并前必须绿的命令。
3. **Repo map**：目录职责各一行，不贴整树。
4. **Non-negotiables**：禁止提交的路径、禁止的操作（例如不得 `git push --force` 到 main）、密钥位置。
5. **PR / commit**：标题格式与必跑检查（若团队需要）。

可选：部署入口、生成代码位置、与人读 README 的分工说明（「README 给人，AGENTS 给代理」）。

### 3.2 写作纪律

- 用「运行 `pnpm test`」代替「认真测试」。
- 同一规则只出现一次；子包 `AGENTS.md` 只写增量。
- 多步流程且偶发：改成 Skill / 脚本，不要堆进根记忆。
- 聊天里纠正第二次：改文件，不指望下次会话还记得口头约定。

### 3.3 冲突与优先级（团队约定）

建议写进根文件顶部：

1. 用户当次消息 > 更近的 `AGENTS.md` / rules > 根约定。
2. 安全类 Non-negotiables 高于风格偏好。
3. 发现冲突时开 PR 删旧句，禁止「两处都留着让模型猜」。

Claude 官方描述：更近的 `AGENTS.md` 对编辑中的文件优先；用户聊天覆盖文件。Cursor 侧以产品文档为准，团队仍应自洽。

### 3.4 与「记忆机制」专文的分工

| 问题 | 去哪篇 |
|---|---|
| 上下文窗、自动记忆、压缩存活 | `agent-memory-mechanisms` |
| 仓库明天克隆后代理读什么 | **本篇** |
| Skills / MCP / 钩子何时上 | 机制文 + 各工具文档；本篇只要求「流程重则外置」 |

## 四、外部研判

项目记忆约定的失败模式通常是：根文件变成第二份过时 README、工具专用文件各写一套互相矛盾的「真相」、以及把本该脚本化的发布流程塞进散文。约定的价值是**降低冷启动解释成本**，不是把系统设计说明书塞进每个会话。能提交的短文件，胜过不可移植的自动记忆。

## 五、信息来源与持续验证

复核截至 **2026-11-04（Asia/Shanghai）**。

- [AGENTS.md](https://agents.md/)
- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)
- 站内交叉：[Agent 记忆机制](/articles/research/topics/agent-memory-mechanisms)

### 持续验证

- Claude Code 对 `AGENTS.md` 的默认加载规则（版本门槛、与 `CLAUDE.md` 并存策略）以 Memory 文档当日表为准。
- Cursor rules 目录名与前端若变，只更新第二节 Cursor 行，不在本篇展开产品 UI 长述。
