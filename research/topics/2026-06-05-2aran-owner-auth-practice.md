---
title: 2aran.com 私有功能鉴权逻辑调研：统一 owner session 与端到端加密边界
category: topics
date: 2026-06-05
tags: [2aran.com, 鉴权, owner session, Cloudflare, Next.js, 私有工具, Agent Ops, 端到端加密]
summary: 梳理 2aran.com 当前私有功能的鉴权体系：统一登录态、统一 owner 判断、共享 session cookie、私有 API 保护，以及长期罗盘的端到端加密边界。
tldr: 当前站点的正确抽象不是“每个工具各自登录”，而是“一个主站 session + 一个 owner 判断 + 各业务自己的数据边界”。语音记事、茉莉奶爸待办、项目组合看板和自动化控制台应该共享 owner 鉴权；长期罗盘也共享 owner 门禁，但内容层采用端到端加密，不能被简单归入普通私有数据。
topic_type: tech
assistance: codex
model: gpt-5
pv: 0
---

## 一、背景：私有工具越来越多，鉴权不能继续分散

2aran.com 现在不只是一个个人博客站。它已经同时承载了几类不同属性的功能：

- 公开内容：文章、调研、周刊、技能页、站点介绍；
- 私有工具：语音记事、茉莉奶爸待办、项目组合看板；
- 自动化控制：Agent Ops、任务编排、运行日志、本地 Agent 任务；
- 强隐私系统：长期罗盘，带端到端加密；
- 未来可能继续增加的站长执行工具。

如果每个工具都各写一套登录、用户判断、cookie、API 校验，短期能跑，长期会失控。真正应该统一的是“谁是站长 / owner”这个判断。

这次调研记录当前站点的鉴权逻辑，并给出以后扩展此类私有工具时的管理原则。

## 二、当前鉴权体系的核心抽象

当前主站鉴权可以拆成三层：

```text
登录与 session 签发
  -> edgeSession: tuaran_session
  -> ownerAuth: isOwnerUser / getOwnerUserFromRequest
  -> 业务页面与 API: voice-tasks / dad-todo / project-portfolio / long-compass / agent-ops
```

### 1. `edgeSession`：统一登录态

主站用 `tuaran_session` 作为统一登录 cookie。它不是普通随机字符串，而是一个用 `NEXTAUTH_SECRET` 签名的 session token。

它负责几件事：

- 从 OAuth / 邮箱登录结果生成 session；
- 把 user 信息写进 session payload；
- 用 HMAC 校验 token 是否被篡改；
- 检查过期时间；
- 在生产环境根据 `NEXTAUTH_URL` 决定 cookie 作用域；
- 当 host 是 `2aran.com` 或其子域时，把 cookie domain 设为 `.2aran.com`。

这个设计的结果是：主站和子域工具可以共享同一个浏览器登录态。

### 2. `ownerAuth`：统一 owner 判断

`ownerAuth` 是当前最重要的抽象。它不负责“用户是谁”，而负责“这个用户是不是 owner”。

判断来源包括：

- `SITE_OWNER_IDS`
- `SITE_OWNER_GITHUB_IDS`
- `PRIVATE_VAULT_OWNER_IDS`
- `VOICE_TASK_OWNER_IDS`
- `SITE_OWNER_LOGINS`
- `PRIVATE_VAULT_OWNER_LOGINS`
- `SITE_OWNER_EMAILS`
- `PRIVATE_VAULT_OWNER_EMAILS`
- fallback owner login / email

这说明 owner 不是某一个页面的概念，而是全站私有能力的统一身份边界。

当前核心函数是：

- `isOwnerUser(user)`：判断 user 是否属于 owner；
- `getOwnerUserFromRequest(req)`：从请求 session 中取 user，并返回 `401 / 403 / 200` 语义；
- `safeEqual(a, b)`：给少数 token fallback 场景做常量时间比较。

以后所有“只有站长能用”的工具，都应该优先接这里，而不是再写一份自己的身份判断。

### 3. `/api/me`：前端统一识别 owner 状态

