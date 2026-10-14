---
title: 两个网站接入邮箱、GitHub 和 Google 登录的实录
category: topics
topic_type: tech
tech_type: security_identity
subjects: [site_engineering]
content_type: engineering_case
date: 2026-10-14
tags: [Supabase, Resend, OAuth, 邮箱登录, GitHub, Google, Cloudflare, D1]
summary: 2aran 用 Supabase Auth 管理邮箱密码，沿用站内 GitHub、Google OAuth；博主联盟的三种登录方式由 Supabase Auth 承接。两个项目展示了新站点接入登录时需要核对的回调、发信与账号关联问题。
tldr: 新站点先确定一个身份源，再配置邮箱发信、GitHub 与 Google 回调，最后用真实账号验证登录和会话。2aran 的邮箱链路已通过生产实测；博主联盟的 Google 登录已从线上按钮回到工作台，并恢复原账号权限。
assistance: codex
review_ready: false
ad_eligible: false
pv: 0
---

2aran 和博主联盟都使用 Supabase，但账号边界不同。2aran 的邮箱密码交给独立的 Supabase Auth 项目，GitHub 和 Google 由网站自己的 OAuth 回调处理；三种身份最终写入 D1 的站内账号体系。博主联盟的邮箱、GitHub 和 Google 交给已有的 Supabase Auth 项目，业务角色保存在 `profiles`。两个 Supabase 项目彼此独立，用户需要分别注册。

## 两个站点当前怎样登录

| 站点 | 邮箱 | GitHub | Google | 站内身份与会话 |
|---|---|---|---|---|
| 2aran | 独立 Supabase Auth 验证邮箱密码；Resend SMTP 递送确认邮件 | 站内 OAuth 回调 | 站内 OAuth 回调 | D1 `site_users` 与 `account_identities`；网站签发 `tuaran_session` |
| 博主联盟 | 原有 Supabase Auth 邮箱登录 | Supabase OAuth，提供商已启用 | Web 客户端、Supabase 提供商和线上按钮已配置；Google 应用已正式发布 | Supabase Auth 会话；`profiles` 保存昵称与角色 |

2aran 的 Supabase 项目 ref 是 `xyslkdmevmddwzacrzvn`；博主联盟使用 `pmgpykadirszazskjdhr`。项目 ref 和 publishable key 可用于客户端初始化；服务角色密钥、SMTP 密码和 OAuth client secret 留在服务端或平台控制台。

2aran 的邮箱注册由 Cloudflare Edge API 调用 Supabase Auth。用户确认邮箱后，密码登录得到 Supabase 用户 ID；网站用 `account_identities(provider='supabase', provider_account_id=<用户 ID>)` 找到或建立站内账号，再签发七天有效的 Cookie。业务权限、评论和权益继续由 D1 决定。GitHub、Google 回调也使用这张身份关联表。相同邮箱不会自动把不同提供商的站内账号合并；已登录用户可以主动绑定另一种登录方式。

