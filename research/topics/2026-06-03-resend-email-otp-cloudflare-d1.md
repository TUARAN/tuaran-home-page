---
title: Resend + Cloudflare D1 做邮件 OTP：可核对的工程路径
category: topics
topic_type: tech
tech_type: web_cloud
content_type: engineering_case
date: 2026-06-03
updated: 2026-11-04
tags: [Resend, Cloudflare D1, OTP, 邮件验证, Domain Connect, Workers]
summary: 用现行 Resend 发信 API 与 Cloudflare Domain Connect 文档，整理「域名验证 → 发 OTP → D1 存挑战」的可核对路径；SyncBlog 个案数字标为个案，不作通用 SLA。
tldr: Resend 负责投递与域名；D1 存 OTP 哈希与过期；Workers 做签发与校验。Free 发信额度有日/月双限。未在现行文档出现的内部迭代次数一律不写死。
subjects: [web_cloud]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **分工清晰**：Resend 发信与域名声誉；Cloudflare DNS / Domain Connect 协助域名接入；D1 存 OTP 挑战（哈希、过期、尝试次数）；Worker 签发与校验。
2. **现行 Resend 发信面**：`POST` 发信 API 需要 `from` / `to` / `subject`，正文用 `html` 或 `text`（或模板）；支持 `Idempotency-Key`。[Send Email](https://resend.com/docs/api-reference/emails/send-email)
3. **域名**：Resend 文档提供与 Cloudflare 的 **Domain Connect** 一键路径，也可手动加 DNS 记录。[Resend × Cloudflare](https://resend.com/docs/knowledge-base/how-to-add-cloudflare-domain-to-resend)
4. **额度结构（公开定价检索，2026-11-04）**：Free 档常见口径为每月约 **3,000** 封、每天约 **100** 封；付费按计划升高。采购前打开 [resend.com/pricing](https://resend.com/pricing) 复核。
5. **个案与通论分开**：SyncBlog 等本站相关实践可说明「能跑通」；具体迭代次数、送达率、某次排障耗时若无公开日志，本稿不下硬数字。

## 二、事实层

### 2.1 Resend：域名与发信

- 自定义域名需通过 Resend 控制台完成 DNS 验证（SPF/DKIM 等记录以控制台当日提示为准）。
- Cloudflare 用户可走 Domain Connect：在 Resend 选 Cloudflare → 跳转授权 → 自动写记录；失败则回退手动记录。[文档](https://resend.com/docs/knowledge-base/how-to-add-cloudflare-domain-to-resend)
- 发信最小字段见官方 API：`from`、`to`、`subject` + 正文；SDK 示例以 `resend.emails.send({...})` 为主。[API](https://resend.com/docs/api-reference/emails/send-email)
- 幂等：请求头 `Idempotency-Key`（最长 256，24 小时窗口）用于防重复发送。

### 2.2 D1：OTP 挑战存储（工程约定，非厂商 OTP 产品）

D1 **没有**「OTP 专用 API」。常见自建表字段（可按项目裁剪）：

| 字段 | 用途 |
|---|---|
| `email` 或 `user_id` | 主体 |
| `code_hash` | 只存哈希，不存明文码 |
| `expires_at` | 短过期（如 5–15 分钟，由产品定） |
| `attempts` | 防爆破 |
| `created_at` / `consumed_at` | 审计与一次性消费 |

读写走 Worker 的 D1 binding；注意 Free 档日写上限（见 D1 Limits）。OTP 流量通常远低于写上限，但仍应避免「每次按键写库」。

### 2.3 Worker 校验路径（逻辑层）

1. 用户请求 OTP → Worker 生成随机码 → 哈希写入 D1 → 调用 Resend 发信（正文只含短码或魔术链接）。
2. 用户提交码 → Worker 查未消费且未过期行 → 常数时间比较哈希 → 标记 `consumed_at`。
3. 失败：attempts 递增；超限锁定至过期。

密钥：Resend API Key 放 Workers Secrets，不进仓库。

## 三、结构：什么时候用这条栈

| 适合 | 不适合（另选） |
|---|---|
| 已在 Cloudflare 上跑站 / API，只要「邮件验证码」 | 要完整用户体系、社交登录、会话产品化 → 看 Auth 平台 |
| 发信量在 Resend Free/入门档可覆盖 | 营销大促、事务邮件海量 → 先算日/月双限与声誉 |
| 验证状态与业务表同区、希望少一个 BaaS | 需要邮件分析、模板市场、多品牌复杂投递策略 → 加重型 ESP |

与「Supabase Auth 发信」对比：本栈自己管 OTP 状态机；换来的是供应商更少、自己承担安全细节（哈希、限流、时钟）。

## 四、外部研判

邮件 OTP 的难点很少在「调用发信 API」，而在域名声誉、退信、用户收件箱分类，以及挑战存储是否被枚举。Resend + Cloudflare DNS 降低的是**接入摩擦**；D1 降低的是**状态与边缘计算同区**的运维面。把个案博客的排障故事写成「标准工期」会误导读者——可复用的是字段与职责划分，不是某次上线花了几轮。

## 五、信息来源与持续验证

复核截至 **2026-11-04（Asia/Shanghai）**。

- [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email)
- [Add Cloudflare domain to Resend](https://resend.com/docs/knowledge-base/how-to-add-cloudflare-domain-to-resend)
- [Resend Pricing](https://resend.com/pricing)（额度以打开当日为准）
- [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

### 持续验证

- Free 日/月封数若定价页改版，更新第二节额度句，勿沿用本稿约数。
- Domain Connect 按钮文案与必填 DNS 记录以 Resend 控制台为准；文档与 UI 不一致时信控制台。
- 旧稿若写过具体「迭代 N 次」「送达率 X%」且无公开原始日志，已从本版删除；有日志再补进事实层。
