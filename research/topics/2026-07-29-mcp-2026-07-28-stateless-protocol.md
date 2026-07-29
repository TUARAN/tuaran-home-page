---
title: MCP 2026-07-28：无状态协议如何改变部署、交互与迁移
category: topics
topic_type: tech
content_type: analysis
date: 2026-07-29
time: 09:05
tags: [MCP, Model Context Protocol, 无状态协议, AI Agent, Serverless, 边缘计算, OAuth, SDK]
summary: MCP 2026-07-28 移除了协议级会话和初始化握手，让远程 MCP 服务可以按普通 HTTP 服务横向扩展；多轮输入、显式状态句柄、标准请求头和正式废弃策略补上了生产部署所需的机制。
tldr: 这次升级改变的是 MCP 的协议内核。每个请求独立携带版本和能力信息，负载均衡器不再依赖会话粘滞；跨请求状态由业务层句柄显式传递，用户确认由 MRTR 的“返回输入要求、补充答案、重试原请求”完成。生产迁移需要同时检查会话状态、服务端发起请求、订阅、缓存、鉴权和双版本兼容，不能只删除 Mcp-Session-Id。
assistance: codex
model: gpt-5
show_assistance: false
review_ready: true
ad_eligible: false
pv: 0
---

2026 年 7 月 29 日凌晨，MCP 项目发布了 `2026-07-28` 稳定版规范。官方 GitHub Release 的发布时间是 2026-07-28 16:47 UTC，对应北京时间 7 月 29 日 00:47。

这次升级最重要的变化只有一句话：**MCP 的协议内核变成了无状态的。**

它解决了远程 MCP 服务进入生产环境后最直接的扩展问题。请求可以落到任意服务实例，负载均衡器不再需要维护 MCP 会话粘滞，服务端也不必为了协议会话准备共享状态库。

不过，“无状态”不等于所有业务都不能保存状态，也不等于 MCP 彻底取消了流。跨调用状态、长任务、用户确认和变更通知仍然存在，只是换了更明确的承载方式。

## 1、握手和会话被移除了

在 `2025-11-25` 版本里，客户端先发送 `initialize`，服务端可以分配 `Mcp-Session-Id`。后续请求携带这个标识，服务端据此找到对应会话。

这种设计适合桌面客户端连接单个本地进程。放到远程服务里，就会带来三个问题。

第一，请求可能需要持续落到同一个实例，也就是“粘滞会话”。

第二，多实例共享会话状态时，需要额外的 Redis、数据库或其他状态存储。

第三，滚动发布、实例缩容和故障转移会影响还在进行中的会话。

`2026-07-28` 删除了 `initialize` / `notifications/initialized` 握手和 `Mcp-Session-Id`。协议版本、客户端能力和客户端信息改为随请求传递。服务端新增必须实现的 `server/discover`，供客户端提前查询它支持的协议版本、能力和身份。

一个工具调用的 HTTP 请求大致如下。

