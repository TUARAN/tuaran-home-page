---
title: Web 身份认证方案全景调研：Cookie-Session、Token、JWT 与 OAuth 协议族
category: topics
date: 2026-06-10
tags: [鉴权, 身份认证, Cookie, Session, JWT, OAuth, OIDC, SAML, API Key, SSO, 前后端分离, 微服务]
summary: 系统梳理七种常见 Web 身份认证与授权方案——Cookie-Session、随机 Token、JWT、OAuth 2.0、OIDC、SAML、API Key——从有状态/无状态、适用场景、安全边界到选型建议，帮助在单体、前后端分离、微服务与第三方登录之间做正确取舍。
tldr: 认证方案没有银弹：同域传统 Web 优先 Cookie-Session；前后端分离/移动端用服务端存 Token；跨服务/SSO 用 JWT 但要配黑名单或短 TTL；第三方登录走 OAuth 2.0，要「知道用户是谁」选 OIDC；政企老系统才碰 SAML；机器对机器用 API Key。协议（OAuth/OIDC/SAML）解决的是「谁签发身份」，凭证形态（Cookie/Token/JWT）解决的是「怎么携带身份」，两者不要混为一谈。
topic_type: tech
assistance: cursor
model: composer-2.5
pv: 0
---

## 一、是什么

Web 应用要回答两个问题：**你是谁（Authentication）** 和 **你能做什么（Authorization）**。本文聚焦前者——用户或调用方如何向系统证明身份。

业界常见方案可粗分为三类：

| 类型 | 代表方案 | 本质 |
|---|---|---|
| **凭证形态** | Cookie-Session、随机 Token、JWT | 客户端拿什么、服务端怎么验 |
| **授权/联合协议** | OAuth 2.0、OIDC、SAML | 第三方如何签发或传递身份 |
| **应用间密钥** | API Key | 长期有效的机器身份 |

### 总览对照表

| 方案 | 状态 | 核心特点 | 典型场景 |
|---|---|---|---|
| Cookie-Session | 有状态 | 浏览器自动携带，可控性强 | 传统网站、同域 Web |
| 随机字符串 Token | 有状态 | 简单灵活，可主动失效 | 前后端分离、APP、小程序 |
| JWT | 无状态 | 自包含、分布式友好，难作废 | 微服务、跨服务、SSO |
| OAuth 2.0 | 协议 | 第三方授权 | 微信 / QQ / 微博快捷登录 |
| OIDC | 协议 | 基于 OAuth2 做身份认证 | 统一登录、企业 SSO |
| SAML | 协议 | 老旧 XML 格式 | 传统政企老系统单点登录 |
| API Key | 密钥 | 长期有效，应用间调用 | 开放平台、云服务接口 |

> **关键区分**：OAuth 2.0 本身只解决「授权」，不保证你知道用户是谁；OIDC 在 OAuth 之上加了 ID Token，才是身份认证协议。Cookie / Token / JWT 是凭证载体，可以和 OAuth/OIDC 组合使用。

---

## 二、为什么重要

选错认证方案，短期能跑，长期会踩坑：

- **前后端分离却用 Cookie**：跨域、移动端、第三方域名都要额外处理 CORS 与 SameSite，复杂度陡增。
- **微服务全链路 JWT 却不设计作废策略**：用户改密、封号、权限变更后旧 Token 仍有效，形成安全窗口。
- **把 OAuth 当登录**：拿到 access_token 不等于知道用户身份，缺少 userinfo / id_token 时后端无法稳定绑定账号。
- **API Key 进前端**：密钥暴露在浏览器，等于把家门钥匙贴在门上。

认证是安全架构的地基。后面 RBAC、多租户、审计日志、合规（等保、SOC2）都建立在「身份可信」之上。

---

## 三、关键玩家与生态

### 开源与框架

