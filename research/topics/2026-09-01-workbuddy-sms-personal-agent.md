---
title: 用短信操纵本地 WorkBuddy：运营商直连与云通信平台方案
category: topics
date: 2026-09-01
time: 10:13
tags: [WorkBuddy, CodeBuddy CLI, 智能体, 短信, 腾讯云短信, Twilio, Agent Skills]
summary: 一套通过普通短信调用本地 WorkBuddy 能力的双路线方案：企业优先直连运营商网关；个人或小团队通过腾讯云、阿里云、Twilio 等云通信平台接入，再由本地 CLI 执行专家与 Skills。
tldr: 企业已有服务代码和网关账号时，优先通过 CMPP、SGIP 或 SMGP 直连；拿不到运营商端口时，使用云通信平台承接上行、下行和回调。本地桥接程序只访问 127.0.0.1 上的 CodeBuddy HTTP API，并把 SSE 事件转换成安全的进度摘要，不向短信发送模型原始思维链。
topic_type: tech
subjects: [ai_dev]
content_type: analysis
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

这套产品可以实现，推荐采用“运营商直连优先、云通信平台兜底”的双路线。模型调用、专家、Skill、文件、凭证、会话和长期记忆都由用户电脑上的智能体进程管理；公网只保留短信收发、消息排队和设备在线状态，不在云端运行另一个智能体。

关键判断有七个：

1. WorkBuddy 已经提供远程助理，支持微信、企业微信、QQ、钉钉和飞书。官方列表暂未包含短信。微信助理已经能在手机端发起任务、补充指令、批准操作并接收结果，适合先验证“用户是否愿意从消息入口调用本地专家”。
2. WorkBuddy 5.4.5 已为微信、企微助理加入逐字流式输出；CodeBuddy CLI 也提供 `stream-json`、REST Runs 和 SSE。技术上可以持续获得进度事件。
3. 企业若已经获得服务代码、网关账号和网络条件，优先使用 CMPP、SGIP 或 SMGP 直连。它能控制 MO、MT、REPORT、重试和路由，也减少对单一云聚合商 API 的依赖。
4. 个人或小团队通常无法直接申请运营商网关。腾讯云短信、阿里云短信、Twilio 等平台可以提供发送 API 和上行回调，但中国大陆个人主体仍可能受实名报备、签名、模板和业务类型限制。云平台降低技术门槛，不等于自动取得双向短信经营条件。
5. 短信不适合逐字转发。长短信会被拆分成多个协议包和计费条目，具体字数、编码、内容审核、频率和资费以签约运营商或云平台规则为准。产品应发送“已收到—需要确认—已完成”这类状态摘要，完整过程留在 WorkBuddy 或一个受保护的本地/网页详情页。
6. 公开资料没有证明 WorkBuddy 桌面端向第三方开放了可直接接入短信的通用 API。CodeBuddy CLI 有公开 Beta HTTP API、Agent SDK、自定义 Agent、Skills、会话恢复和定时任务，适合作为本地桥接层。不要依赖 GUI 自动点击、抓包或私有 RPC。
7. WorkBuddy 与 CodeBuddy CLI 的配置和记忆已经分目录保存。CLI 路线可以复刻专家、Skills、项目上下文和本地记忆，但不能假定它自动继承 WorkBuddy 账号里的云端用户画像。若“原样使用 WorkBuddy 记忆”是硬条件，应推动官方增加短信助理通道，或继续使用现有微信、飞书助理。

这份方案聚焦“一名用户、一台本地节点、一个私人专家”。短信/RCS 的行业与资质问题可继续查阅[站内早期通道调研](/articles/research/topics/workbuddy-sms-rcs-channel)；多人短信群、云端控制面和分布式 Agent 见[双向短信群方案](/articles/research/topics/workbuddy-sms-distributed-agent-messaging-architecture)。

## 二、产品边界：要做的是个人智能服务节点

用户发出的短信只是一条远程指令。真正的服务运行在用户自己的电脑上：

```text
用户手机
   │ 上行短信
   ▼
短信入口
   ├─ 企业直连：运营商 SMSC / CMPP / SGIP / SMGP
   └─ 云通信：腾讯云 / 阿里云 / Twilio Webhook
   ▼
通道接入层 ── 验签、去重、回执、限流、加密离线队列
   │ 用户电脑主动领取消息，不开放公网入站端口
   ▼
用户电脑：SMS Bridge → 127.0.0.1 → CodeBuddy CLI / WorkBuddy 能力
                                         │
                                         ▼
                              专家 + Skills + MCP + 本地文件
   │
   ├─ SSE 进度事件 → 合并、限频 → 短信状态通知
   └─ 最终答案 → 压缩摘要 → 短信下发
```

运营商直连通常由企业或服务提供商获得接入账号、服务代码、网关地址、协议版本和网络访问条件。具体是否要求固定出口 IP、专线或 VPN，以及资质、内容、频率和计费规则，均以签约运营商和省级通道的书面约定为准。它不是给普通手机号直接开放的个人 API。

个人用户缺少运营商端口时，由云通信平台承担号码或短信通道、运营商连接、发送 API、上行回复和状态回调。用户电脑通过出站长轮询或 WebSocket 从通道接入层领取消息。云端只做通信和短期排队，不运行用户专家，也不持有用户文件凭证。

本地节点只访问回环地址上的 Agent API，不需要把 WorkBuddy 或 CodeBuddy 的 HTTP 端口暴露到公网。若运营商要求专线接入，可以把 `sms-cli gateway` 部署在用户控制的企业网络或边缘主机，用户电脑再通过双向认证的出站连接领取事件。

## 三、双路线怎么选：直连优先，云平台降低门槛

