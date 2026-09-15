# 5g-msg-channel 连接器 — 安装与使用说明

> 版本：**1.0.0**（2026-09-08）｜升级：改 `src/version.cjs` 后同步本文档与 CHANGELOG.md
> 本文档面向**接手部署/联调的其他人员**：按步骤即可完成安装、启动、验证、接入 WorkBuddy。
> 配套文档：`simulator/docs/USAGE.md`（模拟器使用说明）、`connector/docs/DESIGN.md`（技术方案）、
> `connector/docs/REQUIREMENTS.md`（需求）
> 时序图：见「第 11 节 消息时序图」或独立文件 `connector/docs/SEQUENCE.md`
> 👉 只想在 WorkBuddy 里注册连接器的非技术同学，直接看 `connector/docs/MCP-GUIDE.md`（小白版）

---

## 1. 组件简介

`5g-msg-channel` 连接器实现 **5G 消息（MaaP OpenClaw WS v2.0）→ 真实 WorkBuddy AI** 的双向桥接：

```
手机 5G 消息 ──▶ 平台 WS 推送 ──▶ 连接器(本组件) ──▶ ACP ──▶ WorkBuddy AI 处理
手机收到回复 ◀── 平台 WS send  ◀── 连接器 ◀── ACP 流式文本 ◀── AI 回复
```

三个关键角色：

| 角色 | 文件 | 职责 |
|---|---|---|
| maap-client | `src/maap-client.cjs` | 5G MaaP 平台 WS 连接（协议 100% 复用参考包 cmicmaap v2.0） |
| acp-client | `src/acp-client.cjs` | ACP 客户端：connect/initialize/session/prompt/活动订阅 |
| bridge | `src/bridge.cjs` | 消息路由：串行队列、进度回执、看门狗防卡死 |

---

## 2. 环境要求

| 项 | 要求 | 备注 |
|---|---|---|
| Node.js | ≥ 18 | 推荐 WorkBuddy 内置 node（见 §4.1） |
| 依赖 `ws` | 已装 | 项目根 `node_modules/ws`（未装则 `npm install`） |
| WorkBuddy | 桌面端运行中 | 提供 ACP 端点（连接器对接真实 AI 的前提） |
| 模拟器（联调） | 端口 8066 | 没有真实网关时的本地验证台 |

---

## 3. 快速开始（5 分钟跑通，联调模式）

> 联调模式 = 连接器对接**本地模拟器(8066)**，无需真实 5G 网关。

### 第 1 步：启动模拟器（终端 A）
```bash
cd E:\workbuddy\5g-msg-channel\simulator\src
node sim-server.cjs 8066
```
看到 `模拟器已启动` 且页面 `http://127.0.0.1:8066/` 显示「运行中」即成功。

### 第 2 步：启动连接器（终端 B）
```bash
cd E:\workbuddy\5g-msg-channel\connector\src
node index.cjs --mock
```
看到如下日志即成功：
```
✅ ACP 会话就绪: d0bac45c-...
[maap] ✅ auth_ok，开始心跳
✅ 5G WS 已连接(auth_ok)，开始接收消息
```

### 第 3 步：端到端验证
1. 打开模拟器页面 `http://127.0.0.1:8066/`
2. 底部输入框发消息，如：`请问中国首都？只答城市名`
3. 数秒后收到 AI 真实回复（模拟器手机屏出现白色气泡，如「北京」）

### 第 4 步：确认状态
```bash
curl http://127.0.0.1:8066/api/health        # connectionCount ≥ 1 即连接器已连
grep -E "✅|✍️|完成" connector/logs/channel-*.log | tail
```

---

## 4. 对接真实 5G 网关

### 4.1 找到本机 WorkBuddy node 路径
```bash
# 读版本号（每台机器不同，勿写死）
cat C:\Users\<你的用户名>\.workbuddy\binaries\node\versions\current
# 真实路径 = 上面的目录 + node.exe
C:\Users\<你的用户名>\.workbuddy\binaries\node\versions\<版本号>\node.exe
```

### 4.2 用环境变量启动
```bash
cd E:\workbuddy\5g-msg-channel\connector\src

# Linux/macOS
MAAP_WS_URL="wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg" \
MAAP_API_KEY="ak_你的key" \
node index.cjs

# Windows CMD
set MAAP_WS_URL=wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg
set MAAP_API_KEY=ak_你的key
node index.cjs
```

### 4.3 或用 `.env` 文件（connector/ 目录下新建 `.env`，可选）
```
MAAP_WS_URL=wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg
MAAP_API_KEY=ak_你的key
# 可选
# ACP_PORT=16120            # 不设则自动探测
# ALLOWED_SENDERS=13800138000,13900139000
# ENFORCE_WHITELIST=true
```

