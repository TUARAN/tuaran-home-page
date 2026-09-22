# WorkBuddy SMS Personal Agent MVP

这是调研《用短信操纵本地 WorkBuddy》的第 2 阶段本机桥接 MVP。公网短信接入层把手机号转换为脱敏 `senderId`，再通过带时间戳的 HMAC 请求把最小事件送到本机；本机桥只监听 `127.0.0.1`，调用 CodeBuddy 公开的 `/api/v1/runs` 与 SSE 接口，不访问 WorkBuddy 私有 RPC，也不转发模型原始思维链。

当前提供：

- 默认真实通道 `fiveg`：本机 `5g-legacy-macos.sock` 的 `send_5g` / `bridge_status`，走已经认证的 cmicmaap WebSocket，不走短信模拟器；
- 官方 WorkBuddy 5G HTTP 回调目录：生产 `https://5gvas01.cmicmaap.com/gtw-ai/workbuddy/api`、测试 `https://cmic-maap-ums.cmmaap.com:5443/gtw-ai/workbuddy/api`、本机 `http://127.0.0.1:8080/workbuddy/api`；
- 本机 Clawbot / OpenClaw 网关探测：`http://127.0.0.1:18789`；
- 白名单、HMAC 验签、五分钟重放窗口、事件幂等和每小时限流；
- `STOP` / `退订` / `暂停服务` 在进入 Agent 前确定性处理；
- 固定 `senderId → conversationId` 映射和“新对话”命令；
- `accepted` 与最终摘要短信，默认最多 240 字；
- 本地 SQLite 事务保存幂等、速率、退订与任务状态，只记录脱敏 ID 和错误码，不保存短信正文；
- 可插拔 Agent：本机 WorkBuddy ACP、CodeBuddy REST Runs、官方硬件 ACP 桥接台、`mock`；
- 兼容通道：Twilio 出站、Cloudflare 中继轮询。`mock` 通道只留给单测。

短信端口只作为助理渠道入口。官方连接器不能在一个包里同时使用 MCP+Skill 和 CLI+Skill；融合发生在本机短信桥，而不是市场上架包。

## 三种后端

| `agent.mode` | 对应能力 | 会话落点 | 电脑关掉后 |
|---|---|---|---|
| `codebuddy` | MCP + CLI / CodeBuddy `/api/v1/runs` | 本机 CLI 会话 | 不可用 |
| `local-acp` | 本机 WorkBuddy ACP | 桌面当前或新建会话 | 不可用 |
| `workbuddy-acp` | 官方硬件 Open API + 云端任务 ACP | 云端 task | 可用 |
| `mock` | 本地闭环 | 无 | 可用 |

`node src/cli.mjs doctor` 会打印能力矩阵：短信作为入口是否可用、短信作为 MCP 工具是否可用（当前三条后端都是入口，不是工具）。

`node src/cli.mjs compare '请只回复 PING，不要调用工具。'` 用同一条短信对照三条后端；未启动的后端记为 skipped，不会把 MCP 和 CLI 合并成一个连接器。

把 `agent.mode` 设为 `workbuddy-acp` 前，先在 `tools/workbuddy-acp-bridge` 运行 `npm run probe`，并设置 `WORKBUDDY_BRIDGE_KEY`。当前登记配置下，`agent.bridgeBaseUrl` 是 `http://127.0.0.1:8080`；它与短信回调不能并行占用 8080，只能分阶段测试或由本机反向代理按方法分流。

公开产品页在真实 OAuth 烟测通过前保持“模拟 / 企业内部联调”，不要把它改成已上线硬件。

## 真实 5G 短信

默认 `channel.provider` 为 `fiveg`，`agent.mode` 为 `local-acp`。出站走本机已经连上的 5G daemon（`~/.workbuddy/5g-legacy-macos.sock` → `wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg`）。入站走官方 WorkBuddy 回调：

```bash
export MAAP_API_KEY_FILE="$HOME/.workbuddy/5g-macos-key"
# 可选：把脱敏 senderId 映射到 5G 下发目标
export WORKBUDDY_SMS_SENDER_MAP='{"self-demo":"平台userId"}'
node src/cli.mjs doctor
node src/cli.mjs start
```