| 领域 | 代表项目 |
|---|---|
| Session 管理 | Express-session、Next.js 内置 Cookie、Redis Session Store |
| Token / JWT | jsonwebtoken、jose、Paseto |
| OAuth/OIDC 客户端 | NextAuth (Auth.js)、Better Auth、oidc-client-ts |
| OAuth/OIDC 服务端 | Keycloak、Authentik、Ory Hydra、Zitadel |
| SAML | Shibboleth、SimpleSAMLphp、OneLogin SDK |
| API Key 管理 | Kong、Tyk、AWS API Gateway Usage Plans |

### 商业身份服务（IdP / CIAM）

- **Auth0**（Okta）、**Clerk**、**WorkOS**：开发者友好的 OIDC/OAuth 托管
- **Azure AD / Entra ID**、**Google Workspace**、**Okta**：企业 SSO 与 SAML/OIDC
- **微信开放平台**、**QQ 互联**、**微博开放平台**：国内第三方 OAuth 登录
- **Cloudflare Access**、**AWS Cognito**：基础设施层身份网关

### 标准组织

- **IETF**：OAuth 2.0（RFC 6749）、OAuth 2.1 草案、JWT（RFC 7519）
- **OpenID Foundation**：OpenID Connect Core 1.0
- **OASIS**：SAML 2.0

---

## 四、技术 / 实施细节

### 4.1 Cookie-Session（有状态）

**工作原理**

```text
1. 用户登录成功
2. 服务端创建 session（存 Redis / 内存 / DB），生成 session_id
3. 通过 Set-Cookie 把 session_id 写入浏览器
4. 后续请求浏览器自动带上 Cookie
5. 服务端用 session_id 查 session，得到 user_id 与权限
```

**优点**

- 浏览器原生支持，无需前端手动传 Token
- 服务端可随时销毁 session（登出、踢人、改密后立即失效）
- Secret 不离开服务端，session_id 只是随机指针

**缺点**

- 有状态：session 存储成为扩展瓶颈，多实例需共享存储（Redis）
- 跨域麻烦：Cookie 受 SameSite、Domain、Secure 约束
- 不适合纯 API 客户端（CLI、IoT） unless 模拟浏览器

**安全要点**

- `HttpOnly`：防 XSS 窃取
- `Secure`：仅 HTTPS 传输
- `SameSite=Lax/Strict`：防 CSRF
- session_id 足够随机（≥128 bit 熵）

**典型场景**：传统 MVC、同域 SSR（Next.js Server Actions + Cookie）、内部管理后台。

---

### 4.2 随机字符串 Token（有状态）

**工作原理**

```text
1. 登录成功，服务端生成 opaque token（如 uuid4 + 随机字节）
2. token 作为 key 存入 Redis/DB，value 为 user_id、过期时间、设备信息
3. 客户端把 token 放在 Authorization: Bearer <token> 或自定义 Header
4. 每次请求服务端查表校验；登出时 delete key
```

**与 JWT 的区别**：Token 本身不含信息，必须回源查库；因此**天然可作废**。

**优点**

- 实现简单，逻辑清晰
- 主动失效：删 Redis key 即可
- 前后端分离、APP、小程序、桌面端统一：`Authorization` Header 无跨域 Cookie 问题

**缺点**

- 每次请求需查存储（Redis 通常 <1ms，可接受）
- 水平扩展依赖集中式 session 存储
- 移动端需安全存储 Token（Keychain / EncryptedSharedPreferences），勿放明文 SharedPreferences

**典型场景**：REST API + SPA、微信小程序、Flutter App、前后端分离的后台。

---

### 4.3 JWT（无状态）

**工作原理**

```text
1. 登录成功，服务端用私钥/对称密钥签发 JWT
2. Payload 自包含：sub(user_id)、exp、iat、自定义 claims（角色等）
3. 客户端保存 JWT，请求时 Bearer 携带
4. 各服务用公钥/同一 secret 本地验签，无需查 central session
```

