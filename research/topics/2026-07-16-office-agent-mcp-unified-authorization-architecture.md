---
title: 办公智能体调用 MCP 服务并接入统一认证授权服务：通用架构方案
category: topics
topic_type: tech
tech_type: agents_automation
date: 2026-07-16
time: 09:21
tags: [MCP, OAuth 2.1, 统一认证授权, 办公智能体, PKCE, JWT, Token Introspection, 企业安全]
summary: 以 MCP 当前授权规范和 OAuth 安全最佳实践为基线，设计办公智能体、MCP 服务、统一认证授权服务与下游业务系统之间的发现、授权、调用、刷新和撤销架构。
tldr: 推荐把办公智能体视为 OAuth Client，把 MCP 服务视为 Resource Server，把统一认证授权服务视为 Authorization Server。用户认证和授权确认集中在统一认证授权服务；办公智能体使用 Authorization Code + PKCE，并在授权请求和 Token 请求中携带 resource；MCP 服务严格校验目标 audience，再把 Scope、角色和业务权限合并决策。MCP Token 不向下游透传，下游访问使用独立 Token 或 Token Exchange。短期 Access Token、Refresh Token 轮换、精确 redirect_uri、完整审计和撤销链路是落地基线。
content_type: analysis
assistance: codex
model: gpt-5
show_assistance: false
review_ready: true
ad_eligible: false
pv: 0
---

办公智能体一旦能读取合同、发起审批、查询客户资料，MCP 地址就不再是一条普通配置。它实际建立了一条“某个应用代表某个用户访问某项企业能力”的授权链路。

这条链路适合交给 OAuth 处理。MCP 负责规定客户端怎样发现受保护资源及其授权服务器，统一认证授权服务负责认证与发证，MCP 服务负责最后一道业务授权。

## 一、一句话架构定义

**办公智能体以 OAuth Client 身份，通过 MCP Protected Resource Metadata 发现统一认证授权服务，使用 Authorization Code + PKCE 获取限定到目标 MCP 服务的用户委托凭证，再由 MCP 服务完成 Token 校验、Tool 权限判断和下游凭证隔离。**

简单说，统一认证授权服务回答“用户是谁、用户把什么范围授权给哪个客户端”，MCP 服务回答“这次 Tool 调用在当前业务上下文中能不能执行”。两层判断缺一不可。

## 二、概要架构图

<figure class="research-inline-diagram">
<svg viewBox="0 0 900 520" width="900" height="520" role="img" aria-label="办公智能体接入 MCP 与统一认证授权服务的概要架构">
<defs>
<marker id="mcp-auth-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
<path d="M0,0 L7,3.5 L0,7 Z" fill="#64748b"/>
</marker>
</defs>
<rect x="28" y="38" width="844" height="442" rx="18" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="52" y="70" font-size="15" font-weight="700" fill="#334155">企业授权与业务信任域</text>

<rect x="62" y="178" width="142" height="86" rx="12" fill="#eef2ff" stroke="#818cf8" stroke-width="1.5"/>
<text x="133" y="211" text-anchor="middle" font-size="16" font-weight="700" fill="#312e81">用户</text>
<text x="133" y="237" text-anchor="middle" font-size="12" fill="#475569">认证、同意、发起 Tool</text>

<rect x="266" y="148" width="172" height="146" rx="12" fill="#eff6ff" stroke="#60a5fa" stroke-width="1.5"/>
<text x="352" y="181" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a8a">办公智能体</text>
<text x="352" y="208" text-anchor="middle" font-size="12" fill="#475569">MCP Client</text>
<text x="352" y="230" text-anchor="middle" font-size="12" fill="#475569">OAuth Client</text>
<text x="352" y="252" text-anchor="middle" font-size="12" fill="#475569">凭证安全存储</text>
<text x="352" y="274" text-anchor="middle" font-size="12" fill="#475569">调用与刷新</text>

<rect x="512" y="104" width="302" height="108" rx="12" fill="#f0fdf4" stroke="#4ade80" stroke-width="1.5"/>
<text x="663" y="137" text-anchor="middle" font-size="16" font-weight="700" fill="#14532d">统一认证授权服务</text>
<text x="663" y="164" text-anchor="middle" font-size="12" fill="#475569">Authorization Server：认证、同意、客户端管理</text>
<text x="663" y="188" text-anchor="middle" font-size="12" fill="#475569">授权码 / Token / 刷新 / 校验 / 撤销 / JWK</text>

<rect x="512" y="266" width="302" height="108" rx="12" fill="#fff7ed" stroke="#fb923c" stroke-width="1.5"/>
<text x="663" y="299" text-anchor="middle" font-size="16" font-weight="700" fill="#7c2d12">MCP 服务</text>
<text x="663" y="326" text-anchor="middle" font-size="12" fill="#475569">Resource Server：Metadata、Token 校验</text>
<text x="663" y="350" text-anchor="middle" font-size="12" fill="#475569">Scope + 角色 + ABAC + Tool 最终授权</text>

<rect x="512" y="406" width="302" height="50" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
<text x="663" y="437" text-anchor="middle" font-size="14" font-weight="700" fill="#334155">下游业务服务 / 数据平台 / 开放接口</text>

<path d="M204 208 L266 208" stroke="#64748b" stroke-width="1.6" marker-end="url(#mcp-auth-arrow)"/>
<text x="235" y="197" text-anchor="middle" font-size="11" fill="#64748b">操作</text>
<path d="M438 181 C472 181 476 158 512 158" stroke="#64748b" stroke-width="1.6" marker-end="url(#mcp-auth-arrow)"/>
<text x="474" y="145" text-anchor="middle" font-size="11" fill="#64748b">OAuth + PKCE</text>
<path d="M512 188 C470 205 470 238 438 250" stroke="#64748b" stroke-width="1.6" marker-end="url(#mcp-auth-arrow)"/>
<text x="480" y="231" text-anchor="middle" font-size="11" fill="#64748b">Token</text>
<path d="M438 270 C470 285 478 320 512 320" stroke="#64748b" stroke-width="1.6" marker-end="url(#mcp-auth-arrow)"/>
<text x="474" y="309" text-anchor="middle" font-size="11" fill="#64748b">Bearer / DPoP</text>
<path d="M663 266 L663 212" stroke="#64748b" stroke-width="1.6" marker-end="url(#mcp-auth-arrow)"/>
<text x="674" y="243" font-size="11" fill="#64748b">JWK / Introspection</text>
<path d="M663 374 L663 406" stroke="#64748b" stroke-width="1.6" marker-end="url(#mcp-auth-arrow)"/>
<text x="676" y="396" font-size="11" fill="#64748b">独立下游 Token</text>
</svg>
<figcaption>图 1：统一认证授权服务负责身份与委托，MCP 服务保留 Tool 和业务数据的最终授权权力。</figcaption>
</figure>

