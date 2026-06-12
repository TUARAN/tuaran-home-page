---
title: 邮箱登录与 Resend 邮件验证码配置经验（SyncBlog 实战）
category: topics
topic_type: tech
date: 2026-06-03
tags: [Resend, Cloudflare, Workers, D1, 邮箱验证码, OTP, 认证, SyncBlog, DNS, PBKDF2]
summary: SyncBlog 从 GitHub OAuth 切到「邮箱+密码+6 位验证码」登录的完整实战记录——含接口设计、D1 表结构、Resend 域名验证、Cloudflare DNS 自动授权、Worker secrets 管理与上线踩坑清单。
tldr: 把登录从 GitHub OAuth 换成自管邮箱体系，主要为了去掉「必须有 GitHub 账号」这道门槛。技术栈选 Cloudflare Workers + D1 + Resend——Resend 的 Cloudflare 集成把 SPF/DKIM/MX 一键写入，发件域名验证从「半天来回」压到「3 分钟点完」。最大的坑是 EMAIL_FROM 必须用已验证子域、CNAME 必须 DNS only 不开橙云、SESSION_SECRET 一旦换全员重登。
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

> 这篇是 SyncBlog 把登录从 GitHub OAuth 切换到「邮箱+密码+验证码」的实战记录。不是 OAuth vs 邮箱登录的「该选哪个」的科普——那是产品决策，这里只回答「**决定切了之后怎么落地最快、踩了哪些坑**」。

## 一、是什么

把 SyncBlog 的认证系统从 GitHub OAuth **整体替换**为传统的「邮箱 + 密码 + 邮件验证码」方案，整个链路全部跑在 Cloudflare 边缘：

- **认证服务**：Cloudflare Workers（沿用现有 Worker）
- **用户存储**：Cloudflare D1（沿用现有数据库，新增两张表）
- **邮件发送**：Resend（第三方，按量付费）
- **DNS / 域名**：Cloudflare（顺带提供 Resend 自动授权能力）
- **登录态**：Worker 签名的 HttpOnly cookie（保持不变）

目标用一句话总结：**不再依赖 GitHub 账号，但其他所有基础设施零迁移**。

## 二、为什么重要

GitHub OAuth 对开发者社区友好，但对 SyncBlog 这种偏内容/工具型站点是「自缚手脚」：

1. **拒掉非技术用户**——很多潜在用户根本没有 GitHub 账号，或者懒得授权
2. **第三方依赖风险**——GitHub OAuth 服务可用性不在自己手里，2024 年那次 OAuth 故障期间整站登录全挂
3. **数据归属感弱**——用户的「身份」绑在 GitHub 上，做付费、订阅、配额管理时永远要回去查 OAuth profile
4. **无法在 GitHub 不普及的市场扩张**——中国大陆访问 GitHub 本身就有门槛

而「自管邮箱体系」的实施成本，在 2026 年比想象中低得多——这正是本调研要论证的核心：**Resend × Cloudflare 这套组合让自管认证的 setup 时间从「两三天」压到「半天」**。

## 三、关键玩家与生态

### 3.1 邮件服务对比

| 服务 | 免费额度 | 付费起价 | DX 评价 | Cloudflare DNS 集成 |
|---|---|---|---|---|
| **Resend** | 3,000/月 | $20/月 (50k) | ⭐⭐⭐⭐⭐ API 极简 | ✅ 一键授权 |
| SendGrid | 100/天 | $19.95/月 (50k) | ⭐⭐⭐ 老牌但繁琐 | ❌ 手动 |
| Postmark | 100/月试用 | $15/月 (10k) | ⭐⭐⭐⭐ 偏事务邮件 | ❌ 手动 |
| AWS SES | 3,000/月 (EC2) | $0.10/1k | ⭐⭐ 配置最痛苦 | ❌ 手动 |
| Mailgun | 1,000/月 | $35/月 | ⭐⭐⭐ | ❌ 手动 |

