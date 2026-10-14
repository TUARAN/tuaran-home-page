---
title: 2aran 邮箱登录接入现状：Supabase Auth、Resend 与 D1 怎样协作
category: topics
topic_type: tech
tech_type: security_identity
subjects: [site_engineering]
content_type: engineering_case
date: 2026-10-14
tags: [2aran, Supabase, Resend, 邮箱登录, SMTP, Cloudflare, D1, 身份关联]
summary: 2aran 已建独立 Supabase 项目并配置 Resend SMTP；邮箱注册与登录代码已进入主分支，仓库中的切换开关仍关闭。用户身份验证、邮件投递和站内账号分别由 Supabase、Resend、D1 承担。
tldr: 新链路由 Supabase Auth 验证邮箱密码、Resend 发送确认邮件，D1 继续管理站内账号与业务数据。旧链路仍由 D1 校验密码、网站直接调用 Resend API 发送验证码。当前配置和代码已就位，真实收信与完整登录流程尚待验证；仓库默认配置尚未启用新链路。
assistance: codex
review_ready: false
ad_eligible: false
pv: 0
---

2aran 的邮箱登录正在从站内自管认证过渡到独立的 Supabase Auth 项目。截至 2026 年 10 月 14 日，新项目运行正常，Resend 发信域名通过验证，Supabase 的自定义 SMTP 已保存；网站代码也已推送到 `main`。仓库没有把控制新链路的 `SUPABASE_EMAIL_AUTH_ENABLED` 设为 `true`；公开站的部署变量及页面行为尚未独立复核。邮件配置完成和用户实际收到确认邮件，仍是两项不同的验证结果。

## 一、三个系统各管什么

| 组件 | 当前职责 | 保存或处理的关键内容 |
|---|---|---|
| Supabase Auth | 新邮箱账号的注册、密码校验、邮箱确认 | 独立项目中的认证用户与 Supabase 用户 ID |
| Resend | 递送邮件 | 旧链路接收网站的 Email API 请求；新链路接收 Supabase 的 SMTP 请求 |
| Cloudflare D1 与站内会话 | 保存站内账号、身份关联、权限及业务数据，并签发网站 Cookie | `email_users`、`account_identities`、`site_users` 等站内记录 |

Supabase 项目名为 `2aran`，位于 `blogger-alliance` 组织的东京区域。它与该组织内原有项目分开建号，账号池独立。2026 年 10 月 14 日读取到的项目状态为 `ACTIVE_HEALTHY`。网站在 `wrangler.toml` 配置了项目 URL 和 publishable key；新邮箱流程由服务端调用 Auth 接口，仓库没有存放 Supabase secret/service role key，也没有为此建立新的公开业务表。

