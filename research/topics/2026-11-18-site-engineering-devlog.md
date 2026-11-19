---
title: 2026-11-18 站点工程开发记录：21 次 PR 合并的分类台账与发布链路
category: topics
topic_type: tech
tech_type: web_cloud
subjects: [site_engineering]
content_type: build_log
date: 2026-11-18
tags: [站点工程, 开发记录, Pull Request, Cloudflare Pages, 持续部署, 内容发布, 分支治理]
summary: 2026-11-18 主仓库合并 20 个 PR、数据仓库合并 1 个，当日新建 17 条 PR 与 18 条 Issue。台账按六类归集交付，并记下代码与内容两条发布链路的差别、并行会话的三次撞车，以及查到终态才交付的约定。
tldr: 一天 21 次合并，主线是内容可视化契约、首页与后台界面、GitHub 热门中文化数据链路。代码合入 main 由 Pages 生产构建生效，调研正本还要在后台审批写入 D1 才公开；两者在当天都留下了实测证据。
assistance: workbuddy
show_assistance: false
review_ready: false
ad_eligible: false
auto_images: false
pv: 0
---

> 适用范围：数据来自 2026-11-18 对 `TUARAN/tuaran-home-page` 与 `TUARAN/github-auto-follow` 的 GitHub API 查询、本机会话日志、仓库文件与提交，以及对 Cloudflare Pages 预览与生产页面的实测。PR 与 Issue 状态核对到北京时间 22:15；合并时刻按 GitHub 记录的 UTC 时间加 8 小时换算。

## 一、结论

2026-11-18 是这个持续部署仓库合并最密集的一天：主仓库 20 个 PR、数据仓库 1 个 PR 合入，当日新建 17 条 PR 与 18 条 Issue。到 22:15，当日新建的 18 条 Issue 里 15 条已关闭、3 条仍开放，主仓库只剩 1 条 PR 开放。

- 21 次合并集中在四条主线：内容可视化与写作契约、首页与后台界面、GitHub 热门中文化的数据链路，以及仓库治理与发布闭环。
- 代码和调研正本走两条发布链路。代码合入 `main` 后由 Cloudflare Pages 生产构建生效；调研正本合入 `main` 只完成创作留档，公开详情页还要站长在后台审批写入 D1 `content_documents`。
- 当日出现三次并行会话撞车，分别落在 #422、#423、#424，都用 `force-with-lease` 或独立工作树修正，没有把其他任务的改动带进 PR。
- 外部异步结果查到终态再交付，从一次批评变成长期约定：#426、#423、#431 的 CI 与 Pages 部署都查到 success，预览链接与生产实测回填到 PR 正文。
- 阶段 3–4 的图表组件、反腐题材两篇稿件、浮生日记稿件与分支第二/三档清理仍留在待办，当日没有收口。

## 二、分类总表

统计口径：主仓库 20 个合并 PR 按主交付目的归类，每个 PR 只计一次；治理与交付复核类不产生独立合并 PR。状态列只表达状态，标签文字直接写出状态词。

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 260" role="img" aria-label="当日 20 个主仓库 PR 按主交付目的分类：内容可视化与写作契约 4 个、调研与内容稿 4 个、首页与后台界面 5 个、数据与自动化 3 个、构建体积与存量收口 4 个">
<text x="20" y="28" font-size="14" font-weight="500" fill="#2C2C2A">当日 20 个主仓库 PR 按主交付目的分类</text>
<text x="20" y="75" font-size="13" fill="#2C2C2A">内容可视化与写作契约</text>
<rect x="200" y="58" width="232" height="24" rx="4" fill="#85B7EB" stroke="#185FA5" stroke-width="0.5"/>
<text x="444" y="75" font-size="13" font-weight="500" fill="#2C2C2A">4</text>
<text x="20" y="111" font-size="13" fill="#2C2C2A">调研与内容稿</text>
<rect x="200" y="94" width="232" height="24" rx="4" fill="#D3D1C7" stroke="#888780" stroke-width="0.5"/>
<text x="444" y="111" font-size="13" font-weight="500" fill="#2C2C2A">4</text>
<text x="20" y="147" font-size="13" fill="#2C2C2A">首页与后台界面</text>
<rect x="200" y="130" width="290" height="24" rx="4" fill="#85B7EB" stroke="#185FA5" stroke-width="0.5"/>
<text x="502" y="147" font-size="13" font-weight="500" fill="#2C2C2A">5</text>
<text x="20" y="183" font-size="13" fill="#2C2C2A">数据与自动化</text>
<rect x="200" y="166" width="174" height="24" rx="4" fill="#D3D1C7" stroke="#888780" stroke-width="0.5"/>
<text x="386" y="183" font-size="13" font-weight="500" fill="#2C2C2A">3</text>
<text x="20" y="219" font-size="13" fill="#2C2C2A">构建、体积与存量收口</text>
<rect x="200" y="202" width="232" height="24" rx="4" fill="#D3D1C7" stroke="#888780" stroke-width="0.5"/>
<text x="444" y="219" font-size="13" font-weight="500" fill="#2C2C2A">4</text>
<text x="20" y="248" font-size="12" fill="#5F5E5A">蓝色条为内容可视化与界面交互两条主线，合计 9 个</text>
</svg>
<figcaption>图 1：20 个合并 PR 里，内容可视化与界面交互合计 9 个，接近当日交付的一半</figcaption>
</figure>