**选 Resend 的核心理由**：API 设计是「2026 年级别」的（一个 POST，几行代码出邮件），且 Cloudflare DNS 集成是别家没有的——后面会展开。

### 3.2 后端组合

- **Cloudflare Workers**：认证逻辑、Resend API 调用、cookie 签发
- **Cloudflare D1**：用户表、验证码表
- **PBKDF2-SHA256**（Web Crypto API 原生支持）：密码哈希
- **HttpOnly Cookie + HMAC**：会话管理

整套**零新增基础设施**——只引入 Resend 一个外部服务。

## 四、技术 / 实施细节

### 4.1 接口设计

```
GET  /api/auth/me                  # 返回当前用户
POST /api/auth/email/send-code     # 发送邮箱验证码
POST /api/auth/register            # 邮箱+密码+验证码 注册
POST /api/auth/login               # 邮箱+密码 登录
POST /api/auth/logout              # 清 cookie
```

注册流程：

```
用户输入邮箱
  ↓ POST /api/auth/email/send-code
Worker 生成 6 位验证码 → 哈希后存 D1（明文只塞进邮件）
  ↓ 调用 Resend API
用户收件箱看到验证码
  ↓ POST /api/auth/register {email, password, code}
Worker 校验验证码哈希 + PBKDF2 哈希密码 → 写入 users → 签发 cookie
```

**关键设计点**：D1 **只存验证码哈希，不存明文**。即使数据库被脱库，攻击者也拿不到能直接登录的验证码。

### 4.2 D1 数据模型

`users` 表关键字段（在原有基础上扩展）：

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,              -- PBKDF2 输出，base64
  login TEXT,                      -- 兼容老 OAuth 用户
  name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL,     -- 'email' | 'github'（保留迁移期兼容）
  email_verified_at INTEGER,
  plan TEXT DEFAULT 'free',
  ai_quota_used INTEGER DEFAULT 0,
  ai_quota_reset_at INTEGER,
  pro_expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

`email_verification_codes` 表：

```sql
CREATE TABLE email_verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,         -- HMAC(EMAIL_CODE_SECRET, code)
  purpose TEXT NOT NULL,           -- 'register' | 'reset' | 'login_2fa'
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  attempts INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_codes_email_purpose ON email_verification_codes(email, purpose);
```

**既有的 `subscriptions`、`payment_events`、AI 配额字段保留不动**——这套迁移对账单系统是无侵入的。

### 4.3 验证码策略

| 维度 | 限制 | 原因 |
|---|---|---|
| 长度 | 6 位数字 | 用户体验与暴力破解的平衡 |
| 有效期 | 10 分钟 | 给用户切换 App 留时间，但不无限期挂着 |
| 最大尝试 | 5 次 | 防止暴力枚举 |
| 同邮箱频率 | 1 分钟 1 次 | 防止误点 / 攻击者刷邮箱 |
| 同邮箱日上限 | 10 次 | 防止滥用一个邮箱 |
| 同 IP 频率 | 1 分钟 6 次 | 防止单 IP 批量注册 |

注意这套限制是**每条独立检查**——不是「取最严」。同时也意味着如果只 IP 限流不够（如对方有代理池），同邮箱限流是兜底；反之亦然。

### 4.4 Resend 域名配置（核心实战部分）

#### 4.4.1 创建 API Key

Resend 后台 → API keys → Add API key。**生成后立即写入 Worker secret，绝不写进代码或 `.env` 提交仓库**。

#### 4.4.2 测试发件人 vs 正式发件人

Resend 默认提供 `onboarding@resend.dev`，**但这个地址只能发给 Resend 账号关联邮箱**——做完最基本的「Hello world」测试就该淘汰。

要给任意用户发送验证码，必须验证自己的域名。

#### 4.4.3 用子域而不是主域

推荐用 `mail.syncblog.cn` 这样的子域，而不是直接用 `syncblog.cn`。原因：

