# 5g-msg-channel 连接器 — 需求文档（REQUIREMENTS）

> 版本：v1.0（草案）｜日期：2026-09-07｜状态：待评审
> 参考：`5g-cli-bridge-v3.5.0-win-wb(5).zip`（官方 cmicmaap OpenClaw WS 协议 v2.0）

---

## 1. 背景与目标

### 1.1 背景
已有 `5g-cli-bridge`（v3.5.0）实现了「5G MaaP WS ⇄ codebuddy CLI 子进程」的桥：
- 优点：单进程、协议已跑通真实网关（cmicmaap）
- 局限：它 spawn `codebuddy` CLI（stdin/stdout stream-json），依赖 CLI 二进制、
  每次重启冷启动会话、与 WorkBuddy 桌面引擎是两个独立进程，无法复用当前桌面
  会话的上下文与 MCP 工具生态。

### 1.2 目标
在**不改变 5G MaaP WS 协议**的前提下，将桥的后端从「spawn CLI」替换为
「ACP（Agent Client Protocol）对接真实 WorkBuddy」：
- WS 交互（下行接收 / 上行发送）**100% 复用**参考包协议与帧格式
- 消息处理从「CLI 子进程」改为「ACP 会话注入真实 WorkBuddy AI」
- 复用桌面活跃会话（resume），让 5G 提问能调用 WorkBuddy 全部能力（工具/MCP/文件）

### 1.3 非目标（明确不做）
- 不改 MaaP 平台 WS 协议（auth/ping/send/text_message 帧保持不变）
- 不做富媒体卡片下行（v1 仅文本；帧格式预留）
- 不在连接器内做身份人格注入（身份由 ACP resume 的桌面会话天然携带）

---

## 2. 总体架构

```
┌────────────┐  5G 上行(下行消息)  ┌──────────────────────────┐
│  手机用户   │ ──────────────────▶ │  5G MaaP 平台(cmicmaap)  │
└────────────┘                     └────────────┬─────────────┘
                                                │ WebSocket (WSS 长连接)
                                                ▼
┌──────────────────────────────────────────────────────────────┐
│              5g-msg-channel 连接器 (本组件)                    │
│  ┌─────────────────┐    ┌────────────────────────────────┐   │
│  │ Maap5GConnection │    │    AcpEngineClient (ACP 客户端) │   │
│  │ (复用参考包WS协议) │    │ connect→initialize→session/    │   │
│  │ auth/ping/receive │    │ resume→session/prompt→活动订阅  │   │
│  │ sendReply→send帧  │    │ →抓回复→回调下发                │   │
│  └────────┬─────────┘    └──────────────┬─────────────────┘   │
│           │  上行消息(onMessage)          │  注入+回复回调        │
│           ▼                              ▼                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             Bridge 核心（消息路由/队列/去重/超时）         │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                          │ ACP (HTTP JSON-RPC over SSE)
                          ▼
              ┌─────────────────────────┐
              │  真实 WorkBuddy 引擎      │
              │  (daemon/sidecar ACP    │
              │   :47185/:38818)         │
              └─────────────────────────┘
```

---

## 3. 功能需求

### FR-1 WS 连接管理（与参考包一致）
| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-1.1 | 以 `X-API-Key` 握手头连接 `MAAP_WS_URL`（默认 `wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg`） | P0 |
| FR-1.2 | 连接建立后发送 `{type:'auth', apiKey, version:'2.0'}` 认证 | P0 |
| FR-1.3 | 收到 `auth_ok` 后：置已连接 + 立即 ping + 启动 15s 心跳循环 | P0 |
| FR-1.4 | 心跳：发 `{type:'ping'}` → 10s 内无 `pong` 判假死 → 主动重连 | P0 |
| FR-1.5 | 断线自动重连：指数退避 1s→30s，无限次（auth 无效除外） | P0 |
| FR-1.6 | 收到 `disconnected`（重复连接顶替）→ 停止并提示 | P1 |
| FR-1.7 | 白名单：`ENFORCE_WHITELIST=true` 时仅处理 `ALLOWED_SENDERS` 内号码 | P1 |