| 路线 | 适用对象 | 得到什么 | 主要门槛 | 结论 |
|---|---|---|---|---|
| CMPP / SGIP / SMGP 直连 | 已有企业资质、服务代码和运营商网关账号 | MO、MT、REPORT、协议流控和路由控制 | 商务开通、网络条件、协议联调、运维 | 长期主路线 |
| 腾讯云短信 | 中国大陆企业或有企业授权的团队 | 发送 API、短信回复回调、控制台和审核流程 | 实名认证、资质、签名、模板、运营商报备 | 国内云平台优先评估 |
| 阿里云短信 | 已使用阿里云体系的企业 | 发送 API、`SmsUp` HTTP/队列上行 | 资质、签名、模板、密钥和业务审核 | 国内备选 |
| Twilio | 海外用户和快速 PoC | 可编程号码、入站 Webhook、发送 API、状态回调 | 试用限制、地区与号码政策 | 最快验证海外闭环 |

### 腾讯云能不能解决个人没有运营商端口的问题

技术接入层面可以。腾讯云替用户处理与运营商之间的大部分协议连接，开发者通过 HTTPS API 发送短信，通过回复回调接收用户上行，不需要自己实现 CMPP、SGIP 或 SMGP。

业务开通层面需要按主体判断。腾讯云国内短信快速入门要求完成账号认证、资质、签名和正文模板配置。官方身份与签名说明显示，中国大陆个人认证主体的个人签名无法完成运营商实名报备；企业资料、网站或 App 所属主体及相应授权链路更适合正式服务。个人用户注册腾讯云账号后，不应承诺一定能立即获得一个支持自由双向 AI 对话的短信通道。

因此，安装向导可以这样分流：

1. 用户有企业服务代码和网关账号：进入运营商直连配置；
2. 用户有企业主体或企业授权：优先打开腾讯云短信开通页，准备资质、签名和模板；
3. 用户只有个人身份、目标在海外：引导使用 Twilio 试用号码完成 PoC；
4. 用户只有个人身份、目标在中国大陆：先使用 WorkBuddy 微信或飞书助理验证需求，同时申请合规云短信通道，不宣传“个人手机号直接变成短信机器人”。

阿里云的逻辑相近：发送 API 必须在后端使用，AccessKey 不能放入客户端提示词；上行回复由 `SmsUp` 推送到 HTTP 地址或消息队列。两家国内平台都需要确认真实业务样例是否允许开放式 AI 问答、过程通知和用户回复。

### 云平台接入也不要暴露用户电脑

云平台需要一个公开 HTTPS 回调地址。推荐把回调放在 Cloudflare Workers、腾讯云函数或阿里云函数计算等托管环境，再让本地桥接程序主动取消息。开发测试阶段可以使用临时隧道，正式版本不应要求用户长期运行 ngrok，也不应把本地 `8080` 端口映射到公网。

云端事件只保存最小字段：供应商消息 ID、用户别名、密文正文、接收时间、设备 ID 和过期时间。默认 24 小时过期；本地领取成功后尽快删除正文。供应商密钥保存在云端 Secret 管理或用户本机系统钥匙串，不进入 Agent 上下文。

## 四、本地 CLI 要做到快速安装

CodeBuddy CLI 官方提供 Homebrew、npm 和原生安装器。安装器应自动识别环境，普通用户只需选择一种方式：

```bash
# macOS
brew install Tencent-CodeBuddy/tap/codebuddy-code

# 已有 Node.js 18.20 或更高版本
npm install -g @tencent-ai/codebuddy-code

# macOS / Linux 原生安装器（Beta）
curl -fsSL https://www.codebuddy.cn/cli/install.sh | bash

codebuddy --version
```

首次运行 `codebuddy` 后按界面完成登录。短信桥可以设计成三条命令；以下名称是建议开发的产品接口，不代表已经发布的 npm 包：

```bash
npx @tuaran/workbuddy-sms init
workbuddy-sms doctor
workbuddy-sms start
```

`init` 向导依次完成通道选择、官方注册页跳转、凭证保存、手机号验证码绑定、专家/Skills 选择、自检短信和系统保活。macOS 使用 LaunchAgent，Windows 使用 Windows Service，Linux 使用 systemd 用户服务。用户不需要理解 Webhook、SSE、服务代码或协议序列号。

`doctor` 应给出明确动作：

```text
✓ CodeBuddy CLI 已安装并登录
✓ Agent API 只监听 127.0.0.1
✓ 腾讯云凭证与回调验签通过
✓ 控制手机号已完成验证码绑定
✓ 上行 → 本地执行 → 下行自检成功
! 电脑休眠后无法执行：建议开启接电时保持唤醒
```

通道凭证必须保存到 macOS Keychain、Windows Credential Manager 或 Linux Secret Service。配置文件只记录 Secret 引用，安装命令和日志均不打印密钥。

## 五、WorkBuddy 已经具备哪些底座

| 能力 | 已确认的公开能力 | 对短信方案的意义 |
|---|---|---|
| 专家与 Skill | 插件可以包含自定义 Agent、Skills、Hooks、MCP；WorkBuddy 项目也会统一注入专家、Skill、连接器和指令 | 一个安装包即可封装专家及其工具链 |
| 远程入口 | WorkBuddy 助理支持微信、企微、QQ、钉钉、飞书 | 已证明“消息入口遥控本机 Agent”的产品形态成立 |
| 执行过程 | 助理页面保留思考过程、操作步骤、产物和结果；微信/企微已有流式输出 | 可把进度映射成外部事件，但不需要暴露模型内部推理文本 |
| 权限 | 默认权限会在脚本、外部程序、敏感路径、删除和网络操作前请求确认 | 短信通道必须处理 `awaiting_approval`，不能默认绕过 |
| 会话 | CLI 支持固定 `session-id`、`--resume`、REST Runs 和 ACP 有状态会话 | 手机号可以稳定映射到一个会话或多个命名线程 |
| 记忆 | WorkBuddy 会从历史会话提取用户记忆；CLI 有用户、项目、自动记忆和相关性选择 | 可以实现长期个性化，但两套记忆的自动互通尚未得到公开文档确认 |
| 定时 | WorkBuddy 有本地自动化；CLI HTTP API 支持 `durable: true` 的定时任务 | 定时执行可留在本机，结果再通过短信通知 |

