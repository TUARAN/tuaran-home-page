---
title: 个人项目目录为何越做越乱：一次 3136 个文件的仓库审计
category: topics
date: 2026-10-10
time: 17:40
tags: [代码库治理, 目录结构, 技术债, 个人项目, 仓库审计, Next.js]
summary: 对 2aran.com 代码库做了一次结构审计：3136 个已入库文件分布在 33 个顶层目录里，根目录堆了 88 个条目，lib/ 一层平铺 266 个文件，同一份内容有六个落点。失控来自四条各自独立的漂移机制，治理成本和风险分成四档。
tldr: 审计发现四类失控：根目录变成杂物间、lib/ 平铺命名空间、同一份内容六个落点、单一功能横跨六个顶层目录。四条漂移机制里，最贵的一条是「没有判据时两个都留着」。四档治理中前两档零风险可立即执行，后两档需要先定判据。审计同时发现 188 个测试文件只有 15 个进了 npm 脚本，20 个 lib 模块零引用。
topic_type: tech
tech_type: architecture
subjects: [site_engineering]
content_type: build_log
assistance: deepseek
model: deepseek-flash
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> 适用范围：审计对象是 `tuaran-home-page` 仓库在 2026-10-10 当日的本地快照，文件数、磁盘占用和引用关系都会随后续提交变化。这些数字用于说明结构问题的量级与分布，不构成对其它项目的结构建议。

## 一、先给结论

一个单人长期维护的项目，目录结构失控很少来自某一次错误决策。它来自四种各自独立、单看都说得通的动作：把临时产物留在原地、给新模块顺手起个新文件名、为图省事再建一个内容目录、把功能放到当时最顺手的那一层。

对 2aran.com 代码库（`tuaran-home-page`）做完整遍历后，几个能站住的数字：

- 已入库文件 **3136 个**，分布在 **33 个顶层目录**；根目录自身有 **88 个条目**（53 个目录 + 33 个文件，含 39 个隐藏条目）。
- 被 `.gitignore` 排除但实际留在磁盘上的本地目录合计 **7.0GB**，其中 16 个 `.next-*` 目录占绝大部分，最大的单个 2.7GB。
- `lib/` 有 **274 个条目 = 266 个平铺文件 + 8 个子目录**，平铺部分是 244 个 `.js`、20 个 `.mjs`、1 个 `.jsx`。
- 同一份「文章」概念同时存在于 **六个**落点。
- `blogger-eye` 一个功能横跨 **六个顶层目录**；同类模式在 `x-*` 扩展、`workbuddy`、`a-share` 上重复了至少四次。
- **188 个测试文件**，`package.json` 只引用其中 **15 个路径**，且没有 `test` 脚本。
- **20 个 `lib/` 模块全仓库零静态引用**，其中 3 个连字符串命中都没有。

这四类问题的治理成本差别很大。清理本地构建目录零风险；根目录归位只是移动文件；`lib/` 重构和 `app/` 路由收敛会牵动大量 import 路径；`scripts/`、`tools/`、`workers/`、`services/` 的职责划分已经属于架构决策，顺手改的风险高于收益。

## 二、审计口径

整个过程只用仓库自身能提供的信息，不引入外部判断：`git ls-files` 取已入库清单，`du -sh` 取本地目录占用，一次性 grep 扫出全部源文件的 import 语句、取 basename 去重，再和 `lib/` 的文件名做集合差。

口径上要分清两件事。已入库的东西是结构问题，改它要动代码；被 `.gitignore` 挡住的本地态删掉不影响任何协作者。两者都在拖慢在仓库里检索的速度，但治理动作完全不同，混在一起谈会得出错误结论。

## 三、四类失控的具体形态

### 3.1 根目录：88 个条目

真正属于 Next.js 项目根的大约 12 个：`package.json`、`package-lock.json`、`next.config.js`、`middleware.js`、`wrangler.toml`、`tailwind.config.js`、`postcss.config.js`、`jsconfig.json`、`.eslintrc.json`、`.nvmrc`、`.npmrc`、`.env.example`。其余条目可以分成五类。

**构建产物。** `.next-check`（2.7GB）、`.next-x-format-check`（1.6GB）、`.next-domain-check`（1.6GB）等 16 个目录，加 `.next` 合计 7.0GB。来源是 `next.config.js` 第 17 行的 `distDir: process.env.NEXT_DIST_DIR || '.next'`：每做一次隔离构建验证就新留一份，从不回收。

**仓库副本。** `.claude/worktrees/`（19MB）和 `.worktrees/`（156MB）各存了一份近乎完整的项目树。

**同物两存。** `package-lock.json`（516KB）与 `pnpm-lock.yaml`（296KB）并存，另有 `pnpm-workspace.yaml`。CI 实际执行的是 `npm ci`，`package.json` 里没有 `packageManager` 字段。

**放错层的文件。** 一个已声明废弃的 `auth.js`；一篇完整调研正文 `report-source.md`；一个自带 `sitemap.xml`、`robots.txt`、`_headers` 的独立静态站 `gptplus-site/`；一套 Electron 桌面端（`desktop/`、`desktop-dist/`、`electron-builder.desktop.json`）；一份内容属于 `.vscode/` 的 `extensions.json`；以及若干与代码无关的个人文档。

