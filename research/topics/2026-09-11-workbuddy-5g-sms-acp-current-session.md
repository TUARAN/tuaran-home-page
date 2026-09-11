---
title: 手机短信注入当前 WorkBuddy 对话：ACP 链路实测
category: topics
date: 2026-09-11
time: 08:52
tags: [WorkBuddy, ACP, 5G消息, 短信通道, Agent, session/prompt, macOS]
summary: 在本机把 5G 消息通道切到 ACP 后端后，白名单手机发出的短信可以注入当前 WorkBuddy 会话并自动回复；SQLite 用量立刻上升，聊天界面要手动刷新才显示。
tldr: 2026 年 9 月 11 日上午，本机 shared-daemon 以 ACP 模式连上 WorkBuddy 本机端点 127.0.0.1:50072，用 session/load 绑定既有会话后 session/prompt 注入短信。3 条测试短信 processed=3、failed=0，session_usage 从 128691 增至 132913 tokens。聊天列表不自动出现新 turn，临时用 Cmd+R 或在主对话发一条消息触发重拉。
topic_type: tech
tech_type: agents_automation
subjects: [workbuddy]
content_type: engineering_case
assistance: cursor
model: grok-4.6
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

目标收敛成一句：手机发出去，当前这条 WorkBuddy 对话立刻多出一个 turn，模型处理完再自动回短信。2026 年 9 月 11 日上午，这条链路在本机跑通了；聊天窗口当时没跟上刷新。

## 一、先给结论

1. **处理链路已经闭环。** 手机 → 运营商 5G 网关 WebSocket → `5g-msg-channel-macos` 的 shared-daemon（`BRIDGE_BACKEND=acp`）→ `http://127.0.0.1:50072/api/v1/acp` → `session/load` + `session/prompt` → 模型回复 → 网关 `ws_sent`。
2. **3 条真实上行短信全部处理成功。** `service.log` 累计 `received=3 / processed=3 / failed=0`。
3. **当前对话确实被用到了。** 绑定的 WorkBuddy session 前缀 `5098bb07`；`workbuddy.db` 里 `session_usage.used` 从 128691 跳到 132913 tokens，`updated_at` 落在 08:36:21；同一会话的 `last_activity_at` 同步更新。
4. **桌面 MCP 收件不能满足这个目标。** `receive_5g` / `reply_5g` 能读到消息，但 turn 必须结束，跨 turn 会积压；外部队列、通知中心、`workbuddy://` 深链也写不进当前对话。
5. **界面缺口还在。** SQLite 已写入，renderer 没有接到后续 push，聊天列表要 Cmd+R 或在主对话随便发一条才会重拉。

协议边界见[ACP 与 MCP 硬件接入审计](/articles/research/topics/workbuddy-acp-vs-mcp-hardware-bridge)；通道资质与产品定位见[短信操纵本地 WorkBuddy](/articles/research/topics/workbuddy-sms-personal-agent)和[SMS / 5G 消息可行性](/articles/research/topics/workbuddy-sms-rcs-channel)。

## 二、事实层

### 1、需求怎么收窄

| 阶段 | 当时要验证的问题 |
|---|---|
| 起点 | `receive_5g` / `reply_5g` 桌面收件是否可用 |
| 联调 | 能不能读到手机发来的内容；reply 失败卡在哪 |
| 中途 | 不想每次追问才去拉一次收件箱 |
| 终点 | 手机发出后，**当前** WorkBuddy 对话立刻出现新 turn，并由模型自动回复手机 |

中途那一档曾经指向“外部守护进程自己去拉”。终点把它否决了。有效交付是当前对话立刻出现新 turn；外部日志和新建会话都不算。

### 2、本机通道长什么样

`tools/5g-msg-channel-macos` 把收发拆成三层：

```text
运营商 MaaP WebSocket
        ↓
shared-daemon（launchd 常驻）
        ↓
   ┌────┴────┐
 Unix socket    ACP HTTP
 5g-macos.sock  127.0.0.1:<acpPort>/api/v1/acp
 MCP 收件箱     session/load + session/prompt
```

关键约束写在源码里：

| 机制 | 代码位置 | 实测含义 |
|---|---|---|
| 单接收者 owner 锁 | `src/desktop-inbox.cjs` | 谁先 `receive` 谁持有锁；连接断开后别人才能接。空闲无待领取消息时释放锁，方便守护进程和桌面任务切换 |
| 白名单默认拒绝 | `src/policy.cjs` | `ALLOWED_SENDERS` 为空直接失败；`ENFORCE_WHITELIST=false` 被拒绝。测试只用一个已登记发送者，号码不在公开材料中写出 |
| 发送者目录 | `senderDirectory()` | SHA-256 截 24 位，每个号码一份 `session.json` |
| 后端开关 | `BRIDGE_BACKEND` | 只允许 `acp` 或 `desktop`；未设置时默认 `acp` |
| `ws_sent` | 网关写出 | 只表示本机 WebSocket 已写出，没有业务 ACK，不能当手机送达证明 |

早期桌面模式验证过 6 条历史短信，对应 6 次 `ws_sent`；当时 gateway / delivered 均为空。ACP 这轮 3 条测试短信同样只能证明处理与写出，不能证明对方手机弹出。