### 专家安装包建议

在 CLI 兼容路线中，把个人专家做成一个版本化插件：

```text
personal-expert/
├── .codebuddy-plugin/plugin.json
├── agents/personal-expert.md
├── skills/
│   ├── calendar/SKILL.md
│   ├── knowledge-search/SKILL.md
│   └── daily-review/SKILL.md
├── hooks/hooks.json
├── .mcp.json
└── settings.json
```

`settings.json` 可将该专家设为主 Agent。每个 Skill 应声明输入、输出、可访问目录、是否联网和是否具有副作用。来源不明的 Skill 不应获得 Shell、文件写入或凭证权限；自定义 Agent/Skill 的 frontmatter Hook 默认也会被安全闸门拒绝。

## 六、“思考过程持续返回”应拆成两件事

### 1. 技术上的流式事件

CodeBuddy CLI 支持 `--output-format stream-json --include-partial-messages`。HTTP 服务支持异步创建 Run，再通过 `/api/v1/runs/:runId/stream` 接收 SSE；ACP 适合更完整的有状态客户端。桥接进程可以持续拿到文本增量、工具调用、等待确认、错误和完成事件。

### 2. 用户侧应该看到什么

短信侧不应转发原始思维链。内部推理可能包含系统提示、候选方案、工具参数、文件路径和临时错误，也会产生大量碎片短信。可见内容应限定为可审计的任务进度：

| 内部事件 | 短信文案示例 | 是否立即发送 |
|---|---|---|
| `accepted` | 已收到，正在检查可用资料。任务号 A17 | 是 |
| 连续文本增量 | 不发送，留在本地日志 | 否 |
| 工具开始/结束 | 已完成资料检索，正在整理结果 | 超过 60 秒时发送一次 |
| 等待授权 | 需要读取“合同”目录，请在 WorkBuddy 中批准。任务号 A17 | 是 |
| `completed` | 结论摘要，回复“详情 A17”可继续查看 | 是 |
| `failed` | 执行未完成：本机离线。恢复后可回复“重试 A17” | 是 |

进度合并器建议设置三个阈值：首条确认在 5 秒内发出；同一任务的阶段消息至少间隔 60 秒；默认最多发送 3 条进度短信和 1 条最终短信。其余事件写入本地审计日志。

## 七、短信通道是最大的现实约束

### 双向通信

运营商短信协议需要同时处理三类消息：手机发给服务代码的上行短信（MO）、平台发给手机的下行短信（MT），以及网关返回的提交响应和送达状态报告（REPORT）。中国移动、中国联通、中国电信的常见企业网关协议分别是 CMPP、SGIP、SMGP；协议版本和字段应以实际交付的接口规范为准。

开放式 AI 回答与运营商短信治理存在结构冲突。协议能够承载一段文本，并不代表该文本符合签约业务类型、签名、内容审核、频控和投诉治理要求。上线前需要把“个人专家问答、过程通知、失败通知、退订处理”的真实样例交给运营商确认，并取得允许双向 MO 的服务代码或扩展码。不能把网关返回提交成功当成终端已经送达，也不能把技术可发送当成业务获准发送。

建议与运营商确认并固定有限的消息样式：

- `〖个人助理〗任务{1}已收到，当前状态：{2}`
- `〖个人助理〗任务{1}需要确认：{2}，请在本机处理`
- `〖个人助理〗任务{1}已完成。摘要：{2}`
- `〖个人助理〗提醒：{1}`

最终回答超过短信限制时，先由一个“短信压缩 Skill”生成 120～240 字摘要。完整答案保留在本地会话。若必须远程查看全文，可生成短时有效、一次性令牌保护的页面；页面只暴露该任务结果，不提供本机文件浏览能力。

### 身份与权限

手机号只能作为路由键，不能直接等价为本机管理员身份。最低限度需要：

- 安装时由用户主动绑定手机号，并发送一次性验证码确认；
- 本地仅接受白名单号码，以运营商消息标识、序列号、手机号和接收时间组合去重，重复上行不重复执行；
- 读操作、写操作、外发操作分级，默认只开放只读 Skill；
- 删除、转账、发邮件、发布内容、修改系统配置等高风险动作必须回到 WorkBuddy 本机确认；
- 短信正文和云端日志不保存完整用户画像、访问令牌、文件内容和原始工具结果；
- 提供“暂停服务”“清空短信映射”“导出/删除记忆”的明确入口。

WorkBuddy 的 HTTP API 包含执行进程、终端和文件读写能力，默认要求密码认证；绑定非回环地址时强制认证。生产实现应让 API 只监听 `127.0.0.1`，由同机桥接进程访问。公网层不得直接转发任意 `/api/v1/*` 请求。

## 八、记忆怎么保留

记忆要按作用域拆开，否则一个错误摘要可能长期污染用户画像。