## 三、参与方及职责边界

| 参与方 | 核心职责 | 应保存的数据 | 不应承担的职责 |
|---|---|---|---|
| 用户 | 使用办公智能体；完成身份认证；确认授权范围；发起、解除或撤销连接 | 自己可见的连接状态、授权记录 | 向 MCP 服务直接提交账号密码；理解底层 Token 细节 |
| 办公智能体 | MCP Client 与 OAuth Client；发现元数据；发起授权；管理本地回调；安全保存凭证；调用 Tool；刷新与断开连接 | Client ID、PKCE 临时参数、连接索引、加密后的 Refresh Token、短期 Access Token | 代替统一认证授权服务校验企业密码；自行扩大 Scope；把一个 MCP 的 Token 发给另一个 MCP |
| MCP 服务 | OAuth Resource Server；发布 Protected Resource Metadata；验证 Token；把 Scope 映射到 Tool；执行租户、角色和数据权限判断；安全调用下游 | Resource 配置、Tool 权限策略、短期校验缓存、审计关联号 | 签发办公智能体的授权码；接受错误 audience 的 Token；透传入站 MCP Token 给下游 |
| 统一认证授权服务 | OAuth Authorization Server；认证用户；展示同意页；管理客户端；签发、刷新、校验和撤销 Token；发布元数据与 JWK | 主体、会话、授权事务、Consent Grant、客户端、Token 家族、撤销状态、审计事件 | 判断某一张合同是否可读；替代 MCP 服务做全部业务级授权 |
| 下游业务服务 | 提供实际业务数据或操作；验证面向自己的凭证；执行自身权限策略；记录审计 | 自己的资源权限、面向自身 audience 的凭证状态 | 接受 audience 为 MCP 服务的入站 Token；相信未经验证的用户头 |

边界的关键在于，身份认证集中在统一认证授权服务，业务授权留在资源所在的一侧。用户登录成功只证明“这个人是谁”。它没有自动授予所有 MCP Tool。

## 四、阶段一：MCP 配置与授权连接的完整时序

### 1、配置与首次挑战

1. 用户在办公智能体中输入或选择 MCP Endpoint。
2. 办公智能体先做 URL、TLS、DNS 和 SSRF 策略检查，再向 MCP 服务发起不带 Token 的初始化或能力请求。
3. 受保护的 MCP 服务返回 `401 Unauthorized`。它可以在 `WWW-Authenticate: Bearer` 中带上 `resource_metadata` 和建议的 `scope`。
4. 按当前 MCP 规范，`WWW-Authenticate` 中的 `resource_metadata` 并非唯一发现方式。客户端还必须支持 RFC 9728 的 well-known 回退地址。

例如：

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
  resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
  scope="documents:read"