`start` 只绑定 `127.0.0.1:8080/workbuddy/api`，用 `X-API-Key` 校验，不监听 `0.0.0.0`。生产 / 测试 HTTP 基址只做可达性探测，真实下发仍走已认证的本机 Unix socket，避免在未核对的 HTTP 合同上误发。Clawbot 端口默认 `127.0.0.1:18789`，未启动时 doctor 记为未在听，不替代 5G 通道。

运营商直连、腾讯云/阿里云上行回调需要真实签约参数、审核后的消息模板与测试账号。MVP 没有伪造这些能力，也不允许把本地 HTTP 服务绑定到公网地址。

## 验证手册

先分清链路。一次只测一条，不要把模拟器、本机回调和手机直发混在同一次操作里。

| 编号 | 链路 | 入站 | 出站 | 电脑关掉后 | 当前默认 |
|---|---|---|---|---|---|
| A | 5G daemon | 手机 → 运营商 MaaP WebSocket | `send_5g` 真下发 | 不可用 | 当前已停；恢复后以 `bridge_status` 为准 |
| B | `workbuddy-sms` 本地回调 | `POST 127.0.0.1:8080/workbuddy/api` | 同一条 `send_5g` | 不可用 | 要 `start` 才听；不能与 ACP OAuth 回调同时占 8080 |
| C | 官方 HTTP 基址 | 生产 / 测试 `/gtw-ai/workbuddy/api` | **不下发**，只做 GET 探测 | 与本机无关 | 生产主机可达，测试 TLS 不通 |
| D | 三种 Agent 后端 | 同一条短信文本 | 不经过 5G（`compare` 不发短信） | CLI / 本机 ACP 不可用；官方云端 ACP 可用 | 未启动的后端记 skipped |
| E | Clawbot / OpenClaw | `127.0.0.1:18789` | 不替代 5G | 网关没开就没有 | 当前常未在听 |
| F | ACP 桥接台模拟器 | 浏览器 Mock 硬件 | 不是真短信 | 可用 | **不要当 5G 验证** |

`fiveg` 模式下 `simulate`、回调 `POST` 成功处理一条业务消息，都会真实调用 `send_5g`，通常先发「已收到」、再发「已完成」，**一次两条真短信**。零下发验证只做 0–2；真手机验证做 3；本机 HTTP 真闭环做 4。

### 能力边界（所有链路共用）

| 能力 | 有 | 没有 |
|---|---|---|
| 短信作为助理入口 | 有 | 短信不是 MCP 工具，`smsAsTool` 恒为 false |
| 官方连接器包 | MCP+Skill 与 CLI+Skill 分家 | 不会把两种打进同一个上架包 |
| 本机监听 | 只绑 `127.0.0.1` / `::1` | 不绑 `0.0.0.0`，不把 8080/8789 映射公网 |
| 白名单 | `allowedSenders` 为空则 doctor 失败；未绑定 sender 返回 403 | 不向任意号码回复 |
| 退订 | `STOP` / `TD` / `退订` / `暂停服务` 在进 Agent 前处理 | 退订后普通消息返回 423，直到「恢复服务」 |
| 限流 / 幂等 | 每小时上限；相同 `eventId` 不重跑 | 不把短信正文写入 SQLite |
| 下发长度 | 默认最多 240 字 | Agent 思维链不回传到手机 |
| 生产 / 测试 HTTP | GET 探测可达性 | **不**用未核对的 HTTP 合同真下发；真下发走 Unix socket |
| 公开产品页 | 保持「模拟 / 企业内部联调」 | 真实 OAuth 烟测通过前，不写成已上线硬件 |
| Client Secret | 只留本机 `.env` | 不进 git、网页、短信 |

单测已经覆盖的边界（不发真短信）：白名单 403、限流 429、STOP/恢复、幂等、失败摘要不泄漏路径、回调缺 `X-API-Key` 返回 401、`ping` 控制帧忽略、禁止 `callbackHost=0.0.0.0`。

```bash
cd tools/workbuddy-sms
npm test
```

应看到 28 项通过。

### 0. 配置（只做一次）