**结构**：`Header.Payload.Signature`（Base64URL），签名防篡改，**不加密**（敏感信息勿放 payload，或用 JWE）。

**优点**

- 无状态：微服务、边缘节点、Serverless 无需共享 session 存储
- 自包含：减少 auth 服务往返
- 标准化：RFC 7519，生态成熟

**缺点（「难作废」是核心痛点）**

- 签发后无法单方面废止（除非维护黑名单或极短 TTL + Refresh Token）
- Payload 可读：勿放密码、PII
- 密钥轮换需协调所有验签方
- Token 体积大于 opaque token，每请求都传

**常见补救**

| 策略 | 说明 |
|---|---|
| 短 access_token（15min）+ 长 refresh_token（7d） | refresh 存 Redis，可撤销 |
| Token 黑名单（Redis） | 登出/改密时加入 jti 黑名单 |
| 版本号 claim | user.token_version 改密时 +1，旧 JWT 版本不匹配则拒 |
| 只用 JWT 做服务间传递，用户会话仍用 opaque token | 混合架构 |

**典型场景**：微服务网关、跨域 SSO、Serverless、多区域边缘验签。

---

### 4.4 OAuth 2.0（授权协议）

**OAuth 解决的是**：用户授权第三方应用访问其在某资源服务器上的资源，**而不把密码交给第三方**。

**核心角色**

- **Resource Owner**：用户
- **Client**：你的应用
- **Authorization Server**：发 token（如微信、GitHub、Authentik）
- **Resource Server**：受保护 API

**常见 Grant Type**

| Grant | 场景 | 备注 |
|---|---|---|
| Authorization Code + PKCE | 公开客户端（SPA、移动端） | **当前首选** |
| Authorization Code | 机密客户端（有 client_secret 的后端） | Web 服务端 |
| Client Credentials | 机器对机器 | 无用户上下文 |
| Refresh Token | 续期 access_token | 配合 Code 使用 |
| ~~Implicit~~ | 旧 SPA | **已废弃，勿用** |
| ~~Password~~ | 用户名密码直换 token | **仅遗留系统，勿在新项目用** |

**典型流程（Authorization Code + PKCE）**

```text
用户 -> 你的 App -> 跳转微信授权页
用户同意 -> 微信回调带 code
你的后端用 code + client_secret 换 access_token
用 access_token 调微信 API 获取用户信息（若需登录则再调 userinfo）
在你的系统创建/绑定本地用户，签发自己的 session/token
```

**注意**：OAuth 2.0 **标准不定义用户身份格式**。access_token 可能是 opaque 或 JWT，但「这个 token 代表哪个用户」要靠额外约定或 OIDC。

**典型场景**：「微信登录」「GitHub 登录」「用 Google 账号授权访问 Calendar API」。

---

### 4.5 OIDC（OpenID Connect，身份认证协议）

**OIDC = OAuth 2.0 + 身份层**。在 OAuth 之上增加：

- **ID Token**：JWT，含 `sub`（用户唯一标识）、`iss`、`aud`、`exp` 等
- **UserInfo Endpoint**：用 access_token 拉取标准用户属性（name、email、picture）
- **Discovery**：`/.well-known/openid-configuration` 自动发现端点
- **Scopes**：`openid` scope 触发 OIDC 流程

**与 OAuth 的分工**

| | OAuth 2.0 | OIDC |
|---|---|---|
| 主要目的 | 授权访问资源 | **认证**用户身份 |
| 关键产物 | access_token | **id_token** + access_token |
| 用户信息 | 非标准 | UserInfo 标准 claims |

**典型场景**：企业 SSO（Keycloak / Azure AD）、统一登录门户、B2B SaaS「用客户 IdP 登录」、Auth0 / Clerk 一类 CIAM。

**实施建议**