| 层级 | 建议存储 | 写入方式 |
|---|---|---|
| 当前短信轮次 | `message_id → run_id` | 自动，任务完成后清理临时内容 |
| 会话记忆 | `phone_hash + topic → session_id` | 用户回复“新对话”时新建 |
| 用户偏好 | CLI 用户记忆 / Typed Memory | 只有明确偏好或用户主动要求时写入 |
| 项目知识 | 项目 `CODEBUDDY.md`、规则与资料目录 | 版本化管理，用户可检查 |
| WorkBuddy 用户画像 | WorkBuddy 账号记忆 | 保留在 WorkBuddy；CLI 路线不要假设自动读取 |

WorkBuddy 当前每晚从会话中整理记忆，支持查看、编辑、删除和关闭。CodeBuddy CLI 的 Auto Memory 存在 `~/.codebuddy/memories/`，还可启用 user、feedback、project、reference 四种类型。官方更新记录明确提到 WorkBuddy 已改用独立的 `.workbuddy/` 配置目录，因此 MVP 需要做一次显式的记忆迁移或建立用户可审查的同步文件。

稳妥的同步规则是单向、可见、可撤销：用户从 WorkBuddy 导出或人工确认一份画像摘要，写入 CLI 用户记忆；短信对话中新产生的候选记忆先进入“待确认”列表，不自动反写 WorkBuddy 云端画像。

## 九、定时机制与离线处理

WorkBuddy 桌面自动化会在本地保存任务名称、提示词、调度规则、工作目录和状态，并以当前登录身份调用模型、工具、MCP 和连接器。CLI HTTP API 也能创建 `durable: true` 的定时任务。两者都依赖本机在线、Agent 进程运行和网络可用。

生产运行建议由操作系统负责保活：macOS 使用 LaunchAgent，Windows 使用 Task Scheduler 或 Windows Service。守护进程启动后依次完成健康检查、恢复未确认消息、连接短信队列、启动 Agent API、恢复持久化定时任务。

离线策略：

1. 云端队列只保存加密后的最小消息，默认 24 小时过期；
2. 本机重新上线后按事件时间和事件 ID 顺序消费；
3. 同一手机号同一时刻只允许一个执行中的 Run，后续短信作为补充消息或排队；
4. 超过 2 分钟仍未开始，向用户返回“设备离线/繁忙”；
5. 定时任务执行完成后只发送摘要，失败则发送可重试的任务号。

## 十、WorkBuddy 路线与豆包/扣子路线

| 维度 | WorkBuddy / CodeBuddy 本地节点 | 豆包模型或扣子智能体 API |
|---|---|---|
| 接入难度 | 中等，需要安装本地 CLI 和守护进程 | 较低，官方对话 API 支持流式响应 |
| 本地文件与凭证 | 强，直接使用用户电脑环境 | 需要上传、连接器或另建本地工具服务 |
| 专家与 Skills | 可打包 Agent、Skills、Hooks、MCP | 可配置智能体、工作流和插件 |
| 会话记忆 | 本机会话、项目记忆、Auto Memory；WorkBuddy 云画像需单独处理 | 通过 `conversation_id` 和 `user_id` 隔离会话，历史主要在云端 |
| 去中心化目标 | 符合，云端只做短信中继 | 云智能体承担主要推理和状态 |
| 适合场景 | 私人资料、长期陪伴、本机工具和高隐私任务 | 快速上线、多人服务、无需本机资源的问答 |

扣子官方对话 API 支持流式返回、保存历史，并通过调用方提供的 `user_id` 隔离用户。它可以更快做出短信 Bot，但用户在豆包 App 中已有的画像、会话和本地记忆不能据此推定会自动进入 API 智能体。若产品原则是“每个用户拥有自己的服务节点”，扣子更适合作为可选模型或云端降级通道。

### Twilio 的海外路线提供了什么参照

Twilio 展示了一条已经产品化的演进路线。早期开发者使用 Twilio 号码、入站 Webhook 和 Programmable Messaging API 自行连接 ChatGPT；Twilio 在 2026 年正式推出 Agent Connect，将这层胶水收敛为自托管、模型无关的 Agent 通道 SDK。它负责 SMS、RCS、WhatsApp、语音等通道的接入、身份归一、会话和记忆，开发者自己的 Agent 继续运行在自有环境。

这与运营商直连的层级不同。运营商交付服务代码、网关账号和 CMPP、SGIP、SMGP 等通信接口；Twilio 对底层号码、运营商连接、Webhook、状态回调和合规流程做了 API 化封装；Agent Connect 再把这些通信能力封装成统一的 Agent turn。对应到 WorkBuddy，需要的是一个官方 Channel SDK，或由本地 `sms-cli` 自行承担这一层。目前 WorkBuddy 的公开助理通道列表没有运营商短信，也没有公开说明可导出助理页面中的完整思考过程。

Twilio 可以发送应用交给它的任何合规文本，因此开发者可以把 `accepted`、工具开始、等待批准和完成摘要分别发送成多条短信。它不会主动从 WorkBuddy 或模型中提取内部推理。Agent Connect 的官方示例回调返回一段 Agent response，再由 SMS adapter 投递；公开的 ChatGPT SMS 教程、Agent Connect Quickstart 和 SkyOwl Airlines 参考架构展示了问答、工具、长期记忆与跨短信/语音续接，没有展示把原始思维链持续发送给用户。

海外经验支持的产品承诺应限定为“在短信里持续看到可审计的进度”。若 WorkBuddy 后续公开稳定的执行事件，桥接层可以转发其状态、工具调用和阶段总结；若只提供最终输出，Twilio 或运营商短信通道都无法补出 WorkBuddy 的思考过程。

## 十一、larksuite/cli 能否作为预装通道

可以。它更适合先把对话窗口放到飞书，短信保留为通知或加急通道。

### 1. 它提供什么