```

### 2、发现受保护资源

5. 办公智能体获取 Protected Resource Metadata（PRM）。文档至少应正确声明 `resource`，MCP 规范还要求 `authorization_servers` 至少包含一个授权服务器。
6. 客户端必须验证 PRM 中的 `resource` 与自己访问的资源标识完全一致。通过 `WWW-Authenticate` 获得元数据地址时，也要按 RFC 9728 校验它与原始资源请求的绑定关系。
7. 客户端不应直接信任任意元数据 URL。应限制 HTTPS、阻断私网和云元数据地址、限制重定向、响应大小和 DNS 变化，防止 SSRF。
8. 如果 PRM 给出多个授权服务器，办公智能体按企业信任策略选择。高安全场景适合维护 MCP Resource 与统一认证授权服务的允许关系，并与授权服务器元数据中的 `protected_resources` 交叉检查。

一个最小 PRM 示例：

```json
{
  "resource": "https://mcp.example.com/mcp",
  "authorization_servers": ["https://auth.example.com/tenant-a"],
  "scopes_supported": ["documents:read", "documents:write"],
  "bearer_methods_supported": ["header"],
  "resource_name": "企业文档 MCP"
}
```

### 3、发现统一认证授权服务与客户端身份

9. 办公智能体根据授权服务器 issuer 获取 RFC 8414 Authorization Server Metadata 或 OIDC Discovery 元数据。带路径的 issuer 必须按 MCP 规定的顺序尝试 well-known 地址，不能自行猜 `/authorize` 和 `/token`。
10. 客户端核对返回的 `issuer`，读取 `authorization_endpoint`、`token_endpoint`、`code_challenge_methods_supported`、`scopes_supported`、`revocation_endpoint`、`introspection_endpoint`、`jwks_uri` 及客户端注册能力。
11. MCP 客户端必须确认授权服务器支持 PKCE，且应使用 `S256`。发现元数据没有相应能力时，当前 MCP 规范要求停止流程。
12. 办公智能体取得 Client ID。受控企业环境优先预注册；开放生态可使用 Client ID Metadata Document；兼容旧部署时再使用 RFC 7591 动态客户端注册。

### 4、授权事务与用户交互

13. 办公智能体生成高熵 `state`、`code_verifier`，计算 `code_challenge=S256(code_verifier)`，并在本地建立一次性授权事务。
14. 客户端把用户代理导向统一认证授权服务的 Authorization Endpoint。请求中包含 `response_type=code`、`client_id`、精确注册的 `redirect_uri`、最小 `scope`、`state`、`code_challenge`、`code_challenge_method=S256` 和目标 MCP 的 `resource`。
15. 当前 MCP 授权规范要求客户端在**授权请求和 Token 请求**中都携带 RFC 8707 `resource`，其值为目标 MCP 服务的规范资源标识。
16. 用户在统一认证授权服务完成账号密码、企业单点登录、扫码、短信或 MFA。具体认证方法是统一认证授权服务内部能力，对 OAuth Client 仍表现为同一个授权事务。
17. 统一认证授权服务展示同意页，说明办公智能体名称、MCP 服务、请求的数据与操作范围、有效期、风险提示和撤销入口。用户可以同意、缩小范围或拒绝。
18. 认证与同意完成后，统一认证授权服务生成一次性、短时授权码，并把浏览器重定向到已注册的 `redirect_uri`，返回 `code` 与原 `state`。

浏览器、H5 和二维码可以复用同一授权页面。二维码只承载短时、一次性的授权事务入口，不能放 Access Token、Refresh Token 或用户身份信息。扫码后应在手机和原设备显示一致的客户端、MCP 和校验短码，避免登录 CSRF 与错绑。

无法安全接收浏览器回调的无头设备，可以另行采用 OAuth Device Authorization Grant（RFC 8628）。它与 Authorization Code + PKCE 是两种授权方式，不宜把轮询设备码伪装成浏览器回调。

### 5、换取凭证与建立连接

19. 办公智能体先严格比较 `state`，再向 Token Endpoint 提交授权码、相同 `redirect_uri`、原 `code_verifier`、`client_id` 和相同目标 `resource`。
20. 统一认证授权服务验证授权码未过期、未使用，核对 Client、Redirect URI、PKCE、Resource 和授权范围。
21. 验证通过后，统一认证授权服务签发面向该 MCP Resource 的 Access Token。是否签发 Refresh Token 由客户端类型、授权策略和 Scope 决定，不能假定每次都有。
22. 办公智能体把 Refresh Token 写入操作系统凭证库、硬件保护区或服务端加密保险库；Access Token 尽量只放内存或短时加密缓存。
23. 办公智能体带 Access Token 重试 MCP 请求。成功后，把连接状态标记为“已连接”，并记录 issuer、resource、client_id、subject 连接键、scope、到期时间和 Token 家族标识。

## 五、认证授权时序图

<figure class="research-inline-diagram">
<svg viewBox="0 0 980 820" width="980" height="820" role="img" aria-label="办公智能体连接 MCP 服务的认证授权时序图">
<defs>
<marker id="seq-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
<path d="M0,0 L7,3.5 L0,7 Z" fill="#64748b"/>
</marker>
</defs>
<text x="490" y="32" text-anchor="middle" font-size="19" font-weight="700" fill="#1e293b">MCP 配置、发现、授权与首次调用</text>
<g fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2">
<rect x="25" y="52" width="130" height="44" rx="8"/><rect x="205" y="52" width="150" height="44" rx="8"/>
<rect x="405" y="52" width="150" height="44" rx="8"/><rect x="605" y="52" width="190" height="44" rx="8"/>
<rect x="845" y="52" width="110" height="44" rx="8"/>
</g>
<g font-size="13" font-weight="700" fill="#334155" text-anchor="middle">
<text x="90" y="79">用户</text><text x="280" y="79">办公智能体</text><text x="480" y="79">MCP 服务</text>
<text x="700" y="79">统一认证授权服务</text><text x="900" y="79">下游服务</text>
</g>
<g stroke="#cbd5e1" stroke-width="1" stroke-dasharray="5 5">
<line x1="90" y1="96" x2="90" y2="790"/><line x1="280" y1="96" x2="280" y2="790"/>
<line x1="480" y1="96" x2="480" y2="790"/><line x1="700" y1="96" x2="700" y2="790"/><line x1="900" y1="96" x2="900" y2="790"/>
</g>
<g stroke="#64748b" stroke-width="1.4" marker-end="url(#seq-arrow)">
<line x1="90" y1="126" x2="280" y2="126"/><line x1="280" y1="168" x2="480" y2="168"/>
<line x1="480" y1="210" x2="280" y2="210"/><line x1="280" y1="252" x2="480" y2="252"/>
<line x1="480" y1="294" x2="280" y2="294"/><line x1="280" y1="336" x2="700" y2="336"/>
<line x1="700" y1="378" x2="280" y2="378"/><line x1="280" y1="420" x2="700" y2="420"/>
<line x1="700" y1="462" x2="90" y2="462"/><line x1="90" y1="504" x2="700" y2="504"/>
<line x1="700" y1="546" x2="280" y2="546"/><line x1="280" y1="588" x2="700" y2="588"/>
<line x1="700" y1="630" x2="280" y2="630"/><line x1="280" y1="672" x2="480" y2="672"/>
<line x1="480" y1="714" x2="700" y2="714"/><line x1="480" y1="756" x2="900" y2="756"/>
</g>
<g font-size="11.5" fill="#334155">
<text x="130" y="118">1. 配置 MCP 并连接</text><text x="326" y="160">2. 无 Token 请求</text>
<text x="315" y="202">3. 401 + resource_metadata</text><text x="316" y="244">4. 获取 PRM</text>
<text x="316" y="286">5. resource + authorization_servers</text><text x="422" y="328">6. 获取 AS / OIDC Metadata</text>
<text x="420" y="370">7. Endpoint、PKCE、注册能力</text><text x="412" y="412">8. /authorize + PKCE + resource</text>
<text x="310" y="454">9. 登录、MFA 与同意页</text><text x="310" y="496">10. 用户确认 Scope</text>
<text x="430" y="538">11. redirect_uri?code&amp;state</text><text x="420" y="580">12. /token + code_verifier + resource</text>
<text x="420" y="622">13. Access Token + 可选 Refresh Token</text><text x="324" y="664">14. Authorization: Bearer</text>
<text x="524" y="706">15. JWT / Introspection</text><text x="635" y="748">16. 独立下游凭证</text>
</g>
<rect x="260" y="642" width="440" height="132" rx="10" fill="none" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="6 4"/>
<text x="270" y="790" font-size="11" fill="#2563eb">调用阶段：验证 Token 后仍需执行 Tool、角色、租户与数据级授权</text>
</svg>
<figcaption>图 2：授权码经浏览器返回，Token 通过后端 Token Endpoint 交换；授权请求与 Token 请求都绑定同一个 resource。</figcaption>
</figure>

## 六、阶段二：MCP 服务调用与鉴权的完整时序

1. 用户在办公智能体中选择或触发一个 MCP Tool。
2. 办公智能体先根据本地连接记录确认 Resource、Scope 和 Token 到期时间。每个 HTTP 请求都携带凭证，不能把 MCP Session ID 当作认证依据。
3. 办公智能体使用 `Authorization: Bearer <access-token>` 请求 MCP 服务。启用 DPoP 时改用 DPoP 方案并附带每次请求的证明。
4. MCP 服务从 Header 读取 Token，拒绝 Query String 中的 Token，并设置日志脱敏。
5. JWT 路线：MCP 服务按可信 issuer 选择缓存的 JWK，验证签名、算法、`typ`、`iss`、`aud`、`exp`、`nbf`、`iat`、`client_id`、`scope`、租户和可选 `cnf`。`resource` 请求参数通常落实为 Access Token 的目标 `aud`，不能机械要求 JWT 一定存在名为 `resource` 的 Claim。
6. Introspection 路线：MCP 服务用自己的机密客户端身份调用统一认证授权服务，确认 `active=true`，并检查 `iss`、`aud`、`client_id`、`sub`、`scope`、到期时间和租户信息。
7. MCP 服务得到 `iss + sub` 代表的稳定用户主体、`tenant_id`、`client_id` 和 Scope。手机号、邮箱、显示名只作为可变属性，不能作为跨系统主键。
8. MCP 服务查找 Tool Policy，例如 `documents.search -> documents:read`，再叠加用户角色、部门、数据归属、租户、环境、时间和风险等级等 ABAC 条件。
9. 高风险 Tool 可以要求更高认证强度或最近认证时间。条件不满足时返回可解释的 403，并触发增量授权或二次认证。
10. 判断通过后，MCP 服务为下游业务服务取得独立 Token。可使用面向下游 audience 的 On-Behalf-Of / Token Exchange，也可使用 MCP 服务自己的服务身份并传递经签名、可审计的用户上下文。
11. 下游服务再次执行自身权限判断。MCP Tool 到下游操作应有明确映射，不能让通用 Tool 绕过下游权限。
12. MCP 服务返回最小必要数据，并记录授权决策、Tool、用户、客户端、租户、资源、结果、耗时和关联 ID。日志不得写入原始 Token、授权码或敏感 Tool 参数全文。
13. Access Token 到期时，办公智能体向 Token Endpoint 提交当前 Refresh Token 和 `resource`。统一认证授权服务签发新 Access Token，并按策略轮换 Refresh Token。
14. 检测到旧 Refresh Token 重放时，统一认证授权服务撤销整个 Token Family，要求用户重新授权。
15. 用户解除连接时，办公智能体调用 Revocation Endpoint，优先撤销 Refresh Token，清除本地凭证和连接状态。退出登录、管理员撤权、账号禁用和租户离职也应触发对应撤销策略。

HTTP 状态码应保持清楚：

| 情况 | 状态码 | 建议响应 |
|---|---:|---|
| 没有 Token、Token 格式错误、签名失败、过期、issuer 或 audience 不匹配 | 401 | `WWW-Authenticate: Bearer error="invalid_token"`，可附 `resource_metadata` |
| Token 有效，但 Scope 或业务权限不足 | 403 | `error="insufficient_scope"`，给出当前操作需要的最小 Scope |
| OAuth 请求参数本身错误 | 400 | 标准 OAuth 错误，例如 `invalid_request` |

## 七、统一认证授权服务需要提供的能力

### 1、协议端点

- RFC 8414 Authorization Server Metadata 和 / 或 OIDC Discovery；MCP 兼容部署应让客户端能够得到 PKCE 能力。
- Authorization Endpoint、Token Endpoint、JWK Set Endpoint。
- Token Revocation Endpoint（RFC 7009）。
- Token Introspection Endpoint（RFC 7662），如果采用不透明 Token 或需要实时状态校验。
- 可选的 Dynamic Client Registration Endpoint（RFC 7591）。
- 可选的 Device Authorization Endpoint，用于无头设备。
- 支持 RFC 8707 `resource`，并把它映射为受众受限的 Token。

### 2、身份认证

- 账号密码、企业 SSO、短信、扫码、MFA 等认证方式的统一编排。
- 会话管理、账号锁定、异常登录检测、设备与风险信息。
- `acr`、`amr`、`auth_time` 等认证强度和时间信息，供高风险操作做 Step-up 判断。
- 以 `iss + sub` 为主体主键；在多租户场景中稳定传递 `tenant_id`。

### 3、授权与同意

- 以 `user + client + resource + scope + tenant` 为核心的 Consent Grant。
- 首次授权、增量授权、降权、拒绝和撤销。
- 同意页展示客户端身份、目标 MCP、数据类型、操作范围、期限和风险。
- Scope 目录、描述、多语言文案、风险级别及与 Resource 的合法组合。
- 高风险 Scope 的二次认证、短时授权或逐次确认。

### 4、客户端管理

- 预注册客户端生命周期、Redirect URI、应用名称、所有者和信任等级管理。
- Client ID Metadata Document 的获取、验证、缓存与域名信任策略。
- DCR 的初始访问令牌、配额、审核、软件声明、速率限制和清理机制。
- 公共客户端与机密客户端分级；机密客户端支持可靠的客户端认证和密钥轮换。

### 5、Token 生命周期

- 一次性授权码；受 Client、Redirect URI、PKCE、Resource、Scope 和用户会话绑定。
- 短期 Access Token，支持 JWT 或不透明格式。
- Refresh Token 轮换、Token Family、重放检测、绝对与空闲有效期。
- 撤销、账号禁用、权限变更和风险事件的传播。
- JWT 签名密钥生成、HSM 或等效保护、JWK 发布、`kid` 管理、轮换和重叠窗口。
- 可选 DPoP 或 mTLS 的发送者约束 Token。

### 6、治理与运维

- 登录、认证因子、同意、授权码、Token 签发、刷新、撤销、Introspection 和管理操作审计。
- 按租户隔离数据、密钥、管理员权限和策略。
- 限流、反自动化、可疑客户端注册检测、告警和应急吊销。
- 只向 Token 放入资源服务器真正需要的 Claim，支持日志脱敏和数据保留周期。

## 八、办公智能体需要实现的能力

- MCP Endpoint 配置、TLS 验证、域名提示、连接状态和断开入口。
- `401` 与 `WWW-Authenticate` 解析，以及 RFC 9728 well-known PRM 回退。
- PRM 的 `resource` 精确校验、多授权服务器选择和 SSRF 防护。
- RFC 8414 与 OIDC Discovery，多路径 issuer 发现与 `issuer` 精确校验。
- 预注册、Client ID Metadata Document、DCR 三类 Client ID 获取策略。
- Authorization Code + PKCE S256，安全生成和验证 `state`，精确处理 Redirect URI。
- 浏览器、H5、二维码的授权事务衔接；二维码中不放凭证。
- 在授权请求和 Token 请求中发送相同的 `resource`。
- Scope 最小化、403 增量授权、用户拒绝和取消处理。
- Access Token 自动附加、到期判断、单飞刷新，避免并发刷新造成 Token 重放误报。
- Refresh Token 使用系统凭证库、硬件保护区或服务端加密保险库；不得写入配置文件、日志或普通数据库明文列。
- 以 `issuer + resource + client_id + tenant + subject` 隔离凭证，防止跨 MCP 选错 Token。
- 撤销、清除、账号切换、租户切换和 Token Family 失效后的重新授权。
- 可选 DPoP 密钥生成与每请求证明。

Web 端还需要区分两种形态。纯浏览器 SPA 属于公共客户端，不能保存 Client Secret；更稳妥的企业办公应用通常采用 BFF，由服务端作为机密客户端持有 Refresh Token，浏览器只持有受保护的站内会话。桌面端和移动端也属于公共客户端，应依赖 PKCE、精确 Redirect URI、系统安全存储和 Refresh Token 轮换，不能把内置 Secret 当作秘密。

## 九、MCP 服务需要实现的能力

- RFC 9728 Protected Resource Metadata，以及 `WWW-Authenticate` 或 well-known 发现入口。
- 为每个公开 MCP Endpoint 定义唯一、稳定、HTTPS 的规范 Resource Identifier。
- Bearer / DPoP Header 解析，拒绝 URL Query Token。
- JWT 验证器或 Introspection Client；可信 issuer、audience、算法和 JWK 配置不得由请求方控制。
- Token Claim 到安全上下文的映射：主体、租户、客户端、Scope、角色、认证强度。
- Tool 权限注册表：每个 Tool 对应的最小 Scope、业务角色、数据域、风险级别和是否需要 Step-up。
- 401、403 和 `insufficient_scope` Challenge；支持增量授权。
- 租户隔离、对象级和行级权限，不能只检查 Tool 名称。
- 下游独立凭证、Token Exchange / On-Behalf-Of 或服务身份方案，禁止 Token Passthrough。
- 审计、限流、幂等、敏感操作确认、异常检测和关联追踪。
- 在统一认证授权服务短时不可用时的明确降级策略。

统一认证授权服务不可用时，JWT 本地验证可以继续接受签名有效且未过期的 Token，前提是 JWK 已安全缓存。新 `kid` 无法获取、Token 已过期或刷新失败时应拒绝，不能跳过校验。Introspection 方案默认 Fail Closed；可以使用很短的正向缓存维持只读请求，但高风险写操作不宜依赖过期状态。

## 十、Token 与身份数据模型建议

### 1、主体模型

用户稳定主键建议使用：

```text
subject_key = issuer + "|" + sub
tenant_subject_key = issuer + "|" + tenant_id + "|" + sub
```

`sub` 只在对应 issuer 的命名空间内有意义。手机号、邮箱、工号、昵称都可能变化，也可能被回收或在不同租户重复，适合作为属性和检索入口，不适合作为授权主键。对外部 MCP 可以使用 pairwise subject，减少跨服务关联用户的能力。

### 2、授权 Grant

```json
{
  "grant_id": "gr_...",
  "issuer": "https://auth.example.com/tenant-a",
  "subject": "user-opaque-id",
  "tenant_id": "tenant-a",
  "client_id": "https://agent.example.com/oauth/client.json",
  "resource": "https://mcp.example.com/mcp",
  "scopes": ["documents:read", "documents:write"],
  "consented_at": "2026-07-16T01:30:00Z",
  "expires_at": "2026-10-14T01:30:00Z",
  "status": "active",
  "auth_context": { "acr": "mfa", "amr": ["pwd", "otp"] }
}
```

Grant 表达用户的长期同意。Token 是这个 Grant 在一段时间内、面向特定 Resource 的可用凭证。二者应分开建模，这样才能做到撤销同意、轮换 Refresh Token，又保留完整审计历史。

### 3、凭证生命周期建议

| 凭证 | 生成方 | 主要保存方 | 建议期限 | 关键控制 |
|---|---|---|---|---|
| 授权码 | 统一认证授权服务 | 浏览器只负责传递；办公智能体短暂接收 | 60—120 秒 | 一次性；绑定 Client、Redirect URI、PKCE、Resource、Scope |
| Access Token | 统一认证授权服务 | 办公智能体；MCP 服务仅在请求时接收 | 常规 5—15 分钟；高风险更短 | audience 限定；最小 Scope；不得记录原文 |
| Refresh Token | 统一认证授权服务 | 仅办公智能体的安全存储 | 空闲 7—30 天；绝对 30—90 天，可按风险调整 | 轮换、Token Family、重放检测、撤销 |

这些数字是通用工程基线，不是 OAuth 强制值。企业应根据数据敏感度、交互成本、设备可信度和撤销时效设定。

### 4、JWT Access Token 建议

采用 RFC 9068 Profile 时，建议包含并校验：

| 字段 | 用途 | MCP 服务的检查 |
|---|---|---|
| Header `typ` | 区分 Access Token 与其他 JWT | 应为 `at+JWT` |
| Header `alg`, `kid` | 选择算法与签名密钥 | 算法白名单；拒绝 `none`；按可信 JWKS 找 `kid` |
| `iss` | Token 签发方 | 与配置的统一认证授权服务 issuer 完全一致 |
| `sub` | 用户主体 | 与 `iss` 组合使用；不得信任客户端自报用户 ID |
| `aud` | 目标 Resource | 必须包含当前 MCP 的唯一 audience |
| `exp`, `nbf`, `iat` | 时间约束 | 校验过期、尚未生效和异常签发时间，只允许很小的时钟偏差 |
| `jti` | Token 唯一标识 | 审计、撤销名单或重放分析 |
| `client_id` | 获得 Token 的 OAuth Client | 用于客户端级策略和审计 |
| `scope` | 被授予的委托范围 | 与 Tool 所需 Scope 做集合判断 |
| `tenant_id` | 租户边界 | 与请求资源、连接和数据行的租户一致 |
| `roles` / `entitlements` | 资源相关授权属性 | 只接受 issuer 签发且与该 Resource 有意义的值 |
| `cnf` | 发送者约束公钥 | 使用 DPoP / mTLS 时验证持有证明 |
| `auth_time`, `acr`, `amr` | 最近认证与强度 | 高风险 Tool 的 Step-up 判断依据 |

`resource` 是授权请求与 Token 请求参数。对于 JWT，它通常决定 `aud`。如果自定义 Token Profile 还放入 `resource` Claim，可以额外验证；不能用自定义 Claim 代替 `aud` 校验。

### 5、Scope、Tool 与业务权限

Scope 适合表达稳定、可向用户解释的能力，例如：

```text
documents:read
documents:write
approval:read
approval:submit
contacts:read
```

不建议为每一个动态 Tool 或每一条数据生成 Scope。更合适的映射是：

```text
允许执行 = Token 有所需 Scope
        AND 用户拥有业务角色
        AND 用户可访问目标对象
        AND 租户一致
        AND 当前认证强度满足风险策略
