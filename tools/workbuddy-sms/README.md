# WorkBuddy SMS Personal Agent MVP

这是调研《用短信操纵本地 WorkBuddy》的第 2 阶段本机桥接 MVP。公网短信接入层把手机号转换为脱敏 `senderId`，再通过带时间戳的 HMAC 请求把最小事件送到本机；本机桥只监听 `127.0.0.1`，调用 CodeBuddy 公开的 `/api/v1/runs` 与 SSE 接口，不访问 WorkBuddy 私有 RPC，也不转发模型原始思维链。

当前提供：

- 白名单、HMAC 验签、五分钟重放窗口、事件幂等和每小时限流；
- `STOP` / `退订` / `暂停服务` 在进入 Agent 前确定性处理；
- 固定 `senderId → conversationId` 映射和“新对话”命令；
- `accepted` 与最终摘要短信，默认最多 240 字；
- 本地 SQLite 事务保存幂等、速率、退订与任务状态，只记录脱敏 ID 和错误码，不保存短信正文；
- CodeBuddy REST Runs + SSE 适配器；
- mock Agent / mock 通道的无账号闭环、Twilio 直连出站适配器，以及 Cloudflare 中继主动轮询模式。

运营商直连、腾讯云/阿里云上行回调需要真实签约参数、审核后的消息模板与测试账号。MVP 没有伪造这些能力，也不允许把本地 HTTP 服务绑定到公网地址。

## 快速验证

需要 Node.js 22.12.x。

```bash
cd tools/workbuddy-sms
node src/cli.mjs init
export WORKBUDDY_SMS_RELAY_SECRET='replace-with-a-long-random-secret'
node src/cli.mjs doctor
node src/cli.mjs simulate '整理今天的待办'
npm test
```

示例配置默认使用 mock。`simulate` 会生成一次脱敏事件，依次产生“已收到”和“已完成”两条 mock 短信，并把状态写入 `var/workbuddy-sms.sqlite`。

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

桥接请求会带 `X-CodeBuddy-Request: 1` 和 Bearer Token。`agent.baseUrl` 只接受 `127.0.0.1`、`localhost` 或 `::1`。

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