| 分类 | 事项 | Issue / PR | 状态 | 关键交付物与口径 |
| --- | --- | --- | --- | --- |
| A 内容可视化 | 站点与 WorkBuddy 方案对齐记录 | — | [!mute]未提交[/!mute] | `docs/context/content-visualization-alignment.md` 152 行；核实代码后纠正「需引入 Chart.js」的初判 |
| A | 五中全会调研与图表规则沉淀 | #405 / #406 | [!good]已合并[/!good] | 133 行调研 + `research/README.md` 图表规则；squash 时遇 502，查 API 确认已生效 |
| A | 关闭内嵌图表的自动氛围图 | #409 / #410 | [!good]已合并[/!good] | `auto_images: false`；裂图来自氛围图池，与内嵌 SVG 重复 |
| A | 彩色契约阶段 0–2 | #425 / #426 | [!good]已合并[/!good] | 9 文件 578 行：SVG 白名单扩展、语义标签、`--sem-*` 令牌、规范与帮助页、9 个测试、试点大图 |
| A | 解除「不要新建组件」限制 | 随 #426 | [!good]已落地[/!good] | `research/README.md` 与对齐记录同步改写，阶段 3 放行 |
| A | 移动端三缺陷修复 | #430 / #431 | [!good]已合并[/!good] | blob SVG 全黑、查看器塌陷、390px 表格裁切；首轮 CI 相对路径失败，修正后三项全绿 |
| B 调研与内容稿 | 理论体系全景与八爪鱼双版本 | #412 / #413 | [!good]已合并[/!good] | 并行会话产出，六层架构图与双版本合稿 |
| B | 海尔公司深度调研 | #418 / #424 | [!good]正本已入库[/!good] | 307 行、2 张内嵌 SVG；正本合入 `main`，前台详情页待后台审批 |
| B | 32GB 本地模型调研 | 直推 `main` `9318918b` | [!good]已入库[/!good] | 单文件提交，变基后 push，pre-push lint 通过 |
| B | 分支治理站点工程文章 | #428 / #429 | [!good]已合并[/!good] | `branch-hygiene-self-audit.md` + `topicHubs.js` 目录入口 |
| B | 诗词专集续增 10 首 | #399 | [!good]已合并[/!good] | 存量内容续增 |
| B | 反腐题材两篇调研稿 | #433 | [!warn]待复核[/!warn] | `needs:decision`，停在 Issue，稿件未提交、未发布 |
| B | 浮生日记稿件 | #427 / #432 / #434 | [!warn]待提交[/!warn] | #434 PR 开放；#427 存档稿 `priority:parked` |
| C 首页与后台界面 | 主要平台改整行卡片 | #419 / #421 | [!good]已合并[/!good] | 平台名与账号名常显、整行可点击；删掉 hover 弹层与 dead code |
| C | 首页瀑布流三区懒加载 | #420 / #423 | [!good]已合并[/!good] | `IntersectionObserver` 三区（load / 预加载 / idle），4 文件 7 测试 |
| C | 移除后台「文字记录」 | #417 / #422 | [!good]已合并[/!good] | 7 文件 −191 行；D1 表与 2 条历史记录保留，未写 DROP migration |
| C | 私密文档与分享统一入口 | #403 / #404 | [!good]已合并[/!good] | 默认展示 PDF，接受 SEO 路由快照变更 |
| C | 大互动日历 Grokbot 执行记录 | #400 / #408 | [!good]已合并[/!good] | 新增板块 |
| D 数据与自动化 | 首页 GitHub 热门板块 | #394 | [!good]已合并[/!good] | 首页靠后增加较小板块 |
| D | GitHub 热门中文化 | #415 / #416；跨仓库 #5 / #4 | [!good]已合并[/!good] | `description_zh` 优先、英文回退；每天 08:30 采集翻译并提交 `main` |
| D | DeepSeek 密钥与历史数据回填 | 随跨仓库 #4 | [!good]已上线[/!good] | GitHub Secrets 配置、90 天翻译缓存；11-17 原地补翻译、11-18 新清单 30 条 |
| D | X 插件启动自动恢复 | #401 / #402 | [!good]已合并[/!good] | 三次启动未确认后恢复启动请求 |
| E 构建与存量 | Worker 体积门禁收束 | #407 / #411 | [!good]已合并[/!good] | 一次性解掉 #408 / #402 / #394 的体积失败 |
| E | Worker 体积基线修复 | #397 | [!good]已合并[/!good] | 修复 `tuaran` Pages 发布失败 |
| E | 01 对半天零运行巡检预警 | #414 | [!good]已合并[/!good] | 巡检与提示改动 |
| E | X 大互动智能体 v4.15.50 | #386 | [!good]已合并[/!good] | 打包发布 |
| F 治理与交付复核 | 分支盘点与配置收口 | — | [!good]已完成[/!good] | 远程 187 → 44；开启 `delete_branch_on_merge` 与 `fetch.prune` |
| F | 盘点快照留存 | — | [!good]已完成[/!good] | `branch-hygiene-2026-11-18.md` / `branch-snapshot-2026-11-18.tsv` |
| F | 预览链接与部署终态回填 | #426 / #423 / #431 | [!good]已复核[/!good] | 查到 success 终态并回填 PR 正文，未留「待部署生成后补入」 |
| F | 生产构建产物实测 | #426 / #423 / #431 | [!good]已核验[/!good] | 生产 CSS 含 `--sem-*` 与 `.is-scrollable`；首页 chunk 含 `IntersectionObserver`；静态归档含内嵌图标记 |
| F | 长期约定沉淀 | — | [!good]已落地[/!good] | 外部异步结果查终态、独立工作树建分支、内容两步发布 |
| F | 本地模型与环境适配 | — | [!mute]未入库[/!mute] | ollama Qwen3.8-27B 18GB 接入并实测工具调用；SSH 改 HTTPS、worktree 软链、沙箱构建拦截 |
| F | 阶段 3–4 图表组件 | — | [!warn]待排期[/!warn] | ECharts 客户端组件与汇总图自动化未开工 |

