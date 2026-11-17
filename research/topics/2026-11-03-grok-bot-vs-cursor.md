---
title: Grok Bot 和 Cursor 差在哪
category: topics
topic_type: product
tech_type: agents_automation
entity_type: product
content_type: analysis
date: 2026-11-03
time: 11:20
updated: 2026-11-17
tags: [Grok Bot, Cursor, Cloud Agents, 记忆协作, The X Subscription]
summary: Cloud Agents 是按任务隔离的编码 VM，同一次 run 可 resume、新任务不自动继承「教训」；Grok Bot 靠 memory + 常驻共享电脑跨会话；经 Bot 派云端编码须把规则与材料写进 brief／仓库。Plus 不含二者。新客户周池里，个人 Auto（Cost）与 Composer、Grok、Grok Bot 共用 Cursor Models 额度。
tldr: 合上电脑都能继续。改代码交 PR → Cloud Agents（耐久知识放 .cursor/rules、AGENTS.md 与本次 brief）。跨应用、登录与例程留到下一回 → Grok Bot。经 Bot 再派 Cloud 时，子任务仍是隔离 VM；UI／样式类任务更适合本机多轮。Plus 两者都不含。个人 Auto 只有 Cost 模式，与 Composer、Grok、Grok Bot 同走包含额度；限额后的降速提示不是写进套餐的正式配额。
subjects: [ai_dev]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> 适用范围：比较公开文档中的 Cursor 编程面（本机编辑器 Agent、CLI、Cloud Agents）与 Grok Bot 的记忆／协作边界。Grok 聊天、Imagine、语音与 API 不在比较范围内。标价不含税。不编造未在官方页出现的功能对等。

## 一、先给结论