> ⚠️ **对外提供服务务必开启白名单**：`ENFORCE_WHITELIST=true` + `ALLOWED_SENDERS=号码,号码`，
> 否则任意号码都能触发你的 AI 处理（有资费/安全风险）。

---

## 5. 在 WorkBuddy 注册为 MCP（让 AI 会话可直接调用）

连接器也可作为 **MCP 服务器** 注册进 WorkBuddy，注册后 AI 会话内可直接调用
`send_5g`（主动下发 5G 消息）与 `bridge_status`（查询链路状态）。

### 5.1 编辑 `~/.workbuddy/mcp.json`

```json
{
  "mcpServers": {
    "5g-msg-channel": {
      "command": "C:\\Users\\<用户名>\\.workbuddy\\binaries\\node\\versions\\<版本号>\\node.exe",
      "args": ["E:\\workbuddy\\5g-msg-channel\\connector\\src\\index.cjs", "--mock"],
      "env": {
        "MAAP_API_KEY": "test-api-key",
        "ACP_CWD": "C:\\Users\\<用户名>\\WorkBuddy\\<你的项目目录>"
      },
      "disabled": false
    }
  }
}
```

说明：
- 联调（本地模拟器）：保留 `--mock`，`MAAP_API_KEY=test-api-key`（与模拟器一致）
- 真实网关：去掉 `--mock`，`MAAP_API_KEY` 换成真实 key，可加 `MAAP_WS_URL`
- ACP 端口与 session **自动探测/持久化**，无需在 env 写死

### 5.2 启用
WorkBuddy → 连接器 / MCP 管理页 → 找到 `5g-msg-channel` → 点「信任」启用。
（新增/修改 mcp.json 需在管理页刷新或重启 WorkBuddy）

### 5.3 验证 MCP（命令行自测）
```bash
cd E:\workbuddy\5g-msg-channel\connector\src
printf '%s\n%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"bridge_status","arguments":{}}}' \
  | node index.cjs --mock
# 期望 stdout 依次返回 initialize → tools/list(send_5g/bridge_status) → bridge_status 状态 JSON
```

---

## 6. 环境变量清单

| 变量 | 默认 | 说明 |
|---|---|---|
| `MAAP_WS_URL` | 真实网关 wss://...（`--mock` 自动用 8066） | 平台 WS 地址 |
| `MAAP_API_KEY` | test-api-key | cmicmaap 直连 API Key |
| `ALLOWED_SENDERS` | 空 | 白名单号码，逗号分隔 |
| `ENFORCE_WHITELIST` | false | true 时仅处理白名单号码 |
| `HTTPS_PROXY` | 无 | 经代理访问真实网关（如 `http://127.0.0.1:7890`）；需先 `npm i https-proxy-agent` |
| `ACP_PORT` | 自动探测 daemon.log | 覆盖 ACP 端口（一般不用设） |
| `ACP_SESSION_ID` | 空（自动） | 指定会话 ID；配了则优先 resume，失效自动 new 并持久化 |
| `ACP_CWD` | 进程 cwd | resume 工作目录 |
| `ACP_SESSION_FILE` | connector/.session.json | 会话持久化文件位置 |
| `TASK_TIMEOUT_MS` | 120000 | AI 单任务超时（超时自动降级 new 会话重试） |
| `NO_PROGRESS` | - | 1=关闭「已收到/处理中」进度回执 |
| `CLEAN_CHINESE_REPLY` | 开 | 0=关闭中文回复清洗（剥离 AI 回复前英文引导杂质，只保留中文正文） |
| `PHONE_PROGRESS` | 非0默认开 | 0=关闭「思考中/调用工具」进度回执 |
| `BRIDGE_DRY` | - | 1=干跑（只打日志不真发） |
| `BRIDGE_SELFTEST_TEXT` | - | 启动 3s 后自测注入一条消息走全链路 |
| `LOG_LEVEL` | info | debug/info/warn/error |
| `CHANNEL_LOG_FILE` | logs/channel-日期.log | 日志文件位置覆盖 |

---

## 7. 日志与问题核查

### 7.1 日志位置
- 默认：`connector/logs/channel-YYYY-MM-DD.log`
- 若被 WorkBuddy 拉起且注入了 `LOG_FILE`，日志会写入该环境变量指定文件（启动日志会打印
  `日志文件: <实际路径>`，以它为准）