- 主域的 SPF / DMARC 记录通常已经为其他用途（Google Workspace、Cloudflare Email Routing 等）配置过，混在一起容易冲突
- 子域出问题（发件信誉受损）不会污染主域
- 邮件地址写成 `noreply@mail.syncblog.cn` 也清楚地告诉用户「这是机器发的」

正式发件人推荐配置成：

```
SyncBlog <noreply@mail.syncblog.cn>
```

#### 4.4.4 Cloudflare 自动授权（强烈推荐）

如果域名 DNS 托管在 Cloudflare，Resend 的 Add domain 页面会提供自动配置入口，操作流程：

```
Resend → Domains → Add domain
  ↓ 输入 mail.syncblog.cn
DNS Records 步骤 → 点 Auto configure
  ↓ 跳到 Cloudflare 授权页
授权 Resend 访问 Cloudflare
  ↓
Resend 自动写入 SPF、DKIM、MX/Return-Path 等记录
  ↓
回到 Resend，等待 Status 变为 Verified
```

实测从点 Auto configure 到 Verified 大约 **2-3 分钟**。这是 Resend × Cloudflare 这套组合的最大杀手锏——传统流程下手抄一遍 DKIM 记录就要 10 分钟，还容易漏字符。

#### 4.4.5 手动 DNS 配置（备用）

如果不愿意把 Cloudflare 授权给 Resend，就在 Resend 点 Manual setup，复制它展示的 DNS records。Cloudflare 路径：

```
Cloudflare Dashboard → syncblog.cn → DNS → Records → Add record
```

常见记录格式（具体 Value 以 Resend 当前展示为准）：

```
Type: TXT
Name: mail
Content: v=spf1 include:amazonses.com ~all
TTL: Auto

Type: TXT
Name: resend._domainkey.mail
Content: p=...（DKIM 公钥）
TTL: Auto

Type: CNAME
Name: bounce.mail
Target: feedback-smtp.<region>.amazonses.com
Proxy status: DNS only    ← 关键：不要开橙云
TTL: Auto

Type: MX
Name: mail
Mail server: feedback-smtp.<region>.amazonses.com
Priority: 10              ← 以 Resend 给出值为准
TTL: Auto
```

**手动配置三个最常踩的坑**：

1. **Name 字段**——Cloudflare 通常自动补全根域名，复制时只填子域部分，否则会变成 `mail.syncblog.cn.syncblog.cn`
2. **CNAME 必须 DNS only**——Cloudflare 默认开橙云代理，对 CNAME 邮件相关记录是灾难性的，邮件直接收不到
3. **Value 完整复制**——DKIM 公钥很长，少一个字符就验证失败，建议用复制按钮而不是手选

DNS 生效一般几分钟，最长可能要几小时（看 TTL 和递归解析器缓存）。

### 4.5 Worker Secrets 配置

需要四个 secret：

| 名字 | 用途 | 备注 |
|---|---|---|
| `SESSION_SECRET` | 签名登录 cookie | **生产环境千万不要换**，否则所有用户被踢下线 |
| `EMAIL_CODE_SECRET` | 验证码 HMAC | 应与 `SESSION_SECRET` 用不同随机值 |
| `RESEND_API_KEY` | 调 Resend | 从 Resend 后台复制 |
| `EMAIL_FROM` | 发件人字符串 | 例：`SyncBlog <noreply@mail.syncblog.cn>` |

生成随机密钥：

```bash
openssl rand -base64 32
```

配置命令（Wrangler 会交互式问你 secret 值）：

```bash
cd apps/web
pnpm exec wrangler secret put SESSION_SECRET
pnpm exec wrangler secret put EMAIL_CODE_SECRET
pnpm exec wrangler secret put RESEND_API_KEY
pnpm exec wrangler secret put EMAIL_FROM
```

**`EMAIL_FROM` 的硬约束**：必须使用 Resend 已验证域名下的发件地址。比如 `mail.syncblog.cn` 验证过了，那 `noreply@mail.syncblog.cn`、`hello@mail.syncblog.cn` 都行；但 `noreply@syncblog.cn`（主域未验证）会直接被 Resend 拒绝。