- 后端验 id_token 签名与 `aud`、`iss`、`exp`
- 用 `sub` + `iss` 作为联合账号唯一键，而非 email（email 可能变）
- SPA 仍用 Authorization Code + PKCE，id_token 由后端换 code 后处理，避免 id_token 长期存前端

---

### 4.6 SAML 2.0（XML 联邦协议）

**工作原理（SP-initiated SSO）**

```text
1. 用户访问你的服务（SP）
2. SP 生成 SAML AuthnRequest，重定向到 IdP（如 AD FS）
3. 用户在 IdP 登录
4. IdP POST SAML Response（XML 断言）回 SP
5. SP 验签断言，提取 NameID / Attributes，建立本地 session
```

**特点**

- 基于 **XML** 断言，体积大、解析重
- 浏览器 POST 绑定（POST Binding）为主，移动端支持差
- 政企、金融、高校遗留系统大量采用
- 与 OIDC 功能重叠，但 **OIDC 是 JSON/REST 时代的主流替代**

**何时还用 SAML**

- 客户 IdP 只支持 SAML（老 AD FS、部分政府平台）
- 合规合同明确要求 SAML 2.0
- 维护已有 SAML 集成，迁移成本高

**新项目**：优先 OIDC；仅在与 legacy IdP 对接时引入 SAML bridge（如 WorkOS、Auth0 Enterprise Connections）。

---

### 4.7 API Key（应用凭证）

**工作原理**

- 平台为每个应用/开发者签发长期密钥（如 `sk_live_xxx`）
- 请求 Header：`Authorization: Bearer sk_xxx` 或 `X-API-Key: xxx`
- 服务端查表：key → tenant_id、配额、权限 scope

**优点**

- 极简，适合脚本、CI、服务端集成
- 易于在网关层做 rate limit、计费、审计

**缺点**

- 长期有效，泄露影响大
- 无用户上下文（除非 key 绑定 service account）
- 不应出现在浏览器或移动 App 二进制（可逆向）

**安全要点**

- 只存 hash（bcrypt / SHA-256），比对时不存明文
- 支持 rotate、scope 限制、IP 白名单
- 区分 publishable key（前端，只读公开数据）与 secret key（仅服务端）

**典型场景**：OpenAI API、Stripe、Cloudflare API、Webhook 签名验证、内部服务 mesh（有时用 mTLS 替代）。

---

## 五、方案对比与组合

### 5.1 凭证形态对比

| 维度 | Cookie-Session | Opaque Token | JWT |
|---|---|---|---|
| 状态 | 有状态 | 有状态 | 无状态 |
| 存储 | 服务端 session | 服务端 token 表 | 客户端自持 |
| 作废 | 删 session 即可 | 删 token 即可 | 需黑名单 / 短 TTL |
| 跨域 | 差 | 好 | 好 |
| 浏览器自动携带 | 是 | 否（需 JS 设置 Header） | 否 |
| CSRF | 需防护 | 不适用 | 不适用 |
| XSS | HttpOnly 可缓解 | Token 在 JS 中则危险 | 同左 |

### 5.2 协议对比

| 维度 | OAuth 2.0 | OIDC | SAML 2.0 |
|---|---|---|---|
| 主要用途 | 授权 | 认证 + 授权 | 企业 SSO 认证 |
| 数据格式 | JSON | JSON（JWT id_token） | XML |
| 移动端 | 好（PKCE） | 好 | 差 |
| 生态趋势 | 基础协议 | **主流 SSO** | 维护态 |
| 与国内社交登录 | 微信等提供 OAuth 式接口 | 部分支持 OIDC | 极少 |

### 5.3 常见组合模式

