# 站内工具 · 转短

## 1. 背景

`/ai-projects` 页面在「AI Native 项目图谱」之外，新增了一个「站内工具」板块，定位是「自用的小工具集合」。第一个工具是 **转短**：把长链接转成 `https://tuaran.me/{code}`，访问短链时由 D1 查表后 302 直跳原链接（不做安全审核），记录按账号写入 Cloudflare D1。

> 历史：第一版（commit `61beccb`）走 TinyURL 生成短链；第二版换成自建短链 + 顶级 `[code]` 路由 + 顶部右侧常驻登录态。

种子链接 `http://112.124.37.151:48575/#/register?code=TYbpJVsl` 是该工具上线时第一条要转的链接，会在用户首次进入、列表为空时被预填到输入框中（不写库），点一次「转短」即落库。

## 2. 用户视角的能力

- 登录后才能使用（GitHub OAuth，与 stomp 留言、xiaomoli-dad-todo 共用同一套自定义 Edge 会话）。面板右上角常驻登录态：未登录显示「GitHub 登录」按钮，已登录显示用户名 + 「退出」。
- 在输入框粘贴 `http(s)://` 长链接，点「转短」→ 服务端生成 7 位 base62 code → `short = https://tuaran.me/{code}` → 落库 → 列表头部出现新记录。
- 列表项显示：短链（可点开、可复制）、原始长链；右侧「删除」仅删除本人记录。
- 列表按 `created_at DESC` 倒序，最多展示当前账号最近 100 条。
- 数据按账号隔离：用户 A 看不到用户 B 的记录。
- 任何人访问 `https://tuaran.me/{code}`：命中即 302 到 `original`；不命中走站内 404。

## 3. 关键文件

| 路径 | 职责 |
| --- | --- |
| `app/ai-projects/page.jsx` | 引入并挂载 `<SiteToolsPanel />`，放在项目矩阵下方 |
| `app/components/SiteToolsPanel.jsx` | 「站内工具」板块的客户端组件，承载「转短」工具的全部 UI 与交互；右上角常驻登录态 |
| `app/api/short/route.js` | Edge 路由，提供 `GET / POST / DELETE`，统一鉴权 + 落 D1，POST 时生成 code |
| `app/[code]/page.jsx` | 顶级动态段，命中 D1 中的 `code` 时 `redirect()` 到 `original`，否则 `notFound()` |
| `migrations/0006_short_links.sql` | `short_links` 表与 `(user_id, created_at DESC)` 索引 |
| `migrations/0007_short_links_code.sql` | 增加 `code` 列与 `idx_short_links_code` 唯一索引 |

## 4. 数据模型

```sql
-- 0006
CREATE TABLE IF NOT EXISTS short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  original TEXT NOT NULL,
  short TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_short_links_user_created
  ON short_links(user_id, created_at DESC);

-- 0007
ALTER TABLE short_links ADD COLUMN code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
```

设计取舍：
- `user_id` 取自 `getUserFromRequest(req)` 返回的 GitHub 用户 ID（与 stomps、dad_todo_completions 同一个口径）。
- 不设 `(user_id, original)` 唯一约束 —— 允许同一长链多次生成，便于留作历史轨迹。
- `short` 列 NOT NULL，存「展示用的完整短链」（如 `https://tuaran.me/aB3xZ9k`），方便前端直接渲染；解析 redirect 时只看 `code`。
- `code` 是后加的列，老记录（v1 / TinyURL 时期）`code` 为 NULL；SQLite 唯一索引允许多个 NULL，所以兼容。
- 索引：`(user_id, created_at DESC)` 覆盖列表查询；`code` 唯一索引覆盖跳转查询 `WHERE code = ?`。

## 5. API 约定

所有方法均 `runtime = 'edge'`、`force-dynamic`，未登录返回 `401 UNAUTHORIZED`，缺 D1 binding 返回 `503 DB_UNAVAILABLE`。

### 5.1 `GET /api/short`

返回当前用户最近 100 条记录：

```json
{ "items": [{ "id": 1, "original": "...", "short": "https://tinyurl.com/...", "created_at": 1714291200000 }] }
```

### 5.2 `POST /api/short`

请求体：`{ "url": "https://..." }`（也兼容 `{ "original": "..." }`）。