```http
POST /mcp HTTP/1.1
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: search
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {"q": "stateless MCP"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "example-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

每个请求都带着处理它所需的协议信息。普通轮询负载均衡、Serverless 函数和边缘运行时因此更容易承载 MCP 服务。

这里仍有一个边界：无状态只覆盖协议层。工具调用所访问的数据库、浏览器实例、购物车和长任务当然可以有状态。

## 2、业务状态改用显式句柄

协议给出的做法是，让工具生成一个句柄，再由模型在后续调用中传回。

比如，一个浏览器工具先返回：

```json
{
  "browser_id": "brw_7f31"
}
```

后续的点击、截图和关闭操作都把 `browser_id` 当作普通工具参数。

这种设计把状态归属放回业务层。服务端可以把状态放进数据库、对象存储、Durable Object 或专用运行时，协议只负责传递标识。

句柄对模型也是可见的。模型可以理解“这个 ID 对应刚才创建的浏览器”，也可以在多个工具之间组合和转交它。隐藏在传输头里的会话 ID 做不到这一点。

代价同样明确。

- 句柄要设置作用域、权限和有效期，不能把可猜测的数据库主键直接暴露给模型。
- 工具定义要说明句柄由哪个调用产生、可以传给哪些调用。
- 删除、退款、支付等高风险操作不能只凭句柄授权，仍要验证用户身份和操作权限。
- 服务端需要处理重复请求。客户端在网络中断后重试时，同一个业务动作不应被执行两次。

所以，无状态协议减少的是传输层耦合。状态建模、幂等和授权没有消失。

## 3、MRTR 让用户确认不再依赖长连接

有些工具无法一次拿齐参数。

创建云项目之前，服务端可能要展示价格；删除数据之前，可能要让用户确认；表单走到中途，也可能需要补充一个字段。

新规范引入 MRTR（Multi Round-Trip Requests，多轮往返请求）。服务端先返回 `InputRequiredResult`：

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "type": "elicitation",
      "message": "将删除 3 个文件，是否继续？",
      "schema": {"type": "boolean"}
    }
  },
  "requestState": "opaque-server-state"
}
```

客户端收集用户输入，再重新发送原请求，同时带上 `inputResponses` 和原样返回的 `requestState`。

任意服务实例都可以接手这次重试。它不需要继续持有上一次请求的连接，也不需要认识原来的协议会话。

MRTR 也给交互增加了一条安全约束：服务端只有在处理客户端请求时才能提出输入要求。客户端不会在没有用户或代理发起动作的情况下，突然收到一个服务端确认框。

每个结果现在都必须带 `resultType`。普通完成结果使用 `"complete"`，需要补充输入时使用 `"input_required"`。兼容旧协议的客户端则要把缺少该字段的结果视为普通完成结果。

## 4、网关终于能看懂 MCP 请求

`Mcp-Method` 成为所有 Streamable HTTP 请求的必需请求头。`tools/call`、`resources/read` 和 `prompts/get` 还必须携带 `Mcp-Name`。

这两个字段让网关不解析 JSON 请求体，也能知道请求正在调用什么。

- `Mcp-Method` 可以用于区分 `tools/call`、`tools/list`、`resources/read` 等方法。
- `Mcp-Name` 可以用于识别具体工具、资源 URI 或提示词。
- API 网关可以按工具配置速率限制、路由、审计和访问策略。
- 防火墙可以直接拒绝高风险工具，观测平台也能用低成本标签聚合延迟和错误率。

服务端必须校验请求头与 JSON-RPC 请求体是否一致。两边不一致时要拒绝请求，避免网关判断的是一个方法，后端执行的却是另一个方法。

列表和资源读取结果还新增了 `ttlMs` 与 `cacheScope`。客户端由此知道 `tools/list` 等结果可以缓存多久，以及缓存能否跨用户共享。结合确定性的工具列表排序，MCP 的发现请求更容易使用客户端缓存和共享缓存。

规范也统一了 OpenTelemetry Trace Context 在 `_meta` 中的键名。一次调用可以从宿主应用进入 MCP 客户端，再经过 MCP 服务和下游 API，最终落到同一棵分布式追踪树里。

这些变化没有工具调用本身醒目，却更接近生产团队每天要处理的问题：路由、缓存、限流、审计和排障。

## 5、无状态不等于没有流

把新版本概括成“纯请求/响应协议”会漏掉一部分机制。

`2026-07-28` 删除了旧的 HTTP GET 流、SSE 断点续传、`Last-Event-ID` 和事件重投递。响应流中断后，客户端要使用新的请求 ID 重发请求。

变更通知则被合并到 `subscriptions/listen`。客户端通过一个长生命周期的 POST 响应流，订阅工具列表、提示词列表、资源列表或资源内容变化。

请求范围内的进度和日志通知，仍然可以跟随对应请求的响应流返回。

因此，更准确的说法是：**MCP 移除了跨请求的协议会话，但保留了请求范围内的流式响应和显式订阅流。**

