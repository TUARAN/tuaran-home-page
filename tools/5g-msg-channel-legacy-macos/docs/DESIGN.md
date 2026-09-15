# 5g-msg-channel 连接器 — 技术方案（DESIGN）

> 版本：v1.0（草案）｜日期：2026-09-07｜配套需求：REQUIREMENTS.md
> 设计原则：**WS 协议层 100% 复用参考包，AI 处理层替换为 ACP**

---

## 1. 技术选型

| 维度 | 选型 | 理由 |
|---|---|---|
| 运行时 | Node.js ≥ 18（复用 WorkBuddy 内置 node） | 与参考包一致，无新依赖栈 |
| WS 客户端 | `ws` 库 | 参考包同款，行为对齐 |
| ACP 客户端 | 自研轻量 HTTP + SSE 解析器 | 参考 5g-acp-sim 已验证实现（connect/JSON-RPC/SSE 事件流） |
| MCP 接入 | stdio 行协议（hybrid） | 与参考包 guard 模式一致 |
| 日志 | 自研 logger（stderr + 文件） | 不污染 stdout |
| 配置 | process.env + 可选 .env | 与参考包一致 |

## 2. 模块划分（connector/src/）

```
src/
├── index.cjs          # 入口：MCP stdio hybrid + 装配
├── config.cjs         # env 读取（对齐参考包字段）
├── version.cjs        # ★版本号唯一来源（升级改这里，语义化版本）
├── logger.cjs         # ★日志模块：分级(debug~error)+文件落盘+MARK打点
├── session-store.cjs  # ★sessionId 持久化（.session.json：保存/读取/清除）
├── maap-client.cjs    # ★复用参考协议：WS 连接/认证/心跳/收发帧/重连
├── acp-client.cjs     # ★ACP：connect/initialize/session 管理/prompt/活动订阅/降级
├── bridge.cjs         # 核心路由：消息→ACP→回复→send；队列/看门狗/去重
├── mcp-server.cjs     # MCP tools: send_5g / bridge_status
└── guard.cjs          # 单实例守护（本地端口锁），可选
```

> v1.0.0 新增：`version.cjs`（版本）、`logger.cjs`（独立日志模块，支持 `MARK` 打点
> 与日志文件路径输出）、`session-store.cjs`（会话持久化，重启复用）。

## 2.1 sessionId 三级解析 + 持久化（v1.0.0）

```
解析优先级：ACP_SESSION_ID(参数/env) → CODEBUDDY_SESSION_ID(引擎注入) → .session.json(上次保存)
降级链：
  ① resume 抛错/失效 → 自动 session/new
  ② session/new 结果持久化保存到 connector/.session.json（重启复用）
  ③ resume 会话 prompt 超时 → 自动切 session/new 重试一次（防活跃会话排队）
清档：删除 connector/.session.json 即强制下次 new
```

## 3. 关键流程

### 3.1 启动时序
```
1. 读配置（MAAP_API_KEY 必须，缺则 mock 提示）
2. 探测 ACP 端口（daemon.log 最新 acpEndpoint）→ 3. 解析 sessionId：
   --session-id 参数 > env CODEBUDDY_SESSION_ID > (暂空，首消息时 session/new 并缓存)
4. 启动 MaaP WS：
   ws = new WebSocket(MAAP_WS_URL, {headers:{'X-API-Key': apiKey}})
   open → send {type:'auth', apiKey, version:'2.0'}
   auth_ok → isConnected=true → ping → 15s 心跳循环 → onConnect
5. 启动 MCP stdio 服务（tools/list / tools/call / ping）
6. （可选）BRIDGE_SELFTEST_TEXT 注入 → 走完整管线自测
```

### 3.2 一条消息的生命周期（核心闭环）
```
① 平台 WS → {type:'text_message', content, from}
② maap-client 归一化: {id, sender:from, text, replyTarget:from, ts}
③ 白名单校验（ENFORCE_WHITELIST=true 时）
④ bridge 入队（同一 replyTarget 串行）→ 标记处理中
⑤ ACP：connect → initialize（带 acp-connection-id）→ session/resume(活跃会话)
     → 若 session/new：创建并缓存 sessionId
⑥ session/prompt {sessionId, prompt:[{type:'text', text}]} → SSE 订阅
⑦ 事件流处理：
   - agent_thought_chunk → 手机进度 💭（可选，节流）
   - tool_call → 手机进度 🔧（可选）
   - agent_message_chunk → 收集文本增量
   - id 匹配 result（stopReason:end_turn）→ 回合结束
⑧ 回复组装：收集文本(节流透传) → 补发剩余
⑨ 下发：WS {type:'send', apiKey, content, to:replyTarget}
     （2s 窗口收 error 帧→重试一次；无 ack 即成功）
⑩ 清理：DELETE ACP 连接；更新状态快照
```

### 3.3 断线重连（WS）
```
close/error → isConnected=false → _scheduleReconnect()
  延迟 = min(initial*2^attempt, 30s)，attempt 清零条件：auth_ok
auth_failed 且 message 含 "无效/为空/invalid" → _authBlocked=true 停止重连
```

### 3.4 心跳与假死检测
```
auth_ok 后立即 ping；此后 setInterval(15s) 发 ping
发 ping 时武装 10s 看门狗：超时未收 pong → 主动 close → 触发重连
pong 到达 → 撤看门狗
```