1. **Cloud Agents** 在隔离云 VM 里克隆仓库、跑测试，可用远程桌面／浏览器验证本次改动，交付分支与草稿 PR；本机不必在线。同一次 run 的对话状态会持久化，可 **resume**；另起一次新任务时，文档没有「自动吸收上次教训」的机制——耐久知识要写进仓库规则／AGENTS.md，或贴进新的 brief。[Cloud Agents](https://cursor.com/docs/cloud-agent) · [Security](https://cursor.com/docs/cloud-agent/security)
2. **Grok Bot** 同样在云端跑；多出来的是**账号级常驻电脑**与官方写明的 **Context compounds**：具名 Bot 跨会话保留 memory、文件、浏览器会话与偏好。[Grok Bot](https://cursor.com/docs/grok-bot)
3. **经 Grok Bot 派 Cloud Agents 写代码时**，交付物仍是那次 Cloud Agent 的分支／PR。Bot 侧可跨会话，子任务侧仍隔离。要把详细上下文、规则与参考材料写进任务 brief，并指向仓库里的 AGENTS.md／`.cursor/rules`；失败复盘也应回写进仓库，而不是指望下一次云端任务「自己记得」。
4. **新客户套餐（The X Subscription）**：Plus（$8/月）有编辑器自有模型 Agent，**不含** Cloud Agents 与 Grok Bot；Premium（$30/月）起两者都有，并与 Grok 应用共享每周用量池。[Models & Pricing](https://cursor.com/docs/models-and-pricing) · [FAQ](https://docs.x.ai/grok-bot/faq)
5. **选型粗分**：云端改代码并交 PR → Cloud Agents（或本机 Agent 多轮）；跨应用、要保留登录与日程例程 → Grok Bot。不要把 Grok Bot 当成第二个 IDE。UI／插件／站点样式这类要靠审美反馈的迭代，站长实践上更偏本机多轮（见第四节研判）。
6. **用量池与限额**：新客户 The X Subscription 是周池，Grok Bot 与编辑器自有模型、Cloud Agents 共用；个人 Auto 只有 Cost 模式，和 Composer、Grok 走同一份 Cursor Models 额度。Plus 不含 Auto。遗留个人档是两个月度池；帮助中心写明包含额度用尽且按需关闭后应停。编辑器里出现的降速提示不是写进套餐的正式配额，也不能据此推断 Grok Bot 限额后一定同样降速延续。

## 二、事实层

### 2.1 能力对照（仅官方口径）

| 维度 | Cursor（含 Cloud Agents） | Grok Bot |
|---|---|---|
| 入口 | 编辑器、CLI、[cursor.com/agents](https://cursor.com/agents)、iOS、Slack、GitHub/Bitbucket 评论、Linear、API | 桌面/手机对话；FAQ 另述 X Chat、部分地区 @bot、Slack 共享 Bot |
| 本机是否须在线 | 编辑器 Agent 用本机；**Cloud Agents 不要求本机在线** | **不要求**；合上笔记本不停止后台回合与例程 |
| 云端环境寿命 | **每次任务**一台隔离 VM；同 run 可 resume；空闲后 VM 回收 | **每用户一台**常驻机；该用户名下 Bot **共用**文件/会话/登录 |
| 典型交付 | 分支、diff、草稿 PR、验证用截图/录像/日志 | 对话结果：草稿、已操作网页、待批准外发等 |
| 浏览器用途（文档表述） | 验证**改过的软件**；人可接管远程桌面 | 操作人日常工具与无连接器的站点；拦截/验证码/人机步骤交还用户 |
| 模型选择 | 用户可选；Premium+ 第三方按 API 标价走预付额度 | **无模型选择器**；产品自行路由；团队 model allowlist **不管** Grok Bot（FAQ） |
| 敏感动作 | Cloud Agent 密钥用 Secrets；合并前审 PR | 批准 / Auto Review；Vault/密码管理器/Secure Form 填值且模型不见明文（FAQ） |

Cloud Agents 文档写明：可并行多个；支持 MCP；可产 artifacts；可多仓协调并开 PR。Grok Bot 文档写明：Bot 可并行；每 Bot 一块屏幕；同一 Bot 同一时刻一个 computer-use 任务；可从演示存 skill、再做成 routine。

### 2.2 Cloud Agent 生命周期与记忆边界

来源：[Security overview](https://cursor.com/docs/cloud-agent/security)、[Builds](https://cursor.com/docs/cloud-agent/builds)、[Rules](https://cursor.com/docs/context/rules)

单次 run 的阶段（官方顺序）：Start → Provision（隔离 VM + clone）→ Run → Persist（对话状态／artifacts，便于 review 与 **resume**）→ Hand off（推分支、开 PR）→ Recycle（空闲后休眠再删 VM）。跟进提示会刷新空闲计时器。

隔离句官方原文要点：

- 「One agent cannot see another agent's code, environment, or state.」
- 对话状态保存在 Cursor 后端，「Kept indefinitely by default so you can revisit and resume runs」。
- Builds「preserve disk state only」——预装依赖／磁盘快照加速启动，**不是**无关 agent 之间的聊天记忆。

Rules 文档写明：「Large language models don't retain memory between completions. Rules provide persistent, reusable context at the prompt level.」耐久约定放在 `.cursor/rules` 或 `AGENTS.md`。

据此可核对的边界：

| 场景 | 文档支持的行为 |
|---|---|
| 同一 Cloud Agent run 里追问、续跑 | 可；conversation state + follow-up 刷新 idle |
| 另开一次新的 Cloud Agent 任务 | 新的隔离 VM；无「自动继承上次任务教训」的文档机制 |
| 想让下一次云端任务少踩坑 | 改仓库规则／AGENTS.md，或把教训写进新 brief；Builds 只带磁盘准备态 |

### 2.3 Grok Bot 为何能跨会话

来源：[Grok Bot](https://cursor.com/docs/grok-bot)、[FAQ: What does a Bot remember?](https://docs.x.ai/grok-bot/faq)

官方产品叙事直接写：**「Context compounds. A named Bot keeps its memory, files, browser sessions, and preferences across sessions instead of resetting on every task.」**

FAQ 对「记得什么」的口径：稳定偏好、角色上下文、先前工作的摘要；对话与学到的上下文按 Bot 分开；共享文件、浏览器会话与直接 handoff 在 Bot 之间搬上下文。同一账号下所有 Bot **共用一台电脑**——文件与登录对全部 Bot 可见，官方要求勿把「多个 Bot」当成安全边界。

Grok Bot 可以把编码任务再派给 Cloud Agents（团队开关允许时）：中间多一跳，交付仍是那次 Cloud 的分支／PR。Bot 自己的跨会话记忆**不会**自动变成子 Cloud Agent 的跨任务记忆。

### 2.4 套餐（以 Pricing + FAQ 为准）

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

Plus 含：自有模型 Agent（Grok 4.7/4.6/4.5、Composer 2.5，固定 Fast off / medium effort 等）以及 Grok Chat、Voice、Imagine、Build、Grok API——**仍不含** Auto、Cloud Agents 与 Grok Bot。

付费档有一个**每周刷新**的 Cursor 模型用量池，覆盖编辑器 Agent、CLI、Cloud Agents、Grok Bot 与 Grok 应用；第三方模型从第一次请求走预付额度。Grok API 另计，不进周池。

**遗留 Cursor 计划**（Pro / Pro+ / Ultra 等）：FAQ 写明旧付费个人档与自助 Teams 含 Grok Bot；可另链 SuperGrok / X Premium+ 等，用量取较高档，**不会相加**。本稿主表只服务新客户 X Subscription。

### 2.5 Auto 与用量池

来源：[Models & Pricing](https://cursor.com/docs/models-and-pricing)（含 [Auto modes](https://cursor.com/docs/models-and-pricing#auto-modes) 节）、[Usage and limits](https://cursor.com/help/models-and-usage/usage-limits)、[Usage-based charges](https://cursor.com/help/account-and-billing/overages)、[Cursor Router](https://cursor.com/docs/cursor-router)、[Available models](https://cursor.com/help/models-and-usage/available-models)、[Legacy Cursor plans](https://cursor.com/docs/account/pricing/legacy-cursor-plans)、[FAQ: How much does Grok Bot cost](https://docs.x.ai/grok-bot/faq)

Auto 不是单一模型。文档把 Cursor Router 写成 Auto 背后的路由：请求按任务分配到不同模型，各轮可以不同。Auto 有 Cost、Balance、Intelligence 三档。个人计划只有 Cost 模式（文档称为 classic Auto）：不论实际落到哪个模型，都记成 Cursor 模型请求，从包含额度里扣。Balance / Intelligence 只在团队或企业打开 Cursor Router 时，按路由到的模型标价计费；第三方路由记第三方用量，在新客户走预付费额度，在遗留计划走进 Other Models 池。不要把团队／企业的 Balance、Intelligence 和个人 Cost 混为一谈。

新客户 The X Subscription 的付费档只有一个每周刷新的 Cursor 模型用量池，覆盖 Grok 4.7、Grok 4.6、Grok 4.5 和 Composer 2.5；编辑器 Agent、CLI、Cloud Agents、Grok Bot 与 Grok 应用共用这一池。第三方模型不在池内，Premium 及以上从第一次请求走预付费额度。Plus 明文不含 Auto。周池用尽后，定价页给出的路径是：等每周重置、使用预付费额度，或升级套餐，并写明 “Requests are never downgraded in quality or speed.” 关闭自动充值、且已购额度用尽时，额外用量应停止。

遗留 Pro / Pro+ / Ultra 与遗留 Teams 等是两个月度池：Cursor Models 用于 Grok 与 Composer；Other Models 用于第三方，按供应商价扣除。Start 只有 Cursor Models 池。帮助中心对 Cost 模式的写法是：从包含的 Cursor 模型池扣除，不记成第三方用量。包含额度用尽后，打开按需（pay-as-you-go）或升级；个人档关闭按需时，帮助中心写明请求在包含用量用尽后应停止。

Cursor Models 用尽之后、同一模型是否先记入 Other Models 包含额度，帮助中心未写成正式规则。论坛官方人员 Colin 的口径是：Cursor Models 用尽后，会继续提供同一模型，并把用量记入 Other Models 包含额度；编辑器 Cursor Models 栏脚注 “consumes Other Models quota or on-demand spend”，意思是先扣 Other Models，只有该池也用尽且已打开按需时才走按需；两边都满且按需关闭时，会出现用量上限提示，等到下一个计费周期重置。这是论坛官方人员口径，不是帮助中心文档。编辑器 Plan & Usage 页脚注（遗留 Pro+）有同等表述：“Additional usage beyond limits consumes Other Models quota or on-demand spend.” 这是产品界面拷贝，不是帮助中心文档。

产品实际还可能先走软限制。编辑器 Auto 会出现 “Usage limit reached”“You've reached your limit. Responses may be slower. Upgrade for more usage” 一类提示，请求仍可能发出。这不是套餐写明的正式配额。官方没有公布还能用多久、用多少、此时对齐哪个模型；这与定价页 “never downgraded in quality or speed” 并陈。论坛官方人员 deanrie、Colin 的口径是：这段降速延续不是保证权益，系统一旦按硬规则拦截或收回放行就会停；稳定接着用，只能打开按需或预付费，或等周期重置。上述软限制提示是编辑器 Auto 的产品拷贝。官方文档没有写明 Grok Bot 限额后会同样降速延续；FAQ 对遗留计划写的是：关闭按需时，Grok Bot 在周用量用尽后停止。

遗留计划上，Grok Bot FAQ 使用「每周用量」和按需续用的表述，与 Cursor 帮助中心「两个月度池」并不相同。两边都是官方页，不以其中一边覆盖另一边。

### 2.6 文档冲突（事实，不作采信）

`cursor.com/docs/grok-bot` 已重定向到 [Grok Bot overview](https://docs.x.ai/grok-bot/overview)，概述页不再出现「included with every paid individual Cursor plan」这类句子。FAQ 现已分开写：新客户 The X Subscription 上，Grok Bot 含于 Premium / Super / Ultra，Plus 与 Free 不含；遗留付费个人档与自助 Teams 含 Grok Bot。采购仍以 **Pricing + FAQ** 为准。

## 三、结构分析：记忆与协作三层

先前一版容易把「本地 vs 云端」说成浏览器反馈回路或文件不同步。站长后续体感更准的是：**协作形状与记忆落点不同**——人仍然可以两边口述反馈；卡住的是谁跨会话、谁跨任务互学、耐久知识该写在哪。

| 层 | 跨会话？ | 跨任务互学？ | 耐久知识放哪 |
|---|---|---|---|
| 本机编辑器 Agent | 同一聊天线程内连贯；换开新 chat 不自动带上旧线程全文 | 无账号级「魔法记忆」；靠打开的文件、Rules、人粘贴 | `.cursor/rules`、`AGENTS.md`、当前 chat、本机打开的材料 |
| Cloud Agent | **同一 run**：可 resume；**新 run**：不自动继承上次教训 | 隔离 VM；一 agent 看不见另一 agent 的代码／环境／状态 | 仓库 rules／AGENTS.md、本次 brief、Builds（仅磁盘准备态） |
| Grok Bot | **是**（官方 Context compounds：memory + 文件 + 浏览器会话 + 偏好） | Bot 记得偏好／摘要；若再派 Cloud，子任务仍隔离 | Bot memory + 共享电脑上的文件；编码时仍须把关键约束塞进 brief／仓库 |

三条链路叠在一起时（常见路径：**人 ↔ Grok Bot ↔ Cloud Agent → PR**）：

1. Bot 对话可以跨天积累偏好与摘要。
2. 派出去的每一次 Cloud 任务仍是独立 run：brief 被压缩经过 Bot，交付偏「一次出 PR」；审美与半成品感的反馈，若不写回 brief／rules，下一次云端任务看不见。
3. 本机编辑器 Agent 则是同一工作区里的多轮：diff、预览、样式微调可以短循环，不必先经过「对话 → 云 VM → PR」的交付形状。

因此「经 Bot 做编码／设计常感觉半成品」在机制上可落到三处（仍属结构描述，第四节再作研判）：

- **协作形状**：Cloud 主叙事是分支／PR handoff；Bot 再加一跳 brief 压缩。
- **评价信号**：样式／扩展 UI 依赖人眼与本机预览；Cloud 虽有远程桌面与 artifacts，默认闭环仍偏「测通＋交 PR」，弱于本机连续审美打磨。
- **教训转移**：新 Cloud run 不自动互学；未回写 AGENTS.md／rules 的坑会重复出现。官方也未用「云端模型更笨」来解释上述边界；半成品感更宜先核对协作形状与记忆落点。

## 四、外部研判

二者解决的是不同「合上电脑之后」：**一次编码闭环** vs **一台会留下来的业务电脑**。用功能清单硬比「谁更能写代码」会选错档——写代码的云端主路径在文档里是 Cloud Agents；Grok Bot 的公开叙事是跨应用执行与常驻上下文。升到 Premium 的理由应是「需要 Cloud Agents 和/或 Grok Bot」。Plus 档仍能用编辑器自有模型写代码。

站长（TUARAN）在约两到三天的密集使用后修正了更浅的对比：瓶颈更突出地出现在浏览器扩展、个人站点 UI／样式一类任务上。

- 用 Grok Bot → Cloud Agents 写代码时，**应当**写详细上下文，并点名规则、AGENTS.md 与参考材料；每次 PR 后把失败点回写进仓库，让下一次 brief 变厚。
- UI／插件／站点样式：优先本机编辑器多轮；若坚持走 Grok→Cloud，把「厚 brief + 回写 rules」当成流程成本；事后只抱怨云端「半成品」解决不了边界问题。

上述站长实践标为**研判**，不是官方产品承诺。

## 五、信息来源与持续验证

核对日期为 2026-11-17（北京）。

- [Models & Pricing](https://cursor.com/docs/models-and-pricing)（含 [Auto modes](https://cursor.com/docs/models-and-pricing#auto-modes) 节）
- [Usage and limits](https://cursor.com/help/models-and-usage/usage-limits)
- [Usage-based charges](https://cursor.com/help/account-and-billing/overages)
- [Cursor Router](https://cursor.com/docs/cursor-router)
- [Available models](https://cursor.com/help/models-and-usage/available-models)
- [Legacy Cursor plans](https://cursor.com/docs/account/pricing/legacy-cursor-plans)
- [Cloud Agents](https://cursor.com/docs/cloud-agent)
- [Cloud Agent security](https://cursor.com/docs/cloud-agent/security)
- [Cloud Agent Builds](https://cursor.com/docs/cloud-agent/builds)
- [Rules](https://cursor.com/docs/rules)（`/docs/context/rules` 现重定向至此）
- [Grok Bot overview](https://docs.x.ai/grok-bot/overview)（`cursor.com/docs/grok-bot` 现重定向至此）
- [Grok Bot FAQ](https://docs.x.ai/grok-bot/faq)
- [Cursor Agent overview](https://cursor.com/docs/agent/overview)（编辑器 Agent 入口，未展开逐条能力）
- 论坛辅证（官方人员口径，不是帮助中心文档）：[On-demand billing off still consuming on-demand-billed services](https://forum.cursor.com/t/on-demand-billing-off-still-consuming-on-demand-billed-services/171902)、[Teams with on-demand OFF — free requests after both pools hit 100%](https://forum.cursor.com/t/teams-with-on-demand-off-free-requests-after-both-pools-hit-100/166740)、[Cannot use Auto after Included Usage reaches 100%](https://forum.cursor.com/t/cannot-use-auto-after-included-usage-reaches-100/168725)

### 持续验证

- 若 Pricing 或 FAQ 调整 Plus 是否含 Auto／Grok Bot／Cloud Agents，或再次把新客户写成「every paid individual」含 Grok Bot，更新 2.4、2.5、2.6 与结论。
- 软限制能延续多久、用多少、此时对齐哪个模型，以及 Grok Bot 限额后是否出现与编辑器 Auto 同款的降速延续，官方文档均未写明；若帮助中心补上正式配额或明确否定，改 2.5。
- 遗留计划上，Grok Bot FAQ 的「每周用量」与 Cursor 帮助中心「两个月度池」若被官方收束成同一口径，更新 2.5。
- Cursor Models 用尽后是否先记入 Other Models：现仅见论坛官方人员口径与编辑器 Plan & Usage 页脚注；若帮助中心写成正式规则，把 2.5 的并陈改成文档事实。
- Cloud Agents 若新增「跨 run 自动继承教训／账号级编码记忆」类能力，重写 2.2 与第三节三层表。
- Cloud Agents 触发入口（Slack / Linear / 评论机器人）若增减，只改 2.1 入口行。
- 本稿不写入未打开的 Teams/Enterprise 安全细开关；需要时另抓 [Grok Bot for teams and enterprises](https://docs.x.ai/grok-bot/teams-and-enterprises) 与相关 security 页。