### 4.6 部署与验证

应用 D1 migration：

```bash
cd apps/web
pnpm exec wrangler d1 migrations apply syncblog --remote
```

部署 Worker：

```bash
pnpm run wrangler:deploy
```

冒烟测试：

```bash
curl -i -X POST https://syncblog.cn/api/auth/email/send-code \
  -H 'Content-Type: application/json' \
  --data '{"email":"your-email@example.com","purpose":"register"}'
```

期望响应：

```json
{ "ok": true }
```

然后查收件箱（含垃圾邮件文件夹）。

## 五、争议与风险

### 5.1 「ok: true 但没收到邮件」

`ok: true` **仅表示 Worker 成功把请求发给了 Resend**——不代表对方收到。下一步必须看 Resend 后台 Logs：

| Resend 状态 | 含义 | 排查方向 |
|---|---|---|
| **Delivered** | 已投递 | 查收件箱、垃圾邮件、广告邮件分类 |
| **Bounced** | 收件方拒收 | 邮箱不存在 / 域名被对方封禁 / 内容触发反垃圾 |
| **Complained** | 用户标记垃圾 | 这条用户以后默认不再发 |
| **Failed** | Resend 请求失败 | API key / 发件域 / 配额问题 |

**关键认知**：`ok: true` 是「我寄出去了」，不是「对方收到了」。这是邮件 vs 短信的本质差异——邮件投递是「best effort」，可能延迟、可能被分类到垃圾，没有强 SLA。

### 5.2 邮箱 ≠ 手机短信

记一笔被问过的真事：用户用 `19802021453@139.com`（移动 139 邮箱），收不到「短信」就来反馈。

**当前实现是邮箱验证码，不是短信验证码**。139 邮箱是邮箱，不会触发手机短信通知（除非用户在 139 客户端开了邮件提醒推送）。

如果未来要做真正的短信验证码，得另接：阿里云短信 / 腾讯云短信 / Twilio。短信成本高（国内 ~3-5 分/条）、配置复杂（要短信签名审核），对 SyncBlog 这种 SaaS 一般不必。

### 5.3 限流策略的真实强度

罗列的 6 条限流看上去严密，但有几个边界要清楚：

1. **同邮箱日上限 10 次** 对正常用户够用，但对**恶意刷邮箱触发对方反垃圾系统**这种场景仍不够低——攻击者只要 100 个不同邮箱就能每天发 1000 封，污染你的发件信誉。**真正的兜底是 Resend 自己的 abuse detection 和域名信誉评分**。
2. **同 IP 每分钟 6 次** 对代理池毫无意义。要更强应当上 Cloudflare Turnstile（免费的 CAPTCHA）做人机校验。
3. **5 次尝试上限是按 code 行计算还是按 email/purpose 计算**——实现时必须明确，否则攻击者反复请求新 code 来绕过尝试次数。建议「同 email/purpose 1 小时内累计尝试不超过 N 次」。

### 5.4 Resend 本身的风险

- **单点依赖**：Resend 挂了你整站不能注册/找回密码。Resend 历史上有过几次 incident，平均 SLA 比 AWS SES 略低
- **价格不便宜**：3,000/月免费够小站用，但跨过这条线就跳到 $20/50k，相比 SES 的 $0.10/1k 贵很多
- **被收购/转型风险**：Resend 是 2023 年成立的初创公司（Resend, Inc.，YC W23），有被巨头收购或转型的可能性

应对：**`EmailSender` 接口要做成可替换的抽象**——`sendCode(to, code)` 这一个方法，未来换 SES / SendGrid 只动一个文件。

### 5.5 密码方案的强度

PBKDF2-SHA256 是 Web Crypto API 唯一原生支持的密码哈希算法，是 Workers 环境里最现实的选择。但严格说：