`larksuite/cli` 是飞书官方团队维护的开源 CLI，采用 MIT 许可证，面向人类和 AI Agent。当前 README 列出 200 多条命令、18 个业务域和 26 个 Agent Skills，覆盖即时通讯、文档、知识库、日历、任务、邮箱、会议、多维表格等能力。

对这套私人智能体最有价值的是两项：

- `lark-event`：`lark-cli event consume im.message.receive_v1 --as bot` 通过 WebSocket 长连接接收消息，事件以 NDJSON 写到 stdout；本地进程无需公网 IP，也不必自己维护 Webhook。
- `lark-im`：机器人可以发送、回复、编辑消息，支持 Markdown、文件和交互卡片。任务进度可以持续更新同一张卡片，减少消息刷屏。

它还暴露飞书的应用内加急、短信加急和电话加急能力。加急只能作用于机器人自己发送、且位于机器人所在会话中的消息。它属于飞书消息的补充通知，不能接收用户从普通短信端发来的新问题。

### 2. 与 WorkBuddy 的两种组合

| 组合 | 实现方式 | 适用条件 |
|---|---|---|
| WorkBuddy 原生飞书助理 | 在 WorkBuddy 助理设置中填写飞书应用凭证，使用 WebSocket 长连接 | 希望直接复用 WorkBuddy 助理会话、审批、专家和记忆 |
| `lark-cli` + CodeBuddy 本地 Agent | `lark-event` 收消息 → 本地桥接 → CodeBuddy Run/SSE → `lark-im` 更新卡片 | 需要自定义路由、多个会话、结构化事件、飞书全套工具或独立产品外壳 |

WorkBuddy 官方已经提供飞书接入，支持长连接和 URL 回调。基础的一对一私人助理没有必要再造消息接收层。`lark-cli` 的价值集中在可编排性：桥接进程能自行决定消息对应哪个 Agent Session、允许哪些飞书能力、如何展示任务状态，以及何时触发短信/电话加急。

推荐的数据流如下：

```text
飞书私聊机器人
  ↓ im.message.receive_v1（WebSocket）
lark-cli event consume（NDJSON）
  ↓ 校验 sender_id / chat_id / message_id
本地 agent-bridge
  ↓ POST /api/v1/runs
CodeBuddy CLI + 私人专家 + Skills + 本地记忆
  ↓ SSE：accepted / progress / approval / completed
lark-cli im：回复消息或更新进度卡片
```

### 3. 预装流程

安装本身可以自动化：

```bash
npx @larksuite/cli@latest install
npx skills add larksuite/cli -y -g
```

首次配置无法做到完全静默。用户仍需在浏览器完成飞书应用创建或授权：

```bash
lark-cli config init --new
lark-cli auth login --recommend
lark-cli auth status
```

如果追求用户真正拥有自己的节点，每个用户应创建自己的飞书自建应用，App Secret 和 OAuth Token 保存在用户设备。统一使用开发方的公共应用会简化开通流程，也会把应用控制权、审批和部分审计集中到开发方。

### 4. 权限配置

机器人收发消息使用 bot 身份；访问用户日历、私有文档或个人任务时，部分操作需要 user 身份。可同时维护 bot 与 user 两套授权，但每个命令都要固定身份和 scope，不能让模型自由切换。

首版只申请以下能力：

- 接收私聊机器人的消息；
- 发送、回复和编辑机器人自己的消息；
- 用户明确启用的只读业务域；
- 需要写入的单个能力逐项授权。

官方安全说明也建议把机器人用作私人助理，不加入群聊或开放给其他用户。CLI 授权后会以用户身份执行命令，提示注入可能导致数据泄露或越权操作，因此桥接层应限制允许的 `lark-cli` 子命令，并在副作用命令前执行 `--dry-run` 或人工确认。

### 5. 对“持续思考”和定时的改善

飞书比短信更适合展示过程。桥接层从 Agent SSE 获取事件后，可以每 2～5 秒更新一次消息卡片，卡片只显示阶段、已完成步骤、当前工具和是否等待审批。最终答案完成后再替换卡片正文。原始思维链继续留在本地，不发送到飞书。

`lark-cli` 的事件消费者解决实时收消息，定时执行仍由 WorkBuddy 自动化、CodeBuddy 持久化 scheduled task 或操作系统守护进程负责。定时任务完成后，调用 `lark-cli im +messages-send` 主动推送即可。

### 6. 推荐取舍

第一版采用 WorkBuddy 原生飞书助理，验证专家、记忆、权限和远程对话是否符合预期。第二版需要产品级定制时，再把 `lark-cli` 预装进本地节点。此时飞书承担主对话界面，短信只用于离线、超时、关键提醒和电话加急。

## 十二、可以做一个 Agent 原生的统一 sms-cli

短信业务更适合拥有自己的 CLI。`lark-cli` 可以作为交互与安全设计的参考，不能代替短信通道。统一 `sms-cli` 同时支持运营商协议和云通信 API，上层 Agent 不需要感知供应商差异。

### 1. 产品定位

`sms-cli` 是运行在用户控制环境中的短信通道客户端。它不负责大模型推理，也不管理专家记忆；它把 CMPP、SGIP、SMGP 和云平台 Webhook/API 的连接、事件与状态差异收敛成稳定的本地命令：

```text
WorkBuddy / CodeBuddy / 其他本地 Agent
                 │
                 ▼
              sms-cli + SMS Skills
       ┌─────────────┴─────────────┐
       ▼                           ▼
 CarrierGateway               CloudGateway
 CMPP / SGIP / SMGP     Tencent / Aliyun / Twilio
       │                           │
       └──────── 短信网络 ─────────┘
```

