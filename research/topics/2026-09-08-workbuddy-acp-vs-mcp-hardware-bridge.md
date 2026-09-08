---
title: WorkBuddy 硬件接入：ACP 与 MCP 的边界、流程和实现审计
category: topics
date: 2026-09-08
time: 09:49
tags: [WorkBuddy, ACP, MCP, 硬件接入, OAuth, SSE, JSON-RPC, AI Agent, 协议设计]
summary: 以“ACP 短信桥接测试终端”的协议链路为例，核对 WorkBuddy 的 OAuth、云端任务与 ACP 双通道流程，并用宽表说明 ACP 负责 Agent 会话、MCP 负责工具和数据接入的边界。
tldr: WorkBuddy 公布的 ACP 接入链路先通过 Open API 获取任务的 link 与 token，再用 GET SSE 接收消息、POST JSON-RPC 发送 initialize、session/load 和 session/prompt。“ACP 短信桥接测试终端”按这条公开链路实现，定位是面向 WorkBuddy 的 ACP v1 最小客户端，尚未覆盖取消、自动重连、Schema 校验、ACP token 更新和完整权限请求分类。开放平台会按实际交付形态审核产品分类；只有桌面模拟器、平台服务和未来硬件设想时，不能作为硬件应用提交。硬件作为用户消息入口时优先用 ACP；硬件作为可被 Agent 调用的传感器或执行器时更适合做 MCP Server。
topic_type: tech
tech_type: agents_automation
subjects: [ai_dev]
content_type: engineering_case
assistance: codex
model: gpt-5
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

一台短信式终端把文字送进 WorkBuddy，会遇到两个名字很像的协议：ACP 和 MCP。两者都使用 JSON-RPC，也都能传递工具相关信息，但责任不同。ACP 管理客户端与 Agent 的会话，MCP 把工具、数据和提示词接入 AI 应用。

[ACP 短信桥接测试终端](/tools/workbuddy-acp-bridge)采用 ACP，是因为它扮演 WorkBuddy 的外部交互界面。用户从桌面窗口或未来的硬件设备发出消息，目标是进入一个具体的 WorkBuddy 会话，并持续接收回答、状态和权限请求。

## 一、先给结论

1. **测试终端按 WorkBuddy 公开的 ACP 流程接入。** 接收通道使用 GET SSE，发送通道使用 POST JSON-RPC，两条通道通过 `Acp-Connection-Id` 关联。
2. **更准确的工程名称是“WorkBuddy ACP v1 最小客户端”。** 核心报文符合官方公开流程，通用协议覆盖和生产可靠性仍有缺口。
3. **硬件作为用户入口时适合 ACP。** 按键、短信、语音和串口输入可以转成 `session/prompt`，执行过程通过 `session/update` 返回。
4. **硬件作为 Agent 的能力时适合 MCP。** 读取传感器、发送短信、开关设备等动作可以暴露为 MCP Tool。
5. **完整方案可以同时使用两种协议。** 外层 ACP 负责人与 Agent 的对话，Agent 内层 MCP 负责调用业务系统和硬件能力。
6. **协议选型与开放平台产品分类是两件事。** 软件可以正确实现 ACP，同时仍不符合“硬件应用”的审核条件。

## 二、WorkBuddy 公开的接入链路