校验链路：
1. `validateUrl`：去空 + 长度 ≤ 2000 + `new URL()` + 协议必须是 `http`/`https`，否则 `400 INVALID_URL`。
2. `genCode`：用 `crypto.getRandomValues` 生成 7 位 base62 code（62^7 ≈ 3.5T，碰撞概率可忽略）。
3. `getShortBase`：优先用 `NEXTAUTH_URL`（生产 = `https://tuaran.me`），缺省退化到 `req.url` 的 origin。最终 `short = ${base}/${code}`。
4. `INSERT ... RETURNING ...` 写库；遇到 `UNIQUE` 冲突最多重试 4 次，仍冲突 → `500 CODE_COLLISION`。
5. 成功返回 HTTP 201 + 新记录。

成功响应：`{ "item": { "id": ..., "original": ..., "short": ..., "code": ..., "created_at": ... } }`

### 5.3 `DELETE /api/short?id=:id`

只允许删除 `id = ? AND user_id = ?`，跨用户操作会被静默无视（影响 0 行）。`id` 必须是正整数，否则 `400 INVALID_ID`。

### 5.4 `GET /{code}`

由 `app/[code]/page.jsx` 处理（不是 `/api/...`）。流程：
1. 校验 `code` 形如 `[A-Za-z0-9]{4,16}`，否则 `notFound()`。
2. `SELECT original FROM short_links WHERE code = ?` 取记录。
3. 命中 → `redirect(original)`（Next.js 默认 307）；未命中 → `notFound()`。

特性：
- 不要求登录，任何人都能访问短链。
- 不做安全审核 —— 设计就是「直跳」。
- `[code]` 是 App Router 中优先级最低的动态段，所以 `/articles`、`/api`、`/sitemap.xml` 等已有路径不受影响；只有「没匹配上其它任何路由」的顶级路径才会落到这里。

## 6. 前端交互要点

`SiteToolsPanel.jsx` 几个有意识的设计：

- 启动时先打 `/api/me` 决定登录态；未登录时只显示「GitHub 登录」按钮，不去打 `/api/short`。
- 登录后立即拉一次列表；列表为空且输入框也为空时，把种子链接 `SEED_URL` 预填进输入框，让用户「点一次就有了第一条」，不去服务端做种子写入 —— 用户主动删除后不会复活。
- POST 成功后把返回的 `item` 直接拼到列表头，避免再发一次 GET。
- DELETE 用 `pendingId` 精准锁定按钮 loading，不影响其他行。
- 错误统一到 `error` state 上展示一行红字；`UPSTREAM_FAILED` 转译为「上游服务未返回结果，请稍后重试」。

## 7. 部署 & 运维

- 远端 D1 应用迁移：

  ```sh
  npx wrangler d1 migrations apply tuaran-me --remote
  ```

  本仓库的环境配置了系统代理（`HTTP_PROXY=http://127.0.0.1:7892`），但该代理无法访问 `dash.cloudflare.com`，会出现 `Client network socket disconnected before secure TLS connection was established`。绕过办法是临时清掉代理：

  ```sh
  HTTP_PROXY= HTTPS_PROXY= http_proxy= https_proxy= \
    npx wrangler d1 migrations apply tuaran-me --remote
  ```

  本次 `0006_short_links.sql` 即按此方式应用成功。

- 本地开发库（可选）：`npx wrangler d1 migrations apply tuaran-me --local`。

- D1 binding 在 `wrangler.toml` 的 `[[d1_databases]]` 中，绑定名 `DB`，由 `lib/d1.js` 在请求上下文中读出。

## 8. 已知约束

- 自建短链对原链接的 `#fragment` 是完整保留的：`original` 整段存进 D1，`redirect()` 时浏览器直接解析 fragment（典型场景：哈希路由的 SPA 注册页）。
- 当前没有提供翻页与搜索，只取最近 100 条；如果记录密度上来了，再加 `?cursor=` 或全文搜索。
- 不做安全审核 —— `original` 是 `http(s)` 任意 URL，包括 IP+端口。被恶意利用可能性低（路由要登录才能写），但要意识到这一点。
- `code` 老记录是 NULL（v1 期间用 TinyURL），这些记录在新版面板里 `short` 列仍指向 TinyURL；列表正常显示，但不能从 `tuaran.me/{code}` 反查（没 code）。

## 9. 后续可扩展方向

- 把「站内工具」做成真正的工具集合：第二个工具可能是「Markdown → 朋友圈分段」「URL 二维码」「站内反链查询」等等，复用 `SiteToolsPanel` 的卡片样式。
- 给短链记录加访问计数：`/{code}` 命中时 `UPDATE short_links SET hits = hits + 1`，在面板列表上展示。
- 支持自定义 code（输入框旁边加可选「自定义 slug」字段），生产中遇到收藏价值高的链接可以指定 `tuaran.me/anthony-blog` 这类好记的形式。
- 提供 export（CSV/JSON）入口，方便迁移或批量分析。