```bash
cd tools/workbuddy-sms
node src/cli.mjs init
```

编辑 `workbuddy-sms.config.json`：

1. `policy.allowedSenders` 填本机 `~/.workbuddy/mcp.json` 里 `5g-msg-channel-legacy-macos` 的 `ALLOWED_SENDERS`（平台 userId 或已在白名单的号码，不要新造 `self-demo` 当真号码）。
2. 需要把脱敏 ID 映射到下发目标时，用环境变量，不要把密钥写进仓库：

```bash
export MAAP_API_KEY_FILE="$HOME/.workbuddy/5g-macos-key"
export WORKBUDDY_SMS_SENDER_MAP='{"<senderId>":"<5G下发目标>"}'
```

`senderMap` 的值必须已经在 5G daemon 白名单里，否则 `send_5g` 会被 daemon 拒绝。

### 1. 零下发：通道是否真实在线

```bash
cd tools/workbuddy-sms
node src/cli.mjs doctor
```

| 字段 | 通过标准 | 失败含义 |
|---|---|---|
| `checks.channel.ok` | `true`，且 `simulator: false` | 不是真 5G |
| `checks.channel.socket.wsAuthed` | `true` | MaaP WebSocket 未认证 |
| `checks.channel.socket.dry` | `false` | daemon 还在空发模式 |
| `checks.callbackKey.ok` | `true` | 找不到 `5g-macos-key` |
| `checks.allowedSender.ok` | `true` | 还没填白名单，**整体 doctor 会失败** |
| `checks.agent.ok` | `true`，`mode: local-acp` | WorkBuddy 没开，或 ACP 端口漂了（doctor 会重探） |
| `channel.http[production].reachable` | `true`（状态可以是 404） | 生产 HTTP 主机不可达 |
| `channel.http[test]` | 现在允许失败 | 测试环境 TLS 不通，不阻塞真 5G |
| `channel.clawbot.listening` | 开了才是 `true` | 18789 没开，不替代 5G |
| `channel.http[local].serviceMatch` | `true` | 必须识别为 `workbuddy-5g-callback`；仅 `reachable=true` 不算通过，可能是 ACP OAuth 占着 8080 |

对照 daemon 本身：

```bash
cd tools/5g-msg-channel-legacy-macos
npm run channel:status
```

`bridge_status` 里 `wsAuthed=true`、`dry=false`、`runtimeReady=true` 才算真通道。这一步**不会发短信**。

### 2. 零下发：本地回调边界

另开终端：

```bash
cd tools/workbuddy-sms
export MAAP_API_KEY_FILE="$HOME/.workbuddy/5g-macos-key"
node src/cli.mjs start
```

应打印 `listening: http://127.0.0.1:8080/workbuddy/api`，`simulator: false`。不要对 `0.0.0.0` 做端口转发。

如果 8080 正由 ACP 桥接台用于 `http://localhost:8080/workbuddy/api` 的 OAuth 回调，短信服务会报 `EADDRINUSE`。两条链路需要分阶段测试：先完成 OAuth / Open API probe，再停桥接台并启动短信回调；或者增加一个明确的本机反向代理做 GET（OAuth）与 POST（5G）分流。不能把另一个服务返回的 HTTP 200 当作短信回调就绪。

```bash
# 健康检查，不下发
curl -sS http://127.0.0.1:8080/workbuddy/api

# 缺 Key → 401，不下发
curl -sS -D - -o /tmp/wb5g.body -X POST http://127.0.0.1:8080/workbuddy/api \
  -H 'Content-Type: application/json' \
  -d '{"type":"text_message","from":"nobody","content":"ping","id":"evt-unauth"}'
# 期望 HTTP 401

# 控制帧 → 202 ignored，不下发
curl -sS -X POST http://127.0.0.1:8080/workbuddy/api \
  -H "X-API-Key: $(cat "$HOME/.workbuddy/5g-macos-key")" \
  -H 'Content-Type: application/json' \
  -d '{"type":"ping"}'
```

再跑一次 `doctor`，此时 `channel.http[local].serviceMatch` 和 `channel.localCallback.ready` 都应为 `true`。