### 7.2 常用排查命令
```bash
cd E:\workbuddy\5g-msg-channel\connector

# 启动/连接状态
grep -E "连接器启动|ACP 会话|auth_ok|WS 已连接" logs/channel-*.log | tail

# 一条消息的完整生命周期
grep -E "入队|处理|prompt|回复组装|完成|失败" logs/channel-*.log | tail -20

# 异常与看门狗
grep -E "❌|看门狗|超时|ECONN|refusal" logs/channel-*.log | tail

# 实时跟踪
tail -f logs/channel-*.log
```

### 7.3 关键日志含义
| 日志 | 含义 |
|---|---|
| `✅ ACP 会话就绪` | ACP 握手 + 会话绑定成功 |
| `✅ auth_ok` | 5G WS 认证通过 |
| `📥 入队` → `🔄 处理` → `④ session/prompt 注入` | 消息进入 AI 处理 |
| `✅ prompt result: end_turn` | AI 回合完成 |
| `✍️ 回复组装(N字): "..."` | 已抓到 AI 回复文本（应非占位符） |
| `✅ 完成 #id 耗时 Xms` | 全链路成功 |
| `⏱ 看门狗触发` | 任务超时被强制释放（防永久卡死） |

---

## 8. sessionId 配置与自动管理

### 8.1 三种配置方式（优先级从高到低）

| 方式 | 示例 | 说明 |
|---|---|---|
| ① 命令行参数 | `node index.cjs --session-id 7e0a63f4-...` | 最高优先级，临时指定 |
| ② 环境变量 | `ACP_SESSION_ID=7e0a63f4-...` | mcp.json / .env / shell 均可 |
| ③ 持久化文件 | 自动 | 上次 session/new 成功后自动存 `connector/.session.json` |

### 8.2 行为语义（配置了 → 尝试 → 不行就新建）

```
配置了 sessionId（①或②）
   └─▶ 启动时优先 session/resume 尝试使用该会话
        ├─ 成功 ✅ → 使用它（日志：acp.session/resume ✓ xxx）
        └─ 失败 ❌（会话失效/引擎重启/被清理）
             └─▶ 自动 session/new 新建
                  └─▶ 新 id 持久化到 .session.json
                       └─▶ 之后都以新 id 为准（不会反复尝试失效的配置值）
未配置 sessionId（纯自动）
   └─▶ 从 .session.json 读上次的 id → resume 尝试 → 失败则 new 覆盖
```

要点：
- 显式配置的 id 失效后，日志会有提示：`显式配置的 sessionId(env) 已失效，本次改用新建会话并持久化`
- `.session.json` 中始终保存**最近一次成功可用的 id**，重启自动复用
- 想强制用全新会话：删除 `connector/.session.json` 后重启，或不配 sessionId 启动一次
- 启动日志展示来源：`session=arg:xxx / env:xxx / auto`（自动+持久化时不显示）

### 8.3 实际应用场景

```bash
# 联调：不关心会话 → 什么都不配（自动 new + 持久化复用）
node index.cjs --mock

# 指定复用桌面会话（如已开着的 WorkBuddy 会话 d0bac45c-...）
node index.cjs --mock --session-id d0bac45c-b979-47d2-a4d9-76f8f3ca2485

# 通过 .env 指定（connector/ 下）
# ACP_SESSION_ID=d0bac45c-b979-47d2-a4d9-76f8f3ca2485
```

---

## 9. 升级指引

1. 修改 `src/version.cjs`（如 1.0.0 → 1.1.0）
2. 更新根目录 `CHANGELOG.md`（记录变更）
3. 重启连接器即可（配置不变，session 自动复用）

---

## 10. 常见问题（FAQ）

| 现象 | 处理 |
|---|---|
| `5G WS 未连接/未认证` | 模拟器未启动（先启 8066）；真实网关检查 `MAAP_API_KEY` |
| `ACP 会话就绪` 失败 | WorkBuddy 引擎不在线，或 ACP 端口探测失败 → 手动 `ACP_PORT=实际端口` |
| 消息处理超时(120s) | resume 的桌面会话排队 → 已自动降级 new 会话重试；可调 `TASK_TIMEOUT_MS` |
| 收到占位符「[AI 已完成处理]」 | ACP 未回传文本分片 → 确认连接器版本 ≥ 1.0.0（含 content.text 提取修复） |
| 模拟器页面无实时更新 | 刷新页面；SSE 断开时轮询兜底自动恢复 |
| 端口冲突 | 换端口启动模拟器（`node sim-server.cjs 8067`），连接器相应配 `MAAP_WS_URL` |
| 多个连接器实例 | 同 key 会顶替——只保留一个实例连同一模拟器/网关 |

---

## 11. 目录结构