同一套核心库还可以提供 MCP Server。CLI 适合本地 Agent、Shell 管道、守护进程和诊断；MCP 适合跨 Agent 的结构化工具调用。两种入口共用凭证、策略、幂等库和 `CarrierGateway` 适配器，避免出现两套发送逻辑。

### 2. 第一版命令面

```bash
# 企业直连；只添加实际签约的通道
sms-cli gateway add mobile-main --protocol cmpp3
sms-cli gateway add unicom-main --protocol sgip12
sms-cli gateway add telecom-main --protocol smgp3

# 云通信平台；凭证从系统 Secret 存储读取
sms-cli gateway add tencent-main --provider tencent-cloud
sms-cli gateway add aliyun-main --provider aliyun
sms-cli gateway add twilio-main --provider twilio
sms-cli auth status
sms-cli doctor

# 查询运营商分配的连接、服务代码和本地策略
sms-cli gateway list --json
sms-cli service-code list --json
sms-cli policy check --profile personal-agent

# 发送：只允许已登记别名、服务代码和批准的消息类型
sms-cli send \
  --to self \
  --service-code personal-agent \
  --message-type task-completed \
  --text "任务 A17 已完成：资料整理完成"

# 实时消费 MO 和 REPORT
sms-cli event list --json
sms-cli event schema sms.mo.received --json
sms-cli event consume sms.mo.received --format ndjson
sms-cli event consume sms.report.received --format ndjson

# 本地守护进程
sms-cli daemon start
sms-cli daemon status --json
sms-cli daemon stop
```

成功结果统一写 stdout，错误和运行状态写 stderr：

```json
{"ok":true,"gateway":"mobile-main","protocol":"cmpp3","data":{"message_id":"...","accepted":true}}
```

事件流每行一个完整 JSON：

```json
{"event":"sms.mo.received","event_id":"...","from":"phone_hash","service_code":"personal-agent","text":"继续","received_at":"..."}
```

父进程等待固定的 `[sms-event] ready` 标记后再读取 stdout。这样 WorkBuddy Skill、CodeBuddy Agent、systemd 和 LaunchAgent 都能可靠判断消费者是否已经建立连接。

### 3. 运营商与云平台适配层

上层统一使用 `SubmitMT()`、`ReceiveMO()`、`ReceiveReport()` 和 `HealthCheck()`。运营商适配器维护 TCP 长连接；云平台适配器负责 HTTPS API、Webhook 验签、回调去重和状态码归一。第一版按真实用户选择实现一个适配器，接口稳定后再扩展：

```text
CarrierGateway
├── Connect() / Authenticate()
├── SubmitMT()
├── ReceiveMO()
├── ReceiveReport()
├── SendHeartbeat()
├── Reconnect()
└── HealthCheck()
```

```text
CloudGateway
├── VerifyWebhook()
├── SubmitMessage()
├── ReceiveUpstream()
├── ReceiveStatusCallback()
├── NormalizeProviderError()
└── HealthCheck()
```

守护进程维护运营商网关的持久 TCP 会话，负责鉴权、心跳、断线重连、序列号、窗口与流控、超时重试、字符编码、长短信拆分/重组，以及 MO 和 REPORT 的确认应答。协议处理与 Agent 执行必须解耦：收到上行包后先写入本地 SQLite 并按协议及时应答，再异步投递给 Agent，避免模型执行时间拖垮网关连接。

若运营商接入点不能从用户电脑直接访问，或使用云平台 Webhook，可把通道连接器部署到用户控制的企业网络或云函数。连接器收到 MO/REPORT 后写入加密队列，本地 `sms-cli daemon` 通过出站长连接领取；MT 反向提交到连接器。该节点仍然只保存最小通道事件，不运行专家。

### 4. 配套 Skills

预装包至少包含四个 Skill：

| Skill | 能力 | 默认权限 |
|---|---|---|
| `sms-shared` | 网关状态、协议错误解释、通道路由 | 只读 |
| `sms-send` | 用已批准的消息类型向白名单别名提交 MT | 需审批 |
| `sms-event` | 监听上行回复和送达回执 | 只读、长期运行 |
| `sms-policy` | 摘要、编码与长度检查、频控、退订词和费用预算 | 确定性规则优先 |

专家收到上行事件后，把 `phone_hash` 映射到自己的 Agent Session，再将回复文本作为普通用户消息继续会话。手机号明文只在最终网关适配器内短暂使用，不进入提示词、Agent 记忆和普通日志。

### 5. 权限模型

`sms-cli` 的默认策略应比运营商协议客户端更窄：

- Agent 无权新增网关、读取连接口令、修改服务代码、添加接收号码或变更通道路由；
- 收件人使用安装时登记的 `self`、`family-1` 等别名，Agent 看不到手机号；
- 只允许已批准的业务类型和固定前缀，正文经过长度、编码、敏感内容和退订规则检查；
- `send` 默认执行 dry-run，副作用调用需要 WorkBuddy 审批票据；
- 单号码、单小时、单日和总费用均设本地硬上限；
- `TD`、`T`、`N`、`STOP`、`退订` 等指令在进入 Agent 前处理；
- 凭证保存到 macOS Keychain、Windows Credential Manager 或 Linux Secret Service；
- 每次发送保存服务代码、正文哈希、审批人、协议消息 ID、提交响应和最终送达状态。

不建议为 Agent 开放原始报文发送、网关配置或任意目的号码接口。诊断场景可以保留受控的协议抓包和回放工具，但必须脱敏，并只允许管理员在测试通道使用。

### 6. 它怎样接入本地专家

