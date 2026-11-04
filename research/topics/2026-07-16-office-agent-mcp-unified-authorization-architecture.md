---
title: 办公智能体 × MCP × 统一认证：协议事实与架构建议分层
category: topics
topic_type: tech
tech_type: agents_automation
date: 2026-07-16
time: 09:21
updated: 2026-11-04
tags: [MCP, OAuth, 统一认证授权, 办公智能体, PKCE, Resource Server, 企业安全]
summary: 先钉 MCP 授权相关的公开协议要求与 OAuth 常见机制，再给出办公场景下「智能体 / MCP / 统一认证授权服务」的架构建议；建议层不冒充任一厂商已交付能力。
tldr: 协议事实：MCP 客户端按受保护资源元数据发现授权服务器，走 Authorization Code + PKCE，并在授权与 Token 请求中携带 resource；MCP 服务作为 Resource Server 校验 audience。架构建议：办公智能体当 OAuth Client，统一认证授权服务当 AS，MCP 不向下游透传入站 Token。具体产品是否实现 CIMD、DPoP、Token Exchange 等，以该产品文档为准，本稿不编造。
content_type: analysis
subjects: [ai_dev]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **先分两层**：MCP / OAuth 公开规范里已经写死的要求是事实；把办公智能体接到企业统一认证授权服务的拓扑与落地清单是**架构建议**。
2. **事实层角色映射（规范语义）**：MCP 客户端获取用户委托凭证；MCP 服务是受保护资源（Resource Server）；授权服务器负责认证、同意、发证与（若提供）刷新/撤销。
3. **建议层默认拓扑**：办公智能体 = OAuth Client；统一认证授权服务 = Authorization Server；MCP = Resource Server；下游业务系统使用**独立**受众凭证，不接受「audience 指向 MCP」的入站 Token 直通。
4. **本稿不声称**：某办公套件、某 IdP、某 MCP 网关已经开箱支持下列全部建议项。能力表必须回到具体产品文档与实测。

## 二、事实层：协议与标准能钉住什么

下列条目来自 MCP 授权相关公开叙述与通用 OAuth/OIDC 机制；实现差异很大，表内「要求」指规范方向，落地以你锁定的 MCP 规范版本与 AS 文档为准。

| 主题 | 可核对的公开要求 / 惯例 | 边界 |
|---|---|---|
| 受保护资源发现 | 401 + `WWW-Authenticate` 可带 `resource_metadata`；客户端还需支持 RFC 9728 well-known 回退 | 不是所有部署都同时实现两种发现路径 |
| Protected Resource Metadata | 声明 `resource`、`authorization_servers` 等；客户端须校验 `resource` 与目标一致 | 字段集随规范版本演进 |
| 授权码 + PKCE | MCP 客户端侧惯例与规范要求强调 PKCE（宜 `S256`） | 设备码等是另一条授权方式，勿混用 |
| Resource 指示 | 授权请求与 Token 请求携带 RFC 8707 `resource`，指向目标 MCP 资源标识 | 旧 AS 可能尚未支持 |
| 受众约束 | Resource Server 校验 Token 的 audience / 资源绑定 | 具体用 JWT `aud` 还是 introspection，属实现选择 |
| 客户端身份 | 预注册 / Client ID Metadata Documents（CIMD）/ 动态注册（DCR） | MCP `2026-07-28` 将 DCR 标为偏向废弃、推荐 CIMD；过渡期仍可能见到 DCR |
| 发行方校验 | 授权响应出现 `iss` 时，客户端须在兑码前校验（MCP 2026-07-28 授权加固） | 旧客户端可能未实现 |

