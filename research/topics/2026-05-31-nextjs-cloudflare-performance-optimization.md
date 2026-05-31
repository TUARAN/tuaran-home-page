---
title: Next.js 个人站点首屏加载与 Cloudflare 部署性能优化复盘
category: topics
topic_type: tech
date: 2026-05-31
tags: [Next.js, Cloudflare, 性能优化, 首屏加载, App Router, CDN, Middleware, Web Vitals]
summary: 记录 2aran.com 本轮首屏加载、按需加载、项目体积与 Cloudflare 部署加速优化的完整过程：问题定位、架构拆分、缓存策略、middleware 收敛、图片优化、收益预估与后续评估。
tldr: 本轮优化的核心不是让首页 First Load JS 立刻大幅下降，而是把主站和 /web-llm 从 layout 层解耦，减少全局 client 边界，收窄 middleware，补齐 Cloudflare 静态缓存，并明确首屏关键图片调度。预估首页冷启动提升 3% - 10%，二次访问和跨页面体感提升 10% - 30%，静态资源重复下载量可下降 50% - 95%。
assistance: codex
pv: 0
---

> **记录定位**：这是一篇站内工程优化复盘，不是通用性能优化清单。所有判断都基于当前 2aran.com 项目结构、Next.js App Router 构建结果、Cloudflare Pages 部署路径和本次实际改动。

## 一、背景与目标

本次优化的目标是提升 2aran.com 的首屏加载速度、按需加载能力、项目体积控制和 Cloudflare 部署后的边缘访问表现。

项目是一个内容型个人站点，同时包含若干较重的交互页面：

- `/web-llm`：端侧大模型、Hugging Face Transformers、ONNX Runtime、WASM、WebGPU。
- `/sun-moon-motion`：Three.js 可视化。
- `/articles/research/...`：调研文章、评论、PV、Markdown 渲染、PPT 下载。
- 首页：文章推荐、头像、二维码、站点入口、动态模块。

这类项目的性能瓶颈通常不只在 JavaScript 包体，还包括：

- 全局 client provider 是否让所有页面都参与 hydration。
- 大型功能页是否污染主站共享 layout。
- 静态资源是否有效利用 Cloudflare CDN 长缓存。
- middleware 是否拦截了过多静态资源请求。
- 首屏关键图片是否被浏览器尽早发现和调度。
- WASM、音频、图片等资源是否按页面隔离。

## 二、优化前基线

执行：

```bash
npm run build
```

优化前观察到的关键数据：

| 指标 | 优化前观察 |
|---|---:|
| 首页 `/` First Load JS | 约 `112 kB` |
| 全站 shared JS | 约 `100 kB` |
| Middleware | 约 `34.7 kB` |
| `public` 目录 | 约 `6.8 MB` |
| `.next/static` | 约 `25 MB` |
| ONNX Runtime WASM | 约 `22 MB` |

构建 warning：

- `app/community/page.jsx` 使用 `<img>`，Next 建议改为 `next/image`。
- `ReadingPyramid.jsx` 存在一个 `useMemo` 依赖 warning。

初步判断：

- 首页 JS 体积没有失控，核心问题不是“首页 bundle 巨大”。
- 真正更值得处理的是架构层面的全局 client 边界、middleware 过宽、重页面隔离和 CDN 缓存。
- `/web-llm` 的 WASM 很大，但这是特定页面能力，不应该影响普通站点加载路径。

## 三、主要问题

### 1. 根 layout 承担过多职责

原始 `app/layout.jsx` 同时负责：

- 全局 metadata。
- favicon / manifest。
- 结构化数据。
- Umami 统计。
- `ThemeProvider`。
- `LayoutChrome`。

这些能力并不都应该挂在所有页面上。尤其是 `/web-llm` 这样的重页面，本身有特殊运行时要求，不应该继承主站导航、统计、主题逻辑。

### 2. `LayoutChrome` 曾是全局 client 边界

`LayoutChrome` 使用 `usePathname()` 判断是否隐藏导航和页脚，因此它需要是 client component。原结构会让页面主体穿过这个 client 边界，扩大 hydration 参与面。

### 3. `/web-llm` 没有独立 layout

`/web-llm` 原先需要在主站布局里被特殊判断，例如统计脚本要跳过它、导航要隐藏它。这说明架构边界反了：不应该由主站 layout 认识所有特殊页面，而应该让特殊页面拥有自己的 layout。

### 4. middleware matcher 过宽

原 matcher：

```js
matcher: ['/((?!_next/static|_next/image).*)']
```

它排除了 Next 静态 chunk 和 Next 图片优化路由，但 public 下的图片、音频、manifest、favicon、XML、TXT 等仍可能进入 middleware。这会造成不必要的边缘计算开销。