**编辑器残留。** 18 个 `.DS_Store`。

### 3.2 `lib/` 的平铺命名空间

266 个文件直接平铺在同一层。按前缀粗聚类，同一个域的文件挤在扁平的命名空间里：

```
23 个 content*    13 个 x*        13 个 site*
10 个 article*     8 个 research*   8 个 home*
 7 个 rss*         6 个 admin*      5 个 resource*
 5 个 deepseek*    4 个 user*       4 个 us*
```

模块扩展名也没有约定。同族的东西分散在三种扩展名下：`changelogData.js` 与 `changelogAutomationCore.mjs` 属于一族，而 `adminIcons.jsx` 是 UI 组件，同样放在这一层。

让新代码无从下手的是约定自相矛盾。`lib/` 里已经建了 8 个子目录——`research/`、`wc/`、`longCompass/`、`publicOpinion/`、`digitalHuman/`、`planning/`、`juejin/`、`generated/`——但同一个域同时以平铺形式存在。`research` 既有 `researchDiscovery.js`、`researchRuntime.js` 等 8 个平铺文件，也有装着 13 个文件的 `lib/research/`；`article` 既有 10 个平铺文件，也有 `articleContentIndex.mjs`、`articleDocument.mjs`。同一件事同时有 8 个建目录的样本和 244 个平铺的样本，新来的人拿不到判据。

还有成对的 Core 文件，提示分层冗余：`deepseekKeys.js` 与 `deepseekKeysCore.js`、`contentPipeline.js` 与 `contentPipelineRuntime.js`、`siteNotifications.js` 与 `siteNotificationsCore.js` 与 `siteNotificationsDisplay.js`。

零引用扫描发现 20 个模块没有被任何源文件静态 import。其中 `engineeringConventions.js`、`rssAnalytics.js`、`sitePublicComponents.js` 在全仓库范围内（含字符串）零命中，可以确认是死文件；`authOptions.js` 和 `stompDb.js` 是 `AGENTS.md` 已点名的 NextAuth 遗留与本地 better-sqlite3 版本。其余需要逐个确认是否走动态加载。

### 3.3 同一份内容，六个落点

| 落点 | 已入库文件 | 装什么 |
|---|---|---|
| `public/data/` | 318 | `article-archive/`、`research-archive/`、`content-catalog.json`、`memory/` |
| `research/` | 377 | `companies/` 100、`topics/` 261、`people/` 13、`templates/` |
| `content/` | 44 | 掘金文章 JSON、`resources/`、`cz-memoirs/` 章节 |
| `data/` | 3 | `content-archive.json`、`media-redirects.json`、`a-shares/companies.json` |
| `private/`（未入库） | 56 | 种子数据、`long-compass/` |
| 根目录与散落目录 | 3 | `report-source.md`、`resources/`、`deliverables/` |

「一篇文章」这个概念同时出现在六个地方：`content/articles/`、`data/content-archive.json`、`public/data/article-archive/`、`app/(site)/articles/articlesData.js`，以及 D1 的 `article_posts` 与 `content_index` 两张表。

`research/README.md` 已经声明 `data/content-archive.json` 固定为迁移当日的历史归档范围。真正缺的是一条回答「新内容该落到哪」的规则。`content/` 有 44 个文件、`data/` 只有 3 个，两者之间的边界尤其看不出判据。

### 3.4 一个功能横跨六个目录

`blogger-eye` 的分布：

```
tools/blogger-eye-runner/                      Python runner
workers/blogger-eye-scheduler/                 Cloudflare Worker
scripts/blogger-eye-server.mjs                 本地服务
scripts/blogger-eye-service.mjs                macOS service 安装
lib/bloggerEye{Browser,Cloud,Core,History}.mjs 四个核心模块
tests/blogger-eye-{browser,cloud,core,history}.test.mjs
package.json 里 6 条 blogger-eye:* 脚本
```

同一模式重复了至少四次。`x-*` 浏览器扩展散在 `tools/` 下 6 个目录、`scripts/build-*-extension.mjs` 和 `output/` 里 15 个 zip 产物中；`workbuddy` 散在 `tools/workbuddy-{acp-bridge,desktop-pet,sms}/`、`workers/workbuddy/`、`workers/workbuddy-sms-relay/`；`a-share` 散在 `lib/aShare*` 四个文件、`scripts/manage-a-share-research.mjs`、`data/a-shares/`、`app/(site)/a-share-research/`、`app/api/admin/a-share-research/` 和三个测试文件里。

`tools/workbuddy-acp-bridge/` 单目录 6817 个文件，是仓库里最大的一块。

成因是四个目录没有职责判据：`scripts/`（93 个）、`tools/`（219 个已入库）、`workers/`（81 个）、`services/`（10 个，Python）。`workers/` 里其实是四个各自带 wrangler 配置的独立 Worker，已经具备 monorepo 子包的形态，却共用根 `package.json`。

