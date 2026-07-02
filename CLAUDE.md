# tuaran-home-page (2aran.com)

Next.js 15 App Router 个人站，部署在 Cloudflare Pages（Functions + D1）。JavaScript（无 TypeScript），Tailwind CSS 3，React 19。

## 关键目录

- `app/` — 页面、布局、API 路由（App Router）；`app/(admin)/admin/*` 为站长后台（AdminPageGate 鉴权）
- `lib/` — 运行时封装与数据：`edgeSession.js`（自定义 GitHub OAuth + 签名 Cookie）、`d1.js`（D1 binding）、`researchStyleTemplates.js`（调研风格库，见下）、`contentPipeline.js`（统一内容注册表：文章/调研/资源归一 + 跨类型相关阅读；contentKey 与评论 articleKey、燃币 resourceKey 同一套约定）
- `research/` — 调研知识库（companies / topics / people），Markdown 落盘，构建时由 loader 渲染到 `/articles`
- `migrations/` — D1 SQL
- `ai-context/` — 项目文档与历史快照（架构、审查、移植记录），索引见 `ai-context/README.md`；时效以各文档落款日期为准

## 调研知识库（最常见的协作任务）

- **frontmatter 与目录契约**：`research/README.md`
- **调研风格与措辞规则的唯一正本**：`lib/researchStyleTemplates.js`（站长在 `/admin/research-style` 查看风格库）。**写任何调研前先选风格**，例如默认调研、人味调研、周刊解释、投研备忘、资料档案；不要凭旧模板复述规则
- 一键生成：`/research-company <名称>`、`/research-topic <事项>`（`.claude/commands/`）
- **不要自动 commit 调研产出**，由站长确认后自行提交
- 网站不调用任何大模型；调研作者统一记为 TUARAN，AI 仅作为协助工具标注在 `assistance` 字段

## 运行时约束

- 三层运行时并存：静态/ISR 页面、Cloudflare Edge API（`runtime = 'edge'`）、浏览器端推理（`/web-llm`，WebGPU）
- Cloudflare 构建：`npm run pages:build`（`@cloudflare/next-on-pages`）；配置在 `wrangler.toml`
- Edge 路由不能用 Node-only API；D1 经 `lib/d1.js` 取 binding

## 注意

- 仓库存在历史遗留：NextAuth 相关文件（已废弃，`[...nextauth]` 路由返回 410）、`lib/stompDb.js`（better-sqlite3 本地版，线上不用）
- 架构细节见 `ai-context/architecture.md`（2026-05 快照，部分内容可能滞后于代码）
