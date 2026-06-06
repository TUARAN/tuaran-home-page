---
title: 2aran.com 私有功能鉴权逻辑调研：统一 owner session、菜单权限化与端到端加密边界
category: topics
date: 2026-06-05
tags: [2aran.com, 鉴权, owner session, 菜单权限, Cloudflare, Next.js, 私有工具, Agent Ops, 端到端加密, 后台管理]
summary: 梳理 2aran.com 当前私有功能的鉴权体系：统一登录态、统一 owner 判断、共享 session cookie、共享前端 session 状态、菜单可见性按 audience 解耦并可被后台覆盖、私有 API 保护，以及长期罗盘的端到端加密边界；并对比市面常见做法。
tldr: 这套体系经历过三轮迭代：第一轮把"每个工具各写一套登录"统一成"`tuaran_session + ownerAuth`"；第二轮把"每个页面组件各自 fetch `/api/me`"统一成 `SessionProvider` 单一上下文，解决登录状态在不同页面之间割裂的问题；第三轮把"哪些菜单对谁可见"从硬编码改成每项菜单的 `audience` 字段 + D1 `nav_overrides` 表，站长可以在 `/agent-ops/nav-admin` 后台动态调整。市面通行做法是 RBAC + feature flag + headless CMS 三块组合；单站长场景下这套轻量方案在保留同等表达力的同时省掉了 80% 的开销。
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

## 八、迭代路径：三轮收敛

这套体系不是一次设计好的，是三轮迭代收敛出来的。每轮都来自一个具体的"坏味道"。

### 第一轮：从"每个工具各自登录"到统一 owner session

**问题状态**：语音记事、待办、项目组合看板各写一份 cookie 解析、各定义自己的"谁是 owner"。新增工具就要复制一遍逻辑，且彼此判断不一致——一个工具把 GitHub login 当 owner，另一个工具把环境变量里的 ID 当 owner。

**收敛动作**：抽出 `lib/edgeSession.js` 统一签发与校验，抽出 `lib/ownerAuth.js` 统一 owner 判定（聚合多种环境变量来源 + fallback login/email），所有页面与 API 走同一个 `getOwnerUserFromRequest()` 或 `isOwnerUser()`。

**留下的好处**：以后再加工具，只问"它是不是 owner-only"，不问"它要不要重写鉴权"。

### 第二轮：从"每个页面各自 fetch /api/me"到 SessionProvider 单一上下文

**问题状态**：第一轮把 server 端统一了，但 client 端仍然散乱。SiteHeader、ArticleComments、SiteToolsPanel、StompPanel、VoiceTasksClient、DadTodoClient 每个组件挂载时都自己 `fetch('/api/me')`，自己存 `useState`。

后果有两个：

- 用户在首页右上角登录后，跳到子页面，子页面拿的还是登录前的快照——它没收到任何"登录态变化"的信号；
- 用户在子页面登录后，导航回首页（客户端路由），SiteHeader 留在 layout 里没重新挂载，header 还是登出态。

`/api/me` 服务端的答案是对的，cookie 也对，但客户端各自为政，呈现出来就是"登录状态在不同页面之间割裂"。

**收敛动作**：

- 在 `(site)/layout.jsx` 顶层挂一个 `SessionProvider`，作为单一会话状态来源；
- `SessionProvider` 自动监听 `focus` / `visibilitychange` / `pageshow` / 自定义 `tuaran:session-refresh` 事件，自动重新拉 `/api/me`；
- 所有消费者改用 `useSessionAccount()` hook 拿同一份 `{ user, isOwner, loading }`，不再各自 fetch。

**留下的好处**：登录态变化一次广播，整站同步；切回 tab 也会自动 revalidate；以后加新组件不再有"我要不要也写一份 /api/me fetch"的问题。

### 第三轮：从"哪些菜单对谁可见"硬编码到 audience 字段 + 后台可覆盖

**问题状态**：早期主导航对所有人展示全部条目，包括 `/voice-tasks`、`/long-compass`、`/agent-ops/project-portfolio` 这种站长私域工具。普通访客看见，点进去被 gate 拦下来，体验割裂——对他们来说，那个入口的存在只是噪声。