### 5. Cloudflare 缓存头不足

`public/_headers` 原先只配置了 `/web-llm` 的 COOP/COEP，没有对 `/_next/static/*`、图片、音频等资源设置明确长期缓存。

### 6. 首屏关键图片缺少加载调度提示

首页头像和推荐阅读首图可能出现在首屏内，但没有 `priority` / `sizes`。浏览器仍会加载它们，但调度优先级不够明确，可能影响 LCP。

## 四、解决思路

本轮策略不是盲目压缩所有文件，而是按加载路径分层治理：

1. 根 layout 最小化：只保留 HTML 外壳和真正全局的 metadata。
2. 主站和重页面拆 route group：`(site)` 与 `(web-llm)` 分离。
3. client 逻辑局部化：只让需要交互的导航、返回顶部、页脚参与 client。
4. middleware 只处理页面路由，不处理公开静态资源。
5. Cloudflare 长缓存覆盖 Next 静态 chunk、图片、音频等资源。
6. 首页关键图片明确 `priority` / `sizes`。
7. 修复构建 warning，降低后续维护噪声。

## 五、实施过程

### 1. 拆分 `LayoutChrome`

将 `LayoutChrome` 改成 server component，只负责结构：

```jsx
export default function LayoutChrome({ children }) {
  return (
    <>
      <LayoutChromeControls />
      <div className="flex w-full min-w-0 flex-1 flex-col [&>*]:min-w-0 [&>*]:w-full">
        {children}
      </div>
      <LayoutChromeFooter />
    </>
  )
}
```

新增 `LayoutChromeControls.jsx`：

- client component。
- 内部使用 `usePathname()`。
- 控制 `SiteHeader`、`BackToTopButton`、非首页 footer。

这样页面主体不再被一个全局 client component 包住，client 逻辑收敛到真正需要交互的 UI。

### 2. 引入 route group

普通站点页面移动到：

```txt
app/(site)
```

端侧大模型页面移动到：

```txt
app/(web-llm)
```

URL 不变：

| 文件位置 | URL |
|---|---|
| `app/(site)/page.jsx` | `/` |
| `app/(site)/articles/page.jsx` | `/articles` |
| `app/(web-llm)/web-llm/page.jsx` | `/web-llm` |

新增：

```txt
app/(site)/layout.jsx
app/(web-llm)/layout.jsx
```

根 `app/layout.jsx` 只保留最小 HTML 外壳。主站 `(site)/layout.jsx` 承载：

- 结构化数据。
- Umami 统计。
- `ThemeProvider`。
- `LayoutChrome`。

`(web-llm)/layout.jsx` 保持极简：

```jsx
export default function WebLlmLayout({ children }) {
  return children
}
```

### 3. 删除全局 `AnalyticsScripts`

原 `AnalyticsScripts` 是 client component，通过 `usePathname()` 判断 `/web-llm` 是否跳过统计。

拆 route group 后，普通站点 layout 直接加载 Umami：

```jsx
<Script
  src="https://cloud.umami.is/script.js"
  data-website-id="..."
  strategy="afterInteractive"
/>
```

`/web-llm` layout 不加载统计脚本。

结果：

- 少一个全局 client 组件。
- 去掉运行时 pathname 判断。
- 特殊页面不再通过 if 分支隐藏脚本，而是从架构上隔离。

### 4. 收窄 middleware matcher

修改后：

```js
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp3|xml|txt)$).*)',
  ],
}
```

效果：

- 图片、音频、图标、manifest、XML、TXT 等静态资源不再进入 middleware。
- middleware 更聚焦于页面路由、canonical host 和历史路径重定向。

### 5. 增加 Cloudflare 静态资源缓存头

在 `public/_headers` 中增加：

```txt
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.webp
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Cache-Control: public, max-age=31536000, immutable

/*.jpeg
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Cache-Control: public, max-age=31536000, immutable

/*.ico
  Cache-Control: public, max-age=31536000, immutable

/*.mp3
  Cache-Control: public, max-age=31536000, immutable

/site.webmanifest
  Cache-Control: public, max-age=86400
```

注意：

- `/_next/static/*` 是 hash 文件，适合长期缓存。
- 图片、音频如果未来会同名替换，长期缓存可能导致用户继续看到旧资源。更稳的做法是文件名带 hash、日期或版本号。

### 6. 优化首页关键图片

首页推荐阅读第一张图增加：

```jsx
priority={index === 0}
sizes="(min-width: 768px) 188px, 100vw"
```

首页头像增加：

```jsx
priority
sizes="148px"
```

效果：

- 浏览器更早发现和调度可能影响 LCP 的图片。
- `sizes` 帮助浏览器选择更合适的图片尺寸，避免过大下载。