## 4. 关键技术决策

### TS-1 ACP 端点自动探测
```js
// 从 daemon.log 取最后出现的 acpEndpoint（实测可靠）
const s = fs.readFileSync('~/.workbuddy/logs/daemon.log', 'utf8');
const m = [...s.matchAll(/acpEndpoint=http:\/\/127\.0\.0\.1:(\d+)\/api\/v1\/acp/g)];
const port = m.length ? m[m.length-1][1] : 47185;   // 兜底默认
```

### TS-2 sessionId 解析优先级（防会话轮换失效）
```
① 显式 ACP_SESSION_ID/--session-id（部署者指定）
② 进程环境变量 CODEBUDDY_SESSION_ID / CLAUDE_SESSION_ID（引擎注入当前活跃桌面会话）
③ ACP session/new 动态创建 → 缓存 → 后续复用（首条消息时惰性创建）
```

### TS-3 回复文本获取策略（A/B 双通道）
**已实测结论（2026-09-03/04）**：
- resume 到活跃桌面会话后 prompt 由 daemon/UI 引擎执行 → ACP 侧可见
  `end_turn` 结果 + 完整活动（thought/tool_call/usage），但**实时文本分片依赖
  引擎回传形态**（当前 sidecar mainAgentSupport=false 时文本在 history 回放才有）
- 可靠路径：注入消息出现在桌面会话 → WorkBuddy 内通过 5G 通道 reply 回传

**连接器策略**：
```
回复 = tryAcpText（订阅流 text 增量，过滤 history）
     ⊕ tryChannelReply（连接器同时以 reply 通道接收 WorkBuddy 回复 → 转发 WS send）
```
- v1 先实现 ACP 注入 + 活动订阅 + end_turn 检测，回复以「end_turn 后的回执」
  或 reply 转发为准；文本稳定后自动收敛。

### TS-4 队列串行化
```
同一 replyTarget 的会话共用 1 个 ACP 连接槽位（prompt 进行中则排队），
避免同会话并发 prompt 造成上下文错乱；不同 replyTarget 可并行（多连接池，v2）。
```

### TS-5 兼容真实网关 + 模拟器双目标
```
MAAP_WS_URL 指向真实网关（默认）→ 真实收发
MAAP_WS_URL=ws://127.0.0.1:8066/ws → 对接配套模拟器（E2E 自测）
两者代码路径完全一致 → 模拟器验证过的逻辑可直接上真实网关
```

## 5. ACP 帧参考（已在 5g-acp-sim 全量实测）

```
① connect:  POST /api/v1/acp/connect  {} → {connectionId, sessionToken}
② 后续头:   X-CodeBuddy-Request:1 + acp-connection-id + Accept:application/json,text/event-stream
③ initialize:  {"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}
   → SSE event:message data:{"id":1,"result":{agentCapabilities:{mainAgentSupport:false},...}}
④ session/resume: {"method":"session/resume","params":{cwd, sessionId}}
⑤ session/prompt: {"method":"session/prompt","params":{sessionId, prompt:[{type:'text',text}]}}
   → 流式 session/update（session_info_update/agent_thought_chunk/tool_call/
     tool_call_update/usage_update/agent_message_chunk）→ 最终 id result{stopReason:'end_turn'}
```

## 6. MCP 协议（stdio，与 WorkBuddy 对接）

```jsonc
// initialize
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}
// → result: {capabilities:{tools:{}}, serverInfo:{name:"5g-msg-channel", version}}
// tools/list → [send_5g{to,text}, bridge_status{}]
// tools/call
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"send_5g",
 "arguments":{"to":"13800138000","text":"hi"}}}
```

## 7. 状态快照（bridge_status 返回）

```json
{
  "wsConnected": true,
  "wsMode": "cmicmaap-direct",
  "wsUrl": "wss://.../ws/msg",
  "acpPort": 38818,
  "sessionId": "d0bac45c-...",
  "sessionSource": "env|arg|new",
  "queueLength": 0,
  "activeTarget": null,
  "lastError": null,
  "dry": false,
  "uptimeSec": 1234
}
```

## 8. 测试策略

| 层 | 手段 |
|---|---|
| 单元 | mock WS 平台（本地 8066 模拟器）+ 断言帧序列 |
| 集成 | 模拟器发 text_message → 断言连接器注入 ACP + 回复 send 帧回平台 |
| E2E | 模拟器页面发消息 → 真实 WorkBuddy 回复 → 页面显示（闭环） |
| 回归 | BRIDGE_SELFTEST_TEXT 注入自检 + 断线重连演练 |
| 真实 | 条件允许时切 MAAP_WS_URL 到真实网关，白名单限定号码 |

## 9. 里程碑

| 阶段 | 内容 | 产出 |
|---|---|---|
| M1 | 模拟器 8066（WS+页面+上下行展示） | 可运行验证台 |
| M2 | 连接器骨架：config/logger/maap-client(复用协议) | WS 连通模拟器，收发帧可见 |
| M3 | acp-client 集成 + bridge 路由 | 消息→ACP→回复→页面 闭环 |
| M4 | MCP 接入 + guard + 文档 | WorkBuddy 可注册使用 |
| M5 | 真实网关联调（可选） | 生产可用 |