### 3.5 一次性内容被写成硬编码路由

`app/` 有 788 个已入库文件，`(site)` 下有 103 个路由段，其中 28 个只含一个 `page.jsx`。这些单文件路由里，相当一部分是一次性长文或专题：`cancers-overview`、`zhang-juzheng-book`、`ming-emperors`、`ru-shi-dao`、`tang-ping-map`、`sun-moon-motion`、`industry-classification`、`platform-framework-pairs`、`global-ai-governance`、`writing-monetization-2026` 等。

仓库同时已经有两条正规内容层：`app/(site)/rich-pages/` 和 `research/` 加 loader。于是一篇长文有三条互不相通的落地方式。组件也分三处：

```
app/(site)/components   81 个
app/(admin)/components   8 个
app/components           1 个（只有 loading/）
```

另有 156 个 `app/api/**/route.js`。

### 3.6 测试和文档：建了目录，没建入口

磁盘上 188 个 `*.test.*` 文件，`package.json` 里出现的 `tests/` 路径只有 15 个，而且没有 `test` 脚本。约 92% 的测试没有统一入口，靠 `test:a-share-core`、`seo:audit`、`workbuddy-sms:test` 这类零散命令手工触发。

文档有四个落点：`docs/`（23 个）、`ai-context/`（19 个）、`research/README.md` 与 `research/templates/`、以及根目录 5 个 Markdown 加 `codex-skills/`、`seo/README.md`、`private/README.md`。生成物位置同样不统一：`seo/route-audit.snapshot.json` 入库，`tmp/seo-route-audit.current.json` 被忽略，两者是同类产物。

`migrations/` 下 110 个顺序 SQL 虽然平铺，但属于通行惯例，不计入问题。

## 四、四种漂移机制

**临时产物缺少回收。** `NEXT_DIST_DIR` 让隔离构建变得很便宜，便宜到没人愿意在验证完顺手删掉。代价被推给未来的每一次检索：`grep`、`find`、IDE 索引和代码代理都要先穿过 7GB 无关数据。

**新增比归位便宜。** 加一条路由、加一个 `lib/xxx.js` 的成本是几分钟，把它并入既有层的成本是理解既有层加上改动调用方。在只有一个人维护的项目里，这个差价长期由新增方胜出，于是 244 个平铺文件和 103 个路由段就是这样一个个攒出来的。

**没有判据时两个都留着。** 这是最贵的一条。`content/` 与 `data/`、`articlesData.js` 与 `public/data/article-archive/`、`package-lock.json` 与 `pnpm-lock.yaml`，都在等一个「哪个是权威」的决定，而没人做决定时两份都保留。代价是后来者无法判断该改哪一份，改错了一份也不会有测试报错。

**按最顺手的一层放置。** `blogger-eye` 的 Python runner 放 `tools/`、Worker 放 `workers/`、本地服务放 `scripts/`、模型放 `lib/`、测试放 `tests/`，每一步都符合当时的直觉，合起来就是六个目录。没有判据的目录集合，会把「一个功能」自动拆成「六个目录里的六块」。

## 五、治理分档

**第一档 · 零风险。** 删掉 16 个 `.next-*` 目录（7.0GB）与两份 worktree 副本，给隔离构建加一条验证后回收的约定。不触碰任何已入库代码。

**第二档 · 低风险，只是移动文件。** 废弃的 `auth.js` 删除；`gptplus-site/` 独立出去；`desktop/`、`desktop-dist/`、`electron-builder.desktop.json` 合并成一个 `desktop/`；个人文档移出根目录；`extensions.json` 移入 `.vscode/`；`report-source.md` 归入 `research/`；两套 lockfile 二选一并在 `package.json` 里写明 `packageManager`。

**第三档 · 中风险，需要先定判据。** `lib/` 按域收拢到子目录，并把已有 8 个子目录统一进来；确定 `.js` 与 `.mjs` 的使用约定；删除零引用模块；补一个覆盖 `tests/**/*.test.*` 的 `test` 脚本。

**第四档 · 高风险，属于架构决策。** `scripts/`、`tools/`、`workers/`、`services/` 的职责划分（是否转为 workspace 子包）；`(site)` 下 28 个单文件路由是否迁往 rich-pages 或 `research/`；`content/` 与 `data/` 的存废。这三项都会改动大量路径，适合单独成次，不宜和其它改动混在一起。

## 六、信息来源与持续验证

资料截至 2026-10-10，来源全部为仓库自身：`git ls-files` 文件清单、`du -sh` 磁盘占用、全库 import 语句扫描与 `lib/` 文件名的集合差。规则依据为仓库根目录的 `AGENTS.md`、`research/README.md`、`next.config.js` 与 `.github/workflows/ci.yml`。

持续验证项：

- 20 个零引用模块中，除已确认的 3 个死文件外，其余是否通过动态加载被间接使用，需要逐个核对运行时调用路径。
- 上述文件数与占用会随提交变化；分档结论的稳定性取决于结构是否被改动，而非数字是否一致。
