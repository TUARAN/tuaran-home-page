---
title: Next.js 个人站点首屏加载与 Cloudflare 部署性能优化复盘
category: topics
topic_type: tech
tech_type: web_cloud
content_type: engineering_case
subjects: [site_engineering]
date: 2026-05-31
updated: 2026-11-04
tags: [Next.js, Cloudflare, 性能优化, 首屏加载, App Router, CDN, Middleware, Web Vitals]
summary: 记录 2aran.com 本轮首屏加载、按需加载、项目体积与 Cloudflare 部署加速优化：layout 解耦、middleware 收窄、静态缓存与首屏图片调度。收益均为构建观察与路径推断下的估算，不是 Lighthouse 实测。
tldr: 主站与 /web-llm 从 layout 层解耦，收窄 middleware，补齐 Cloudflare 静态缓存，并明确首屏关键图片调度。估算：首页冷启动约 3%–10%，二次访问体感约 10%–30%，静态资源重复下载可降 50%–95%——均待 RUM/Lighthouse 复核。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
---

> **适用范围**：站内工程优化复盘，对象是当时的 2aran.com（Next.js App Router + Cloudflare Pages / next-on-pages 路径）。判断不自动外推到任意 Next 站点。

## 结论

1. 本轮不是“首页 First Load JS 大幅下降”的优化；构建上首页仍约 **112 kB** First Load JS、shared JS 约 **100 kB**。
2. 真正动到的是加载路径：根 layout 最小化、`(site)` / `(web-llm)` route group 隔离、client 边界收缩、middleware 不再拦截公开静态资源、`public/_headers` 补长缓存、首屏图加 `priority` / `sizes`。
3. 下列速度数字全部是**估算**（基于构建结果、请求路径变化与常见 Web 性能经验），**不是**本轮 Lighthouse / WebPageTest / RUM 实测，不能当成线上结论。
4. `/web-llm` 的主要成本仍是模型与 ONNX Runtime WASM（当时观察约 **22 MB**）；本轮只去掉主站 layout 干扰，不宣称模型加载变快。

## 事实层：基线与改动

### 优化前观察（构建）

| 指标 | 观察值 |
|---|---:|
| 首页 `/` First Load JS | 约 112 kB |
| 全站 shared JS | 约 100 kB |
| Middleware | 约 34.7 kB |
| `public` | 约 6.8 MB |
| `.next/static` | 约 25 MB |
| ONNX Runtime WASM | 约 22 MB |

构建 warning：社区页 `<img>`；`ReadingPyramid.jsx` 的 `useMemo` 依赖。

### 主要问题（代码结构事实）

1. 根 `app/layout.jsx` 同时挂 metadata、统计、ThemeProvider、LayoutChrome。
2. `LayoutChrome` 因 `usePathname()` 成为全局 client 边界，页面主体穿过 hydration 面。
3. `/web-llm` 无独立 layout，主站用 if 跳过统计与导航。
4. middleware matcher 过宽，public 图片/音频/manifest 等仍可能进中间件。
5. `public/_headers` 缺 `/_next/static/*` 与常见静态资源长缓存。
6. 首页头像与推荐首图缺 `priority` / `sizes`。

### 实施（已完成项）

- `LayoutChrome` 拆成 server 壳 + client 控件。
- route group：`app/(site)` 与 `app/(web-llm)`；URL 不变。
- 删除全局 `AnalyticsScripts`；Umami 只进主站 layout。
- middleware matcher 排除 `_next/static`、`_next/image`、favicon、manifest、常见静态扩展名。
- `_headers` 为 hash 静态资源与图片/音频设长缓存（同名替换有风险，见下）。
- 首页关键图 `priority` / `sizes`；社区二维码与阅读金字塔图改 `next/image`。
- `npm run build` 通过；warning 收敛；静态路由数观察为 **171**。

### 优化后构建观察

| 指标 | 观察值 |
|---|---:|
| 首页 First Load JS | 约 112 kB（基本持平） |
| shared JS | 约 100 kB |
| Middleware | 约 35 kB |
| `<img>` / hook warning | 已消失 |

## 结构：为什么 JS 数字没掉，却仍值得做

`First Load JS` 统计的是首屏所需 JS chunk。首页原本就未打进 three / transformers / pptxgenjs 等重依赖，所以 layout 解耦不会让该列暴跌。

本轮优化的是：

- 哪些页面继承哪些 layout；
- 哪些 client 组件参与 hydration；
- 哪些静态资源进入 middleware；
- 哪些资源能被 Cloudflare / 浏览器长缓存；
- 哪些图片能被浏览器提前调度。

这些落在运行时与网络路径，不一定出现在 build 表格的同一列。

## 速度提升预估（全部为估算）

| 维度 | 估算 | 依据类型 |
|---|---|---|
| 首页冷启动 LCP | 约 3%–10% | 路径推断；若 LCP 命中头像/推荐首图，调度或可少约 100–300ms |
| 二次访问 / 跨页体感 | 约 10%–30% | 长缓存命中假设 |
| 静态资源重复下载 | 约降 50%–95% | 缓存命中假设，视流量与 TTL |
| 单静态资源 TTFB | 或少约 5–30ms | 跳过 middleware 的经验区间 |
| `/web-llm` 主站逻辑开销 | 或少约 20–80ms | 少脚本与少 hydration；不含模型加载 |

**明确未做**：本轮没有新增 Lighthouse 分数、没有伪造 Web Vitals 前后对比表。

## 风险

1. route group 大搬家：相对 import、`opengraph-image` / `robots` 位置错误会改输出；当时已修并 build 通过。
2. 图片/音频 `immutable` 长缓存：同名替换会导致旧资源滞留；应用 hash/版本文件名。
3. matcher 排除的扩展名若未来需要鉴权，会被跳过。
4. 本地浏览器插件曾拒绝访问 `localhost` 做渲染检查；上线前应人工点开 `/`、`/articles`、`/web-llm`、`/reading`、`/community`、`/robots.txt`、`/sitemap.xml`。

## 外部判断

对内容站 + 少数重页面的组合，**先切开 layout 与缓存边界**，通常比在首页上挤几 kB JS 更划算。下一步若要继续压首页 JS，需要 bundle analyzer 进 shared chunk，而不是重复做 route group。`/web-llm` 应单独立项（R2 + 长缓存、点击后再加载 runtime、WebGPU 降级）。部署链路若跟随 Next 大版本，应评估从 `@cloudflare/next-on-pages` 迁 OpenNext 的兼容收益——那是后续决策，不是本轮已完成事实。

## 信息来源

- 本站当时仓库结构与 `npm run build` 输出（2026-05-31 优化回合）
- Next.js App Router / `next/image` 行为（官方文档）
- Cloudflare Pages `_headers` 静态头机制（Cloudflare 文档）
- 站内相关：[Cloudflare 边缘智能体实践](/articles/research/topics/cloudflare-edge-agents-practice)

## 持续验证

- 用 Lighthouse CI / WebPageTest / Cloudflare Web Analytics / Umami 自定义 Web Vitals 建立真实基线后，回写估算表。
- 核对现行部署是 next-on-pages 还是 OpenNext，避免文档与运行时漂移。
- Browserslist 过期提示应定期 `npx update-browserslist-db@latest`，与首屏无直接因果关系。