这项区别会直接影响迁移。如果旧实现依赖独立 GET 流、事件重放或 `resources/subscribe`，只删除会话 ID 还不够。

## 6、授权和废弃策略

授权部分增加了多项约束。

授权服务器应在授权响应中提供 `iss`。客户端只要收到该字段，就必须把它与先前记录的 issuer 比对，再兑换授权码。这可以降低授权服务器混淆攻击的风险。

客户端持久化的凭据必须按 issuer 隔离。授权服务器发生变化时，旧凭据不能直接复用。

动态客户端注册 DCR（Dynamic Client Registration）被标记为废弃，推荐方案改为 CIMD（Client ID Metadata Documents，客户端 ID 元数据文档）。DCR 仍保留给不支持 CIMD 的授权服务器做兼容。

Roots、Sampling、Logging 也进入废弃状态。它们在 `2026-07-28` 中仍能工作，最早可在 2027-07-28 当日或之后发布的首个规范版本中移除。

| 废弃功能 | 建议迁移方向 | 最早可移除时间 |
|---|---|---|
| Roots | 工具参数、资源 URI 或服务端配置 | 2027-07-28 之后的首个规范版本 |
| Sampling | 服务端直接接入模型提供商 API | 2027-07-28 之后的首个规范版本 |
| Logging | stdio 使用 `stderr`，远程观测使用 OpenTelemetry | 2027-07-28 之后的首个规范版本 |
| DCR | CIMD | 2027-07-28 之后的首个规范版本 |
| HTTP+SSE | Streamable HTTP | SEP-2596 转为 Final 后 3 个月 |

最后一行是容易误读的例外。HTTP+SSE 早在 `2025-03-26` 就已被描述为废弃，正式废弃策略采用了历史遗留过渡条款。它没有重新获得完整的 12 个月窗口。

新的生命周期把功能分为 Active、Deprecated 和 Removed。一般情况下，从废弃到具备移除资格至少相隔 12 个月；实际移除仍需核心维护者在后续版本发布时决定，并非到期自动删除。

## 7、生产迁移要检查什么

这次有破坏性变更。迁移工作可以按六步拆开。

### 第一步：盘点会话依赖

搜索 `Mcp-Session-Id`、`initialize`、`initialized`，列出所有按会话保存的数据。

把真正的业务状态改成显式句柄。临时协商信息改为每请求 `_meta`。不再需要的连接级缓存直接删除。

### 第二步：盘点服务端发起请求

搜索 elicitation、sampling、roots 和进度通知。

需要用户输入的流程改用 MRTR。依赖 Sampling 和 Roots 的新功能应停止扩展，已有功能安排替代方案。

### 第三步：改传输和订阅

检查独立 GET 流、`Last-Event-ID`、`resources/subscribe`、`resources/unsubscribe`、`ping` 和 `logging/setLevel`。

需要持续通知的功能迁移到 `subscriptions/listen`。需要断线恢复的业务，应在应用层保存可重试状态。

### 第四步：补齐网关与安全校验

为每个 Streamable HTTP POST 添加 `MCP-Protocol-Version`、`Mcp-Method` 和需要时的 `Mcp-Name`。

网关策略可以开始使用这些请求头，但后端仍要校验头部与请求体一致。OAuth 客户端要验证 `iss`，凭据存储按 issuer 分区。

### 第五步：双版本运行

过渡期内，生产端点最好同时支持 `2025-11-25` 和 `2026-07-28`。新客户端可以先调用 `server/discover`；遇到只支持旧版的服务端，再回退到旧握手。

双版本支持应覆盖真实客户端、网关和失败重试场景。协议兼容不能只靠单元测试判断。

### 第六步：最后再切流量

先部署无状态端点，观察错误率、重试率、缓存命中率、MRTR 完成率和滚动发布期间的失败情况。

旧会话自然排空后，再移除旧路由。仍在使用旧 SDK 的客户端要保留明确的升级期限。

## 8、SDK 与生态进度