### 3. 真手机：只测链路 A（推荐先做）

WorkBuddy 桌面保持登录。**不要**同时用链路 B 处理同一条上行，否则可能双回复。

1. 用白名单手机发一条无副作用短句，例如：`请只回复 PING，不要调用工具。`
2. 看 daemon 日志是否出现 `received` → `session/prompt` 或 `ws_sent`。
3. 手机应收到模型回复（这是 daemon 自己回的，不经过 `workbuddy-sms start`）。
4. 用未绑定号码发同样内容：应无回复。

能证明：运营商 WebSocket 入站、白名单、本机 ACP、`send_5g` 出站。

不能证明：`/workbuddy/api` HTTP 回调、官方云端任务、Clawbot 18789、公开产品页已上线。

### 4. 真短信：只测链路 B（会发两条）

确认 `WORKBUDDY_SMS_SENDER_MAP` 指向白名单目标，`start` 仍在跑。把 `<senderId>` 换成配置里的 ID，`<eventId>` 每次换新的：

```bash
curl -sS -X POST http://127.0.0.1:8080/workbuddy/api \
  -H "X-API-Key: $(cat "$HOME/.workbuddy/5g-macos-key")" \
  -H 'Content-Type: application/json' \
  -d '{"type":"text_message","from":"<senderId>","content":"请只回复 PING，不要调用工具。","id":"<eventId>"}'
```

| 期望 | 含义 |
|---|---|
| HTTP 200，`ok: true` | 回调验签通过，Agent 跑完 |
| 手机先到「任务 … 已收到」，再到「已完成：PING…」 | 真 `send_5g` 闭环 |
| 同 `id` 再 POST 一次，`duplicate: true` | 幂等，不应再发两条 |
| `from` 换成未绑定 ID，HTTP 403 | 白名单 |
| 正文 `STOP`，再发普通消息得到 423 | 退订边界 |

不要对生产 / 测试 URL 做同样的 POST：那两条基址只用于探测，当前实现不会把它们当成下发接口。

### 5. 三种 Agent 后端（不发 5G）

```bash
cd tools/workbuddy-sms
node src/cli.mjs compare '请只回复 PING，不要调用工具。'
```

| `id` | 通过长什么样 | 跳过长什么样 | 能力边界 |
|---|---|---|---|
| `codebuddy-cli` | 本机 CodeBuddy `/api/v1/runs` 有可见文本 | `skipped`（没开 CLI） | 不进桌面聊天；电脑关了不可用 |
| `local-acp` | 本机 WorkBuddy 会话多出 turn | `skipped`（桌面没开） | 进桌面聊天；电脑关了不可用 |
| `official-acp` | 桥接台云端 task 有结果 | `skipped`（没 `WORKBUDDY_BRIDGE_KEY` / 未 OAuth） | 不进本机桌面；电脑关了仍可能可用 |

三条都应出现在 `results` 里。`connectorFusion.allowed` 必须是 `false`。不要为了让 CLI 和本机 ACP 都变绿，去改连接器包把 MCP 和 CLI 捆在一起。

官方硬件 ACP 另做烟测（仍不是 5G 通道）：

```bash
cd tools/workbuddy-acp-bridge
npm test
npm run doctor
npm run probe
```

`probe` 的 mock 模式只写脱敏 `var/capability-probe.json`。`real` 模式需要已经完成 OAuth。通过前不要改公开页 https://2aran.com/tools/workbuddy-acp-bridge 的「模拟 / 企业内部联调」表述。

### 6. Clawbot 端口

```bash
curl -sS -m 2 http://127.0.0.1:18789/health || true
```

| 结果 | 含义 |
|---|---|
| 连通（哪怕 401） | 本机 OpenClaw 网关在听，doctor 的 `clawbot.listening` 应为 true |
| `ECONNREFUSED` | 没开。5G 仍以 MaaP WebSocket 为准，不要用 18789 代替链路 A |

要验证 Clawbot 新消息，先按你原来的本机 OpenClaw 方式把网关拉起来，再重复 doctor，不要改 5G socket。

### 不通过时先看哪

