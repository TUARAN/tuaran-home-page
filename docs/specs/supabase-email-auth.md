# 2aran 独立 Supabase 邮箱登录

2aran 使用独立 Supabase 项目的 Auth 邮箱密码服务。站内账号、会话、权限和业务数据仍保存在 Cloudflare D1。Supabase 用户 ID 通过 `account_identities` 的 `supabase` 身份关联站内账号，不按邮箱自动合并账号。

## 启用条件

1. `blogger-alliance` 组织内已创建独立的 `2aran` Supabase 项目，区域为东京。
2. Auth 已启用邮箱密码与邮件确认，最短密码为 8 位。Site URL 为 `https://2aran.com`，允许的 Redirect URL 包含 `https://2aran.com/login?emailConfirmed=1`。
3. Resend 专用发送域名 `mail.2aran.com` 已标记为 Verified；Cloudflare 已配置 DKIM TXT、`rsend.mail` 和 `send.mail` 两条仅 DNS 的 CNAME。Supabase 自定义 SMTP 已启用，发送人 `2aran <noreply@mail.2aran.com>`、主机 `smtp.resend.com`、端口 `465`、用户名 `resend` 和密码已保存；2026-10-14 刷新页面后已复核非密钥字段。API key 不写入仓库或聊天。
4. `wrangler.toml` 已配置独立项目 `xyslkdmevmddwzacrzvn` 的 `SUPABASE_URL` 和 publishable key。只使用 publishable key，不配置 service role/secret key 到网页。
5. 新项目和邮件流程实测通过后，把 `SUPABASE_EMAIL_AUTH_ENABLED` 设为 `true`；本地开发可用 `.env.local` 设置同名变量。开关关闭时，原有 D1 邮箱登录继续工作。
6. 以新邮箱验证注册、确认、登录、退出和站内账号关联；再以旧邮箱验证旧密码登录、Supabase 注册确认、账号中心绑定、Supabase 登录返回原账号。

## 旧账号迁移

旧站邮箱账号先用“使用原密码登录”进入原账号，再用同邮箱注册并确认 Supabase 账号，随后在账号中心输入 Supabase 邮箱密码完成绑定。未绑定的同邮箱 Supabase 首次登录会返回 `LEGACY_ACCOUNT_LINK_REQUIRED`，避免产生第二个站内账号。GitHub、Google、微信身份不变。

## 边界

Supabase 邮箱验证成功后，网站仍签发原有 `tuaran_session` Cookie，有效期 7 天。Supabase 端重置密码、封禁或删除用户不会立即撤销已签发的网站 Cookie；若需要实时撤销，须扩展站内会话失效机制。当前接入没有在 Supabase 创建公开业务表。