官方 SDK 分级页目前把 TypeScript、Python、C# 和 Go 列为 Tier 1。四个仓库都已经发布支持 `2026-07-28` 的稳定版本。

Rust 仍在官方分级页列为 Tier 2，但 `rmcp` 3.0.0 已于北京时间 7 月 29 日发布。用“Rust 只有 beta”描述当前状态已经过时。

平台侧的支持不能只看“支持 MCP”四个字。旧协议和新协议的传输生命周期差异很大。更有用的核对项是：

- 是否支持 `server/discover` 和双版本协商；
- 是否支持无会话的 Streamable HTTP；
- 是否实现 MRTR；
- 是否补齐标准请求头、缓存字段和追踪字段；
- 是否提供从旧会话模式迁移的路径。

Cloudflare Agents SDK 0.20.0 已公开支持 `2026-07-28` 客户端和服务端，并允许同一路由兼容新旧客户端。Google 的 MCP Toolbox for Databases 也已公开宣布支持候选规范。

AWS、Microsoft、Figma、Supabase、Honeycomb 等产品此前都已有 MCP 能力或参与生态建设，但截至资料整理时间，暂未逐项找到它们针对 `2026-07-28` 稳定版的同口径官方发布说明。生产选型时应以各产品自己的兼容矩阵和发布日期为准。

## 9、结论

MCP 这次改动的价值，集中在远程服务的可运维性。

无状态内核让请求可以经过普通负载均衡器落到任意实例。显式句柄承载业务状态，MRTR 承载用户输入，`subscriptions/listen` 承载持续通知，标准请求头、缓存字段和追踪字段则服务于网关与观测。

这是一轮协议边界的重新划分：MCP 负责描述请求、能力和交互模式；业务状态、恢复策略、权限和幂等由应用自己管理。

对于新服务，`2026-07-28` 更适合作为远程部署的起点。对于已经上线的服务，稳妥做法是先双版本运行，再按会话、交互、订阅和授权四条链路逐项迁移。

## 信息来源与说明

- [MCP `2026-07-28` 稳定版 Release](https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28)
- [MCP `2026-07-28` 变更日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 2026-07-28 候选版说明：A Stateless Protocol](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)
- [SEP-2567：Sessionless MCP via Explicit State Handles](https://modelcontextprotocol.io/seps/2567-sessionless-mcp)
- [SEP-2575：Make MCP Stateless](https://modelcontextprotocol.io/seps/2575-stateless-mcp)
- [SEP-2322：Multi Round-Trip Requests](https://modelcontextprotocol.io/seps/2322-MRTR)
- [SEP-2596：功能生命周期与废弃策略](https://modelcontextprotocol.io/seps/2596-spec-feature-lifecycle-and-deprecation)
- [MCP 废弃功能注册表](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
- [官方 SDK 分级页](https://modelcontextprotocol.io/docs/2026-07-28/sdk)
- [TypeScript SDK 2026-07-28 迁移指南](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/support-2026-07-28.md)
- [Cloudflare Agents SDK 0.20.0 更新说明](https://developers.cloudflare.com/changelog/post/2026-07-27-agents-sdk-v0.20.0-mcp-sdk-v2/)
- [Google MCP Toolbox for Databases 公告](https://medium.com/google-cloud/the-future-is-stateless-mcp-2026-draft-spec-arrives-in-mcp-toolbox-1c993fe00a28)

资料截至 2026-07-29 09:05（Asia/Shanghai）。官方稳定版发布时间、SDK 版本和平台支持状态都可能继续更新。

“第五个大版本”的说法按 2024-11-05、2025-03-26、2025-06-18、2025-11-25、2026-07-28 五个稳定修订计算。官方仓库还保留更早的 2024-10-07 标签，因此它不是规范定义中的正式“主版本序号”。

暂未找到官方材料支持“MCP 月下载量接近 5 亿次”以及“TypeScript、Python SDK 各自累计下载量超过 10 亿”的同口径统计。这些数字没有写入结论。