更糟糕的是，一旦我意识到需要按身份隐藏，最直觉的写法是在 SiteHeader 里硬编码一个 `OWNER_LINKS` 数组，再加上账号下拉里的"私域工具"快捷区。结果同一个 owner-only 入口出现在两个地方，一个在 channel 分组里，一个在快捷区里，又是一处割裂。

**收敛动作**：

- 给 `SITE_CHANNELS`、`SITE_FOOTER_LINKS` 里的每个 item 增加 `audience` 字段：`public` / `authed` / `owner`；
- 新增 `lib/navOverrides.js` + D1 表 `nav_overrides(href, audience)`，作为运行时覆盖层；
- 新增 `/api/admin/nav`（owner-only CRUD）和 `/api/nav-config`（公开读取覆盖映射）；
- 新增 `/agent-ops/nav-admin` 后台页面，列出全部菜单项，站长可以为任意一项设置 audience；
- 解析顺序固定为：override > item.audience > 默认 public；
- `SessionProvider` 同时拉 `/api/me` 和 `/api/nav-config`，对外暴露 `navOverrides`；
- `SiteHeader` / `SiteFooter` / `/map` 都消费同一个 `isItemVisibleForAccount(item, account, overrides)`；
- 删掉之前的 `OWNER_LINKS` 硬编码和"私域工具"快捷区——账号面板只剩身份卡和退出按钮，所有 owner 入口自然回到它们原本所属的频道分组。

**留下的好处**：

- 单一规则，单一来源：每一项菜单是否对当前用户可见，只由 `audience` + `account` 决定；
- 不再有"owner 专属面板 vs channel 分组"的双轨；
- 配置可热更新，不依赖发版；
- 后台可视化，对 4 个频道 + 页脚的每一项菜单都能改；
- 留下 `authed` 这一档以备未来扩展（比如以后做读者会员体系）。

### 三轮迭代抽象出来的原则

| 维度 | 问题状态 | 收敛后的形态 |
|---|---|---|
| 鉴权身份 | 各工具自定义 owner | 统一 `ownerAuth` |
| 服务端会话 | 各工具自己解析 cookie | 统一 `edgeSession` + `tuaran_session` |
| 客户端状态 | 各组件自己 fetch /api/me | 单一 `SessionProvider` + 事件驱动 revalidate |
| 菜单可见性 | 硬编码 + owner 快捷区 | `audience` 字段 + D1 覆盖 + 后台 UI |
| 数据边界 | 公开 / 私有二分 | 公开 / Owner-only / 端到端加密 三分 |

可以把这五行当成以后新增私有功能时的"必经五问"。

## 九、市面上一般怎么做：对照与取舍

这套方案并不是空中楼阁，它实际上是把行业里几套不同体系的能力裁出来的"个人站长版"。理解市面通行做法，能让设计取舍更自觉。

### 1. 鉴权与角色：RBAC / ABAC / Policy 引擎

企业级 SaaS 的通行做法：

- **RBAC（Role-Based Access Control）**：用户→角色→权限三层关系，由数据库管理。Stripe、Notion、Linear、GitHub 都属于这一类。一个团队可能有 owner / admin / member / billing-only 等多种角色，每个角色对应一组操作权限。
- **ABAC（Attribute-Based Access Control）**：在角色之上再叠一层属性条件（"只有当 user.region == doc.region 时才能读取"）。AWS IAM 是典型代表。
- **Policy 引擎**：把权限规则外置成可声明式表达的 policy（Open Policy Agent、Casbin、Oso、Cerbos）。每次请求都过 policy 引擎判定。

**对照 2aran.com**：单站长场景下没有"多角色"的现实需求。如果硬上 RBAC，会引入用户表、角色表、权限表、关联表至少 4 张表，外加一个权限校验中间件——但实际有效角色只有 owner 和非 owner 两个值。我的做法等价于把 RBAC 退化成 `audience ∈ {public, authed, owner}` 三档，承载力少了一截但表达力足够，且省掉 ~90% 的实现复杂度。如果未来真的引入读者会员体系，`authed` 这一档可以直接顶上，不用重构。