## 三、时段分布

20 个主仓库 PR 的合并时刻按北京时间归集，跨仓库 #4 单列。

| 时段 | 主要动作 | 合并的 PR |
| --- | --- | --- |
| 08:00–10:00 | 会话启动、可视化方案对齐、存量内容收口 | #399 |
| 10:00–12:00 | 五中全会调研与裂图修复、彩色契约阶段 0–2 落地、明暗主题复核、Worker 体积收束 | #397 #406 #410 #413 #414 #411 #386 |
| 12:00–14:00 | 批量合并 6 个 open PR，逐个处理体积门禁与 SEO 快照 | #404 #408 #402 #394 |
| 14:00–16:00 | GitHub 热门中文化全链路、DeepSeek 数据上线、本地模型调研推 `main`、分支盘点 | #416；跨仓库 #4 |
| 16:00–18:00 | 首页平台卡片、瀑布流懒加载、海尔调研、移除后台文字记录、内容稿开 PR | #421 #422 |
| 18:00–20:00 | 部署闭环补齐、正本入库、三个 PR 收口、生产部署终态核查 | #424 #426 #423 #429 |
| 20:00–22:15 | 可视化样式修复首轮 CI 失败后修正并合并、反腐稿建档、浮生日记 PR | #431 |

## 四、两条发布链路与边界

当天的实测把代码交付与内容交付的差别摆得很清楚。代码进入 `main` 后由 Pages 生产构建直接生效；调研正本进入 `main` 只保存创作正本，edge 页面优先读 D1 的 `content_documents` 发布快照，静态归档只是 fallback。