### 7. 修复图片与 hook warning

社区页二维码从 `<img>` 改为 `next/image`。

阅读金字塔 tooltip 图片从 `<img>` 改为 `next/image`，并修复 `useMemo` 多余依赖。

效果：

- 构建 warning 消失。
- 图片加载路径更符合 Next.js 优化模型。
- 后续构建输出更干净。

## 六、完成情况

已完成：

- 根 layout 极简化。
- 新增主站 `(site)` route group。
- 新增 `/web-llm` 独立 `(web-llm)` route group。
- 删除全局 `AnalyticsScripts` client 组件。
- `LayoutChrome` server / client 边界拆分。
- middleware matcher 收窄。
- Cloudflare `_headers` 长缓存策略。
- 首页关键图片 `priority` / `sizes`。
- 社区页二维码 `next/image`。
- 阅读金字塔 warning 修复。
- route group 移动后的相对 import 修复。

验证：

```bash
npm run build
```

构建通过。

优化后观察：

| 指标 | 优化后观察 |
|---|---:|
| 首页 `/` First Load JS | 约 `112 kB` |
| shared JS | 约 `100 kB` |
| Middleware | 约 `35 kB` |
| 静态路由数量 | `171` |
| `<img>` / hook warning | 已消失 |

仍存在提示：

- Browserslist 数据过期。
- edge runtime 会影响部分页面静态生成。

## 七、速度提升预估

这些是基于构建结果、请求路径变化和常见 Web 性能经验的估算。当前没有线上 Lighthouse、WebPageTest 或 RUM 数据，因此不能把估算视为真实线上结论。

### 1. 首页首屏

构建指标上，首页 First Load JS 从优化前到优化后基本保持 `112 kB`。这说明本轮不是“首页 bundle 大幅下降”的优化。

收益主要来自：

- hydration 边界变小。
- 首页关键图片调度更明确。
- CDN 缓存策略更强。

预估：

- 冷启动首次访问：LCP 可能提升约 `3% - 10%`。
- 如果 LCP 命中头像或推荐阅读首图，图片调度可能减少约 `100ms - 300ms`。
- 弱网和远距离边缘节点下收益可能更明显。

### 2. 二次访问 / 跨页面访问

Cloudflare 和浏览器长期缓存生效后：

- `/_next/static/*` 可长期缓存。
- 图片、音频、图标等可长期缓存。

预估：

- 二次访问静态资源下载量可下降 `50% - 95%`。
- 跨页面访问时，shared JS 和公共静态资源大概率直接命中缓存。
- 页面切换体感速度预计提升 `10% - 30%`。

### 3. 静态资源请求 TTFB

middleware 不再处理图片、音频、manifest、xml、txt 等静态资源。

预估：

- 每个静态资源请求减少一次 middleware 边缘执行。
- 单资源 TTFB 可能减少约 `5ms - 30ms`。
- 图片较多的页面，请求瀑布更干净。

### 4. `/web-llm` 页面

`/web-llm` 现在不继承主站 layout：

- 不加载主站 Umami。
- 不加载主站导航控制。
- 不加载主站 footer / back-to-top。
- 不走主站 ThemeProvider。

预估：

- JS 执行和 hydration 开销减少约 `20ms - 80ms`。
- 少 1 个第三方统计脚本请求。
- 架构隔离收益更大：后续优化 `/web-llm` 不会影响主站。

注意：

- `/web-llm` 的主要成本仍是模型、WASM、WebGPU 初始化。
- 当前 ONNX Runtime WASM 约 `22 MB`，这是该页面真正的大头。
- 本轮优化不会让模型加载瞬间变快，但清除了主站逻辑干扰。

### 5. 社区页 / 阅读页局部优化

社区页二维码改 `next/image` 后：

- 图片尺寸固定。
- 可获得 Next 图片优化能力。
- 首屏布局更稳定。

预估：

- 社区页图片传输量可能下降 `20% - 70%`，取决于实际图片优化输出格式。
- 阅读页 tooltip 图片不是首屏资源，收益主要是规范化和避免 warning。

## 八、为什么 First Load JS 没明显下降

这一点很关键。

Next.js build 输出的 `First Load JS` 主要统计页面首次所需 JS chunk。当前首页之前已经没有明显引入 `three`、`@huggingface/transformers`、`pptxgenjs` 等重依赖，所以 route group 和 layout 拆分不会让首页 JS 数字大幅下降。

本轮优化影响的是：

- 哪些页面继承哪些 layout。
- 哪些 client 组件参与 hydration。
- 哪些静态资源进入 middleware。
- 哪些资源能被 Cloudflare 长缓存。
- 哪些图片能被浏览器提前调度。