博主联盟的 Vue 前端调用 `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: 'https://blogger-alliance.cn/workspace' } })`。第三方先回到 Supabase 的 `/auth/v1/callback`，再由 Supabase 跳转到白名单中的 `/workspace`。邮箱与 OAuth 用户共用 Supabase 会话和 `profiles`，页面按 `profiles.role` 判断业务角色。[Supabase Google 登录指南](https://supabase.com/docs/guides/auth/social-login/auth-google)、[Supabase 回跳 URL 指南](https://supabase.com/docs/guides/auth/redirect-urls)

## 邮箱：身份验证与发信是两段服务

2aran 的 Resend 子域 `mail.2aran.com` 在控制台显示 Verified。Supabase 自定义 SMTP 已保存为发件人 `2aran <noreply@mail.2aran.com>`、主机 `smtp.resend.com`、端口 `465`、用户名 `resend`。SMTP 密码保存在 Supabase，不进入仓库。网站调用 Supabase 注册接口，Supabase 再通过 Resend 发出确认邮件；网站不直接向 Resend 发送这类邮件。[Supabase 自定义 SMTP](https://supabase.com/docs/guides/auth/auth-smtp)、[Resend SMTP](https://resend.com/docs/send-with-smtp)

2026 年 10 月 14 日，生产环境的临时邮箱注册返回 HTTP 200 和 `pendingConfirmation: true`；对应确认邮件送达 Gmail，发件人为 `noreply@mail.2aran.com`。点击确认链接后，页面显示“邮箱确认完成”；随后用该临时账号登录返回 HTTP 200 并签发 `tuaran_session`。携带会话请求 `/api/me` 返回同一邮箱，请求 `/api/account/identities` 显示 `supabase` 身份关联。这验证了注册、投递、确认、密码校验、站内会话与身份关联。此前一次生产注册返回 502，原因是网站把 Supabase Auth 注册响应误读为 `data.user.id`；该接口返回顶层用户 `id`，修复已随提交 `33289a4e` 推送到 `main`，重新注册成功。

旧 D1 邮箱账号表在切换前有 0 条记录。旧验证码与激活接口已返回 410；登录接口不再回退到旧 D1 密码校验。邮箱用户始终经过同一条 Supabase 验证链路。GitHub、Google 的站内 OAuth 身份照常保留。Supabase 用户被封禁或删除后，已经签发的网站 Cookie 不会立即失效；需要即时撤销时，要给站内会话增加失效校验。

## GitHub 与 Google：三个地址各有用途

为新站点接入 Supabase OAuth 时，先写清以下地址，再打开提供商控制台：

1. **站点源地址**，例如 `https://blogger-alliance.cn`。Google Web OAuth 客户端的 Authorized JavaScript origins 使用它。
2. **提供商回调地址**，例如 `https://pmgpykadirszazskjdhr.supabase.co/auth/v1/callback`。GitHub OAuth App 的 Authorization callback URL、Google 客户端的 Authorized redirect URI 使用它。
3. **登录后站内地址**，例如 `https://blogger-alliance.cn/workspace`。前端把它传给 Supabase 的 `redirectTo`，同时在 Supabase Redirect URLs 中逐项允许；生产环境优先使用明确 URL。

博主联盟的 Supabase 已启用 GitHub 与 Google 提供商。Google Cloud 的独立 `blogger-alliance` 项目已创建 Web OAuth 客户端，站点源地址和 Supabase 回调已填入客户端，凭据已保存到 Supabase。`https://blogger-alliance.cn/workspace` 已加入 Supabase Redirect URLs。Google 登录按钮及[隐私说明](https://blogger-alliance.cn/privacy)已部署，线上页面可访问。Google OAuth 应用已切换为**正式版**。退出原有站内会话后，从线上按钮选择站长 Google 账号，成功回到 `/workspace`；账号中心显示同一邮箱和管理员角色，刷新后会话保持。[GitHub OAuth App 文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)、[Google OpenID Connect 文档](https://developers.google.com/identity/openid-connect/openid-connect)、[Google OAuth 应用首页要求](https://support.google.com/cloud/answer/13807376)

## 新站点最快可复用的接入顺序

1. 建立独立 Supabase 项目，定好正式域名与 Site URL。把各环境的站内回跳地址逐项加入 Redirect URLs。
2. 先完成邮箱注册与确认。面向公开用户时配置已验证发信域名及自定义 SMTP，并用真实收件箱检查发件人、确认链接和密码登录。
3. 创建 GitHub OAuth App，回调指向 Supabase `/auth/v1/callback`，将 Client ID 和 Secret 写入 Supabase GitHub 提供商。
4. 创建 Google Cloud 项目，设置外部受众和应用信息，再创建 Web OAuth 客户端。配置站点源地址与同一个 Supabase 回调；将凭据写入 Supabase Google 提供商，并检查 Google 应用的发布状态。
5. 前端调用 `signInWithPassword`、`signUp` 与 `signInWithOAuth`，把登录后地址交给 `redirectTo`。站内角色从受保护的业务表读取，不能信任用户可修改的 `user_metadata`。
6. 按“注册 → 收信 → 确认 → 登录 → 回跳 → 查询用户与角色 → 退出”逐段验收。用另一提供商登录同一邮箱，核对是否回到预期账号；不要仅凭邮箱相同推断身份已安全合并。

2aran 的混合架构适合保留既有 D1 业务账号和会话的站点。新站点若没有这些历史约束，博主联盟的 Supabase Auth 路径需要维护的认证代码更少；仍应为业务权限建立受保护的资料表或策略。

## 来源与持续验证

资料截至 2026 年 10 月 14 日：本站 `lib/supabase/emailAuth.js`、`lib/auth/accountIdentities.js`、`app/api/auth/*` 与 [2aran 登录配置说明](https://github.com/TUARAN/tuaran-home-page/blob/main/docs/specs/supabase-email-auth.md)；博主联盟 `src/composables/useAuth.js`、`src/components/OAuthButtons.vue` 与 `docs/DEVELOPMENT.md`；两站生产控制台和临时邮箱注册记录。平台步骤参考 [Supabase Auth 文档](https://supabase.com/docs/guides/auth)、[Supabase Google 登录指南](https://supabase.com/docs/guides/auth/social-login/auth-google) 与 [Resend SMTP 文档](https://resend.com/docs/send-with-smtp)。

持续验证：2aran 的邮箱登录已完成单账号端到端实测，跨提供商绑定和即时撤销会话仍需单独验证；博主联盟已用站长账号验收 Google 回跳，其他账号的首次注册、权限默认值与跨提供商关联可在后续回归中覆盖。