```text
sms-cli event consume sms.mo.received
  ↓ 上行 NDJSON
agent-bridge：去重、身份绑定、session 映射
  ↓
CodeBuddy / WorkBuddy 专家会话
  ↓ SSE 事件
progress-aggregator：只选阶段状态与最终摘要
  ↓
sms-cli send
```

短信中的“新对话”“继续 A17”“取消 A17”“状态 A17”由桥接层解析。普通自然语言再交给专家。任务执行过程每 60 秒最多产生一条状态短信，原始思维链不出本机。

### 7. 业务边界

这个 CLI 能解决软件接入，无法替代运营商业务开通：

- 用户通常向运营商分配的企业服务代码或扩展码发送、回复短信，不能把任意个人手机号直接变成 Agent 地址；
- 接入账号、服务代码、协议版本、上行路由、网络白名单和双向能力需要与签约运营商逐项联调；
- 签名、内容、业务类型、频率、投诉和退订规则需要提前确认；协议本身不会替你完成合规审核；
- 开放式长回答容易触发内容审核、长度、费用和频率问题；
- 多用户或多会话同时共用一个通道时，需要扩展码、任务码或“唯一活跃会话”规则解决归属。

因此，`sms-cli` 的第一个可用版本应限定为“企业资质下的一名已绑定用户，用短信询问自己的本地专家”。它具备清楚的闭环，也能验证最核心的个人智能服务形态。

## 十三、分四步落地

### 第 0 阶段：两周内验证需求

直接使用 WorkBuddy 飞书助理或微信助理绑定一台常开电脑，安装目标专家和 Skills。只验证四件事：远程问询频率、平均任务耗时、需要确认的比例、用户是否真的需要过程消息。此阶段无需开发短信桥，也无需自建 `lark-cli` 消息接收层。

验收指标：连续 7 天可用；20 个真实任务中成功完成 16 个以上；高风险动作全部触发确认；用户能从手机继续同一会话。

### 第 1 阶段：飞书 CLI 桥接 MVP

预装 `lark-cli`、Agent 插件和本地 `agent-bridge`。只监听私人机器人 P2P 消息，将 `chat_id` 映射到固定 Agent Session，通过飞书卡片返回进度、审批和结果。先跑通飞书文档、日历与任务的只读 Skill，再逐项开放写权限。

验收指标：WebSocket 断线能自动恢复；重复事件不重复执行；只有绑定用户可以触发；卡片更新频率受控；高风险工具全部进入审批；重启后能恢复同一会话。

### 第 2 阶段：单用户短信 MVP

在一台测试电脑安装 CodeBuddy CLI，加载同一套专家插件。实现一个本地 `sms-bridge`：

1. 企业已有运营商端口时，使用 CMPP、SGIP 或 SMGP 建立连接；个人或小团队使用已经通过审核的腾讯云、阿里云或 Twilio 通道；
2. 接收 MO 或云平台上行回调后先验签、落库并应答，再校验白名单、事件 ID、指令长度和速率；
3. 将手机号映射到固定会话 ID；
4. 调用本机 `/api/v1/runs`；
5. 读取 SSE，生成阶段摘要；
6. 通过统一 `SubmitMT()` 发送已批准样式的进度和最终摘要；
7. 接收 REPORT 或云平台状态回调，SQLite 保存通道消息、Run、提交响应、送达和审批状态，不保存模型凭证明文。

首版只开放无副作用能力：资料查询、个人知识库问答、日程查看、文本总结和提醒。文件写入、外部消息发送和 Shell 执行暂不开放。

### 第 3 阶段：多设备与可安装产品

增加一个薄云端中继、设备注册、出站长连接、端到端消息加密、离线队列、版本升级和诊断包。每个用户默认拥有独立设备节点与独立加密密钥。专家插件和桥接程序分别签名、版本化，更新前展示权限差异。

这一阶段再评估是否向 WorkBuddy 申请原生短信助理能力。原生接入一旦开放，可以复用同一套专家、助理会话、审批 UI 和 WorkBuddy 用户画像，维护成本会明显下降。

## 十四、需要先验证的八个问题

1. 目标运营商或云通信平台能否为该主体开通双向短信，并书面允许个人专家问答和过程通知这一业务类型；
2. WorkBuddy 专家包能否无损投影到 CodeBuddy CLI 插件，尤其是专有 Skill 和连接器；
3. REST Run 的 SSE 中实际包含哪些稳定事件，权限请求能否可靠映射为 `awaiting_approval`；
4. WorkBuddy 记忆是否存在官方导出接口，CLI 是否有受支持的导入方式；
5. 同一 Agent 会话在短信、CLI 和 WorkBuddy 桌面之间能否共享或恢复；
6. WorkBuddy / CodeBuddy 的个人订阅条款是否允许把该节点包装成面向其他用户的服务。
7. 飞书自建应用能否在目标用户的租户中顺利创建、发布并取得最小权限；短信/电话加急是否包含在用户套餐内及其实际限额。
8. 测试通道实际交付的是 CMPP、SGIP、SMGP 还是云平台 Webhook/API；连接方式、并发窗口、长短信、MO、REPORT、号码或服务代码能否支持连续多轮问答。

公开文档目前只能证明各模块分别存在，不能证明第 1～6 项已经形成一条官方支持的端到端链路。MVP 应使用运营商或云通信平台交付的测试账号、真实号码或服务代码、批准的消息样例和只读 Skill 做一轮实测，再决定是否产品化。

## 十五、信息来源与说明

