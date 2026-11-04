---
title: MCP 2026-07-28：无状态协议内核与实现边界
category: topics
topic_type: tech
content_type: analysis
subjects: [ai_dev]
date: 2026-07-29
time: 09:05
updated: 2026-11-04
tags: [MCP, Model Context Protocol, 无状态协议, AI Agent, Serverless, OAuth, SDK, Streamable HTTP]
summary: 对照 MCP 官方 2026-07-28 规范与 changelog：协议层去掉会话与 initialize；业务状态改显式句柄；MRTR、标准请求头与废弃策略补生产机制。区分规范文本与各实现的支持矩阵。
tldr: 无状态只覆盖协议内核——每个请求自带版本与能力，负载均衡不再依赖 MCP 会话粘滞。跨调用状态、用户确认、订阅流仍在，只是换了承载方式。迁移不能只删 Mcp-Session-Id；实现是否跟上以各 SDK/平台兼容表为准，不以「支持 MCP」四字代替。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **`2026-07-28` 是 MCP 稳定规范修订**，官方博客与规范 changelog 均以该日期标识；相对上一稳定修订 `2025-11-25`，最大变化是**协议级无状态**。[博客](https://blog.modelcontextprotocol.io/posts/2026-07-28/) · [changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
2. **删除**：`initialize` / `notifications/initialized` 握手、`Mcp-Session-Id`、旧 HTTP GET 流与 SSE 断点续传（`Last-Event-ID`）等协议会话机制。
3. **补上**：每请求 `_meta` 携带协议版本与客户端能力；必需的 `server/discover`；MRTR（`resultType: input_required`）；Streamable HTTP 上的 `Mcp-Method` / `Mcp-Name`；列表结果的 `ttlMs` / `cacheScope`；授权加固与正式废弃策略。
4. **「无状态」≠ 业务无状态，≠ 没有流**：工具句柄、数据库、浏览器实例仍可有状态；请求范围内的进度流与 `subscriptions/listen` 仍在。
5. **下载量与生态背书是项目方叙述**：博客写 Tier 1 SDK「接近每月半十亿次下载、TS/Python 累计各超 10 亿」——标为官方博客口径，不据此推断生产渗透率。

## 二、事实层：规范文本钉死的变更

### 2.1 相对 2025-11-25 的主要变更（changelog）

官方 Key Changes 可核对的要点包括：

| 主题 | 规范要求（摘要） |
|---|---|
| 会话 | 移除协议级会话与 `Mcp-Session-Id`；跨调用状态用服务端铸造、作为普通工具参数回传的显式句柄（SEP-2567） |
| 握手 | 移除 `initialize` / `initialized`；每请求 `_meta` 携带 `protocolVersion`、`clientCapabilities`；客户端宜带 `clientInfo`（SEP-2575） |
| 发现 | 服务端 **MUST** 实现 `server/discover` |
| 订阅 | 以 `subscriptions/listen` 取代独立 GET 流与旧 `resources/subscribe`；请求级 progress/message 仍跟原请求响应流 |
| MRTR | 服务端返回 `InputRequiredResult`；客户端带 `inputResponses` 重试原请求（SEP-2322）；结果必有 `resultType` |
| 请求头 | Streamable HTTP POST 需要标准 `Mcp-Method`，以及适用时的 `Mcp-Name`（SEP-2243） |
| 缓存 | `tools/list` 等结果带 `ttlMs`、`cacheScope`（SEP-2549） |
| Tasks | 实验性 tasks 移出核心，进入 `io.modelcontextprotocol/tasks` 扩展（SEP-2663） |

权威入口：[specification/2026-07-28/changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)。

### 2.2 无状态请求长什么样（示意）

官方博客示例（字段以现行规范 schema 为准）：

```http
POST /mcp HTTP/1.1
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: search
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/call",
 "params":{"name":"search","arguments":{"q":"stateless MCP"},
 "_meta":{"io.modelcontextprotocol/clientInfo":{"name":"example-client","version":"1.0.0"}}}}
```

任意实例可处理该请求，前提是业务句柄与授权状态可被该实例解析——那已超出协议会话范围。

### 2.3 废弃与生命周期

changelog / 博客写明：Roots、Sampling、Logging 进入 Deprecated；DCR 正式偏向 CIMD；HTTP+SSE 在生命周期政策下重申废弃。一般情况下，从 Deprecated 到具备 Removed 资格至少 12 个月；**到期不自动删除**，仍需后续规范版本决定。具体以 [deprecated 注册表](https://modelcontextprotocol.io/specification/2026-07-28/deprecated) 与 SEP-2596 为准。

授权侧：授权响应宜带 RFC 9207 `iss`，客户端在兑换授权码前必须校验；凭据按 issuer 隔离（SEP-2468 / SEP-2352）。

### 2.4 协议文本 vs 实现（必须拆开）

| 层 | 能证明什么 | 不能证明什么 |
|---|---|---|
| 规范 + SEPs | 线上行为应满足的合同 | 某云厂商「已 100% 支持」 |
| Tier 1 SDK 发布说明 | 官方维护的语言 SDK 是否声明支持该修订 | 你依赖的第三方 server 已迁移 |
| 平台 changelog（如 Cloudflare Agents） | 该产品在某版本声明的客户端/服务端能力 | 全生态同日齐步 |

Cloudflare 文档称其托管 MCP servers 支持 **MCP 2026-07-28** 以及来自 2025 Streamable HTTP 客户端的无状态请求——这是**平台文档声明**，选型时仍应对照你使用的 SDK 小版本与兼容矩阵。[Cloudflare MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)

## 三、结构：迁移真正卡住的地方

无状态内核降低的是传输层耦合：轮询负载均衡、Serverless、边缘运行时更容易承载远程 MCP。卡住生产迁移的通常是四条链路，而不是「删不删 Session-Id」这一下：

1. **会话依赖盘点**：哪些数据曾挂在协议会话上？应改成显式句柄、每请求 `_meta`，或删除。
2. **服务端发起请求**：旧 elicitation / sampling / roots 路径 → MRTR 或停止扩展已废弃能力。
3. **传输与订阅**：独立 GET 流、`Last-Event-ID`、`resources/subscribe` → `subscriptions/listen`；断线恢复放到应用层可重试状态。
4. **网关与安全**：补齐标准请求头；校验头与 JSON-RPC 体一致；OAuth `iss` 与凭据按 issuer 分区；过渡期双版本（`2025-11-25` 与 `2026-07-28`）跑真实客户端与失败重试。

句柄设计的代价也属结构问题：作用域、权限、有效期、幂等、高风险操作不能只凭可猜测 ID。协议只传递标识；状态建模仍在应用侧。

## 四、外部研判

这次修订的外部意义，集中在**远程 MCP 的可运维性**：把「像普通 HTTP 服务一样扩」从绕路变成规范默认。对已经上线的有状态会话实现，稳妥路径是双版本并行再切流量，而不是宣传日当天硬切。

生态背书（云厂商引言、SDK 下载口径）说明关注度高；是否值得你升级，仍取决于：客户端是否已支持 `server/discover` 与 MRTR、网关能否读 `Mcp-Method`、业务句柄与幂等是否就绪。

## 五、信息来源与持续验证

资料复核截至 **2026-11-04（Asia/Shanghai）**。

- [The 2026-07-28 Specification（官方博客）](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [Key Changes / changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [SEP 索引入口（见 changelog 引用）](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [Cloudflare managed MCP servers（实现声明）](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)

### 持续验证

- 若后续稳定修订再次移动 Tasks / MRTR / 废弃窗口，第二节表需按新 changelog 替换，不能沿用 2026-07-28 这个日期标题。
- 生产选型前，对你依赖的每一个 MCP server / 宿主（IDE、Agents 运行时）单独核对「声明支持的协议版本」，缺同口径声明则不写入「已兼容」结论。