### 3、切到 ACP 时改了什么

| 操作 | 结果 |
|---|---|
| 备份 `~/.workbuddy/mcp.json` | 留下 `.bak-acp-` 前缀备份 |
| `BRIDGE_BACKEND: desktop → acp` | shared-daemon 走 `bridge.cjs` → `AcpClient` |
| 写入发送者目录 `session.json` | `sessionId` 绑到当时打开的 WorkBuddy 对话（前缀 `5098bb07`） |
| `launchctl kickstart -k` 重启 shared-daemon | 日志报 `acpPort=50072`，`acpReady=true` |
| `POST /api/v1/acp/connect` | HTTP 200，返回 `connectionId` 与 `sessionToken` |

`src/acp-client.cjs` 的握手顺序是：`connect` → `initialize` → 有 `preferredSessionId` 则 `session/load`，失败再 `session/new` → `session/prompt`。`session/load` 的响应不重复返回 `sessionId`，客户端把首选 ID 自己写回去。

### 4、铁证：日志、库、连接同时跳

`service.log` 事件链（单条短信）：

```text
session_loaded 5098bb07
  → session/prompt
  → agent_message_chunk × 8–9
  → prompt_result
  → ws_sent
  → task_done
```

对照表：

| 观察点 | 数值 | 能证明什么 | 不能证明什么 |
|---|---|---|---|
| `service.log` 累计 | received=3 / processed=3 / failed=0 | 3 条上行都被桥接处理 | 手机是否弹出回复 |
| `session_usage.used` | 128691 → 132913 tokens | 被绑定的会话消耗了推理额度 | 聊天 UI 是否刷新 |
| `sessions.updated_at` / `last_activity_at` | 立刻更新到 08:36:21 | 同一条会话被碰到 | renderer 是否订阅到 turn |
| Electron 主进程监听 50072 | TCP ESTABLISHED | ACP 握手后连接还活着 | 沙箱子进程如何把 turn 推给界面 |

WorkBuddy 当时拆成三类进程：Electron 主进程（ACP 端点 50072）是壳；sandboxed 子进程跑 turn；renderer 负责聊天列表。库更新发生在会话存储层，列表刷新依赖 renderer 的订阅。

### 5、仓库里多出来、但 ACP 链路用不上的文件

探索阶段写进了 `tools/5g-msg-channel-macos/scripts/`：

| 文件 | 作用 | 当前是否在跑 |
|---|---|---|
| `daemon.cjs` | Unix socket 长轮询 `receive_5g`，可选 echo 回复、通知、jsonl 队列 | 否。ACP 模式不经过它 |
| `daemon-service.cjs` | launchd 的 install / uninstall / restart / status | plist 生成过；bootstrap 曾遇 EIO，未作为生产路径 |
| `inbox-reader.cjs` | 主对话读取 jsonl 队列的 CLI | 否 |
| `inbox-watcher.cjs` | 每 5 秒扫队列，通知中心响一声 | 能响、能写日志，当前对话不会因此出现新 turn |

`desktop-inbox.cjs` 的空闲释放锁仍然保留，方便以后有人再切回桌面收件。

## 三、结构分析

### 1、为什么桌面收件到不了“当前对话立刻处理”

`BRIDGE_BACKEND=desktop` 时，shared-daemon 只把短信放进本地收件箱，等某个桌面任务调用 `receive_5g`。领取规则是：同一时刻一个 owner；reply 必须由领取者发出。这对“人在 WorkBuddy 里点一下再回”够用，对“手机一发就自动进入正在看的那条对话”不够。

MCP 工具调用挂在某一个 turn 上。turn 一结束，长挂的 `receive_5g` 就停。下一条短信继续进队列，但没有人在当前对话里自动开新 turn 去领。

### 2、探索过、后来放下的路

| 方案 | 实际结果 | 放下的原因 |
|---|---|---|
| `daemon.cjs` + launchd 开机自启 | 能拉、能回、能写队列 | 满足“我自己去拉”，不满足当前对话同步 |
| `5g-inbox.jsonl` + 5 秒 watcher | 通知中心会响 | 主对话聊天列表不出现新 turn |
| `workbuddy://task?action=start` | 能打开任务 | 开的是新会话，追加不了当前 turn |
| AppleScript 模拟键盘 | 报 -10004 | 缺辅助功能权限 |
| `workbuddy://wechat/share` | 可调 | 只接受微信 ZIP |
| 探测 WorkBuddy 60780 端口 | 找到只读 token | 写不进当前会话 |
| 在对话里持续调用 `receive_5g` | 当轮能等到 | turn 必须结束，跨 turn 仍积压 |

这几条路验证的是旁路通知和旁路会话。目标要的是 **同一条 WorkBuddy session 被 `session/prompt` 追加**。

### 3、ACP 为什么能打进当前对话

`src/bridge.cjs` 按发送者保留 `AcpClient`。目录里的 `session.json` 提供 `preferredSessionId`。短信进队后 `pump()` 调用 `client.prompt(text)`，内部就是 `session/prompt`。模型输出截到 4000 字，再经网关回给原发送者。

