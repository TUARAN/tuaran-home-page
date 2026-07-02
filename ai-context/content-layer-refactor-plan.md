# 内容层抽象重构路径（#3 落地计划）

> 写于 2026-05-30。建议作为多周渐进推进的工作底稿，每完成一步打勾。

## 进展 · 2026-07-02（统一内容管线 + D1 内容索引 + 5 频道导航）

本轮没有按原 Phase 1（先抽样式组件）推进，而是先把**互动层和数据层**打通（对平台化目标收益更大）：

- [x] **统一内容管线** `lib/contentPipeline.js`：文章（articlesData）+ 调研（research catalog，已扩展 tags）+ 资源主题页（contentRegistry，已补 tags）归一成统一 entry 形状；`getRelatedContent()` 跨类型相关阅读（标签重叠 > 同类 > 时间）。contentKey 与评论 articleKey、燃币 resourceKey 同一套约定。
- [x] **ContentEngagement 组件**（`app/(site)/components/ContentEngagement.jsx`）：相关阅读 + 评论区，已挂到 9 个资源主题页（classical-masterpieces / ru-shi-dao / china-politics / history/ming-qing / bookmarks×5）。资源主题页从此进入评论 + 相关阅读体系；`resolveArticleKey` 已支持 `resource:` 前缀（通知/后台可解析）。
- [x] **内容 metadata 进 D1**：migration `0035_content_index.sql`（content_index 表）+ `lib/contentIndex.js` + `/api/content`（公开读）+ `/api/admin/content-index`（owner 同步/登记）。`/admin/content-index` 后台：一键同步构建期注册表进 D1；**手工登记的条目无需构建即出现在 /articles 索引**（客户端 fetch `/api/content?source=manual` 合并）。⚠️ 需在 Cloudflare 手动跑迁移 0035 才生效。
- [x] **导航收敛为 5 频道**：内容 / 资源 / 工具 / 圈子 / 关于（原 阅读/作品/合作/关于 四频道重组，路由本身未迁移、无 301 需求；「圈子」频道 key 仍为 community）。/map 频道配色与 SiteHeader 对齐逻辑已同步。

原计划仍然有效的部分：Phase 1 共享样式组件、Phase 2 大页面拆 md（ai-pioneers / ming-qing）、Phase 3 /knowledge 模板。后续推进时注意：新的统一管线（contentPipeline）应作为 loader 输出的消费端，别再造第二套注册表。
调研详情页的「同类调研」推荐仍用页内旧逻辑（同 category + companyType 优先），后续可切换到 `getRelatedContent()` 统一。

## 问题

知识展示类页面被写成巨型 React 组件：

- `app/history/ming-qing/page.jsx` — 2148 行
- `app/people/ai-pioneers/page.jsx` — 1426 行
- `app/bookmarks/twitter/page.jsx` — 746 行
- `app/china-politics/page.jsx` — 688 行
- 其他：`history/three-kingdoms`、`people/su-shi`、`bookmarks/*`、`poetry`、`ru-shi-dao`

后果：

1. 改错别字要动 JSX、重新部署
2. 没法统一加搜索 / 标签 / 筛选
3. AI 生成的调研稿无法即插即用
4. 卡片 / Section / Tag 样式靠 copy-paste —— 同款 `rounded-[24px] border ... shadow-[0_12px_40px...]` 在十几个文件里重复

## 目标

- 内容 → 数据层（MD / JSON），页面 → 模板
- 共享 UI 组件库统一卡片 / Section / Kicker / Tag / Hero
- 远期：`/knowledge` 频道做跨主题搜索 + 筛选

## 落地路径（按优先级 + 风险递增）

### Phase 1 · 抽共享组件（低风险，可立即开始）

不动任何大页面的内容，先把样式抽走。

新增 `app/components/knowledge/`：