- [WorkBuddy 助理（远程任务）](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Assistant)：支持平台、完整执行记录、单会话和安全边界。
- [WorkBuddy 微信助理接入指南](https://www.codebuddy.cn/docs/workbuddy/WeixinBot-Guide)：本地执行、远程审批、常开主机和一对一绑定。
- [WorkBuddy 更新日志](https://www.codebuddy.cn/docs/workbuddy/Changelog)：微信/企微流式输出、长会话恢复等近期能力。
- [WorkBuddy 默认权限与安全沙箱](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Permission-Modes)：高风险操作确认及完全访问风险。
- [WorkBuddy 记忆](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Memory)：记忆提取、管理和隐私范围。
- [CodeBuddy Code HTTP API Beta](https://www.codebuddy.cn/docs/cli/http-api)：REST Runs、SSE、ACP、认证、插件和持久化定时任务。
- [CodeBuddy CLI 安装](https://www.codebuddy.cn/docs/cli/installation)：npm、Homebrew、原生安装器、版本检查与更新。
- [CodeBuddy Channels Beta](https://www.codebuddy.cn/docs/cli/channels)与[通道参考](https://www.codebuddy.cn/docs/cli/channels-reference)：把 Webhook 或外部事件推入运行中的会话，并通过工具双向回复。
- [CodeBuddy 插件参考](https://www.codebuddy.cn/docs/cli/plugins-reference)：Agent、Skills、Hooks、MCP 及安全闸门。
- [CodeBuddy Agent SDK](https://www.codebuddy.cn/docs/cli/sdk)与[记忆管理](https://www.codebuddy.cn/docs/cli/memory)：配置来源、会话及本地记忆位置。
- [Twilio Messaging Webhooks](https://www.twilio.com/docs/usage/webhooks/messaging-webhooks)：入站短信 Webhook、TwiML 回复和送达状态回调。
- [Twilio Programmable Messaging Quickstart](https://www.twilio.com/docs/messaging/quickstart)与[试用账户说明](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account)：号码开通、已验证收件人、地区与试用限制。
- [Twilio Agent Connect](https://www.twilio.com/en-us/blog/products/launches/agent-connect)与[官方 Quickstart](https://www.twilio.com/docs/conversations/agent-connect/quickstart)：自托管 Agent 接入 SMS、语音和会话上下文的官方路线。
- [Twilio ChatGPT SMS 教程](https://www.twilio.com/en-us/blog/building-chatbot-chatgpt-api-twilio-programmable-sms-python)：早期以 Flask Webhook 自建短信 AI 对话的公开案例。
- [Twilio SkyOwl Airlines 参考架构](https://www.twilio.com/en-us/blog/developers/tutorials/integrations/ai-twilio-agent-connect-amazon-bedrock-agentcore)：短信与语音共用 Agent、身份和长期记忆的多通道案例。
- [中国移动北京云 MAS](https://service.bj.10086.cn/m/style/5Gzt1/sub1_11.html)：集团短信产品支持 Web、SDK、CMPP 等接入方式。
- [腾讯云国内短信快速入门](https://cloud.tencent.com/document/product/382/37745)、[认证主体与签名限制](https://cloud.tencent.com/document/product/382/13444/)与[短信回复回调](https://intl.cloud.tencent.com/zh/document/product/382/35605)：资质、签名模板、实名报备和上行回调。
- [阿里云短信 API](https://help.aliyun.com/zh/sms/getting-started/use-sms-api)、[签名规范](https://help.aliyun.com/zh/sms/user-guide/signature-specifications-1)与[SmsUp 上行回调](https://help.aliyun.com/zh/sms/developer-reference/receipt-message-faq)：后端发送、AccessKey 安全、签名要求和回复推送。
- [中国联通合作方门户：短信协议](https://prm.chinaunicom.com/portal/information/hzyd/index.xhtml?type=sms)：列出 SGIP 协议及联网、鉴权相关资料入口。
- [CMPP 3.0 协议文档镜像](https://www.kannel.org/~tolj/specs/CMPP2/CMPP-v30.pdf)：用于核对连接、消息头、提交、上行和状态报告报文；最终以运营商交付版本为准。
- [go-sms-protocol](https://github.com/hujm2023/go-sms-protocol)：可参考的开源 Go 协议库，覆盖 CMPP 2.0/3.0、SGIP 1.2、SMGP 3.0 和 SMPP；它不是运营商官方 SDK，上线前需做协议一致性与压力测试。
- [扣子发起对话 API](https://docs.coze.cn/developer_guides_chat_v3)：流式响应、`conversation_id`、`user_id` 与历史保存。
- [larksuite/cli 官方仓库](https://github.com/larksuite/cli)：安装、命令、身份、Agent Skills 与安全说明。
- [lark-event Skill](https://github.com/larksuite/cli/blob/main/skills/lark-event/SKILL.md)：WebSocket 事件消费、NDJSON、进程契约和消息事件 Schema。
- [lark-im Skill](https://github.com/larksuite/cli/blob/main/skills/lark-im/SKILL.md)：消息收发、编辑、卡片、用户/机器人身份和加急能力。
- [WorkBuddy 接入飞书指南](https://www.codebuddy.cn/docs/workbuddy/Feishu-Guide)：原生飞书助理、长连接、应用权限和事件配置。
- [站内：WorkBuddy + 消息（SMS / 5G 消息）](/articles/research/topics/workbuddy-sms-rcs-channel)：短信通道、资质、成本与替代方案。
- [站内：WorkBuddy 接入双向短信群](/articles/research/topics/workbuddy-sms-distributed-agent-messaging-architecture)：多人短信桥、云端控制面和分布式 Agent。

资料截至 2026 年 9 月 1 日。有关 WorkBuddy 与 CodeBuddy CLI 记忆互通、运营商直连接入条件、云通信平台对开放式 AI 问答的审核、商业授权和权限事件格式的结论仍需实测或向对应方书面确认。