这些属于运行时路径和网络路径优化，不一定直接体现在 `First Load JS` 一列。

## 九、风险评估

### 1. route group 移动风险

这次把大量页面移动到 `app/(site)`，URL 不变，但文件路径变化较大。

风险：

- 相对 import 路径可能遗漏。
- 特殊文件如 `opengraph-image.jsx`、`robots.js` 放错位置会改变路由输出。

处理：

- 已修复相对 import。
- 已将 `opengraph-image.jsx` 和 `robots.js` 放回根 app 层。
- `npm run build` 已通过，静态路由数量为 `171`。

### 2. 长缓存风险

图片和音频设置 `max-age=31536000, immutable` 后，如果同名文件替换内容，用户可能看到旧资源。

建议：

- 后续替换图片时改文件名。
- 或采用带 hash / 日期版本号的资源命名。

### 3. middleware matcher 误排除风险

当前排除了 `png|jpg|jpeg|webp|svg|ico|mp3|xml|txt` 等扩展。

如果未来某个 `.txt` 或 `.xml` 需要 middleware 鉴权或重定向，会被跳过。但当前这些类型主要是公开静态资源、sitemap、rss、llms、robots，跳过 middleware 是合理的。

### 4. 本地浏览器验证受限

曾尝试用 in-app Browser 访问 `localhost:3001` 做页面渲染检查，但当前浏览器插件安全策略拒绝访问该地址。

已经完成：

- `npm run build` 通过。
- 构建路由输出正常。
- lint warning 已收敛。

上线前仍建议手动访问：

- `/`
- `/articles`
- `/web-llm`
- `/reading`
- `/community`
- `/opengraph-image`
- `/robots.txt`
- `/sitemap.xml`

## 十、后续评估与优化建议

### 1. 建立真实 Web Vitals 基线

建议接入或定期运行：

- Lighthouse CI。
- WebPageTest。
- Cloudflare Web Analytics。
- Umami 自定义 Web Vitals。
- Next.js `useReportWebVitals`。

重点观测：

- LCP。
- INP。
- CLS。
- TTFB。
- JS transfer size。
- 图片 transfer size。
- Cloudflare cache hit ratio。

没有 RUM 数据时，性能优化只能是工程推断；有数据后才能判断真实收益。

### 2. 单独治理 `/web-llm`

`/web-llm` 后续值得单独优化：

- 模型资源放 R2 + 自定义域 + 长缓存。
- WASM 资源明确缓存策略。
- 首屏只加载 UI，用户点击后再加载模型 runtime。
- 加模型加载进度和缓存命中提示。
- WebGPU 不可用时提前降级，避免无效下载。

### 3. CSS 体积治理

构建中 CSS raw size 曾观察到主 CSS 约 `144 KB`。

建议：

- 把重复的 Tailwind arbitrary class 抽成语义化 class。
- 减少重复阴影、边框、渐变写法。
- 特殊页面 CSS 放在对应 route 内，不进入全局。

### 4. 评估 Cloudflare OpenNext

当前项目使用 `@cloudflare/next-on-pages`。如果继续跟随 Next 15+，建议评估迁移 Cloudflare OpenNext。

收益：

- 与新版本 Next 的兼容性更稳。
- 部署和运行时模型更清晰。
- 后续边缘缓存和 server function 行为更可控。

### 5. 更新 Browserslist 数据

构建提示 Browserslist 数据过期。

建议定期执行：

```bash
npx update-browserslist-db@latest
```

这不会直接决定首页速度，但会影响 CSS / JS 兼容产物和构建提示质量。

## 十一、结论

本轮优化不是一次“压缩 bundle 立刻少几十 KB”的改动，而是一次加载路径和架构边界优化。

最核心的结果：

- 主站和 `/web-llm` 从 layout 层解耦。
- 根 layout 从复杂运行时容器变成最小 HTML 外壳。
- 全局 client 逻辑减少。
- middleware 不再拦截公开静态资源。
- Cloudflare 静态缓存策略补齐。
- 首页关键图片调度更明确。
- 构建 warning 收敛。

预估综合收益：

| 维度 | 预估收益 |
|---|---:|
| 首页冷启动 | `3% - 10%` |
| 二次访问 / 跨页面访问 | `10% - 30%` 体感提升 |
| 静态资源单请求 TTFB | 减少 `5ms - 30ms` |
| 静态资源重复下载量 | 下降 `50% - 95%` |
| `/web-llm` 主站逻辑开销 | 减少约 `20ms - 80ms` |

后续如果要继续明显降低首页 `First Load JS`，需要进入更细的 bundle 分析阶段，例如用 bundle analyzer 定位 shared chunk 内部组成，再决定是否替换依赖、拆分 provider、减少全局 CSS 或调整交互组件。