| 现象 | 先查 |
|---|---|
| doctor `channel.ok=false` | launchd `com.tuaran.5g-msg-channel-legacy-macos`、Key 文件权限 0600、`channel:status` |
| 手机发了没回复 | 号码是否在 daemon `ALLOWED_SENDERS`；WorkBuddy 是否登录；ACP 端口是否还活着 |
| 回调 401 | `X-API-Key` 是否等于 `5g-macos-key` |
| 回调 200 但手机没短信 | `senderMap` 是否指向白名单目标；daemon `dry` 是否仍为 true |
| `simulate` 发出去了 | 这是真下发，不是模拟器；以后零下发请只用 doctor / GET / 401 / ping |
| 公开页仍写「模拟」 | 预期行为，官方 OAuth probe 通过前不要改 |

## 接入 CodeBuddy

启动仅监听本机的 CodeBuddy HTTP API：

```bash
codebuddy --serve --port 8080 --session-id personal-sms
```

把配置中的 `agent.mode` 改为 `codebuddy`，再把 CodeBuddy 启动时生成的密码放到环境变量：

```bash
export CODEBUDDY_API_TOKEN='your-local-codebuddy-password'
node src/cli.mjs doctor
```

桥接请求会带 `X-CodeBuddy-Request: 1` 和 Bearer Token。把 `agent.mode` 设为 `codebuddy`，并保证 `agent.baseUrl` 指向 CodeBuddy。`agent.baseUrl` 只接受 `127.0.0.1`、`localhost` 或 `::1`。默认真实短信路径用本机 ACP，8080 留给 `/workbuddy/api` 回调。

## 启动本机入口

```bash
export WORKBUDDY_SMS_RELAY_SECRET='replace-with-a-long-random-secret'
node src/cli.mjs start
```

入口为 `POST http://127.0.0.1:8789/v1/events`。请求必须包含：

- `X-WorkBuddy-Timestamp`：Unix 毫秒时间戳；
- `X-WorkBuddy-Signature`：`HMAC-SHA256(secret, timestamp + "." + rawBody)` 的十六进制值；
- JSON 正文：`eventId`、脱敏 `senderId`、`text`，可选 `receivedAt`。

正式环境由用户控制的中继通过出站隧道或本机主动领取方式投递，不能将 8789 或 CodeBuddy 8080 端口映射到公网。

推荐使用仓库中的 `workers/workbuddy-sms-relay`。部署中继后把配置改为：

```json
{
  "channel": {
    "provider": "relay",
    "relayBaseUrl": "https://sms.example.com",
    "pollIntervalMs": 2000
  }
}
```

再设置设备令牌并启动：

```bash
export WORKBUDDY_SMS_DEVICE_TOKEN='same-value-as-worker-device-token'
node src/cli.mjs start
```

此模式不监听本机端口，只由电脑主动发起 HTTPS 请求领取事件；处理完成后确认回执，中继随即清空密文正文。

中继的 `SMS_PROVIDER` 可设为 `tencent`、`aliyun` 或 `twilio`。国内腾讯云/阿里云必须先申请企业资质、完成签名实名报备并取得审核通过的正文模板；具体 Secrets、模板映射与上行回调地址见 [国内中继说明](../../workers/workbuddy-sms-relay/README.md)。本机 CLI 不接触云厂商 AccessKey，也不会让 Agent 自由选择模板或接收号码。

## Twilio 出站

配置 `channel.provider` 为 `twilio`，并填写 `channel.from`。凭证只从环境变量读取：

```bash
export TWILIO_ACCOUNT_SID='...'
export TWILIO_AUTH_TOKEN='...'
export TWILIO_TO='+1...'
```

手机号和 Auth Token 不进入配置文件、Agent 提示词或状态文件。入站短信仍应由经过 Twilio `X-Twilio-Signature` 验证的公网中继转换为脱敏事件；该中继不属于本机 MVP。

## 测试

```bash
node --experimental-sqlite --test tools/workbuddy-sms/tests/*.test.mjs
```

测试覆盖签名与重放窗口、Unicode 摘要、退订、白名单、限流、幂等、失败记录、CodeBuddy Gateway Protocol 请求和 SSE 结果读取。