- **PBKDF2 不是 2026 年的最佳实践**，业界推荐是 Argon2id 或 scrypt
- Workers 不支持 Node 原生 crypto，跑 Argon2 要 WASM，包体大、冷启动慢
- 当前用 PBKDF2 是「在 Workers 约束下的合理妥协」，**iterations 一定要拉满**（建议 ≥ 600,000，OWASP 2023 推荐值）

如果未来用户量大且攻击面增加，应考虑：
- 升级到 Argon2id（WASM）
- 或把密码哈希外包给独立服务（如 Auth0、Clerk）

### 5.6 切换期兼容

老的 GitHub OAuth 用户怎么办？两条路：

1. **强制迁移**：登录时提示「请绑定邮箱并设置密码」
2. **双轨并行**：`auth_provider` 字段保留，老用户继续走 OAuth，新用户走邮箱

实战推荐 2——切换期摩擦最小，等老用户自然流失或主动迁移再下线 OAuth。

## 六、个人结论

**一句话定性**：Resend × Cloudflare 是 2026 年「自管邮箱认证」的最低摩擦组合——能把传统需要半天的 DNS+SMTP+API 联调压到两小时上线。

**是否值得跟进 / 接入 / 学习**：

✅ **强烈推荐接入**，理由：
- 本仓库（2aran.com）和 SyncBlog 同样跑在 Cloudflare 上，这套方案完全可复用
- 「调研知识库」未来如果要做用户订阅 / 个性化推送，邮件验证码是最低成本的身份认证
- Resend 的 DX 是真·2026 级别，对个人开发者节省的时间成本远超月费

⚠️ **跟进时的红线**：
- 不要省「子域名 + Cloudflare 自动授权」这一步，手动配 DNS 是性价比最低的折腾
- `SESSION_SECRET` 和 `EMAIL_CODE_SECRET` 务必用不同的随机值，泄露其中一个不至于全盘崩
- `EmailSender` 一定写成接口，给未来换厂商留口子
- 上线前补一次「Resend 后台 → 删除已验证域名 → 重新走流程」演练，确保你真的会配，而不是 Claude / Codex 替你配了一遍你看不懂

**下一步行动**：
1. 把这套方案的代码骨架（Worker 路由 + D1 schema + Resend 客户端 + 限流中间件）整理一份到本站 / SyncBlog 公共 snippets，方便后续项目复用
2. 给本站「调研知识库」加一个**可选的邮件订阅入口**——用户留邮箱，新文章发布时推送，验证码就走 Resend；这是个 30 行代码的小事但有真实价值
3. **不投入**：不做短信验证码（成本不匹配）；不做密码强度策略的过度优化（zxcvbn 装一下显示强度就够）；不做"魔术链接"（magic link）替代验证码（用户在多设备场景反而更困惑）

## 七、信息来源

### 官方一手
- [Resend 官方文档 - Domains](https://resend.com/docs/dashboard/domains/introduction)
- [Resend Cloudflare Integration](https://resend.com/docs/dashboard/domains/cloudflare)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare D1 Migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Web Crypto API - PBKDF2](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### 关键文章 / 对比
- [Resend vs SendGrid vs Postmark](https://resend.com/blog/resend-vs-sendgrid)（厂商自评，看个角度）
- [Why we built Resend (YC W23)](https://resend.com/blog/why-we-built-resend)
- HN 关于 Resend 的多次讨论 - 搜 `site:news.ycombinator.com resend.com`

### 站内相关
- 站内调研：[基于 Cloudflare 的边缘智能体开发实战](/articles/research/topics/cloudflare-edge-agents-practice)（Cloudflare Workers/D1/Workers AI 体系总览）
- 站内调研：[Next.js + Cloudflare 性能优化](/articles/research/topics/nextjs-cloudflare-performance-optimization)

> 写作说明：本文基于 SyncBlog 实际上线过程整理，由 TUARAN 在 Claude Code（Opus 4.7）协助下成文。所有 DNS 记录、Resend 接口、Wrangler 命令均按 2026-06 当时实际版本记录，未来 API/UI 可能微调，落地前请对照各服务最新文档。
