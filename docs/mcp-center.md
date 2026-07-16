# MCP 中心与文章服务

## 对外端点

- 页面：`https://2aran.com/mcp-center`
- Streamable HTTP：`https://2aran.com/api/mcp/articles`
- 工具：`get_recent_articles`、`search_articles`
- 数据边界：只返回已公开内容的标题、摘要、标签、日期和原文链接；加密调研、正文、用户数据与后台能力不进入服务。

服务使用无状态 Streamable HTTP。它支持 `initialize`、`ping`、`tools/list`、`tools/call` 和客户端通知；不创建会话，也不提供 GET SSE 流。

## 安全开关

公开文章本身无需登录，因此默认允许匿名只读访问。若要限制给指定客户端使用，在 Cloudflare Pages 环境中添加 Secret：

```bash
npx wrangler pages secret put MCP_ARTICLES_API_KEY --project-name tuaran-me
```

客户端随后需要发送：

```http
Authorization: Bearer <token>
```

不要把 Token 写进仓库、页面示例、查询参数或日志。轮换 Token 时先让客户端切到新值，再删除旧值；如果需要并行轮换，应把单值开关升级成独立的凭据表或 OAuth 授权服务。

## 上线检查

1. 在 Cloudflare WAF 为 `/api/mcp/articles` 再配置一层 IP 限流。应用内基线是每 IP 每分钟 60 次、每天 1000 次；D1 不可用时会降级，因此 WAF 是生产兜底。
2. 只允许 `POST` 执行 JSON-RPC；请求体上限 32 KiB。浏览器请求会校验 `Origin`，非浏览器 MCP 客户端通常不发送 `Origin`。
3. 监控 401、403、413、429 和 JSON-RPC 错误率，不记录 Authorization 请求头或完整请求体。
4. 新增工具前重新判断权限。私有内容、付费内容、写操作和后台操作应拆成独立 MCP，并使用 OAuth 2.1、用户级 scope、操作确认和审计日志。
5. 内容索引迁移或同步失败时，服务会回落到构建期公开目录；后台手工登记的最新内容要进入 MCP，需要 D1 `content_index` 正常且状态为 `published`。

## 冒烟请求

```bash
curl https://2aran.com/api/mcp/articles \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"smoke-test","version":"1.0"}}}'
```

初始化成功后再请求 `tools/list` 和 `tools/call`；后续请求带上协商后的 `MCP-Protocol-Version`。
