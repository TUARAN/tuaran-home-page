# MCP 中心、文章服务与 OAuth

## 架构边界

```text
MCP Client
  ├─ OAuth discovery / Authorization Code + PKCE
  ▼
2aran Authorization Server
  ├─ 复用本站登录 session，只负责认证、同意、发码、换 Token、刷新与撤销
  ▼
Articles MCP Resource Server
  └─ 只验证 Access Token 的状态、audience(resource) 与 articles:read scope
```

站点 Cookie 不会成为 MCP 凭证，MCP Access Token 也不会反向成为站点登录 Cookie。授权中心和 Resource Server 只通过 OAuth 数据契约协作。

## 端点

- MCP：`https://2aran.com/api/mcp/articles`
- Protected Resource Metadata：`https://2aran.com/.well-known/oauth-protected-resource/api/mcp/articles`
- Authorization Server Metadata：`https://2aran.com/.well-known/oauth-authorization-server`
- Authorization Endpoint：`https://2aran.com/oauth/authorize`
- Token Endpoint：`https://2aran.com/api/oauth/token`
- Dynamic Client Registration：`https://2aran.com/api/oauth/register`
- Revocation Endpoint：`https://2aran.com/api/oauth/revoke`

授权使用 `authorization_code` 和 `refresh_token` grant。公共 MCP Client 必须使用 PKCE S256，并在授权请求和 Token 请求中携带完全一致的 `resource=https://2aran.com/api/mcp/articles`。

## Token 策略

- Access Token：不透明随机值，数据库只保存 SHA-256；15 分钟有效。
- Refresh Token：不透明随机值，30 天有效；每次使用都轮换。
- 检测到旧 Refresh Token 重放时，撤销整个 Token Family。
- Scope：当前只有 `articles:read`。
- Audience：严格绑定完整 MCP endpoint，不接受本站 session、其他站点 Token 或 query-string Token。

## DCR 安全边界

开放 Dynamic Client Registration 是为了兼容通用 MCP Client，但只接受：

- `authorization_code` / `refresh_token`
- `token_endpoint_auth_method=none`
- HTTPS redirect URI、HTTP localhost loopback URI，或 WorkBuddy 固定格式的 `workbuddy://workbuddy/mcp/<config-id>/oauth/callback`
- 最多 5 个 redirect URI
- 每 IP 每小时 20 次注册

服务不会读取客户端提供的 metadata URL，避免 DCR 引入 SSRF。

## 部署

必须先应用 D1 migration：

```bash
npx wrangler d1 migrations apply tuaran-me --remote
```

随后部署应用。迁移未完成时，授权服务返回 `temporarily_unavailable`，MCP 不会降级成匿名模式。

线上还应在 Cloudflare WAF 对以下路径设置限流：

- `/api/mcp/articles`
- `/api/oauth/register`
- `/api/oauth/token`
- `/api/oauth/authorize`

监控 401、403、429、授权拒绝、Token 刷新重放和撤销事件；禁止记录授权码、Access Token、Refresh Token、PKCE verifier 或完整 Authorization Header。

## 完整流程

1. Client 不带 Token 请求 MCP，收到 401 与 `resource_metadata`。
2. Client 读取 Protected Resource Metadata 和 Authorization Server Metadata。
3. Client 动态注册，并生成 `state`、`code_verifier`、S256 `code_challenge`。
4. 浏览器进入 `/oauth/authorize`；未登录时先进入本站登录，随后返回授权页。
5. 用户确认 `articles:read`，Authorization Server 返回一次性授权码。
6. Client 使用授权码、PKCE verifier 和相同 resource 换取 Token。
7. Client 在每个 MCP 请求中发送 `Authorization: Bearer <access-token>`。
8. Access Token 到期后使用 Refresh Token 轮换；解除连接时调用 Revocation Endpoint。

## 本地 stdio Demo

仓库同时提供一个不走 HTTPS/OAuth 的本地加解密 MCP Demo。WorkBuddy 通过 `command` + `args` 在本机拉起 Node.js 子进程，以 stdin/stdout 传输 JSON-RPC。完整配置、自测和安全边界见 [mcp-stdio-demo.md](./mcp-stdio-demo.md)。