### 2. 会话与登录：NextAuth / Auth0 / Clerk / Supabase Auth

主流方案：

- **NextAuth (Auth.js)**：Next.js 生态里最常见，提供 `useSession()` hook + SessionProvider，本质上就是我手写的那一套。
- **Auth0 / Clerk / WorkOS**：托管身份服务，提供完整的 UI + 后端 + 用户管理，按 MAU 计费。
- **Supabase Auth / Firebase Auth**：随数据库一起提供身份系统，便于"用户 ↔ 数据"建模。

**对照 2aran.com**：项目早期实际上引入过 NextAuth（仓库里还有 `auth.js` 和 `app/api/auth/[...nextauth]/route.js`），但后来在 Cloudflare Pages edge runtime 上发现它跟 OAuth callback 的 cookie 处理不太顺，迁移成本不如直接在 edge 写一份 200 行的 `edgeSession.js` + GitHub/Google OAuth 端点。**取舍点**：托管方案适合多用户、需要邮件验证流、需要 MFA、需要 SAML 的场景；自建 JWT + HMAC 的代价在单站长场景反而更低。我的 `SessionProvider` 几乎就是 NextAuth `useSession` 的子集——只是不依赖 `next-auth` 这个包。

### 3. 菜单与权限的可视化管理：Headless CMS / Admin Panel

业界处理"菜单/导航能从后台改"的常见做法：

- **Headless CMS**（Strapi、Sanity、Payload、Directus）：把内容、菜单、组件配置全部建模到 CMS 里，前端拉 GraphQL/REST 渲染。Sanity 的 "Studio" 就是给运营改菜单顺序、改标签、加 feature flag 的地方。
- **传统 CMS**（WordPress、Ghost、Drupal）：内置菜单管理后台，每个菜单项可以绑定显示条件（用户角色、登录状态、A/B test 分桶）。
- **Feature Flag SaaS**（LaunchDarkly、GrowthBook、Unleash、PostHog）：把"对谁开放"从代码里抽出来，配合 SDK 做条件渲染。常见用法：新功能先对内部员工开放，再灰度到 5%、20%、100%。
- **Admin Panel 框架**（React Admin、Refine、AdminJS、Retool）：给开发者一个快速搭建后台的脚手架，CRUD + 权限配置一把拉齐。

**对照 2aran.com**：我没引入 CMS 或 feature flag SaaS，是因为对一个站长来说它们的目标用户错位——CMS 是给"运营/编辑"用的，feature flag 是给"产品/增长团队"用的，两者都假设有多人协作和 A/B 分桶需求。我把它们的核心能力——"在不发版的前提下改菜单"——裁成一张 D1 表 + 一个后台页面 + 几个 API endpoint，总共不到 400 行代码。功能上等价于 Sanity Studio 的"菜单项目"模块，但运营成本是 0（没有第三方服务订阅、没有 schema 设计、没有跨系统状态同步）。

代价是：我没有 audit log、没有变更回滚、没有 staging/production 分离。对单站长来说这些缺失目前无足轻重，但如果未来引入助手或合作编辑，就要把这些补上——届时升级路径很清晰，因为底层模型（每项 nav item 有 audience + override）和 CMS 的菜单模型同构。

### 4. 前端会话同步：SWR / React Query / 显式事件

市面做法：

- **SWR / React Query**：把 `/api/me` 这种远程状态用统一的 cache + revalidation 框架管理，自动处理 focus refetch、stale-while-revalidate、跨组件去重。
- **Auth.js / Clerk 的 SessionProvider**：库内置 SessionProvider，提供 `useSession()` hook，所有组件共享一份。
- **服务端注入 + RSC**：在 React Server Components 时代，越来越多项目让 server component 直接读 session，把 user 作为 prop 传下去，客户端只在需要交互时再用 client component。

**对照 2aran.com**：我选了"手写最小 SessionProvider + 显式事件总线"，理由是：

