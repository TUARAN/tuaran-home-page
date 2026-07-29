---
title: 用 Skill 实现 Channel：WorkBuddy / CodeBuddy 的可行路径与边界
category: topics
date: 2026-07-17
time: 10:21
tags: [WorkBuddy, CodeBuddy, Skill, Channel, MCP, Hooks, AI Agent, 消息路由, 状态管理]
summary: 核验 WorkBuddy、CodeBuddy Code 与开源 Agent 框架后发现，纯 Skill 只能模拟部分 channel 行为；CodeBuddy Code 已提供 Channels Beta，实际可行方案是 MCP channel server 负责收发，Skill 负责语义与工作流，Hook 负责生命周期事件。
tldr: 截至 2026 年 7 月，CodeBuddy Code 已公开 Channels Beta，自定义 channel 可通过特殊 MCP server 向运行中的会话推送事件，并用 reply 工具实现双向通信。Skill 适合放路由策略、格式转换和业务流程，不适合独自承担常驻连接、身份认证、可靠投递与会话隔离。桌面 WorkBuddy 已有多种官方 IM 接入和 Hook 插件，但自定义 channel 是否复用 CLI 的完整协议，仍需按版本实测。
topic_type: tech
tech_type: agents_automation
content_type: analysis
assistance: codex
model: gpt-5
show_assistance: false
review_ready: true
ad_eligible: false
pv: 0
---

## 写在前面

这篇文章核对的是 2026 年 7 月可访问的官方文档和开源仓库。WorkBuddy 桌面端与 CodeBuddy Code CLI 的能力并不完全相同，文中会分开标注。

## 一、先给结论

理论上可以用 Skill 模拟 channel 的一部分逻辑，但目前更合适的实现已经出现：**MCP channel server 管收发，Skill 管业务，Hook 管事件。**

具体有 5 点。

1. **纯 Skill 只能做“像 channel 的工作流”**。它可以解析消息、选择路由、保存状态、调用发送 API，也可以定时轮询。它很难独立保证常驻连接、外部事件主动唤醒、断线重连、幂等投递和多会话隔离。
2. **CodeBuddy Code 已公开 Channels Beta**。官方把 Channel 定义成一种特殊 MCP server。它通过 stdio 运行，向会话发送 `notifications/claude/channel`，双向场景再暴露 `reply` 工具。
3. **WorkBuddy 已经支持多个现成入口**。官方助理文档列出了微信、企业微信、QQ、元宝、飞书和钉钉。很多“新增 channel”需求，实际可以直接使用现成集成。
4. **Skill Hook 也已出现，但有版本边界**。CodeBuddy Code v1.16.0 及以上的 Hook 文档列出 27+ 事件；Skill frontmatter Hooks 仍处于 Beta，并受非可信来源开关约束。桌面 WorkBuddy 是否使用同一运行时，需要现场验证。
5. **社区 harness 可以借鉴，不能当作官方扩展契约**。`workbuddy-harness` 有 HookRunner、daemon 和插件目录，适合参考事件总线与执行历史。它无法单独证明 WorkBuddy 内部会接收这些事件。

## 二、Skill 和 Channel 的差别

两者容易混淆，因为它们都能“调用外部服务”。

Skill 更接近一份可执行的工作说明。[WorkBuddy 官方文档](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)把它描述为脚本和工作流的封装；CodeBuddy 文档中的标准结构是 `SKILL.md` 加可选的 `scripts/`、`references/` 和 `assets/`。本轮查到的官方结构没有把 `config.yaml` 列为必需文件，社区项目的配置格式不能直接当成官方规范。

Channel 是一条长期存在的消息通路。它至少要处理以下问题。

| 能力 | Skill 适合承担 | Channel adapter 适合承担 |
|---|---:|---:|
| 意图识别、业务规则 | 是 | 可选 |
| 消息格式转换 | 是 | 是 |
| Webhook / WebSocket / 轮询 | 勉强，可由脚本完成 | 是 |
| 外部事件主动推送到会话 | 依赖宿主入口 | 是 |
| 身份认证与发送者白名单 | 可写规则 | 是，且应在入站前完成 |
| 会话 ID、线程与回复关系 | 可保存简单映射 | 是 |
| 重试、去重、死信与限流 | 脚本可补 | 是 |
| 断线重连、健康检查 | 不适合 | 是 |
| 回复、附件、回执 | 可调用 API | 是 |