| 链路 | 合入 `main` 之后 | 前台可见条件 | 当日实例 | 状态 |
| --- | --- | --- | --- | --- |
| 代码与样式 | Cloudflare Pages 生产构建 | 构建产物包含新代码与样式即可见 | #426 语义色令牌与 `:has()` 色条、#423 首页骨架占位与 `IntersectionObserver`、#431 `.is-scrollable` | [!good]已核验[/!good] |
| 调研创作正本 | Git 保存正本，纯内容提交用 `[CF-Pages-Skip]` | 站长在后台 `/admin/articles/research-import` 审批写入 D1 | #424 海尔稿合入后详情页仍 404；#429 目录页 200、详情页 404；#426 试点文章正文仍是旧快照 | [!warn]待后台发布[/!warn] |

## 五、并行会话与环境约束

共享工作区上多条会话同时改动，是当天返工的主要来源。三次撞车都发生在同一份工作树里，修正时保留了他人的未提交改动。

| 现象 | 影响 | 处理 | 沉淀 |
| --- | --- | --- | --- |
| 多会话共用同一 HEAD | #422 head 混入海尔提交，#423 首个提交带入 7 个无关文件 | `reset --mixed` 保住工作区、`force-with-lease` 修正远端；#424 改用独立工作树 | 开分支前核对 `git log --oneline -3`，内容稿用独立工作树 |
| SSH 被权限规则拒绝 | fetch / push 卡在 host key 交互 | 改用 HTTPS URL 与 gh 凭据 | 本机 Git 远程操作统一走 HTTPS |
| 工作树缺 `node_modules` | pre-push 的 `next lint` 与 `node --test` 失败 | 软链主工作区依赖，用完清理，未用 `--no-verify` | 钩子依赖按验证用途临时补齐 |
| 本机 `next build` 被沙箱 fs shim 拦截 | EPIPE、`safe-delete guard` | 以 CI `Build & Lint` 为准，组件级 SSR 渲染与 `enhanced-resolve` 复核替代 | 区分环境限制与代码错误 |
| #431 首轮相对路径多写一层 `..` | CI 与公开站 Pages failure | 修正 import，并复核 5 条相对导入 | 本地 lint 不解析模块路径，改 import 后要跑构建 |
| `gh pr merge` 返回 502 | #406 出现一个空合并提交 | 查 GitHub API 的 merged 状态再决定，不直接重试 | 合并结果以服务端状态为准 |

## 六、沉淀的规则与未完结项

| 条目 | 触发事件 | 落地位置 | 状态 |
| --- | --- | --- | --- |
| 外部异步结果查到终态并回填交付物 | #426 把「预览链接待补」留给站长 | 项目长期记忆、PR #426 / #423 / #431 正文 | [!good]已落地[/!good] |
| 独立工作树基于最新 `origin/main` 建 `codex/*` 分支 | 并行会话混改动 | 项目长期记忆、#426 / #429 / #431 交付 | [!good]已落地[/!good] |
| 内容发布两步链路 | #424 / #429 详情页 404 | 项目长期记忆、PR 正文 | [!good]已落地[/!good] |
| 分支名带 Issue 号、合并即删、定期巡检 | 187 个远程分支盘点 | 仓库设置、`branch-hygiene-self-audit.md` | [!good]已落地[/!good] |
| 图表组件可新建、可引入图表库 | 11:28 拍板解除限制 | `research/README.md`、对齐记录 | [!good]已落地[/!good] |
| 第二档 33 + 第三档 7 个分支确认 | 分支盘点 | 待办 | [!warn]待确认[/!warn] |
| `main` 保护与 bot 直推 `main` 的冲突 | 分支治理 | 待办 | [!warn]待决策[/!warn] |
| 阶段 3–4：ECharts 客户端组件、汇总图自动化 | 彩色契约 | 待办 | [!warn]待排期[/!warn] |
| #433 反腐两篇稿、#427 浮生日记存档稿 | 内容复核 | 停在 Issue | [!warn]待复核[/!warn] |
| #434 浮生日记入库 PR | 内容入库 | PR 开放 | [!warn]待合并[/!warn] |

## 七、信息来源与持续验证

主要来源：GitHub REST API 的 PR / Issue 状态、合并时刻与 check-runs；本仓库 2026-11-18 会话日志 310 行；仓库文件、提交与 CI 记录；对 Cloudflare Pages 预览与生产页面、CSS 与 JS chunk 的 `curl` 实测。状态核对到 2026-11-18 22:15（北京时间）。

会改变结论的缺项：

- #434、#433、#427 的后续处置会改变当日未完结项清单。
- 阶段 3–4、分支第二/三档与 `main` 保护的排期会改变后续交付范围。
- 调研正本的后台审批由站长执行，公开详情页状态以后台发布后的实际结果为准。