```text
模式 A：传统 Web
  表单登录 -> Cookie-Session -> 同域 SSR

模式 B：SPA + API
  登录 API -> opaque access_token + refresh_token (Redis)
  或 B2：短 JWT access + Redis refresh

模式 C：社交登录
  OAuth Code + PKCE -> 第三方 token -> 换本地 session/token
  若 IdP 支持 OIDC：验 id_token 后 upsert 用户

模式 D：企业 SSO
  OIDC（首选）或 SAML -> 本地 session 或签发自己的 JWT

模式 E：开放平台
  开发者注册 -> API Key（服务端）
  用户授权第三方 App -> OAuth 2.0 授权码

模式 F：微服务
  网关验 JWT -> 下游服务信任网关或本地 JWKS 验签
  用户会话入口仍建议有状态 refresh 层
```

---

## 六、争议与风险

### 6.1 「JWT 万能论」

JWT 适合**服务间传递已验证的身份声明**，不适合作为唯一用户会话方案。无作废能力在「即时封号」「权限变更」场景是真实风险。

### 6.2 「OAuth = 登录」

OAuth 只保证「用户授权你的 app 访问某资源」。没有 OIDC 或 vendor-specific userinfo 时，后端可能拿不到 stable user id。

### 6.3 Cookie 已死？

Cookie 在**同域 SSR、防 XSS 的 HttpOnly 会话**里仍然是最优解之一。被诟病的是跨域 SPA + Cookie 的复杂度，不是 Cookie 本身。

### 6.4 把 JWT 存 localStorage

XSS 一次清空。更稳妥：HttpOnly Cookie 存 refresh token + 内存存短 access；或 SPA 用 BFF 层代管 Cookie。

### 6.5 API Key 进 Git

历史上大量泄露事件来自 `.env` 提交、前端 bundle、日志打印。密钥扫描（GitHub Secret Scanning、gitleaks）应成为标配。

### 6.6 SAML 是否该淘汰

对新系统：是，选 OIDC。对政企存量：SAML 仍是刚需，用 IdP broker 降低直接解析 XML 的成本。

---

## 七、个人结论

### 一句话定性

> **凭证选 Cookie / opaque Token / JWT 解决「怎么带身份」；协议选 OAuth / OIDC / SAML 解决「谁证明身份」。两者分层选型，不要混为一谈。**

### 选型决策树（简化）

```text
是否机器调用、无用户？
  └─ 是 -> API Key（或 mTLS / Client Credentials）

是否只用第三方账号登录、不自建密码？
  └─ 是 -> OAuth 2.0 Code+PKCE；要标准身份则 OIDC

是否企业客户要求 SSO？
  └─ OIDC 优先；仅 SAML IdP 时上 SAML bridge

是否同域传统 Web / SSR？
  └─ Cookie-Session

是否前后端分离 / APP / 小程序？
  └─ Opaque Token + Redis（优先）
  └─ 或短 JWT + Refresh（微服务多、auth 服务少）

是否多微服务、边缘验签、跨区？
  └─ JWT + JWKS + 短 TTL + 可撤销 refresh 层
```

### 是否值得深入

- **Web 开发者**：Cookie-Session、opaque Token、OAuth/OIDC 是必学；JWT 理解 claims 与验签即可，不必迷信。
- **后端 / 架构**：JWT 作废策略、Refresh Token 轮转、PKCE、SAML bridge 值得专门设计。
- **个人项目 / 小站**：opaque Token 或 signed Cookie session 足够；社交登录直接接 Auth.js / Better Auth，勿从零实现 OAuth。

### 下一步行动

1. 画一张自己项目的认证链路图：登录入口 → 凭证形态 → 存储 → 作废路径
2. 若已用 JWT：确认 access TTL、refresh 是否可 revoke、改密是否失效旧 token
3. 若接微信/GitHub 登录：确认后端是否用 `sub` 绑定用户，而非仅 email
4. 排查 API Key / secret 是否出现在前端或 git 历史

---

## 八、信息来源

- [RFC 6749 — OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7519 — JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OASIS SAML 2.0 Technical Overview](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [Auth.js (NextAuth) Documentation](https://authjs.dev/)
- [Better Auth Documentation](https://www.better-auth.com/docs)