[WorkBuddy 第三方应用文档](https://open.workbuddy.cn/docs/third-party-app)把开放平台分成应用注册、OAuth 授权、Scope 管理和 Open API 调用。测试终端只申请两个权限：

| Scope | 官方含义 | 桥接台用途 |
|---|---|---|
| `user.task.readable` | 读取用户的云端任务列表及任务详情 | 展示可接入的会话，并重新获取任务的 ACP link/token |
| `user.task.invokable` | 按照用户指令创建和执行云端任务 | 创建测试会话，取得 ACP 连接信息 |

昵称、头像、手机号、本地助理状态和积分都不参与测试终端的任务接入流程，因此不申请 `user.profile.readable`、`user.contact.readable`、`user.localassistant.*` 或 `user.credit.exchange`。

### 0、一次审核给出的产品分类边界

2026 年 9 月 8 日，“ACP 短信桥接测试终端”的硬件接入申请被驳回。平台给出的理由是：产品链接与产品介绍属于平台服务，不符合硬件应用分类。应用 ID 属于后台信息，不在公开材料中展示。

审核结论与申报时产品页呈现的证据一致：

| 申报材料 | 审核方可能形成的判断 | 硬件申请缺少的证据 |
|---|---|---|
| 产品名称包含“测试终端” | 软件测试工具或演示程序 | 实体产品名称、品牌和型号 |
| 产品页明确写 macOS 桌面应用 | 平台服务或桌面客户端 | 实机照片、外观、接口和尺寸 |
| 页面标注“硬件状态：模拟” | 尚无可审核的实体设备 | 可运行原型、开发板或量产设备 |
| 设备事件由本机接口模拟 | 软件已经能演示流程 | 设备侧固件、通信链路和联调记录 |
| 产品图主要展示 UI | 能证明界面存在 | 能证明硬件存在且具备申报能力的图片 |

五类发布入口按交付形态选择：

| 实际要交付的产品 | 更匹配的入口 | 提交前应具备什么 | 与已审计代码的差距 |
|---|---|---|---|
| 实体短信终端、开发板原型或通信设备 | 硬件接入 | 实机、型号、设备能力、设备到 WorkBuddy 的完整链路 | 需要补真实硬件和设备侧证据 |
| 让 WorkBuddy 调用短信、收件箱或设备状态服务 | 连接器 | MCP Server + Skill，或成熟的跨平台 CLI + Skill | 需要把能力方向改成 WorkBuddy 调用设备服务 |
| 面向某个行业的完整 AI 工作台 | Buddy 应用 | 工作模式、系统提示、Skill、连接器和场景配置 | 需要重新定义垂直行业产品，测试终端不属于这一形态 |
| 独立桌面 ACP Client，用来控制 WorkBuddy 会话 | 现有公开入口没有完全对应项 | 需向平台确认是否开放普通第三方客户端注册 | 测试终端的准确分类 |

交付物如果包含真实短信硬件，可继续走“硬件接入”：先完成可展示的原型，再选择下拉框中最接近“开发板/开发套件”“通信终端”或“其他智能硬件”的类型，具体名称以平台实际选项为准。交付物如果只有 macOS 软件，应停止按硬件应用反复提交，改造为 MCP 连接器，或向平台确认普通第三方 ACP 客户端能否取得 Open API 凭据。

### 1、应用与 OAuth

```text
开放平台创建符合实体产品条件的硬件应用
        ↓
提交产品资料、Scope、OAuth 回调地址
        ↓
审核通过，Client ID / Client Secret 生效
        ↓
用户点击“连接 WorkBuddy”
        ↓
浏览器进入 /authorize
        ↓
用户确认授权
        ↓
http://localhost:8799/oauth/callback?code=...&state=...
        ↓
本地桥接用 code 换取 access_token / refresh_token
```

本地回调必须与开放平台登记值逐字一致：

```text
http://localhost:8799/oauth/callback
```

桥接服务实际只监听 `127.0.0.1:8799`。回调 URL 使用 `localhost`，是为了满足开放平台允许本地 HTTP 调试的登记格式；两者最终都留在用户电脑的回环网络内。

已审计版本会生成一次性 `state`，有效期 10 分钟，回调时验证并立即删除。Open API access token 接近过期时使用 refresh token 更新；token 文件使用 `0600` 权限保存。Electron 设置中的 Client Secret 通过系统安全存储加密后落盘。

公开分发还受一项凭据安全限制。[WorkBuddy Open API 文档](https://open.workbuddy.cn/docs/openapi)要求 Client Secret 不得暴露在前端或客户端代码中。内部联调可以利用本机安全存储降低误泄露风险；面向外部用户分发时，桌面应用无法成为真正的机密客户端，应该改成 PKCE 公共客户端模式，或让受控服务端完成 code 交换。截至 2026 年 9 月 8 日，开放平台的公开资料没有明确承诺支持不带 Secret 的原生应用模式。

### 2、任务 API 与 ACP 凭据

OAuth access token 用于调用 WorkBuddy Open API。创建任务或查询单个任务后，平台返回：

| 字段 | 用途 | 生命周期 |
|---|---|---|
| `task_id` | 云端任务 ID，也是后续 ACP `sessionId` | 随任务存在 |
| `link` | ACP 连接地址 | 由任务接口返回 |
| `token` | ACP 网关鉴权凭据 | 短期；遇到 401 应重新查询任务获取 |
| `expire_at` | ACP token 过期时间 | Unix 秒级时间戳 |

Open API access token 与 ACP token 属于两层凭据。前者允许第三方应用管理用户授权范围内的任务；后者只允许连接某个云端任务的 ACP 通道。两者不应混用。

### 3、ACP 双通道

[WorkBuddy Open API 的 ACP 使用说明](https://open.workbuddy.cn/docs/openapi#acp-使用说明)规定了一条接收通道和一条发送通道：

```text
客户端                                     WorkBuddy ACP 网关
   │
   │ GET {link}
   │ Authorization: Bearer {ACP token}
   │ Accept: text/event-stream
   ├──────────────────────────────────────────►
   │◄──────── SSE + Acp-Connection-Id ─────────
   │
   │ POST {link}
   │ Acp-Connection-Id: {connectionId}
   │ JSON-RPC: initialize
   ├──────────────────────────────────────────►
   │◄──────────── JSON-RPC response via SSE ───
   │
   │ POST session/load
   ├──────────────────────────────────────────►
   │◄──────────── 会话历史与加载结果 via SSE ──
   │
   │ POST session/prompt
   ├──────────────────────────────────────────►
   │◄──────────── session/update 流式增量 ─────
   │◄──────────── prompt 最终 response ─────────
```

`initialize`、`session/load` 与 `session/prompt` 的最小报文如下：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": 1,
    "clientCapabilities": {
      "fs": { "readTextFile": false, "writeTextFile": false }
    },
    "clientInfo": {
      "name": "workbuddy-local-hardware-bridge",
      "version": "0.1.0"
    }
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "session/load",
  "params": {
    "sessionId": "任务返回的 task_id",
    "cwd": "/workspace",
    "mcpServers": []
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "session/prompt",
  "params": {
    "sessionId": "任务返回的 task_id",
    "prompt": [
      { "type": "text", "text": "读取当前任务状态并给出一句摘要" }
    ]
  }
}
```

## 三、ACP 短信桥接测试终端的协议实现审计

表中的“符合”表示与 WorkBuddy 2026 年 9 月 8 日公开文档一致。它不等于已经覆盖 ACP 的每一个可选能力。

| 检查项 | WorkBuddy 公开要求 | 测试终端实现 | 判断 |
|---|---|---|---|
| 任务创建 | `POST /openapi/v2/tasks` | 已实现 | 符合 |
| 任务列表 | `GET /openapi/v2/tasks` | 已实现分页请求 | 符合 |
| 单任务查询 | `GET /openapi/v2/tasks/{task_id}` | 已实现 | 符合 |
| ACP 地址来源 | 使用任务返回的 `link` | 从任务详情读取 | 符合 |
| ACP 鉴权 | Bearer ACP token | 已实现 | 符合 |
| SSE 接收 | GET link + `Accept: text/event-stream` | 已实现 | 符合 |
| 连接标识 | 读取 `Acp-Connection-Id` | 缺失时直接报错 | 符合 |
| JSON-RPC 发送 | POST 同一 link | 已实现 | 符合 |
| 通道关联 | POST 回传 `Acp-Connection-Id` | 已实现 | 符合 |
| JSON-RPC 版本 | `2.0` | 已实现 | 符合 |
| ACP 版本 | `protocolVersion: 1` | 固定为 1 | 符合已公开流程 |
| 初始化 | 建连后调用 `initialize` | 已实现 | 符合 |
| 客户端能力 | 声明支持范围 | 明确关闭文件读写 | 符合且权限较小 |
| 加载会话 | `session/load` | 使用 task ID 加载 | 符合 |
| 工作目录 | `cwd` 为绝对路径 | 使用 `/workspace` | 符合 |
| MCP 列表 | `mcpServers` 数组 | 传入空数组 | 符合 |
| 用户消息 | `session/prompt` + ContentBlock | 已实现纯文本块 | 符合 |
| 流式消息 | 接收 `session/update` | 原样进入本地事件流 | 符合 |
| 请求关联 | response 使用相同 `id` | pending Map 按 ID 结算 | 符合 |
| 最终完成 | prompt response 的 `stopReason` | 作为设备完成事件发布 | 符合 |
| 权限应答 | Server-to-Client Request 需要 response | 界面允许用户应答 | 基础符合 |
| OAuth CSRF 防护 | 验证 `state` | 一次性 state，10 分钟过期 | 已实现 |
| 浏览器来源限制 | 本地页面应限制 Origin | 只允许 localhost/回环来源 | 已实现 |
| 硬件入口鉴权 | 设备事件需要独立凭据 | `X-Bridge-Key` 常量时间比较 | 已实现 |
| 设备消息去重 | 重试不能重复执行 | 使用 `eventId` 去重 | 已实现，重启后不持久化 |
| 取消任务 | `session/cancel` | 未实现 | 待补 |
| 自动重连 | SSE 断开后恢复 | 未实现指数退避和恢复 | 待补 |
| ACP token 轮换 | 401 后重新查询任务 | 未自动刷新 | 待补 |
| Schema 校验 | 按 ACP v1 Schema 校验报文 | 手写最小客户端 | 待补 |
| 多内容类型 | ACP 支持多种 ContentBlock | 只发送文本 | 部分覆盖 |
| 请求分类 | 区分权限、提问和其它服务端请求 | 统一映射为 permission | 待补 |
| WorkBuddy 扩展 | 可收到 `_codebuddy.ai/*` | 可显示原始消息，未结构化处理 | 可忽略、可增强 |
| 通用互操作 | 可连接任意 ACP Agent | 绑定 WorkBuddy 的鉴权和 HTTP Profile | 不属于通用客户端 |

已审计版本可以定位为“基于 WorkBuddy ACP v1 的本地硬件桥接客户端”。“完整实现 ACP 标准”会超过现有代码所能证明的范围。

## 四、ACP 与 MCP 宽表

[ACP 官方项目](https://github.com/agentclientprotocol/agent-client-protocol)把协议定位为 Client 与 Agent 之间的通信标准。[MCP 官方架构](https://github.com/modelcontextprotocol/docs/blob/main/docs/concepts/architecture.mdx)把 MCP Server 定位为向 AI Host 提供工具、资源和提示词的能力服务。

| 对比维度 | ACP：Agent Client Protocol | MCP：Model Context Protocol | 对硬件桥接的含义 |
|---|---|---|---|
| 核心问题 | 客户端如何控制、观察和呈现 Agent | AI 应用如何连接外部工具、数据与提示词 | 先判断硬件是界面还是能力 |
| 连接关系 | Client ↔ Agent | MCP Client ↔ MCP Server | 桌面短信窗口是 ACP Client |
| 典型 Client | IDE、聊天 UI、终端、移动端、硬件交互界面 | AI Host 内部的 MCP Client | 测试终端的桥接进程属于前一类 |
| 典型服务端 | 完整 Agent 运行时 | 数据库、搜索、文件、业务 API、设备服务 | WorkBuddy 是 ACP Agent |
| 主要原语 | Session、Prompt、Update、Permission、Terminal、FS | Tools、Resources、Prompts、Sampling、Elicitation | 会话入口需要 ACP |
| 最终用户消息 | `session/prompt` 原生承载 | 通常作为某个 Tool 参数 | 短信内容适合映射成 ACP Prompt |
| 多轮上下文 | Agent Session 是核心对象 | MCP 连接有状态，但不负责最终用户会话 | 续接 WorkBuddy 会话用 ACP |
| 创建会话 | `session/new`，已有会话可 load/resume | 没有等价的通用 Agent 会话原语 | WorkBuddy 任务对应 ACP session |
| 流式回答 | `session/update` 持续推送内容与状态 | 工具可报告进度，重点仍是能力调用 | 短信窗口展示执行过程用 ACP |
| 一轮结束 | prompt response + `stopReason` | Tool result 或异步 Task result | 测试终端按 prompt response 判定完成 |
| 工具过程 | Agent 向 Client报告工具调用与进度 | Server 向 Host 暴露可调用工具 | 一个负责展示，一个负责提供 |
| 权限确认 | Agent 可调用 `session/request_permission` | Host通常管理 MCP Tool 授权，也可用 Elicitation | 远程终端应把 ACP 权限请求交给用户 |
| 数据资源 | 可随 Agent 输出或工具结果出现 | Resources 是核心原语 | 纯查询型数据源更适合 MCP |
| 提示词模板 | 用户消息与 Agent 会话的一部分 | Prompts 是 Server 可发现能力 | 复用业务模板可放 MCP Prompt |
| 硬件作为输入终端 | 很适合 | 需要绕成 Tool 调用 | 采用 ACP |
| 硬件作为传感器 | 可以经 Agent 工具间接访问 | 很适合暴露 `read_sensor` Tool | 采用 MCP |
| 硬件作为执行器 | 可以经 Agent 工具间接控制 | 很适合暴露 `send_sms`、`switch_relay` | 采用 MCP |
| 能力协商 | initialize 交换 Agent/Client 能力 | initialize 交换 Client/Server 能力 | 两者都有，内容不同 |
| 文件能力 | Client 可向 Agent提供受限文件读写 | 文件系统通常作为 MCP Server | 测试终端的 ACP Client 主动声明不提供 |
| 终端能力 | Client 可向 Agent提供 Terminal | Shell 可以包装为 MCP Tool | 测试终端的两层均不开放终端能力 |
| 消息封装 | JSON-RPC 2.0 | JSON-RPC 2.0 | 外形相似不代表职责相同 |
| 常用传输 | stdio；远程传输仍在演进，也有 HTTP/SSE、WebSocket 实现 | stdio、Streamable HTTP | WorkBuddy 使用公开的 GET SSE + POST Profile |
| 服务端主动消息 | Agent 经常主动推送更新或请求用户决定 | 支持双向消息，主要模式仍围绕 Server 能力 | ACP 更贴合持续 Agent 运行 |
| 身份粒度 | Connection、Session、Prompt、Tool Call | Connection、MCP Session、Tool/Resource | ACP Session 直接对应用户任务 |
| OAuth 关系 | 宿主平台可以在 ACP 外层用 OAuth 授权 | 远程 MCP Server 也可使用 OAuth | OAuth 解决身份，不能替代协议本身 |
| 发现能力 | 通过初始化结果和会话能力协商 | `tools/list`、`resources/list`、`prompts/list` | 动态工具市场更偏 MCP |
| 失败恢复 | 需要恢复连接、会话和未完成 Prompt | 需要恢复 MCP Session 或重新调用工具 | ACP 恢复通常更依赖会话状态 |
| 最适合 | 构建完整 Agent 前端或远程控制入口 | 为 Agent 增加可发现、可调用能力 | 用户入口选 ACP，设备能力选 MCP |
| 接入实例 | 把一条短信送入 WorkBuddy 会话 | 让 WorkBuddy 调用短信网关或传感器 | 两层可以组合 |

ACP 的 ContentBlock 与 MCP 内容结构存在兼容设计，ACP 会话在创建或加载时也可以携带 `mcpServers`。两种协议在同一条 Agent 链路里共存，是规范预留的组合方式。ACP v1 Schema 对内容块兼容关系有明确说明，可在[官方 Schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/schema/v1/schema.json)中核对。

## 五、硬件入口为什么选择 ACP

测试终端的硬件桥接处理以下动作：

1. 用户在短信式终端输入文本。
2. 设备或本地适配器提交 `eventId`、`deviceId` 和 `text`。
3. 本地桥接找到活动的 WorkBuddy task/session。
4. 文本转换成 ACP `session/prompt`。
5. WorkBuddy 在会话中规划、调用工具和生成结果。
6. `session/update` 把流式增量送回桌面窗口。
7. prompt response 给出本轮结束原因。

这是一条“用户界面控制 Agent”的链路：

```text
短信硬件 / 桌面窗口 = ACP Client
WorkBuddy 云端任务   = ACP Agent Session
```

如果需求改成让 WorkBuddy 主动操作短信设备，角色会发生变化：

```text
WorkBuddy                 = MCP Host / MCP Client
本地硬件能力服务           = MCP Server
send_sms                  = MCP Tool
read_inbox                = MCP Tool
get_device_status         = MCP Tool
```

同一个硬件可以同时拥有两种角色。面板上的按键和输入框属于 ACP 入口；设备的传感器、短信发送器和继电器属于 MCP 能力。

## 六、推荐的组合架构

```text
用户
  │
  ▼
短信设备 / 桌面测试终端
  │ 设备事件 + X-Bridge-Key
  ▼
本地安全桥接
  │
  │ ACP：会话、Prompt、流式结果、权限确认
  ▼
WorkBuddy Agent
  │
  │ MCP：调用外部工具、数据源和硬件能力
  ▼
短信发送器 / 串口 / 传感器 / 企业系统 / 数据库
```

职责拆分如下：

| 层 | 应负责 | 不应承担 |
|---|---|---|
| 设备层 | 采集输入、显示结果、持有设备身份 | 持有 WorkBuddy Client Secret 或 OAuth token |
| 本地桥接层 | 验证设备、去重、路由会话、维持 ACP、展示权限请求 | 自动批准高风险权限 |
| WorkBuddy ACP 层 | 维护 Agent 会话、接收 Prompt、推送执行过程 | 直接信任任意设备事件 |
| MCP Server 层 | 暴露窄范围工具与数据，校验参数和业务权限 | 管理最终用户的完整对话体验 |
| OAuth/Open API 层 | 用户授权、Scope、任务创建与任务查询 | 承载 ACP 的实时流式消息 |

## 七、从审核到真实运行的完整流程

| 阶段 | 操作 | 成功信号 | 常见阻塞 |
|---|---|---|---|
| 1. 确认产品分类 | 核对交付物是实体设备、连接器还是 Buddy 应用 | 产品材料与发布入口一致 | 把桌面平台服务按硬件提交 |
| 2. 创建应用 | 填产品名称、图标、类型、介绍、产品页和场景 | 平台生成 Client ID/Secret | Secret 未及时保存 |
| 3. 申请权限 | 只选 task readable/invokable | 权限进入审核 | 多申请资料、联系方式或本地助理权限 |
| 4. 登记回调 | 填 `http://localhost:8799/oauth/callback` | 配置保存 | 写成 `127.0.0.1` 或多一个 `/` |
| 5. 等待审核 | 保持 Mock 模式继续本地联调 | 应用状态变为审核通过/已生效 | 产品材料无法证明实体硬件；未审核时真实 OAuth 不可用 |
| 6. 录入凭据 | 桌面设置填写 ID、Secret、回调和 Bridge Key | 保存后应用重启 | 把 Secret 发到聊天或提交 Git |
| 7. 用户授权 | 点击“连接 WorkBuddy” | 回调后 health 显示已授权 | 回调不一致、state 过期、应用未生效 |
| 8. 获取任务 | 刷新列表或创建新会话 | 返回 task_id、link、token | 新任务尚未准备好 link/token |
| 9. ACP 建连 | GET link 建立 SSE | 收到 `Acp-Connection-Id` | ACP token 过期或网络中断 |
| 10. 初始化 | POST `initialize` | SSE 返回对应 id 的 result | 协议版本或能力不兼容 |
| 11. 加载会话 | POST `session/load` | 历史更新和加载结果返回 | task/session ID 不一致 |
| 12. 发送消息 | POST `session/prompt` | 收到 `session/update` | 无活动会话、连接已经断开 |
| 13. 权限交互 | 用户允许或拒绝服务端请求 | response 使用原 request id | 误把未知请求自动批准 |
| 14. 判断结束 | 等待 prompt response | result 包含 `stopReason` | 只看最后一个文本 chunk，误判完成 |
| 15. 断线恢复 | 重新获取 task token 并重建 ACP | 会话可继续追问 | 已审计版本尚未自动实现 |

## 八、上线前仍需补齐什么

| 优先级 | 能力 | 原因 | 建议验收方式 |
|---|---|---|---|
| P0 | ACP 401 后重新查询任务 token | 官方说明 ACP token 可能很短 | 模拟 token 过期，自动恢复同一 task |
| P0 | 断线重连与退避 | SSE 网络中断属于常态故障 | 断网后恢复，消息不重复执行 |
| P0 | 严格识别 `session/request_permission` | 未知服务端请求不能被当成普通权限框 | 未知 method 默认拒绝或提示升级 |
| P0 | 权限结果按 ACP Schema 构造 | 错误 result 可能造成误授权或协议错误 | 用官方示例做允许、拒绝、取消测试 |
| P1 | `session/cancel` | 用户需要停止长任务 | 取消后收到权威 stopReason |
| P1 | 持久化幂等记录 | 内存去重在重启后失效 | 重启后重复 eventId 仍不重复执行 |
| P1 | ContentBlock 完整处理 | 后续需要图片、资源和产物 | 文本、图片、工具状态分别回归 |
| P1 | Schema 校验或官方 SDK | 手写对象容易在协议升级后漂移 | CI 对 ACP v1 Schema 校验 |
| P1 | WorkBuddy 扩展事件适配 | 计划、媒体、总结等产物需要结构化展示 | `_codebuddy.ai/artifact` 实测 |
| P2 | MCP 硬件服务 | 让 Agent 主动查询和操作设备 | 先暴露只读 `get_device_status` |
| P2 | 公共客户端授权方案 | 桌面端无法长期保守 Client Secret | 与平台确认 PKCE 或服务端交换模式 |

## 九、外部研判

WorkBuddy 的公开接口已经把“任务管理”和“实时 Agent 通信”分成两层。REST API 负责创建、查询和刷新凭据，ACP 负责会话内部的持续交互。这种拆分适合硬件入口：设备请求可以快速进入本地队列，Agent 的长时间执行留在 ACP 流中，不需要让一次硬件 HTTP 请求一直等待。

截至 2026 年 9 月 8 日，WorkBuddy 公开的 ACP HTTP Profile 与上游 ACP 社区正在推进的 Streamable HTTP 方案并非完全相同。WorkBuddy 文档要求先 GET SSE 取得 `Acp-Connection-Id`，再 POST `initialize`；上游新的 Web Transport 资料倾向先 POST `initialize`，再用返回的连接标识打开 SSE，并进一步区分 connection 与 session Header。远程 ACP 传输仍在演进，桥接层应隔离 transport adapter，避免把 WorkBuddy 的网络握手写成所有 ACP Agent 都必须接受的通用规则。可参阅 ACP 的[远程传输讨论](https://agentclientprotocol.com/rfds/streamable-http-websocket-transport)。

长期更稳妥的产品结构是双协议组合：ACP 保持用户与 Agent 的连续会话，MCP 把短信发送、设备状态和企业数据收敛成权限明确的工具。这样替换前端设备不会改变业务工具，新增工具也不需要重写会话客户端。

## 十、未能验证

- 应用审核未通过前，开放平台是否允许创建者在受限沙箱中完成真实 OAuth 和 ACP 调用，公开文档没有明确说明。页面提示为审核通过后配置生效，未审核状态应按不可用处理。
- WorkBuddy 是否计划支持面向原生桌面应用的 PKCE 公共客户端模式，公开资料没有找到明确承诺。
- 开放平台是否会为纯软件 ACP Client 提供独立于“硬件接入”的发布入口，公开资料没有找到明确说明。此次审核反馈只能证明申报材料不能按硬件应用通过。
- ACP token 在不同沙箱环境中的确切有效期不固定；官方只说明通常约 3 天，也可能很短，应以 `expire_at` 和实际 401 为准。
- WorkBuddy 私有扩展事件可能继续增加；2026 年 9 月 8 日可访问的公开文档只列出重点扩展，客户端应安全忽略未知 notification。
- “ACP 短信桥接测试终端”尚未在审核通过的真实第三方应用凭据下完成端到端测试，协议判断来自官方报文、Mock 测试与本地代码审计。

## 信息来源与说明

### 一手资料

- [WorkBuddy 开放平台：第三方应用](https://open.workbuddy.cn/docs/third-party-app)：OAuth、Scope、权限含义和最小权限原则。
- [WorkBuddy 开放平台：连接器](https://open.workbuddy.cn/docs/connector)：MCP + Skill 与 CLI + Skill 两种能力接入方式。
- [WorkBuddy 开放平台：Buddy 应用](https://open.workbuddy.cn/docs/buddy-app)：垂直行业 AI Harness 的产品定位与配置范围。
- [WorkBuddy 开放平台：Open API 接口](https://open.workbuddy.cn/docs/openapi)：任务 API、ACP link/token、GET SSE + POST JSON-RPC 双通道、报文顺序和扩展事件。
- [Agent Client Protocol 官方仓库](https://github.com/agentclientprotocol/agent-client-protocol)：ACP 定位、稳定协议版本和 Schema。
- [ACP v1 JSON Schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/schema/v1/schema.json)：会话、权限、内容块与客户端能力字段。
- [ACP Streamable HTTP 与 WebSocket RFD](https://agentclientprotocol.com/rfds/streamable-http-websocket-transport)：远程传输的演进方向及其与 MCP Streamable HTTP 的差异。
- [Model Context Protocol 官方架构](https://github.com/modelcontextprotocol/docs/blob/main/docs/concepts/architecture.mdx)：Host、Client、Server、Tools、Resources 与 Prompts 的职责。
- [MCP 2025-11-25 Schema](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2025-11-25/schema.json)：2025-11-25 稳定版协议的数据结构与方法。

### 资料边界

- 协议与平台事实以 2026 年 9 月 8 日可访问的官方文档为准。
- 工程实现证据来自“ACP 短信桥接测试终端”的本地代码、测试和运行结果。
- 产品分类案例来自 2026 年 9 月 8 日的 WorkBuddy 开放平台审核反馈；公开正文隐藏应用 ID。
- “推荐架构”和优先级属于工程判断，不代表 WorkBuddy 或 ACP/MCP 标准组织的产品承诺。