前端页面不应该自己解析 cookie。当前 `/api/me` 会返回：

```json
{
  "user": "...",
  "isOwner": true,
  "secureCookie": true
}
```

这让客户端组件可以统一做三件事：

- 判断当前是否已登录；
- 判断当前是否 owner；
- 决定展示工具界面还是登录入口。

语音记事、茉莉奶爸待办这类客户端工具，应该以 `isOwner` 作为进入条件，而不是只看是否存在 `user`。

## 三、各功能如何接入

### 1. 语音记事

语音记事属于站长执行工具。它的页面层通过 `/api/me` 判断 `isOwner`，API 层通过 `voiceTasksAuth` 获取 principal。

这里有一个现实设计：`voiceTasksAuth` 仍保留 API token fallback。原因是语音记事未来可能存在脚本写入、快捷指令写入、自动化写入，不一定总有浏览器 session。

但 owner 判断本身已经统一到 `ownerAuth`。也就是说：

- 浏览器访问：走 `tuaran_session -> ownerAuth`；
- 脚本访问：可以走专门 token；
- owner 规则：仍然集中在同一处。

这是一种合理的“统一身份 + 场景 token 兜底”。

### 2. 茉莉奶爸待办

茉莉奶爸待办也是站长执行工具。它现在应该和语音记事一样，不再把“已登录用户”视为足够权限，而是明确要求 owner。

API 层使用 `getOwnerUserFromRequest(req)`。这意味着：

- 没 session：`401`；
- 有 session 但不是 owner：`403`；
- 是 owner：允许读写待办数据。

这个边界是对的。家庭待办不是公开产品，也不是多用户协作系统，没必要引入复杂 RBAC。

### 3. 项目组合看板

项目组合看板位于 AI 系统 / Agent Ops 的管理语境里，本质是“本地资产治理 + 项目归化路线图”。它包含项目状态、整合路径、产品线归属、后续优先级，这些不适合公开。

因此它也应该复用 owner session。

当前页面的保护逻辑是：读取 `tuaran_session`，校验 session，然后用 owner 判断决定是否展示看板；未通过则展示登录门。

这一点和语音记事、茉莉奶爸待办保持一致。

### 4. 自动化控制台 / Agent Ops

自动化控制台更特殊，因为它不是纯主站页面，而是本机 `agent-ops` 服务通过 `ops.2aran.com` 暴露出来。

它要同时满足两个要求：

- 浏览器访问时复用 `2aran.com` 的 `tuaran_session`；
- 本机维护时保留本地口令兜底。

合理链路是：

```text
浏览器
  -> ops.2aran.com
  -> Cloudflare Access
  -> Cloudflare Tunnel
  -> 127.0.0.1:4179
  -> 校验 tuaran_session 是否为 owner
  -> 若没有共享 session，再检查本地 agent_ops_session
```

这里的关键是 `NEXTAUTH_SECRET`。Agent Ops 必须拿到和主站一致的 `NEXTAUTH_SECRET`，才能验证主站签发的 `tuaran_session`。

这不是把主站逻辑复制一遍，而是让独立服务接受同一个签名事实：这个浏览器已经被 2aran.com 认证为 owner。

### 5. 加密调研文章

调研文章里也存在 `encrypted: true` 的私域内容。它过去更像“只靠文章密码保护”：页面可以公开打开，但正文 payload 是密文，用户在浏览器里输入密码解密。

归一化后，加密调研应该和长期罗盘保持同一分层：

- 访问层：先用 `tuaran_session + ownerAuth` 判断是否 owner；
- 内容层：通过后仍然只给密文 payload，明文需要在浏览器本地输入口令解密；
- SEO 层：加密调研不进入公开索引，避免把私域标题页当公开内容推广。

这不是用登录态替代加密，而是在加密外面补上统一门禁。owner session 负责“谁能进入解密界面”，文章口令负责“谁能读明文”。

### 6. 长期罗盘

长期罗盘不能只说“私有页面”。它有两层边界：