```
5g-msg-channel/
├── connector/                  # 连接器（本文档对象）
│   ├── src/
│   │   ├── index.cjs           # 入口（装配 + 启动 + MCP 挂载）
│   │   ├── config.cjs          # env 配置读取
│   │   ├── logger.cjs          # 日志模块（分级 + 文件 + 打点）
│   │   ├── version.cjs         # ★版本号唯一来源
│   │   ├── session-store.cjs   # sessionId 持久化（.session.json）
│   │   ├── maap-client.cjs     # 5G MaaP WS 客户端
│   │   ├── acp-client.cjs      # ACP 客户端
│   │   ├── bridge.cjs          # 消息路由（队列/看门狗/降级）
│   │   └── mcp-server.cjs      # MCP stdio 层（send_5g / bridge_status）
│   ├── docs/                   # INSTALL(本文档)/SEQUENCE(时序图)/REQUIREMENTS/DESIGN
│   ├── logs/                   # 运行日志（自动生成）
│   └── .session.json           # 会话持久化（自动生成，可删重置）
├── simulator/                  # 模拟器（见 simulator/docs/USAGE.md）
└── ref-5g-cli-bridge/          # 参考包解压目录（协议参照，勿改）
```

---

## 12. 消息时序图

一条 5G 消息从「手机发出」到「收到 AI 回复」的完整时序（与真实网关/模拟器行为一致）：

### 12.1 时序总览

```
手机用户 ──▶ MaaP 平台/模拟器(8066) ──▶ 连接器(5g-msg-channel) ──▶ WorkBuddy(AI)
    ▲                                                                   │
    └────────────── 5G 回复下发 ◀── WS send 帧 ◀── 回复文本 ────────────┘
```

### 12.2 详细步骤（9 步）

| # | 方向 | 动作 | 说明 |
|---|---|---|---|
| 1 | 手机 → 平台 | 5G 消息上行 | 用户发消息到运营商 MaaP |
| 2 | 平台 → 连接器 | `WS 推送 text_message(content, from)` | 长连接实时推送，连接器归一化为 `{id, sender, text, replyTarget}` |
| 3 | 连接器 → 平台 | `[已收到]` 进度回执（可选） | bridge 入队后立即回执「AI 处理中」，可关闭 |
| 4 | 连接器 → WorkBuddy | **ACP 会话握手** | connect → initialize → session resume（失效自动 new） |
| 5 | 连接器 → WorkBuddy | `session/prompt` 注入消息 | 注入用户文本，SSE 订阅活动事件 |
| 6 | WorkBuddy → 连接器 | `agent_message_chunk` 文本流 | 抓取 `content.text` 文本增量（流式） |
| 7 | WorkBuddy → 连接器 | `result{stopReason: end_turn}` | AI 回合结束 |
| 8 | 连接器 → 平台 | `WS send 帧 {type:send, content, to}` | AI 回复文本下发（send 成功无 ack，2s 收 error 则重试） |
| 9 | 平台 → 手机 | 5G 回复下发 | 用户手机收到回复 |

### 12.3 Mermaid 源码（支持 GitHub/编辑器直接渲染）

````mermaid
sequenceDiagram
    participant Phone as 手机用户
    participant MaaP as MaaP平台/模拟器(:8066)
    participant Conn as 连接器(5g-msg-channel)
    participant WB as WorkBuddy AI

    Phone->>MaaP: ① 5G消息上行
    MaaP->>Conn: ② WS推送 text_message(content, from)
    Conn-->>MaaP: ③ [已收到]进度回执(可选)
    Conn->>WB: ④ ACP connect → initialize → session resume|new
    Conn->>WB: ⑤ session/prompt 注入用户消息
    WB-->>Conn: ⑥ agent_message_chunk 文本流回传
    WB-->>Conn: ⑦ result: stopReason=end_turn
    Conn->>MaaP: ⑧ WS send帧 {type:send, content, to}
    MaaP->>Phone: ⑨ 5G回复下发到手机
````

> 说明：步骤 ④ 的 session 由连接器自动管理——resume 上次会话失败或超时，
> 自动降级 session/new 并把新 sessionId 持久化到 `.session.json` 供下次复用。

### 12.4 关键机制提示

| 机制 | 说明 |
|---|---|
| 串行队列 | 同一号码消息逐条处理，不乱序（不同号码并行为 v2 规划） |
| 进度回执 | 「已收到 / 💭思考中 / 🔧调用工具」可选下发到手机，体验友好 |
| 看门狗 | 单任务默认 120s 超时强制释放，防 ACP 挂起导致队列死锁 |
| 文本双通道 | ACP 流式文本 + end_turn 回执兜底，至少回执不丢消息 |
| WS 心跳/重连 | 15s ping、10s pong 看门狗判假死、指数退避重连 |
