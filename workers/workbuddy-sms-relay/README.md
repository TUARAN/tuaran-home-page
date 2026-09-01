# WorkBuddy SMS Relay（国内 / 海外双路线）

单用户短信助理的薄云端中继。国内支持腾讯云短信和阿里云短信，海外保留 Twilio。它接收上行短信，将正文用 AES-256-GCM 加密后写入 D1；本机 `workbuddy-sms` 主动领取事件、执行 CodeBuddy，再通过已审核模板发送状态与最终摘要。Worker 不运行 Agent，不持有本机文件，也不把手机号传给 Agent。

国内版的下行短信严格使用签名和正文模板：腾讯云请求采用 TC3-HMAC-SHA256，阿里云请求采用 ACS3-HMAC-SHA256。桥接层不提供“任意号码 + 任意正文”接口，消息类型只能是任务接收、完成、失败、暂停和恢复。

## 创建与配置

```bash
pnpm dlx wrangler@4.126.0 d1 create workbuddy-sms-relay
```

把返回的数据库 ID 写入 `wrangler.jsonc`，随后配置 Secrets：

```bash
pnpm dlx wrangler@4.126.0 secret put DEVICE_TOKEN --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put QUEUE_ENCRYPTION_KEY --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put ALLOWED_FROM_SHA256 --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put SENDER_ALIAS --config workers/workbuddy-sms-relay/wrangler.jsonc
```

`QUEUE_ENCRYPTION_KEY` 是 32 字节随机值的 base64url 编码；`ALLOWED_FROM_SHA256` 是绑定手机号按 E.164 格式（国内示例 `+8613811112222`）计算的 SHA-256 base64url；`SENDER_ALIAS` 应为本机配置中的脱敏 ID。

## 腾讯云国内短信

在 `wrangler.jsonc` 的 `vars` 或部署环境中把 `SMS_PROVIDER` 设为 `tencent`，然后设置：

```bash
pnpm dlx wrangler@4.126.0 secret put DOMESTIC_TO --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TENCENT_WEBHOOK_TOKEN --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TENCENT_SECRET_ID --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TENCENT_SECRET_KEY --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TENCENT_SMS_SDK_APP_ID --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TENCENT_SIGN_NAME --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TENCENT_REGION --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TENCENT_TEMPLATE_MAP_JSON --config workers/workbuddy-sms-relay/wrangler.jsonc
```

`TENCENT_TEMPLATE_MAP_JSON` 把内部消息类型映射到已审核的模板 ID 和有序参数。参数只能引用 `taskId` 或 `text`：

```json
{
  "task-accepted": { "id": "123456", "params": ["taskId"] },
  "task-completed": { "id": "123457", "params": ["taskId", "text"] },
  "task-failed": { "id": "123458", "params": ["taskId"] },
  "service-paused": { "id": "123459", "params": [] },
  "service-resumed": { "id": "123460", "params": [] }
}
```

腾讯云回复回调地址：

```text
https://<中继域名>/webhooks/tencent/<TENCENT_WEBHOOK_TOKEN>/inbound
```

回调按腾讯云公开的 JSON 字段读取 `mobile`、`nationcode`、`text`、`time` 和 `extend`。路径令牌应至少 32 字节随机值，并避免出现在公开截图或普通访问日志中；泄露后立即轮换。

## 阿里云国内短信

把 `SMS_PROVIDER` 设为 `aliyun`，然后设置：

```bash
pnpm dlx wrangler@4.126.0 secret put DOMESTIC_TO --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put ALIYUN_WEBHOOK_TOKEN --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put ALIYUN_ACCESS_KEY_ID --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put ALIYUN_ACCESS_KEY_SECRET --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put ALIYUN_SIGN_NAME --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put ALIYUN_TEMPLATE_MAP_JSON --config workers/workbuddy-sms-relay/wrangler.jsonc
```

阿里云模板参数使用“模板变量名 → 内部字段名”：

```json
{
  "task-accepted": { "id": "SMS_123456", "params": { "task": "taskId" } },
  "task-completed": { "id": "SMS_123457", "params": { "task": "taskId", "summary": "text" } },
  "task-failed": { "id": "SMS_123458", "params": { "task": "taskId" } },
  "service-paused": { "id": "SMS_123459", "params": {} },
  "service-resumed": { "id": "SMS_123460", "params": {} }
}
```

阿里云 SmsUp HTTP 批量推送地址：

```text
https://<中继域名>/webhooks/aliyun/<ALIYUN_WEBHOOK_TOKEN>/inbound
```

中继接受官方 JSON Array 结构，使用 `sequence_id` 去重，回复 `{ "code": 0, "msg": "接收成功" }`。HTTP 非 200 时阿里云会按其规则重试。

## Twilio（海外）

把 `SMS_PROVIDER` 设为 `twilio`，并配置：

```bash
pnpm dlx wrangler@4.126.0 secret put TWILIO_ACCOUNT_SID --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TWILIO_AUTH_TOKEN --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TWILIO_FROM --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TWILIO_TO --config workers/workbuddy-sms-relay/wrangler.jsonc
pnpm dlx wrangler@4.126.0 secret put TWILIO_WEBHOOK_URL --config workers/workbuddy-sms-relay/wrangler.jsonc
```

Twilio 入站地址设置为 `https://<中继域名>/webhooks/twilio/inbound`，并把完全相同的 URL 保存到 `TWILIO_WEBHOOK_URL`；Twilio 签名包含完整 URL，二者不一致会返回 403。

迁移、测试、部署：

```bash
pnpm dlx wrangler@4.126.0 d1 migrations apply workbuddy-sms-relay --remote --config workers/workbuddy-sms-relay/wrangler.jsonc
node --test workers/workbuddy-sms-relay/tests/*.test.mjs
pnpm dlx wrangler@4.126.0 deploy --config workers/workbuddy-sms-relay/wrangler.jsonc
```

## 运营商直连边界

CMPP、SGIP、SMGP 需要运营商实际交付的协议版本、企业服务代码、网关地址、账号口令、网络白名单、长短信规则、流控窗口及 MO/REPORT 路由。Worker 不能建立这类长期 TCP 专线连接。正式直连应另建运行在企业网络内的 `CarrierGateway` 守护进程，并复用本项目的脱敏事件、加密队列、幂等、策略和本机 Agent 接口。

在没有真实交付参数和测试通道前，不应添加看似可用的 CMPP/SGIP/SMGP 默认配置。

队列正文默认 24 小时过期。本机确认处理后，Worker 会清空密文与 IV，只保留供应商、脱敏事件 ID、时间和处理结果；出站审计只保存正文 SHA-256、消息类型、任务 ID、供应商消息 ID 与状态。

本机执行 `workbuddy-sms doctor` 时会调用受设备令牌保护的 `/v1/doctor`。响应只给出各项绑定和五种模板是否存在，不返回 AccessKey、手机号、令牌、签名内容或模板正文。