- 访问层：仍然应该复用 owner session；
- 数据层：端到端加密。

这两层不能混淆。

owner session 只能回答“谁可以打开这个系统”。端到端加密回答的是“即使服务端、数据库或中间层看到数据，也不应该读懂内容”。

所以长期罗盘应该在导航和产品说明里标成“端到端加密”，而不是普通 Private。它和语音记事、待办、项目组合看板共享 owner 门禁，但隐私等级更高。

## 四、当前逻辑的优点

### 1. 私有工具入口统一

现在可以用一句话概括：

> 只要是站长执行工具，默认走 `tuaran_session + ownerAuth`。

这比每个工具自己维护登录状态更稳。

### 2. 页面和 API 都有边界

只在前端隐藏按钮是不够的。当前重要私有 API 已经逐步改为服务端判断 owner，这是正确方向。

页面层负责体验：显示登录入口、展示用户状态。

API 层负责安全：没有 owner principal 就不读写数据。

### 3. 支持子域工具

`tuaran_session` 在生产环境可作用于 `.2aran.com`，这让 `ops.2aran.com` 这种子域服务可以共享主站 session。

这对未来很重要。因为站长工具不一定都在 Next.js 主站里，也可能是：

- 本地 Node 服务；
- Cloudflare Worker；
- 独立管理后台；
- Agent worker 控制面；
- 临时实验工具。

只要它能验证同一个 session，并复用同一套 owner 判断，就不需要重新设计登录体系。

### 4. 允许有限 fallback

统一不等于所有场景都只能浏览器登录。语音记事和 Agent Ops 都有合理的 fallback：

- 语音记事可以保留 API token，方便脚本或快捷指令写入；
- Agent Ops 可以保留本地口令，方便主站 session 不可用时维护。

关键是 fallback 要少、要明确、要只服务特定场景。

## 五、风险与需要继续收敛的点

### 1. owner 环境变量命名还有历史痕迹

当前 owner 来源里有 `PRIVATE_VAULT_*`、`VOICE_TASK_*` 这类历史命名。它们可以兼容保留，但长期看应该收敛为更通用的：

- `SITE_OWNER_IDS`
- `SITE_OWNER_LOGINS`
- `SITE_OWNER_EMAILS`

业务专属 owner env 只在确实需要“某个工具允许不同 owner”时存在。

### 2. fallback token 要有台账

fallback token 是方便，也是风险。

建议给所有 fallback 做登记：

| 工具 | fallback 类型 | 用途 | 是否可撤销 | 是否进 git |
|---|---|---|---|---|
| 语音记事 | API token | 脚本 / 快捷指令写入 | 是 | 否 |
| Agent Ops | 本地口令 | 本机维护兜底 | 是 | 否 |
| 长期罗盘 | 加密口令 / key | 内容解密 | 应独立管理 | 否 |

fallback 不能散落在代码里，更不能进入 git。

### 3. Agent Ops 依赖环境同步

Agent Ops 要复用主站 session，必须配置同一个 `NEXTAUTH_SECRET`。

如果本地 launchd、Cloudflare Tunnel 或将来的 worker 环境没有这个变量，表现就是：

- 主站已登录；
- 访问 `ops.2aran.com` 仍被要求本地口令；
- 共享 session 不生效。

这不是 cookie 问题，而是签名校验缺少 secret。

### 4. 长期罗盘需要独立看待密钥恢复

端到端加密系统最怕的是“登录态正常，但密钥丢了”。owner session 可以恢复访问权限，但不能恢复加密内容。

长期罗盘后续应单独设计：

- 密钥派生方式；
- 恢复短语或恢复文件；
- 重新授权流程；
- 加密数据迁移流程；
- 服务端永远不持有明文的约束。

这部分不要和普通 owner 登录混为一谈。

## 六、以后新增私有工具的规则

以后 2aran.com 新增类似“站长执行工具”时，建议按这个顺序处理：

### 1. 先判断工具类型