```

例如，`approval.submit` 需要 `approval:submit`，还要检查发起人是否属于目标组织、金额是否超过审批额度、数据是否属于当前租户。用户认证成功不会绕过这些条件。

## 十一、JWT 本地校验与 Token Introspection 对比

| 维度 | JWT 本地校验 | Token Introspection |
|---|---|---|
| Token 形态 | 自包含、已签名 JWT | 常见为不透明 Token，也可查询其他 Token |
| 每次调用依赖 | 无需实时调用统一认证授权服务 | 通常需要网络调用，可短时缓存 |
| 延迟与吞吐 | 低延迟，适合高并发 | 延迟较高，受授权服务容量影响 |
| 撤销生效 | 默认等到 Token 到期；需短 TTL、黑名单或事件补强 | 可在下一次查询时立即反映 `active=false` |
| 信息暴露 | Claim 对持有者可读，应最小化 | Token 本身不暴露 Claim |
| 密钥管理 | MCP 服务需缓存和轮换 JWK | MCP 服务需安全保存 Introspection 客户端凭证 |
| 授权服务故障 | 已缓存 JWK 时可继续验未过期 Token | 默认无法确认状态，应 Fail Closed |
| 适用场景 | 高吞吐、低延迟、允许数分钟撤销窗口 | 高敏感、强实时撤销、跨域 Claim 不宜暴露 |

推荐采用风险分层：普通读操作使用 5—10 分钟 JWT，本地校验；高风险写操作可以使用不透明 Token + Introspection，或在 JWT 校验后再查询高风险授权状态。无论哪种方案，MCP 服务都要做 Tool 和业务级权限判断。

## 十二、客户端注册方案对比

| 方案 | 优点 | 局限 | 推荐场景 |
|---|---|---|---|
| 预注册 | 信任最强；可人工审核名称、所有者、Redirect URI 和权限；容易封禁 | 跨组织接入慢；运维成本高 | 企业自有办公智能体、核心和高风险 MCP |
| Client ID Metadata Document | Client ID 直接使用 HTTPS 元数据 URL；无需向每个授权服务器写注册数据；适合未知客户端与 MCP 开放生态 | 当前仍是 IETF 草案；客户端要托管 HTTPS 文档；授权服务器要防 SSRF、缓存投毒和元数据变更 | 跨组织、开放生态；双方支持当前 MCP 推荐机制时 |
| 动态客户端注册（RFC 7591） | 标准成熟；自动化好；兼容既有 MCP 实现 | 暴露写入型注册端点；容易被批量注册、数据库膨胀和伪造应用身份滥用 | 兼容旧部署；配合 Initial Access Token、软件声明、配额和审核 |
| 用户手工输入 Client ID | 实现简单；可作兜底 | 易配置错；体验差；难验证应用身份 | 管理员调试或封闭环境临时接入 |

当前 MCP 规范给出的优先顺序是：已有预注册信息时先用预注册；否则在授权服务器声明支持时使用 Client ID Metadata Document；再以 DCR 作为回退；最后才让用户手工输入。

公共客户端不能安全保存 Client Secret。把 Secret 编译进桌面程序、移动 App 或前端 JavaScript，只会把它变成可提取的公开字符串。机密 Web/BFF 客户端可以在受控服务端保存 Secret，最好使用非对称客户端认证或等效的可轮换机制。

Redirect URI 必须精确注册和精确比较。桌面端可使用 loopback `localhost` 回调并配合随机端口；移动端优先使用可验证归属的 HTTPS App Link / Universal Link。所有场景都要结合 PKCE 和 `state`，防止授权码被其他客户端截获和登录事务错绑。

## 十三、下游系统访问方案

MCP 服务不能把办公智能体传入的 Token 原样交给下游。当前 MCP 安全规范明确禁止 Token Passthrough，原因包括 audience 混乱、控制绕过、审计失真和混淆代理攻击。

推荐三种模式：

| 模式 | 做法 | 适用条件 |
|---|---|---|
| Token Exchange / On-Behalf-Of | MCP 服务用入站用户 Token 的授权上下文换取 `aud=下游服务` 的短期 Token | 下游需要明确用户委托；统一认证授权服务与下游支持交换 |
| MCP 服务身份 + 用户上下文 | MCP 服务以自己的服务 Token 调用下游，同时传递经验证、签名或受信通道保护的 `sub`、`tenant`、`client_id`、授权决策 ID | 企业内部服务间信任成熟；下游能同时审计 actor 与 subject |
| MCP 服务维护独立用户授权 | MCP 服务作为下游 OAuth Client，单独为用户取得下游 Token | 第三方下游有自己的授权服务器，无法纳入统一 Token Exchange |

审计链至少保留：最终用户 `sub`、办公智能体 `client_id`、MCP 服务身份、下游服务身份、原始授权 Grant、Tool 名、资源对象和全链路 `correlation_id`。下游 Token 的 audience、scope 和生命周期都应独立于 MCP Token。

## 十四、主要安全风险及应对措施

| 风险 | 典型表现 | 应对措施 |
|---|---|---|
| Token 泄漏 | 日志、配置文件、浏览器存储、崩溃报告出现 Token | Header 传递；日志脱敏；短期 Access Token；安全存储 Refresh Token；最小 Scope |
| Token 重放 | 被窃取的 Bearer Token 在同一服务重复使用 | 短 TTL；DPoP / mTLS；高风险操作幂等与二次确认；异常检测 |
| 跨 MCP 使用 | MCP-A 接受发给 MCP-B 的 Token | 授权和换 Token 都带 `resource`；Access Token audience 限定；MCP 严格校验 `aud` |
| 混淆代理 | MCP 接受或向下游透传错误 Token | 禁止 Token Passthrough；下游独立 Token；验证 actor、subject 和 audience |
| 授权码截获 | 恶意应用抢占回调或复用授权码 | Authorization Code + PKCE S256；精确 Redirect URI；一次性短码；验证 `state` |
| 登录 CSRF / 二维码错绑 | 用户给错误设备或攻击者事务完成授权 | 高熵事务；设备双端显示一致信息和校验码；短时一次性二维码；操作确认 |
| 恶意元数据与 SSRF | MCP 地址诱导智能体访问内网、云元数据或恶意授权服务器 | HTTPS；IP / DNS / 重定向策略；大小和超时限制；`resource` 精确校验；信任关系白名单 |
| 客户端冒充 | DCR 伪造知名应用名称或批量注册 | 预注册；HTTPS Client ID Metadata；软件声明；注册配额、审核、域名验证和速率限制 |
| Refresh Token 重放 | 旧 Refresh Token 被再次使用 | 每次刷新轮换；Token Family；重放即整族撤销；并发刷新单飞 |
| 撤销不及时 | JWT 仍在有效期内继续调用 | Access Token 短 TTL；撤销事件 / 黑名单；高风险 Introspection；权限版本 Claim |
| 租户串用 | Token 属于租户 A，却访问租户 B 数据 | issuer / tenant / subject 三者绑定；连接和缓存按租户隔离；数据查询强制租户条件 |
| JWK 轮换故障 | 新旧 Key 切换导致误拒绝或继续信任失陷 Key | `kid`；新旧 JWK 重叠；缓存上限；紧急吊销；监控未知 `kid`；禁止从 Token 指定任意 JWKS |
| 权限变化不同步 | 用户离职或角色变化后旧 Token 仍有效 | 短 Token；Introspection；权限版本；事件通知；Refresh 时重算权限 |
| 敏感信息扩散 | Token 和日志携带手机号、组织架构、Tool 参数全文 | Claim 最小化；使用不透明 `sub`；字段级脱敏；审计与业务正文分离；设定保留周期 |

签名 Key 建议在受保护的密钥系统中生成和使用，私钥不得进入应用配置。轮换时先发布新公钥，再签发新 `kid` 的 Token，保留旧公钥直到所有旧 Token 的最大生命周期结束。发生私钥泄漏时需要走紧急吊销流程，不能只等待自然过期。

## 十五、对原始 11 步方案的合理性评估

### 1、合理的内容

- 办公智能体主动访问 MCP，由受保护资源给出认证发现信息，方向正确。
- MCP 服务作为 Resource Server，统一认证授权服务作为 Authorization Server，职责划分正确。
- 用户通过浏览器、H5 或二维码完成认证与同意，符合用户代理参与授权的思路。
- 办公智能体持 Access Token 调用 MCP，MCP 服务验证 Token 并结合 Tool 业务权限做最终判断，方向正确。
- Access Token 过期后由办公智能体刷新，用户解除连接或撤销后使凭证失效，生命周期方向正确。

### 2、明确错误

**没有发现已经明确描述、且可以直接判定违反标准的步骤。**

这里需要保持克制。概要方案没有写到某个安全参数，通常属于“尚未展开”；语句可能包含多种实现方式，则属于“设计歧义”。不能因为没看到细节，就直接下结论说方案错误。

### 3、设计歧义

| 原始表述 | 歧义 | 需要明确的设计 |
|---|---|---|
| “MCP 服务通过 401、WWW-Authenticate 和 Protected Resource Metadata 告知入口” | 容易理解为三者每次都必须同时出现 | 当前 MCP 规范允许 `WWW-Authenticate resource_metadata` 与 well-known 两种 PRM 发现方式；客户端要同时支持，Header 存在时优先使用 |
| “用户通过浏览器、H5 或二维码完成认证及授权确认” | 没说明二维码是授权 URL、设备码还是自定义登录 | 能接收回调时使用同一 Authorization Code + PKCE 事务；无头设备再考虑 RFC 8628；二维码不承载 Token |
| “统一认证授权服务向办公智能体签发授权结果” | “授权结果”可能指授权码，也可能指 Access Token | 前通道应返回一次性授权码；Access Token 由办公智能体通过后通道 Token Endpoint 换取 |
| “办公智能体获得 Access Token 和 Refresh Token” | 容易被理解为 Refresh Token 必然签发 | Access Token 是调用凭证；Refresh Token 是否签发取决于客户端、Scope 和策略 |
| “MCP 服务校验 Token，取得用户身份和授权范围” | 没说明 JWT 或 Introspection，也没说明 audience | 必须验证 issuer、目标 audience、时间、client、scope、tenant 等；`resource` 应落实到目标 audience |
| “用户退出登录后相关凭证失效” | OAuth 授权、统一登录会话和某个办公智能体本地会话可能是三件事 | 要定义退出范围：仅退出智能体、结束统一登录会话、撤销某个 Grant，或全局撤销全部 Token |

### 4、尚未展开

- Authorization Code + PKCE、`state`、Redirect URI 精确匹配。
- 授权请求与 Token 请求中的 `resource`，以及 Access Token audience 绑定。
- RFC 9728 PRM 的 `resource` 校验、多授权服务器选择和 SSRF 防护。
- RFC 8414 与 OIDC Discovery 的路径规则和 issuer 校验。
- 预注册、Client ID Metadata Document、DCR 的选择与反滥用。
- Scope 与 Tool、角色、对象级权限、租户和 Step-up 的映射。
- JWT / Introspection 选型、统一认证授权服务故障时的策略。
- Refresh Token 安全存储、轮换、重放检测和 Token Family。
- 撤销对短期 JWT、缓存和下游 Token 的传播方式。
- 下游 Token 隔离、Token Exchange 与完整审计链。
- JWK 轮换、Claim 最小化、日志脱敏、限流和事件告警。

## 十六、推荐架构

推荐采用“发现层、授权层、资源授权层、下游委托层”四层结构。

### 1、发现层

每个 MCP Endpoint 发布 RFC 9728 PRM。办公智能体从 401 Challenge 或 well-known 地址发现 PRM，再通过 `authorization_servers` 找到统一认证授权服务。客户端验证 `resource`、issuer、TLS 和信任关系，并完成 SSRF 防护。

### 2、授权层

统一认证授权服务处理认证、MFA、Consent、Client 和 Token。桌面、移动、SPA 都按公共客户端处理，使用 Authorization Code + PKCE；企业 Web 应用优先采用 BFF 机密客户端。授权与 Token 请求都带 `resource`。

### 3、资源授权层

MCP 服务只接受 audience 为自己的 Access Token。Token 通过后，还要执行 Scope、Tool Policy、角色、租户、对象级权限和风险策略。高风险 Tool 采用增量授权、最近 MFA 或逐次确认。

### 4、下游委托层

MCP Token 停在 MCP 服务边界。调用下游时换取面向下游的独立 Token，或使用服务身份加可审计用户上下文。每一跳都有独立 audience、最小 Scope 和审计主体。

## 十七、落地步骤

### 第 0 步：先建立资产清单

列出全部 MCP Endpoint、Tool、数据等级、下游系统、租户边界和高风险操作。没有这张表，Scope 会变成随意命名，Consent 也无法说清用户授权了什么。

### 第 1 步：定义 Resource 与 Scope

为每个 MCP 设定唯一、稳定的 HTTPS Resource Identifier。建立 `Tool -> Scope -> 业务角色 -> 数据条件 -> 风险等级` 权限矩阵，先覆盖只读与低风险 Tool。

### 第 2 步：打通标准发现

MCP 服务发布 PRM；统一认证授权服务发布 RFC 8414 / OIDC Discovery；办公智能体实现 401、well-known、issuer 路径、元数据校验和 SSRF 防护。

### 第 3 步：完成授权码 + PKCE

先选择客户端注册策略，注册精确 Redirect URI。实现 `state`、PKCE S256、浏览器回调、`resource` 双请求携带、最小 Scope 和拒绝处理。二维码只做同一事务的入口展示。

### 第 4 步：建立 Token 基线

低风险场景先用 5—10 分钟 JWT Access Token，Refresh Token 轮换。MCP 严格校验 `iss`、`aud`、时间、`client_id`、Scope 和租户。高风险 Tool 再引入 Introspection、DPoP 或更短 Token。

### 第 5 步：接入业务授权

把每个 Tool 接入权限矩阵和对象级数据过滤。统一测试 401、403、增量授权、跨租户、账号禁用、角色变化和并发刷新。

### 第 6 步：隔离下游 Token

逐个下游选择 Token Exchange、服务身份加用户上下文，或独立用户 OAuth。禁止原样透传 MCP Token，并在下游再次验证 audience 与权限。

### 第 7 步：补齐撤销和审计

实现 Revocation Endpoint、Token Family、重放检测、权限变更事件、JWK 轮换和端到端关联 ID。做一次完整演练：用户撤销、员工离职、客户端被封禁、Key 泄漏后，多久能让所有调用停止。

### 第 8 步：分风险上线

第一批只开放只读 Tool；第二批开放可逆写操作；敏感、不可逆或涉及资金与外发的 Tool 最后上线，并增加逐次确认、MFA、幂等键和人工审批。

## 十八、最终判断

原始架构方向正确，可以作为概要蓝图。它目前停在“角色和主流程”层面，离可上线的安全设计还差四个决定性细节：目标 Resource 绑定、公共客户端 PKCE、MCP 与下游 Token 隔离、撤销与业务权限闭环。

最稳妥的实现方式，是让每一方只相信自己能验证的内容。办公智能体不自报用户身份，MCP 服务不接受错误 audience，统一认证授权服务不替业务系统决定对象权限，下游也不接受上一跳的通用 Token。这样，办公智能体获得的是一段可限制、可审计、可撤销的用户委托。

## 十九、信息来源与说明

- 主要资料为 2026-07-16 可访问的 MCP 2025-11-25 授权规范及 IETF 正式 RFC。OAuth 2.1 当时仍是草案：MCP 规范引用 draft-13，IETF Datatracker 当前为 2026-03-02 更新的 draft-15，不能写成已经发布的 RFC。

### MCP 官方资料

- [MCP 2025-11-25 Authorization Specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [MCP Client Registration 演进说明](https://blog.modelcontextprotocol.io/posts/client_registration/)

### IETF 与开放标准

- [OAuth 2.1 Authorization Framework 当前草案](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/)
- [RFC 9728：OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 8414：OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414)
- [RFC 8707：Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707)
- [RFC 9700：Best Current Practice for OAuth 2.0 Security](https://datatracker.ietf.org/doc/html/rfc9700)
- [RFC 7636：Proof Key for Code Exchange](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 9068：JWT Profile for OAuth 2.0 Access Tokens](https://datatracker.ietf.org/doc/html/rfc9068)
- [RFC 7662：OAuth 2.0 Token Introspection](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009：OAuth 2.0 Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)
- [RFC 7591：OAuth 2.0 Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591)
- [RFC 8693：OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693)
- [RFC 8628：OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- [RFC 9449：OAuth 2.0 Demonstrating Proof of Possession](https://datatracker.ietf.org/doc/html/rfc9449)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)

（完）