### FR-2 消息接收与归一化（下行接收）
| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-2.1 | 接收 `{type:'text_message', content, from}` → 归一化为内部消息 | P0 |
| FR-2.2 | 接收 `{type:'media_message', payload, from}` → 解析 JSON payload 提取描述/URL | P1 |
| FR-2.3 | `from` 透传为 `replyTarget`（send.to 原样使用，平台可能是 userId 编码） | P0 |
| FR-2.4 | 无 `from` 的帧（system 确认）→ 丢弃不处理 | P0 |
| FR-2.5 | 内部消息结构：`{id, sender, type, text, mediaUrl, replyTarget, ts}` | P0 |
| FR-2.6 | 生成消息 id（`messageId` 优先，否则 `cmic-时间戳-随机`） | P1 |

### FR-3 ACP 对接真实 WorkBuddy（核心差异点）
| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-3.1 | ACP 端点自动探测：从 `~/.workbuddy/logs/daemon.log` 取最新 `acpEndpoint` | P0 |
| FR-3.2 | `connect` → 存 connectionId；后续请求带 `acp-connection-id` 头 | P0 |
| FR-3.3 | `initialize`（Accept 必须为 `application/json, text/event-stream`） | P0 |
| FR-3.4 | sessionId 三级解析：`--session-id` > env `CODEBUDDY_SESSION_ID` > `session/new` 缓存复用 | P0 |
| FR-3.5 | `session/resume {cwd, sessionId}` 绑定真实会话 | P0 |
| FR-3.6 | `session/prompt` 注入消息文本；流式订阅 `session/update` 活动 | P0 |
| FR-3.7 | 回复获取策略（**关键技术选型**，见 TS-4）： | P0 |
|       a) 首选：resume 活跃桌面会话 → 引擎产生 end_turn → AI 回复经 5G 通道回传 |
|       b) 补偿：订阅流过滤 history 回放后的 `agent_message_chunk` 文本增量 |
| FR-3.8 | 活动事件统计（thought/tool_call/usage）→ 生成「处理中」进度回执 | P1 |

### FR-4 下行发送（上行回包）
| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-4.1 | 回复走 WS `{type:'send', apiKey, content, to}`（与参考包完全一致） | P0 |
| FR-4.2 | send 成功无 ack 帧；2s 窗口内收到 `{type:'error'}` 判失败并重试一次 | P0 |
| FR-4.3 | 队列 + 并发上限（同一会话串行，防止 ACP 多 prompt 冲突） | P1 |
| FR-4.4 | 超时兜底（默认 120s）→ 回「处理超时，请重试」 | P1 |

### FR-5 MCP 接入形态
| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-5.1 | 以 MCP stdio 服务器注册（hybrid：stdin MCP 协议 / EOF 独立运行） | P0 |
| FR-5.2 | 暴露工具：`send_5g`（主动下发）、`bridge_status`（链路状态） | P0 |
| FR-5.3 | 暴露工具：`bridge_config`（查看/刷新 ACP 目标与会话） | P2 |
| FR-5.4 | stdout 仅供 MCP 协议；日志全走文件+stderr | P0 |

### FR-6 可观测性
| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-6.1 | 日志：连接/认证/收发/ACP 每步留痕（channel.log），独立 logger 模块分级+文件 | P0 |
| FR-6.1a | 关键节点 MARK 打点（✅/⚠️），便于 grep 核查（如 `acp.session/new`） | P0 |
| FR-6.1b | 日志文件路径可在启动日志中直接看到（`日志文件: ...`） | P1 |
| FR-6.2 | 状态快照：`{wsConnected, wsMode, acpPort, sessionId, queueLength, activeTaskId}` | P1 |
| FR-6.3 | 干跑模式 `BRIDGE_DRY=1`：只打日志不真发 | P1 |
| FR-6.4 | 自测注入 `BRIDGE_SELFTEST_TEXT`：启动后走完整管线验证闭环 | P1 |
| FR-6.5 | 版本号：`version.cjs` 唯一来源，启动日志打印 `vX.Y.Z`（升级可追溯） | P0 |
| FR-6.6 | sessionId 持久化：`session-store.cjs` 保存 `.session.json`，重启复用 | P0 |