| 类型 | 示例 | 鉴权方式 |
|---|---|---|
| 公开内容 | 调研文章、周刊、公开页面 | 不需要 owner |
| 普通私有工具 | 语音记事、茉莉奶爸待办、项目组合看板 | `tuaran_session + ownerAuth` |
| 自动化控制工具 | Agent Ops、任务编排、日志、Agent worker | `tuaran_session + ownerAuth`，必要时本地 token 兜底 |
| 加密调研 | encrypted research | `tuaran_session + ownerAuth` + 浏览器本地解密 |
| 强隐私工具 | 长期罗盘 | `tuaran_session + ownerAuth` + 端到端加密 |
| 外部写入入口 | webhook、快捷指令、脚本 | 专用 token / 签名，不复用浏览器 cookie |

### 2. 页面层只做体验，不做最终安全

客户端可以通过 `/api/me` 判断 `isOwner`，用来展示登录入口或工具界面。

但真正的读写 API 必须在服务端再调用 owner 判断。

### 3. API 层统一返回语义

建议统一：

- `401`：没有有效 session；
- `403`：有 session，但不是 owner；
- `200`：通过 owner 判断；
- `404`：资源不存在，不用于掩盖身份问题，除非有明确安全需求。

这能减少前端判断分支，也方便以后做监控。

### 4. 子域服务必须声明 session 依赖

只要工具挂在 `*.2aran.com`，并希望复用主站登录，就必须满足：

- cookie domain 是 `.2aran.com`；
- session cookie 名称是 `tuaran_session`；
- session 签名 secret 与主站一致；
- owner 判断规则与主站一致；
- HTTPS 环境下使用 Secure cookie。

### 5. 端到端加密工具必须打标签

长期罗盘这类系统，应该在导航、调研、架构图里始终标明“端到端加密”。

原因是它的用户承诺不一样：

- 普通私有工具：服务端可以读业务数据，只是不公开；
- 端到端加密工具：服务端也不应该读明文。

这个差异会影响备份、恢复、迁移、客服、自动化分析和 Agent 接入方式。

## 七、当前站点的一句话结论

当前 2aran.com 的鉴权逻辑应该被统一表述为：

> 公开内容不鉴权；站长执行工具统一复用 `tuaran_session + ownerAuth`；加密调研文章先过 owner 门禁，再在浏览器本地解密；自动化控制台作为子域服务复用同一 owner session，并保留本地口令兜底；长期罗盘也复用 owner 门禁，但内容层单独采用端到端加密，不能被普通 Private 逻辑覆盖。

这套抽象的好处是：以后新增工具时，不需要再问“我要不要重新做登录”。只需要问三个问题：

1. 它是不是公开内容？
2. 它是不是只有 owner 能用？
3. 它的数据是否需要端到端加密？

如果答案清楚，鉴权方案也就清楚了。

## 八、代码依据

本次调研依据当前站点代码梳理：

- `lib/edgeSession.js`：session 签发、校验、cookie 名称与 domain；
- `lib/ownerAuth.js`：统一 owner 判断；
- `lib/privateVaultAuth.js`：长期罗盘 / 私域系统复用 owner 判断；
- `lib/voiceTasksAuth.js`：语音记事 owner + token fallback；
- `app/api/me/route.js`：前端统一读取 `isOwner`；
- `app/api/dad-todo/route.js`：茉莉奶爸待办 API owner 校验；
- `app/(site)/voice-tasks/VoiceTasksClient.jsx`：语音记事页面按 `isOwner` 展示；
- `app/(site)/xiaomoli-dad-todo/DadTodoClient.jsx`：待办页面按 `isOwner` 展示；
- `app/(site)/articles/research/[category]/[slug]/page.jsx`：加密调研文章 owner 门禁；
- `app/(site)/agent-ops/project-portfolio/page.jsx`：项目组合看板 owner 门禁；
- `lib/siteNav.js`：AI 系统、长期罗盘、私有工具的导航归类；
- `agent-ops/scripts/agent-ops.mjs`：独立自动化控制台复用 `tuaran_session` 的实现方向。