- 站长项目不愿意为一个会话状态引入 SWR 全家桶；
- Auth.js 的 SessionProvider 强绑定 NextAuth，我已经走自建 edgeSession，不想为了 useSession 把整个 NextAuth 重新拖回来；
- RSC 全量重构性价比低，主要痛点（客户端组件状态不同步）用 client 端 SessionProvider 就够了。

写出来差不多 80 行，去重、focus refetch、自定义事件刷新都覆盖了。这种"知道边界条件之后，刻意不引入更通用框架"的取舍，是个人项目能持续推进的关键。

### 5. 端到端加密：Signal Protocol / Bitwarden / Tutanota

主流端到端加密产品的共性：

- 用户口令派生主密钥（PBKDF2 / Argon2）；
- 主密钥永不离开客户端；
- 服务端只存密文 blob + 元数据；
- 提供恢复短语 / 恢复账户机制；
- 多设备同步通过设备密钥协商。

**对照 2aran.com**：长期罗盘走的就是这一类思路，但简化到"单用户单设备 + 浏览器口令解密"。我没有做多设备同步、没有恢复短语机制——这是已知的薄弱点，文中第五节也明确列出来需要继续打磨。市面成熟方案的复杂度对应着"多人多设备"这个外部约束，去掉之后能省掉的部分非常可观。

### 6. 总体取舍

把上面这些放到一张表里：

| 维度 | 业界做法 | 2aran.com 做法 | 省掉的部分 | 保留的能力 |
|---|---|---|---|---|
| 角色 | RBAC + 多角色表 | `audience ∈ {public, authed, owner}` | 用户/角色/权限三表 + 关联 | 三档可见性表达力 |
| 会话 | NextAuth / Auth0 / Clerk | edgeSession（JWT + HMAC） | 第三方依赖 + UI 套件 | 登录/校验/多 provider |
| 菜单管理 | CMS / Feature Flag SaaS | D1 表 + 后台 UI | audit log / 灰度 / A/B | 不发版改菜单 |
| 前端态 | SWR / React Query / useSession | SessionProvider + 事件 | 全家桶 cache 系统 | focus refetch / 单源 |
| 加密 | E2EE 框架 | 浏览器口令派生 | 多设备同步 / 恢复短语 | 服务端不持明文 |

这张表的隐含信息是：单站长场景下，业界方案里 80% 的复杂度对应的是"多人协作"和"商业级合规"两个我现在不需要的约束。把这两块拿掉，剩下的核心能力可以用一份 1000 行级别的代码自承载。

但任何时候，如果业务边界变了（引入合作编辑、引入读者会员、引入助手账户），上面这张表就是清晰的升级路径——每一行都对应一个具体的、行业里有现成方案的替换点，不需要从零设计。

## 十、代码依据

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
- `lib/siteNav.js`：菜单分组 + 每项 `audience` 字段 + `isItemVisibleForAccount` 单一过滤规则 + 页脚链接也接入；
- `lib/navOverrides.js`：D1 `nav_overrides` 表的 CRUD，供后台动态覆盖菜单 audience；
- `migrations/0016_nav_overrides.sql`：菜单覆盖表 schema；
- `app/api/admin/nav/route.js`：站长后台 CRUD API，owner 校验 + audience 校验；
- `app/api/nav-config/route.js`：公开读取 overrides 映射，供 SessionProvider 拉取；
- `app/(site)/components/SessionProvider.jsx`：客户端单一会话状态来源，并行拉 `/api/me` + `/api/nav-config`，监听 focus/visibility/自定义事件自动 revalidate；
- `app/(site)/components/SiteHeader.jsx`：所有菜单逻辑只剩"读 SessionProvider + 按 audience 过滤"，账号面板剥离掉 owner 快捷区；
- `app/(site)/components/SiteFooter.jsx`：页脚也走同一套 audience + overrides 过滤；
- `app/(site)/agent-ops/nav-admin/page.jsx` + `NavAdminClient.jsx`：站长后台 UI，按 channel / footer 展开所有菜单项；
- `app/(site)/map/page.jsx`：服务端读 overrides，/map 全站索引按身份过滤；
- `agent-ops/scripts/agent-ops.mjs`：独立自动化控制台复用 `tuaran_session` 的实现方向。