---

## 4. 消息格式（沿用参考协议，不改）

### 4.1 WS 下行帧（平台 → 连接器，即手机上行消息）
```json
// 文本消息
{"type":"text_message", "content":"你好", "from":"13800138000"}
// 富媒体消息（payload 为 JSON 串）
{"type":"media_message", "payload":"{\"description\":\"图片\",\"mediaUrl\":\"https://...\"}", "from":"13800138000"}
// 系统/确认帧（无 from，忽略）
{"type":"text_message", "content":"RESPONSE: ..."}
```

### 4.2 WS 上行帧（连接器 → 平台，即 AI 回复下发）
```json
{"type":"send", "apiKey":"ak_xxx", "content":"你好，我是AI助手", "to":"13800138000"}
```

### 4.3 控制帧
```json
// 客户端→服务端
{"type":"auth", "apiKey":"ak_xxx", "version":"2.0"}
{"type":"ping"}
// 服务端→客户端
{"type":"connected"} {"type":"auth_ok","message":"认证成功"}
{"type":"pong"}  {"type":"auth_failed","message":"..."}
{"type":"disconnected","message":"重复连接被顶替"}
{"type":"error","message":"send 失败原因"}
```

---

## 5. 边界条件与验收

| 场景 | 期望行为 |
|---|---|
| MaaP 断线 | 指数退避重连，队列保留，恢复后补发 |
| ACP 端口变化（会话轮换） | 自动探测最新端口 + 重新解析 sessionId |
| 桌面会话无 AI 响应（仅 tool_call 无文本） | 进度回执「已收到，AI 处理中…」，reply 通道兜底 |
| auth_failed（无效 key） | 停止重连（配置错误，不空转） |
| 同一手机连续多发 | 串行处理，不回乱序 |
| 5G 用户问复杂任务 | ACP 注入后桌面 AI 全能力执行（工具/文件/MCP） |
| BRIDGE_DRY=1 | 绝不真发短信 |

---

## 6. 环境变量清单

| 变量 | 默认 | 说明 |
|---|---|---|
| MAAP_WS_URL | wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg | 平台 WS |
| MAAP_API_KEY | (空) | cmic 直连 apiKey（必填，P0） |
| ALLOWED_SENDERS / ENFORCE_WHITELIST | 空 / false | 号码白名单 |
| ACP_PORT | 自动探测 daemon.log | 覆盖 ACP 端口 |
| ACP_SESSION_ID | env CODEBUDDY_SESSION_ID | 覆盖会话 id |
| ACP_SESSION_FILE | connector/.session.json | 会话持久化文件（可换路径） |
| LOG_LEVEL / CHANNEL_LOG_FILE | info / 自动 | 日志级别与文件覆盖 |
| ACP_CWD | 当前工作目录 | resume cwd |
| TASK_TIMEOUT_MS | 120000 | AI 单任务超时 |
| HEARTBEAT_INTERVAL | 15 | 心跳秒 |
| BRIDGE_DRY / BRIDGE_SELFTEST_TEXT | - | 调试 |

---

## 7. 风险与开放问题

| # | 风险/问题 | 影响 | 对策 |
|---|---|---|---|
| R1 | ACP 回复文本回传不稳定（当前 sidecar mainAgentSupport=false） | 可能只拿到 end_turn 拿不到文本 | ①resume 活跃桌面会话 ②reply 通道兜底 ③进一步验证 --serve 自承载 |
| R2 | 桌面会话轮换导致 resume 失败 | 注入无效 | 启动自动解析 sessionId + 失败自动重试 session/new |
| R3 | 真实网关不可达（联调阶段） | 无法 E2E | 配套模拟器（见模拟器文档）先行验证 |
| R4 | ACP 多 prompt 并发 | 同一会话冲突 | 串行队列 |
| Q1 | 是否需要 media 卡片下行（v1 只文本） | - | 待产品确认 |