Resend 的 `mail.2aran.com` 发信子域已在控制台显示 Verified。Cloudflare DNS 配有 DKIM TXT，以及 `rsend.mail`、`send.mail` 两条仅 DNS 的 CNAME。Supabase 自定义 SMTP 已启用，发件人是 `2aran <noreply@mail.2aran.com>`，主机为 `smtp.resend.com`，端口 `465`，用户名 `resend`。密码在控制台显示为已存储且不可回读；设置保存后，刷新页面仍显示上述非密钥字段。Resend 官方文档确认 SMTP 的密码使用 API key，端口 465 使用隐式 TLS。密钥的实际值及其权限范围没有从控制台重新读取，不能据此声称已核实域名限制。[Resend SMTP 文档](https://resend.com/docs/send-with-smtp)、[Resend 域名文档](https://resend.com/docs/dashboard/domains/introduction)

## 二、两条邮件链路

目前仓库保留两条路径，它们使用同一家发信服务，但邮件由不同系统发起。图中的“开关关闭／开启”描述注册页面和登录接口的选择逻辑。

```text
旧链路（开关关闭时由注册页面使用）
浏览器 → 2aran 邮箱注册 / 验证码接口 → Cloudflare Edge API
       → D1 存验证码哈希与邮箱账号 → Resend Email API → 收件箱
       → 网站验证密码并签发 tuaran_session

新链路（开关开启后）
浏览器 → 2aran 注册接口 → Supabase Auth 建立待确认邮箱账号
       → Supabase 通过 Resend SMTP 发送确认邮件 → 收件箱
       → 用户确认邮箱并用密码登录 → 站内关联 Supabase 用户 ID
       → 网站签发 tuaran_session；业务数据继续留在 D1
```

旧链路的 `lib/auth/emailAuth.js` 直接调用 `https://api.resend.com/emails`，依靠网站自己的 `RESEND_API_KEY` 和 `EMAIL_FROM` 发送 6 位验证码，验证码哈希写入 D1。新链路的 `lib/supabase/emailAuth.js` 调用 Supabase Auth 的注册与密码登录接口；确认邮件模板和投递由 Supabase 触发，Resend 提供 SMTP 通道。旧验证码接口目前没有随新开关关闭，切换后仍须评估它是否继续开放及相应发信额度。Supabase 官方文档说明，其默认发信服务只允许给项目团队成员地址发邮件；面向公开用户的确认邮件需要自定义 SMTP。[Supabase 自定义 SMTP 文档](https://supabase.com/docs/guides/auth/auth-smtp)

这次接入没有把所有登录方式迁到 Supabase。GitHub、Google 等入口及网站现有的签名 Cookie 机制仍按原有路径运行。新邮箱账号在 Supabase 验证成功后，站内通过 `account_identities` 将 Supabase 用户 ID 关联到 D1 账号；业务权限继续由网站判断。Supabase 的 `user_metadata` 只用于展示昵称，不承担站内授权判断。

## 三、旧账号怎样过渡

旧邮箱账号留在 D1。新链路启用后，旧用户可以先用原密码进入站内账号，再用同一邮箱注册并确认 Supabase 账号，最后在账号中心验证新邮箱密码并绑定。此后用新链路登录应回到原站内账号与原有数据。

代码在 Supabase 身份首次登录时检查该邮箱是否已有 D1 邮箱账号；若有且尚未绑定，会返回 `LEGACY_ACCOUNT_LINK_REQUIRED`，避免仅凭相同邮箱另建一个站内账号。站内保留原密码登录入口供迁移使用。这个流程已进入代码，尚未完成真实旧账号的端到端验证。

## 四、启用状态与下一步

| 环节 | 2026 年 10 月 14 日状态 |
|---|---|
| 独立 Supabase 项目与邮箱确认配置 | 项目健康；邮箱注册、确认和回跳地址已配置 |
| Resend 发信子域与 Supabase SMTP | 域名 Verified；SMTP 已保存并刷新复核非密钥字段 |
| 网站接入代码 | 已推送到 `main`，提交 `1b2e9360`；7 项相关测试与推送前检查通过 |
| 公开站切换 | 仓库未启用 `SUPABASE_EMAIL_AUTH_ENABLED`；部署变量与公开页面行为尚未独立复核 |
| 真实邮件与登录验证 | 仍需用可收信邮箱完成注册、确认、登录、退出、账号绑定与旧账号回归 |

上线判断要看完整链路：确认邮件送达、确认链接返回正确页面、已确认账号能够登录、旧账号绑定后回到原站内身份。还应在 Resend 邮件记录和 Supabase Auth 日志中核对失败原因。完整 Cloudflare 构建曾因依赖镜像站 DNS 解析失败而中断，因此不能把本地单元测试当作部署验证。

当前实现还有一处明确边界：Supabase 验证成功后，网站签发的 `tuaran_session` 有效期为 7 天。若之后仅在 Supabase 端重置密码、封禁或删除用户，已签发的网站 Cookie 不会立即失效。需要即时撤销时，站内会话机制也要增加失效校验。

## 资料与核对记录

- 本站代码：`lib/supabase/emailAuth.js`、`app/api/auth/register/route.js`、`app/api/auth/login/route.js`、`lib/auth/accountIdentities.js`、`lib/auth/emailAuth.js` 与 `wrangler.toml`，版本见 [提交 `1b2e9360`](https://github.com/TUARAN/tuaran-home-page/commit/1b2e93602e3ffcd3ecd16fabaa7de60883d3c88d)。
- 本站配置记录：[2aran 独立 Supabase 邮箱登录](https://github.com/TUARAN/tuaran-home-page/blob/1b2e93602e3ffcd3ecd16fabaa7de60883d3c88d/docs/specs/supabase-email-auth.md)。项目健康状态与 SMTP 非密钥字段于 2026 年 10 月 14 日复核。
- [Supabase 自定义 SMTP 文档](https://supabase.com/docs/guides/auth/auth-smtp)、[Supabase 邮箱密码认证文档](https://supabase.com/docs/guides/auth/passwords)、[Resend SMTP 文档](https://resend.com/docs/send-with-smtp)、[Resend 已验证域名文档](https://resend.com/docs/dashboard/domains/introduction)，查阅于 2026 年 10 月 14 日。