权威入口应回到你选用的 MCP 规范版本中的 Authorization 章节，以及 RFC 6749 / 7636 / 8414 / 8707 / 9728 原文。MCP `2026-07-28` 变更摘要见官方 changelog。[changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) · [MCP 博客](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

**明确不是协议自动给你的东西**：合同能否被某角色读取、审批单字段校验、租户隔离策略、DPoP 是否强制、Token Exchange 是否开通——这些是企业业务与 IdP 产品能力。

## 三、结构：架构建议（与事实分开）

### 3.1 建议拓扑

```
用户
  └─ 办公智能体（MCP Client + OAuth Client）
        ├─ OAuth + PKCE ──► 统一认证授权服务（AS）
        └─ Bearer（audience=MCP）──► MCP 服务（RS）
                                      └─ 独立下游 Token ──► 业务系统
```

职责建议：

| 参与方 | 建议负责 | 建议不要负责 |
|---|---|---|
| 用户 | 认证、同意、发起/撤销连接 | 直接把企业密码交给 MCP |
| 办公智能体 | 发现元数据、PKCE、安全存 Refresh、按最小 scope 调用 | 自行扩大 scope；把 A 资源的 Token 发给 B 资源 |
| 统一认证授权服务 | 认证、同意页、客户端管理、发证/刷新/撤销、JWKS | 代替 MCP 做「这份合同能不能看」的业务裁决 |
| MCP 服务 | Token 校验、Tool 级授权、租户/数据权限、审计关联 | 签发授权码；透传入站 MCP Token 给下游 |
| 下游业务 | 校验面向自身 audience 的凭证 | 信任未验证的用户头或 MCP 入站 Token |

### 3.2 建议的连接时序（实现清单，非厂商截图）

1. 用户配置 MCP Endpoint；客户端做 URL/TLS/SSRF 策略检查后发起无 Token 探测。  
2. 收到 401 后按 PRM / well-known 发现资源与 AS；校验 `resource` 绑定。  
3. 拉取 AS 元数据，确认 PKCE 等能力；取得 Client ID（优先预注册）。  
4. 授权请求携带最小 scope、`resource`、state、PKCE；用户完成认证与同意。  
5. 用授权码 + `code_verifier` + `resource` 换 Token；短期 Access Token，Refresh 轮换与按 issuer 隔离存储。  
6. 调用 MCP Tool 时由 MCP 合并：Token 有效性 + scope→Tool 映射 + 角色/属性/数据权限。  
7. MCP 访问下游时换独立凭证（客户端凭证、Token Exchange 或下游会话），并写审计关联号。  
8. 断开连接时尽量调用撤销端点；本地清除密钥材料。

### 3.3 安全基线（建议）

- 精确注册 `redirect_uri`；禁止开放重定向。  
- Access Token 短寿命；Refresh Token 旋转与重用检测（若 AS 支持）。  
- 高影响 Tool（付款、删数、外发）默认二次确认或步进授权。  
- 元数据与回调 URL 限制 HTTPS、拒绝私网/云元数据地址、限制重定向跳数与响应大小。  
- 协作场景的「角色限制」不等于多租户恶意隔离——需要额外威胁模型。

## 四、外部研判

办公场景把 MCP 地址当成「又一条集成配置」会低估它：它实际建立的是「某应用代表某用户访问某企业能力」的委托链。统一认证授权服务适合集中回答「是谁、同意了什么」；MCP 侧必须保留「这个 Tool 在这个业务上下文能不能做」的最终否决权。两层缺一，要么变成万能票，要么变成无法审计的旁路。

是否上 DPoP、mTLS、步骤级授权产品，取决于威胁模型与 AS 能力，不宜在未核对产品文档前写成「标准标配」。

## 五、信息来源与持续验证

资料复核截至 **2026-11-04（Asia/Shanghai）**。

- [MCP 2026-07-28 changelog（含授权相关 SEP）](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 2026-07-28 发布说明](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- OAuth / 资源元数据相关 RFC：6749、7636、8414、8707、9728（标准原文）
- 具体办公套件、IdP、MCP 网关能力：**未**在本篇做厂商矩阵实测

### 持续验证

- 锁定你环境实际使用的 MCP 规范版本后，若 Authorization 章节对 CIMD / DCR / `resource` 必填性有更新，第二节表需按该版本替换。  
- 选定 IdP 与 MCP 产品后，用产品文档填一张「已实现 / 未实现 / 不支持」表，再决定第三节建议哪些能落地；未核验前不要把建议写成采购结论。
