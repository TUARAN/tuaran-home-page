# 2aran 统一登录方式

截至 2026-10-14，2aran 的公开邮箱注册与密码登录统一调用独立 Supabase 项目 `xyslkdmevmddwzacrzvn`。GitHub、Google 沿用站点自有 OAuth 回调。三种方式最终通过 D1 `account_identities` 关联到同一个 `site_users.platform_id`，业务权限与权益仍由 D1 判断，网站签发 7 天 `tuaran_session` Cookie。

## 邮箱注册与登录

- Supabase Auth 负责邮箱密码、确认状态；用户注册后必须确认邮箱才能登录。
- Resend 的 `mail.2aran.com` 已验证，Supabase 自定义 SMTP 使用 `2aran <noreply@mail.2aran.com>`、`smtp.resend.com:465`、用户名 `resend`。SMTP 密钥只保存在 Supabase，不写入仓库。
- Supabase 项目 Site URL 为 `https://2aran.com`，Redirect URLs 包含 `https://2aran.com/login?emailConfirmed=1`。
- 网站 `SUPABASE_URL` 与 publishable key 位于 `wrangler.toml`；`SUPABASE_EMAIL_AUTH_ENABLED=true`。服务不可用时邮箱接口返回 503，不回退到旧 D1 密码验证。
- 旧 D1 邮箱账号表在切换前检查为 0 条。旧验证码发送和激活 API 返回 410；历史数据表及代码暂保留供追溯，不接受新注册。

## 身份关联

- Supabase 邮箱首次登录使用 Auth 用户 ID 作为 `provider_account_id`，写入 D1 的 `supabase` identity。不要按相同邮箱自动合并已存在的 GitHub、Google 账号。
- 已登录用户可以在账号中心先注册并确认邮箱，再输入邮箱密码主动绑定。GitHub、Google 也可在账号中心主动绑定到当前站内账号。
- 邮箱身份不能从账号中心解绑；OAuth 身份在保留至少一种登录方式时可以解绑。
- Supabase 的 `user_metadata` 只用于昵称展示，不能用作站内授权依据。

## 验证与限制

验证顺序：注册 API 返回待确认状态 → 确认邮件实际送达 → 打开确认链接 → 密码登录创建站内 session → `/api/me` 和账号中心显示同一 platform ID → 登出；再检查 GitHub、Google 原账号登录和主动绑定。

Supabase 用户被封禁或删除后，已签发的网站 Cookie 不会即时失效。需要立即撤销时，须增加站内会话失效校验。2026-10-14 发现并修正 `/auth/v1/signup` 成功响应解析错误：该端点返回顶层用户对象，不能只读取 `data.user.id`。上线状态以生产部署和完整链路实测为准。