- `Section.jsx` — `rounded-[24px] border ...` 卡片容器，props: kicker / title / action / children
- `Kicker.jsx` — `font-mono text-[11px] uppercase tracking-[0.24em]` 小标
- `TagPill.jsx` — `rounded-full border border-[#e8dfcf] bg-[#f8f4ec] px-2.5 py-1 ...`
- `KnowledgeCard.jsx` — 通用知识卡（封面 + 标题 + 摘要 + 标签）
- `HeroBand.jsx` — 详情页顶部 hero（kicker + 大标 + 副标 + tags + meta）

迁移顺序（一次一个文件，每次提交一个 PR）：

1. `app/page.jsx` 的「推荐阅读」与「关注我」section 改用 `<Section>`
2. `app/articles/page.jsx`
3. `app/articles/research/[category]/[slug]/page.jsx`
4. `app/about/page.jsx`
5. 其余按访问量来

验收：每迁一个文件，diff 应该是 *减少* 行数（删除重复 className）。

### Phase 2 · 内容数据层（中风险）

参照已有 `lib/research/loader.js` 模式，为每个知识门类建一个 loader：

```
research/
  topics/        # 已有
  companies/     # 已有
  history/       # 新增，每个朝代/时期一个 md
  people/        # 新增，每个人物一个 md，frontmatter 标 era/role
  bookmarks/     # 新增，每个 collection 一个 md
  poetry/        # 新增
```

frontmatter 标准（参照 `research/`）：

```yaml
---
slug: ming-qing
category: history
title: 明清史长篇笔记
date: 2026-01-08
tldr: 一句话摘要
tags: [明朝, 清朝, 政治, 文化]
hero: { cover: ..., kicker: ..., subtitle: ... }
---
```

loader 输出统一形状：`{ slug, category, title, date, tldr, tags, html, toc, hero }`。

迁移顺序（按"代价 vs 收益"）：

1. `bookmarks/*`（最容易，5 个 md 各放一组链接）
2. `people/su-shi` → md（最短，验证模板）
3. `people/ai-pioneers` 1426 行 → 拆成 10 个人物 md（最大收益）
4. `history/three-kingdoms` → md 阵营/人物/战役
5. `history/ming-qing` 2148 行 → 拆成时期 md（最重，最后做）

每个文件迁移完，旧 `page.jsx` 改为读 loader → 喂模板。

### Phase 3 · 模板与 `/knowledge` 频道（高风险，远期）

- 通用详情模板：`app/knowledge/[category]/[slug]/page.jsx`
- 通用列表模板：`app/knowledge/[category]/page.jsx`
- 跨主题搜索页：`app/knowledge/page.jsx`（用 lunr / minisearch 客户端索引）
- 旧路由 `/history/...` `/people/...` 做 301 转发到 `/knowledge/...`，或保留 SEO 旧链
- 主导航「内容」频道下拉里加「全部知识库」入口

### 不做的事

- 不上 CMS（Notion / Strapi / Sanity）。MD + git 已经够用，且和现在的 research workflow 对齐
- 不引 i18n、不引 GraphQL，loader 直接遍历文件系统
- 不一次性大改 —— 每个 PR 只动一个文件 / 一个组件，保住 main 总是可用

## 估算

| Phase | 改动 | 估时 |
| --- | --- | --- |
| 1 共享组件 | 5 个新组件 + 迁 5-6 个页面 | 1-2 个晚上 |
| 2 数据层 | bookmarks / poetry / su-shi 先行 | 1 周（每天 1 小时） |
| 2 数据层 | ai-pioneers / three-kingdoms / ming-qing | 2-3 周 |
| 3 /knowledge 频道 | 模板 + 搜索 + 路由迁移 | 1-2 周 |

总计：1.5-2 个月，但每一步都能独立合入，没有「半成品分支」风险。

## 启动建议

第一步：在 `app/components/knowledge/` 里建 `Section.jsx`，先把 `app/page.jsx` 的「推荐阅读」section 换成 `<Section kicker="Highlights" title="推荐阅读" action={...}>`。一晚上能搞定，立即看到收益。