把 `session.json` 改成当时 UI 里打开的那条会话 ID，注入目标就从“新建一条 ACP 会话”变成“复用你正在看的对话”。token 用量跳变是这条绑定生效的直接证据：如果只是另开会话，`5098bb07` 这条记录不会在 08:36:21 被碰到。

站内更早的判断是：硬件或短信作为**用户入口**时用 ACP，作为 **Agent 可调用的执行器**时用 MCP。这次实测走的是入口方向，和[那篇协议审计](/articles/research/topics/workbuddy-acp-vs-mcp-hardware-bridge)一致。

### 4、UI 缺口落在哪一层

处理成功和界面显示是两件事。

ACP 端点在 Electron 主进程。turn 跑在沙箱子进程。聊天列表在 renderer。`session/prompt` 从本机回环打进去之后，库表更新了，renderer 没有收到足以让列表重绘的 push。临时办法是 Cmd+R 强刷 renderer，或在主对话发任意一条消息，迫使前端重拉会话。

把这个现象写成“ACP 没注入成功”会误判。用量、活动时间和 `prompt_result` 已经证明注入发生了。缺口在 WorkBuddy 客户端自己的进程间通知。

## 四、外部研判

这些是观察，不是 WorkBuddy 官方结论。

**当前对话同步，应走 ACP `session/prompt`，不要再加一层外部收件守护进程。** daemon / watcher 解决的是“别让人来问才去拉”，仍把人留在 WorkBuddy 外面。目标一旦改成“当前对话就是收件箱”，ACP 才是对口协议。

**硬绑定 sessionId 能跑通 PoC，运营上很脆。** 用户新开一条对话后，旧的 `session.json` 仍指向 `5098bb07`。`AcpClient` 在 `session/load` 失败时会 `session/new`，新会话能处理短信，但不会自动出现在用户正在看的窗口。要稳定使用，需要可改的绑定步骤：从当前任务复制 sessionId，写入对应发送者目录，再 `kickstart` daemon。

**renderer 不刷新更像产品缺陷，桥接层补不好。** 队列文件、通知中心、深链都试过，最多做到“旁边响一声”。真正该修的是 session 被外部 `session/prompt` 追加后，UI 订阅 `turn_added` 一类事件。这项要交给 WorkBuddy 客户端团队（当时对接人是江旭一侧），外部仓库改不到 renderer。

**`ws_sent` 和“手机已收到”仍要分开说。** 通道文档写明无业务 ACK。自动回复在本机写出 3/3，对方手机是否弹出、是否被运营商过滤，这轮没有独立回执。

## 五、未能验证

| 缺口 | 已知线索 | 可能的查证路径 |
|---|---|---|
| 手机端是否弹出回复 | gateway / delivered 为空 | 用测试机截图，或向网关要 MT 回执字段 |
| renderer 漏订阅的具体事件名 | 库有记录、界面无 turn | WorkBuddy 源码或团队确认 `turn_added` / IPC 通道 |
| launchd 安装 `daemon.cjs` 的 EIO | plist 已生成 | 在本机终端重跑 `node scripts/daemon-service.cjs install`；ACP 路径不依赖它 |
| 新开对话后的自动重绑 | 代码有 `session/new` 回退 | 开一条新 WorkBuddy 任务，发测试短信，看 UI 落在哪条会话 |
| 多发送者同时注入同一条桌面对话 | 目录按号码隔离 | 第二个白名单号码联调；当前只测了一个发送者 |
| 沙箱子进程 cwd 与 `ACP_CWD` 是否一致 | 子进程使用独立工作目录 | 对照 `bridge.cjs` 传入的 cwd 与子进程实际文件访问 |

## 六、信息来源与说明

- **一手：** 2026-09-11 本机联调记录。`tools/5g-msg-channel-macos` 源码（`desktop-inbox.cjs`、`acp-client.cjs`、`bridge.cjs`、`policy.cjs` 及 `scripts/daemon*.cjs`）、shared-daemon `service.log`、本机 `workbuddy.db` 的 `session_usage` / `sessions`、Electron 主进程与 50072 端口的 TCP 状态。
- **配置改动：** `~/.workbuddy/mcp.json` 的 `BRIDGE_BACKEND`；发送者工作目录中的 `session.json`。备份文件留在本机，不入库。
- **未公开：** 白名单手机号、网关 API Key、ACP `sessionToken`、完整 session UUID、WorkBuddy 内部 IPC 协议细节。
- **推断：** “renderer 没接到 push event”依据库表与界面不同步，以及主进程 / 沙箱子进程 / renderer 的分工；未阅读 WorkBuddy 闭源 renderer 代码。
- **资料截至：** 2026-09-11 08:52（北京时间）。此后若客户端修复了会话推送，或 `session.json` 改绑，结论中的 UI 缺口和硬绑定限制需要重测。

临时使用方式：Mac 开着 WorkBuddy，shared-daemon 保持 ACP 模式，`session.json` 指向要同步的那条对话。手机从白名单号码发短信。处理发生后如果聊天列表没动，Cmd+R 刷新窗口。
