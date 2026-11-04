---
title: Grok Bot 和 Cursor 差在哪
category: topics
topic_type: product
tech_type: agents_automation
entity_type: product
content_type: analysis
date: 2026-11-03
updated: 2026-11-04
tags: [Grok Bot, Cursor, Cloud Agents, The X Subscription, 套餐]
summary: 以 2026-11-04 Models & Pricing、Cloud Agents、Grok Bot 与 FAQ 为准：Cloud Agents 是按任务隔离的编码 VM；Grok Bot 是账号级常驻云电脑。Plus 不含二者；Premium 起同时具备。
tldr: 合上电脑两边都能继续跑。改代码、云端验证、交 PR → Cloud Agents。登录与例程要留到下一回 → Grok Bot。Plus 两者都不含。能力表只采官方文档，概述页与 FAQ 冲突处写入持续验证。
subjects: [ai_dev]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> 适用范围：比较公开文档中的 Cursor 编程面（编辑器 Agent、CLI、Cloud Agents）与 Grok Bot。Grok 聊天、Imagine、语音与 API 不在比较范围内。标价不含税。不编造未在官方页出现的功能对等。

## 一、先给结论

1. **Cloud Agents** 在隔离云 VM 里克隆仓库、跑测试，可用远程桌面/浏览器验证本次改动，交付分支与草稿 PR；本机不必在线。[Cloud Agents](https://cursor.com/docs/cloud-agent)
2. **Grok Bot** 同样在云端跑；多出来的是**账号级常驻电脑**——文件、浏览器会话、应用登录与例程留在同一用户下，下一回接着用。[Grok Bot](https://cursor.com/docs/grok-bot)
3. **新客户套餐（The X Subscription）**：Plus（$8/月）有编辑器自有模型 Agent，**不含** Cloud Agents 与 Grok Bot；Premium（$30/月）起两者都有，并与 Grok 应用共享每周用量池。[Models & Pricing](https://cursor.com/docs/models-and-pricing) · [FAQ](https://docs.x.ai/grok-bot/faq)
4. **选型**：云端改代码并交 PR → Cloud Agents；跨应用、要保留登录与日程例程 → Grok Bot。不要把 Grok Bot 当成第二个 IDE。

## 二、事实层（2026-11-04）

### 2.1 能力对照（仅官方口径）

| 维度 | Cursor（含 Cloud Agents） | Grok Bot |
|---|---|---|
| 入口 | 编辑器、CLI、[cursor.com/agents](https://cursor.com/agents)、iOS、Slack、GitHub/Bitbucket 评论、Linear、API | 桌面/手机对话；FAQ 另述 X Chat、部分地区 @bot、Slack 共享 Bot |
| 本机是否须在线 | 编辑器 Agent 用本机；**Cloud Agents 不要求本机在线** | **不要求**；合上笔记本不停止后台回合与例程 |
| 云端环境寿命 | **每次任务**一台隔离 VM，随任务结束 | **每用户一台**常驻机；该用户名下 Bot **共用**文件/会话/登录 |
| 典型交付 | 分支、diff、草稿 PR、验证用截图/录像/日志 | 对话结果：草稿、已操作网页、待批准外发等 |
| 浏览器用途（文档表述） | 验证**改过的软件**；人可接管远程桌面 | 操作人日常工具与无连接器的站点；拦截/验证码/人机步骤交还用户 |
| 模型选择 | 用户可选；Premium+ 第三方按 API 标价走预付额度 | **无模型选择器**；产品自行路由；团队 model allowlist **不管** Grok Bot（FAQ） |
| 敏感动作 | Cloud Agent 密钥用 Secrets；合并前审 PR | 批准 / Auto Review；Vault/密码管理器/Secure Form 填值且模型不见明文（FAQ） |

Cloud Agents 文档写明：可并行多个；支持 MCP；可产 artifacts；可多仓协调并开 PR。Grok Bot 文档写明：Bot 可并行；每 Bot 一块屏幕；同一 Bot 同一时刻一个 computer-use 任务；可从演示存 skill、再做成 routine。

### 2.2 套餐（以 Pricing + FAQ 为准）

来源：[Models & Pricing](https://cursor.com/docs/models-and-pricing)、[FAQ: Do I need a separate subscription / How much](https://docs.x.ai/grok-bot/faq)

| 档位 | 标价 | Cloud Agents | Grok Bot（新客户 X Subscription） |
|---|---|---|---|
| Free | $0 | 不含 | 不含 |
| Plus | $8/月（年付 $80） | **不含**（Pricing：No … Cloud Agents …） | **不含**（FAQ 明文） |
| Premium | $30/月（年付 $300） | 含 | 含 |
| Super | $100/月（年付 $1,000） | 含 | 含 |
| Ultra | $200/月（年付 $2,000） | 含 | 含 |
| Teams | 每席 $30 / $100 / $200 | 与席位档一致 | 付费席位含（FAQ） |
| Enterprise | 定制 | 含（合同） | 管理员开启（FAQ） |

Plus 含：自有模型 Agent（Grok 4.7/4.6/4.5、Composer 2.5，固定 Fast off / medium effort 等）以及 Grok Chat、Voice、Imagine、Build、Grok API——**仍不含** Cloud Agents 与 Grok Bot。

付费档有一个**每周刷新**的 Cursor 模型用量池，覆盖编辑器 Agent、CLI、Cloud Agents、Grok Bot 与 Grok 应用；第三方模型从第一次请求走预付额度。Grok API 另计，不进周池。

**遗留 Cursor 计划**（Pro / Pro+ / Ultra 等）：FAQ 写明旧付费个人档与自助 Teams 含 Grok Bot；可另链 SuperGrok / X Premium+ 等，用量取较高档，**不会相加**。本稿主表只服务新客户 X Subscription。

### 2.3 文档冲突（事实，不作采信）

`cursor.com/docs/grok-bot` 概述仍有「included with every paid individual Cursor plan」类表述；**同日** FAQ 与 Models & Pricing 将新客户写成 Plus/Free **不含**。采购决策采 **Pricing + FAQ**；概述句列入持续验证。

## 三、结构分析

| 问题 | 跟谁 |
|---|---|
| 要隔离环境、测试、交 PR | Cloud Agents |
| 要登录态与例程留到明天 | Grok Bot |
| 只要编辑器里改代码 | Plus 的本机 Agent 即可 |
| 只要聊天/做图 | 同订阅 Grok 应用；不必为 Grok Bot 升档 |

Grok Bot 文档允许把编码任务再派给 Cloud Agents（团队开关默认开时）：交付物仍是那次 Cloud Agent 的分支/PR，中间多一跳，且 Bot 侧不能自选模型——适合「对话里交代 → 编码任务」而非替代 IDE。

爆炸半径：Cloud Agent 任务结束环境丢弃，记忆靠仓库与 PR；Grok Bot 电脑上的登录对**该用户全部 Bot**可见，官方要求勿把「多个 Bot」当成安全边界。

## 四、外部研判

二者解决的是不同「合上电脑之后」：**一次编码闭环** vs **一台会留下来的业务电脑**。用功能清单硬比「谁更能写代码」会选错档——写代码的云端主路径在文档里是 Cloud Agents；Grok Bot 的公开叙事是跨应用执行与常驻上下文。升到 Premium 的理由应是「需要 Cloud Agents 和/或 Grok Bot」，而不是「Plus 不能写代码」。

## 五、信息来源与持续验证

复核截至 **2026-11-04（Asia/Shanghai）**。

- [Models & Pricing](https://cursor.com/docs/models-and-pricing)
- [Cloud Agents](https://cursor.com/docs/cloud-agent)
- [Grok Bot](https://cursor.com/docs/grok-bot)
- [Grok Bot FAQ](https://docs.x.ai/grok-bot/faq)
- [Cursor Agent overview](https://cursor.com/docs/agent/overview)（编辑器 Agent 入口，未展开逐条能力）

### 持续验证

- 若 `docs/grok-bot` 概述删掉「every paid individual」或 Plus 开始包含 Grok Bot，更新第二节套餐表与冲突段。
- Cloud Agents 触发入口（Slack / Linear / 评论机器人）若增减，只改 2.1 入口行。
- 本稿不写入未打开的 Teams/Enterprise 安全细开关；需要时另抓 [grok-bot/teams](https://cursor.com/docs/grok-bot/teams) 与 security 页。