这里的关键限制是“谁先被唤醒”。

如果只有用户进入 WorkBuddy 并触发 Skill，脚本当然可以去收消息。但是，外部平台先来一条消息时，Skill 本身通常还没有运行。此时需要 webhook、常驻进程、MCP 通知或宿主 API 把事件送进 Agent 会话。

这就是 fake channel 和真正 channel 的分界。

## 三、官方能力已经走到哪里

### 1、WorkBuddy 桌面端

[WorkBuddy 的官方插件页面](https://www.codebuddy.cn/docs/workbuddy/Plugins)列出 5 类组件：Skill、MCP、Hook、Agent 和 Rule。另一份插件说明还写明，一个插件可以同时打包 Skills、MCP、Slash Commands、Hooks 和 Agents。

[助理页面](https://www.codebuddy.cn/docs/workbuddy/Claw)已经提供微信、企业微信、QQ、元宝、飞书和钉钉接入。[飞书](https://www.codebuddy.cn/docs/workbuddy/Feishu-Guide)与[钉钉](https://www.codebuddy.cn/docs/workbuddy/Dingtalk-Guide)可以选择 WebSocket 长连接或 URL 回调。这说明 WorkBuddy 内部已经有消息入口和远程会话路由。

目前公开页面主要解释“如何配置官方已有平台”。我暂未找到桌面 WorkBuddy 自定义 channel 的稳定 SDK 契约，也没有看到它明确承诺兼容 CodeBuddy Code 的全部 Channels Beta 接口。

### 2、CodeBuddy Code CLI

CodeBuddy Code 的情况更清楚。

[官方 Channels Beta 参考文档](https://www.codebuddy.cn/docs/cli/channels-reference)给出了一套最小协议：

- MCP server 声明 `capabilities.experimental['claude/channel']`。
- server 通过 stdio 连接，由 CodeBuddy Code 作为子进程启动。
- 入站事件使用 `notifications/claude/channel` 发送。
- `content` 进入 `<channel>` 标签正文，`meta` 转成标签属性。
- 双向 channel 额外提供标准 MCP `reply` 工具。
- 自定义开发版本使用 `--dangerously-load-development-channels` 测试；组织策略 `channelsEnabled` 仍然生效。

官方还明确提醒：发送者鉴权必须发生在 `mcp.notification()` 之前，并且应校验发送者 ID，不能只校验群 ID。原因很简单，channel 消息会进入模型上下文，未设防的入口就是 prompt injection 接口。

### 3、Hooks 与 Skill frontmatter

“WorkBuddy 不支持 Hook”这个说法已经过时。

2026 年 3 月版 CodeBuddy 用户指南记录了 7 类 Hook。[当前 CodeBuddy Code v1.16.0+ 文档](https://www.codebuddy.cn/docs/cli/hooks)已经扩展到 27+ 事件，覆盖工具、会话、子代理、权限、任务、文件和工作树等生命周期。

当前文档还允许在 `SKILL.md` frontmatter 中声明 Hooks。这个能力处于 Beta，并有两个限制：

- 非内置 Skill 默认视为非可信来源，需要显式开启 `allowUntrustedFrontmatterHooks`。
- Skill frontmatter Hook 的作用域跟随 fork subagent 生命周期，无法自动替代宿主级 channel listener。

所以，Hook 很适合记录、拦截、回调和补充上下文。它仍然需要一个入站口把外部消息送进系统。

## 四、推荐的实现架构

一个可维护的最小架构可以拆成 4 层。

```text
外部平台
  │  Webhook / WebSocket / Polling
  ▼
Channel Adapter（认证、验签、限流、去重、附件下载）
  │  notifications/claude/channel
  ▼
CodeBuddy / WorkBuddy 会话（线程映射、权限、Agent loop）
  │
  ├─ Skill（意图、业务路由、输出格式、何时回复）
  ├─ Hook（审计、前后处理、失败回调、会话事件）
  └─ reply 工具 ────────────────► 外部平台
```

这套分工有一个好处：替换外部平台时，Skill 的业务逻辑可以保留；调整业务流程时，底层连接也不用重写。

### 入站数据

先把不同平台消息归一化。

```json
{
  "event_id": "evt_123",
  "channel": "acme-chat",
  "account_id": "bot_01",
  "sender_id": "user_42",
  "conversation_id": "room_7",
  "thread_id": "thread_9",
  "text": "帮我检查今天的部署",
  "attachments": [],
  "timestamp": 1784250000
}
```

`event_id` 用来去重，`conversation_id + thread_id` 用来寻找 Agent 会话，`sender_id` 用来做授权。平台原始 payload 应另存审计记录，避免归一化时丢失排障信息。

### 状态管理

最少需要 3 类状态。

1. **路由状态**：外部 conversation 对应哪个 Agent session。
2. **投递状态**：事件是否已接收、处理中、已回复、失败或进入死信队列。
3. **权限状态**：发送者、群组、可调用工具范围和高风险操作审批。

早期原型可以用 SQLite。线上版本更适合使用带唯一键约束的数据库，并为 `(channel, account_id, event_id)` 建唯一索引。

### 回调与重试

外部平台通常会重复投递 webhook。adapter 应快速验签、落库并返回 2xx，后续处理异步完成。

回复失败时使用指数退避，并设置最大次数。超过上限进入死信队列，不能让 Agent 无限重试。所有有副作用的操作都要带幂等键。

## 五、三条实现路线

### 路线 A：直接使用现成 WorkBuddy 助理

如果领导要的是微信、企微、QQ、飞书或钉钉接入，优先验证现成功能。

这条路线成本最低。它已经覆盖扫码、机器人凭证、WebSocket 或回调模式，以及会话中的远程操作。

### 路线 B：CodeBuddy Code 自定义 Channel

如果目标平台没有官方入口，同时允许使用 CodeBuddy Code CLI，可以直接实现 MCP channel server。

第一版只做单向 webhook：验签后发送 `notifications/claude/channel`。第二版再加入 `reply` 工具、会话映射和发送者白名单。权限中继应放到最后，因为它允许远程批准 Bash、Write、Edit 等高风险操作。

这是目前证据最完整的自定义路径。

### 路线 C：Skill + 外部桥接，模拟 fake channel

如果只能使用桌面 WorkBuddy，且没有公开的自定义 channel 入口，可以用外部 daemon 收消息，再由 Skill 脚本读取队列并发送回复。

它适合 PoC，前提是业务可以接受以下限制：

- WorkBuddy 需要保持运行，或需要用户主动触发 Skill。
- 外部事件未必能立即唤醒现有会话。
- 会话、权限和重试需要自己维护。
- WorkBuddy 更新后，非公开桥接点可能失效。

这条路线最好明确命名为“channel simulator”或“event bridge”，避免团队误以为已经获得原生 channel 能力。

## 六、社区 harness 能提供什么

[`zhuang-HE/workbuddy-harness`](https://github.com/zhuang-HE/workbuddy-harness) 值得看，但要看它的实现边界。

当前 README 描述了 HookRunner、daemon、执行历史、插件目录和 `pre_tool_use` 等事件。daemon 会把 WorkBuddy 目录变化映射成 Hook 事件。这些设计可以借来做 3 件事：

- 统一事件格式和 Hook 配置。
- 集中执行回调、超时和错误处理。
- 保存执行历史，方便审计和回放。

它仍然是外置 harness。要让一条外部消息真正进入 WorkBuddy 会话，还需要官方 channel、MCP 通知、HTTP API 或其他稳定 ingress。

仓库还有一个小口径差异：页面标题写“21 个 Hooks”，当前 v2.0 README 的 `hooks.json` 段落和目录说明写“17 个自动化 Hooks”。这不妨碍参考代码，但说明评估时应以当前文件、测试和实际运行结果为准。

## 七、开源框架给出的共同答案

OpenClaw 把 Skill、Hook 和 Channel Plugin 分成不同扩展面。它的 channel plugin 负责账号配置、私聊安全、配对、会话 ID 语法、出站发送和线程回复；核心负责共享消息工具与分发。这套职责划分很适合作为 WorkBuddy adapter 的设计模板。

LangGraph 解决的是另一层问题。它用 checkpointer 在每一步保存图状态，并用 `thread_id` 恢复会话。这适合实现 channel 后面的对话状态、人工审批和故障恢复。

CrewAI Flows 提供事件驱动路由、状态和持久化，适合组织收到消息后的业务流程。它同样不替代平台连接与身份认证。

nanobot 已经支持 Telegram、Discord、Slack、微信等多平台。它的价值在于观察一个轻量 Agent 如何把 channel、session、media 和 command routing 分开。

这些项目指向同一个工程结论：**消息 transport、Agent state 和 Skill workflow 应分层。** 全部塞进一个 Skill，短期文件少，后续会把重连、权限、状态迁移和故障排查缠在一起。

## 八、先问领导 6 个问题

“要一个新 channel”常常只是表面描述。动手前可以先问：

1. 外部系统是哪个？WorkBuddy 是否已经内置？
2. 只需要 Agent 发通知，还是也要接收用户消息？
3. 需要新建任务，还是续接某个已有会话？
4. 是否需要附件、群聊、线程、流式输出和消息编辑？
5. 谁可以发消息，谁可以远程批准高风险操作？
6. 是否要求 7×24 小时可用，进程重启后能否恢复？

对应的选择很直接。

| 真实需求 | 建议 |
|---|---|
| 已支持的 IM 远程控制 | 用 WorkBuddy 助理 |
| CI / 监控告警进入会话 | 单向 MCP channel |
| 新聊天平台双向对话 | MCP channel + reply 工具 |
| 只需在任务结束后通知 | Hook 调用通知 API |
| 只需增加一个业务动作 | Skill 或 MCP tool |
| 宿主无 ingress，只做概念验证 | 外部 daemon + fake channel Skill |

## 九、风险与止损线

Channels、Skill frontmatter Hooks 都标着 Beta。接口升级是正常风险，adapter 应独立成包，并锁定 CodeBuddy 版本。

以下任一条件出现，就不建议继续用 Skill 硬接：

- 需要 7×24 小时收消息。
- 需要远程批准工具权限。
- 需要多个账号、群组或线程隔离。
- 需要可证明的消息不丢失、可重放和审计。
- 需要面向外部客户提供 SLA。

这些场景应该使用正式 channel server，或者由独立消息网关承接可靠性。

## 十、最后的判断

用 Skill 实现 channel 的想法并没有错。它适合承载“收到消息以后怎么做”。

问题出在把 Skill 同时当成连接器、队列、状态库和权限系统。这样做出来的 fake channel 可以演示，很难长期维护。

截至 2026 年 7 月，CodeBuddy Code 已经给出更清楚的路径：特殊 MCP server 负责外部事件，插件负责分发，Skill 负责业务知识，Hook 负责生命周期。对于桌面 WorkBuddy，先用已有助理；确实缺平台时，再验证它是否暴露相同的 Channels Beta 或稳定 ingress。

先确认领导需要的是新入口、新功能，还是一次任务完成通知。三者的工程量可能相差一个数量级。

## 信息来源

### 腾讯官方

- [WorkBuddy：技能](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)
- [WorkBuddy：插件系统](https://www.codebuddy.cn/docs/workbuddy/Plugins)
- [WorkBuddy：助理与支持平台](https://www.codebuddy.cn/docs/workbuddy/Claw)
- [WorkBuddy：飞书接入指南](https://www.codebuddy.cn/docs/workbuddy/Feishu-Guide)
- [CodeBuddy Code：Channels Beta](https://www.codebuddy.cn/docs/cli/channels)
- [CodeBuddy Code：Channels 参考与自定义协议](https://www.codebuddy.cn/docs/cli/channels-reference)
- [CodeBuddy Code：Hooks 参考](https://www.codebuddy.cn/docs/cli/hooks)
- [CodeBuddy Code：Skills 与 frontmatter Hooks](https://www.codebuddy.cn/docs/cli/skills)
- [CodeBuddy Code：插件参考](https://www.codebuddy.cn/docs/cli/plugins-reference)

### 开源项目与框架

- [WorkBuddy Harness](https://github.com/zhuang-HE/workbuddy-harness)
- [OpenClaw：Building channel plugins](https://docs.openclaw.ai/plugins/sdk-channel-plugins)
- [OpenClaw：Hooks](https://docs.openclaw.ai/automation/hooks)
- [LangGraph：Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [CrewAI：官方文档](https://docs.crewai.com/)
- [nanobot](https://github.com/HKUDS/nanobot)

### 站内交叉

- [如何让一个 channel 被 OpenClaw 官方集成](/articles/research/topics/openclaw-channel-official-integration)
- [WorkBuddy + 消息（SMS / 5G 消息）](/articles/research/topics/workbuddy-sms-rcs-channel)

（完）
