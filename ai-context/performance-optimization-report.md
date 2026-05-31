# 2aran.com 首屏加载与 Cloudflare 部署性能优化调研记录

日期：2026-05-31  
项目：`tuaran-home-page`  
技术栈：Next.js App Router、React 19、Cloudflare Pages / Workers、D1、Tailwind CSS

## 1. 调研背景

本次调研目标是提升 2aran.com 的首屏加载速度、按需加载能力、项目体积控制和 Cloudflare 部署后的边缘访问表现。项目属于内容型个人站点，同时包含若干较重的交互页面，例如端侧大模型 `/web-llm`、Three.js 可视化、文章调研页、PPT 下载等。

这类项目的性能瓶颈通常不只在 JavaScript 包体，还包括：

- 全局 client provider 是否让所有页面都进入 hydration。
- 大型功能页是否污染主站布局和共享加载路径。
- 静态资源是否有效利用 CDN 长缓存。
- middleware 是否拦截过多静态资源请求。
- 首屏关键图片是否被浏览器尽早调度。
- 图片、WASM、音频等资源是否按页面隔离。

## 2. 基线观察

执行命令：

```bash
npm run build
```

优化前观察到的关键数据：

- 首页 `/`：`First Load JS` 约 `112 kB`。
- 全站 shared JS：约 `100 kB`。
- middleware：约 `34.7 kB`。
- `public` 目录：约 `6.8 MB`。
- `.next/static`：约 `25 MB`，其中 `/web-llm` 相关 ONNX Runtime WASM 约 `22 MB`。
- 构建 warning：
  - `app/community/page.jsx` 使用 `<img>`，Next 建议改为 `next/image`。
  - `ReadingPyramid.jsx` 有一个 `useMemo` 依赖 warning。

判断：

- 首页 JS 体积没有失控，核心问题不是“首页 bundle 巨大”。
- 真正更值得处理的是架构层面的全局 client 边界、middleware 过宽、重页面隔离和 CDN 缓存。
- `/web-llm` 的 WASM 很大，但它是特定页面能力，不应该进入普通站点的加载路径。

## 3. 发现的问题

### 3.1 根布局承担过多职责

原始根布局 `app/layout.jsx` 同时负责：

- 全局 metadata。
- 全局 favicon / manifest。
- 注入结构化数据。
- 注入 Umami 统计。
- 包裹 `ThemeProvider`。
- 包裹 `LayoutChrome`。

其中 `ThemeProvider`、`LayoutChrome`、`AnalyticsScripts` 都涉及 client 逻辑或路由判断。这会让普通页面和特殊页面共享过多运行时结构。

### 3.2 `LayoutChrome` 原先是全局 client 边界

`LayoutChrome` 使用 `usePathname()` 判断哪些页面隐藏导航和页脚，因此整个 `children` 都穿过 client 组件边界。虽然 Next 仍可做 Server Component 优化，但这个结构会扩大 hydration 参与面，不利于长期维护。

### 3.3 `/web-llm` 没有独立 layout

`/web-llm` 是端侧大模型页面，包含 Hugging Face Transformers、ONNX Runtime、WASM、WebGPU 等重能力。它的产品性质与普通博客页不同，但原先仍继承主站 layout 的统计、主题、导航控制等逻辑。

这会带来两个问题：

- `/web-llm` 需要额外避开主站逻辑，代码里出现路径判断。
- 主站 layout 需要知道特殊页面，架构边界不清晰。

### 3.4 middleware matcher 过宽

原 matcher：

```js
matcher: ['/((?!_next/static|_next/image).*)']
```

它排除了 Next 静态 chunk 和 Next 图片优化路由，但 public 下的图片、音频、manifest、favicon、XML、TXT 等仍可能进入 middleware。

对页面 HTML 来说这不是大问题；但对静态资源请求来说，这是不必要的边缘计算开销。

### 3.5 Cloudflare 缓存头不足

`public/_headers` 原先只配置了 `/web-llm` 的 COOP/COEP：

```txt
/web-llm
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: credentialless
```

没有对 `/_next/static/*`、图片、音频等资源设置明确长期缓存。

### 3.6 首屏关键图片缺少调度提示

首页头像和推荐阅读首图可能在首屏区域，但原先没有 `priority` / `sizes`。浏览器仍会加载它们，但关键资源调度不够明确，可能影响 LCP。

### 3.7 局部页面图片没有使用 `next/image`

社区页二维码使用 `<img>`，阅读金字塔 tooltip 也使用 `<img>`。这类不是首页核心问题，但属于低风险可修复项。

## 4. 解决思路

整体策略不是盲目压缩所有文件，而是按影响路径分层治理：

1. 先减少全局运行时负担：根 layout 只做最小外壳。
2. 再用 route group 隔离主站和重页面：`(site)` 与 `(web-llm)` 分离。
3. 静态资源请求不走 middleware。
4. 静态资源交给 Cloudflare 长缓存。
5. 对首屏关键图片加浏览器调度提示。
6. 顺手消除构建 warning，减少未来维护噪声。

## 5. 实施过程

### 5.1 拆分 `LayoutChrome`

把 `LayoutChrome` 从 client 组件改成 server 组件，只保留页面结构：

- `LayoutChrome`：server component，负责包裹页面内容。
- `LayoutChromeControls`：client component，负责导航、返回顶部、按 pathname 判断隐藏 chrome。
- `LayoutChromeFooter`：client component，只负责非首页 footer 的路径判断。

收益：

- 页面主体不再被一个全局 client component 包住。
- client 逻辑收敛到导航、返回顶部、页脚这些确实需要交互的区域。

### 5.2 引入 route group

把普通站点页面移动到：

```txt
app/(site)
```

把端侧大模型页面移动到：

```txt
app/(web-llm)
```

URL 不变：

- `app/(site)/page.jsx` 仍然对应 `/`
- `app/(site)/articles/page.jsx` 仍然对应 `/articles`
- `app/(web-llm)/web-llm/page.jsx` 仍然对应 `/web-llm`

新增：

```txt
app/(site)/layout.jsx
app/(web-llm)/layout.jsx
```

根布局 `app/layout.jsx` 只保留：

- 全局 CSS。
- HTML / body。
- metadata。
- favicon / manifest。

主站 layout 承担：

- 结构化数据。
- Umami 统计。
- ThemeProvider。
- LayoutChrome。

Web LLM layout 保持极简：

```jsx
export default function WebLlmLayout({ children }) {
  return children
}
```

收益：

- `/web-llm` 不再继承主站 analytics、theme、导航、页脚等逻辑。
- 删除了原本为 `/web-llm` 特判的 `AnalyticsScripts` client 组件。
- 主站与重页面边界更清晰，后续可以单独优化 `/web-llm`。

### 5.3 删除全局 `AnalyticsScripts`

原本 `AnalyticsScripts` 是 client component，用 `usePathname()` 判断 `/web-llm` 是否跳过统计。

route group 拆分后，普通站点 layout 直接加载：

```jsx
<Script
  src="https://cloud.umami.is/script.js"
  data-website-id="..."
  strategy="afterInteractive"
/>
```

`/web-llm` layout 不加载统计脚本。

收益：

- 少一个全局 client 组件。
- 去掉运行时 pathname 判断。
- 特殊页面不再通过条件分支隐藏脚本，而是从架构上隔离。

### 5.4 收窄 middleware matcher

修改后：

```js
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp3|xml|txt)$).*)',
  ],
}
```

收益：

- 图片、音频、图标、manifest、XML、TXT 等静态资源不再进入 middleware。
- 让 middleware 更聚焦于页面路由、canonical host 和历史路径重定向。

### 5.5 增加 Cloudflare 静态资源缓存头

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

收益：

- Next hashed chunk 可长期缓存。
- 图片、音频等静态资源可被 Cloudflare 和浏览器更积极复用。
- 对二次访问、跨页面访问和边缘命中率提升明显。

注意：

- 如果未来同名图片会替换内容，长期缓存可能导致用户继续看到旧图。
- 更稳的做法是静态资源文件名带 hash 或版本号。

### 5.6 优化首页关键图片

首页推荐阅读第一张图：

```jsx
priority={index === 0}
sizes="(min-width: 768px) 188px, 100vw"
```

首页头像：

```jsx
priority
sizes="148px"
```

收益：

- 浏览器更早发现并调度可能影响 LCP 的图片。
- `sizes` 帮助浏览器选择更合适的图片尺寸，避免下载过大资源。

### 5.7 修复局部图片和 lint warning

社区页二维码从 `<img>` 改为 `next/image`。

阅读金字塔 tooltip 图片从 `<img>` 改为 `next/image`，并修复 `useMemo` 多余依赖。

收益：

- 构建 warning 消失。
- 图片加载策略更符合 Next.js 的优化路径。
- 维护噪声减少。

## 6. 完成情况

已完成：

- 根 layout 极简化。
- 主站 `(site)` route group。
- `/web-llm` 独立 `(web-llm)` route group。
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

构建结果：

- 首页 `/`：`First Load JS` 约 `112 kB`。
- shared JS：约 `100 kB`。
- middleware：约 `35 kB`。
- 构建 warning 中 `<img>` 和 `useMemo` 相关问题已消失。

仍存在提示：

- Browserslist 数据过期。
- edge runtime 会影响部分页面静态生成。

## 7. 速度提升预估

以下是基于构建结果、请求路径变化和常见 Web 性能经验的估算。由于当前没有线上 Lighthouse / WebPageTest / RUM 数据，不能把这些估算视为真实线上结论。

### 7.1 首页首屏

构建指标：

- 优化前：首页 `First Load JS` 约 `112 kB`。
- 优化后：首页 `First Load JS` 约 `112 kB`。

结论：

- JS 包体数字基本不变。
- 这次首页收益主要来自 hydration 边界变小、关键图片调度更明确、缓存策略更强，而不是首页 bundle 大幅下降。

预估收益：

- 冷启动首次访问：LCP 可能提升约 `3% - 10%`。
- 如果首页 LCP 命中头像或推荐阅读首图，图片调度可能减少约 `100ms - 300ms`。
- 如果网络慢或 Cloudflare 边缘较远，收益可能更明显。

### 7.2 二次访问 / 跨页面访问

Cloudflare 和浏览器长期缓存生效后：

- `/_next/static/*` 可长期缓存。
- 图片、音频、图标等可长期缓存。

预估收益：

- 二次访问静态资源下载量可下降 `50% - 95%`。
- 跨页面访问时，shared JS 和公共静态资源大概率直接命中缓存。
- 页面切换体感速度预计提升 `10% - 30%`，具体取决于用户缓存命中情况。

### 7.3 静态资源请求 TTFB

middleware 不再处理图片、音频、manifest、xml、txt 等静态资源。

预估收益：

- 每个静态资源请求减少一次 middleware 边缘执行。
- 单资源 TTFB 可能减少约 `5ms - 30ms`。
- 对图片多的页面，总体请求瀑布更干净。

这类收益在本地构建数字里不明显，但线上 Cloudflare 环境更有意义。

### 7.4 `/web-llm` 页面

`/web-llm` 现在不继承主站 layout：

- 不加载主站 Umami。
- 不加载主站导航控制。
- 不加载主站 footer / back-to-top。
- 不走主站 ThemeProvider。

预估收益：

- JS 执行和 hydration 开销减少约 `20ms - 80ms`。
- 少 1 个第三方统计脚本请求。
- 更重要的是架构隔离：后续优化 `/web-llm` 时不会影响主站。

注意：

- `/web-llm` 的主要成本仍是模型、WASM、WebGPU 初始化。
- 当前 `.next/static` 中 ONNX Runtime WASM 约 `22 MB`，这是该页面真正的大头。
- 本次优化不会让 `/web-llm` 的模型加载瞬间变快，但让它与主站解耦。

### 7.5 社区页 / 阅读页局部优化

社区页二维码改 `next/image` 后：

- 图片尺寸固定。
- 可获得 Next 图片优化能力。
- 首屏布局更稳定。

预估收益：

- 社区页图片传输量可能下降 `20% - 70%`，取决于 Cloudflare / Next 图片优化实际输出格式。
- 阅读页 tooltip 图片不是首屏资源，收益主要是规范化和避免 warning。

### 7.6 构建与维护收益

构建 warning 减少后：

- 未来真正的性能 warning 更容易被发现。
- route group 后架构边界更清晰，特殊页面不会继续污染根 layout。

预估收益不体现在毫秒上，但会降低后续性能治理成本。

## 8. 为什么 First Load JS 没明显下降

这点需要单独说明。

Next.js build 输出的 `First Load JS` 主要统计页面首次所需 JS chunk。当前首页之前已经没有明显引入 `three`、`@huggingface/transformers`、`pptxgenjs` 等重依赖，所以移动 route group 和拆 layout 不会让首页 JS 数字大幅下降。

本次优化影响的是：

- 哪些页面继承哪些 layout。
- 哪些 client 组件参与 hydration。
- 哪些静态资源进入 middleware。
- 哪些资源能被 Cloudflare 长缓存。
- 哪些图片能被浏览器提前调度。

这些属于运行时路径和网络路径优化，不一定直接反映在 `First Load JS` 这一列。

## 9. 风险评估

### 9.1 route group 移动风险

本次把大量页面移动到 `app/(site)`，URL 不变，但文件路径变化较大。

风险：

- 相对 import 路径可能遗漏。
- 特殊文件如 `opengraph-image.jsx`、`robots.js` 放错 route group 会改变路由输出。

处理：

- 已修复相对 import。
- 已将 `opengraph-image.jsx` 和 `robots.js` 放回根 app 层，保持 `/opengraph-image` 和 `/robots.txt` 正常输出。
- `npm run build` 已通过，静态路由数量恢复为 `171`。

### 9.2 长缓存风险

图片和音频设置 `max-age=31536000, immutable` 后，如果同名文件替换内容，用户可能看到旧资源。

建议：

- 后续替换图片时改文件名。
- 或采用带 hash / 日期版本号的资源命名。

### 9.3 middleware matcher 误排除风险

当前排除了 `png|jpg|jpeg|webp|svg|ico|mp3|xml|txt` 等扩展。

风险：

- 如果未来某个 `.txt` 或 `.xml` 需要 middleware 做鉴权或重定向，会被跳过。

当前判断：

- 本站这些类型主要是公开静态资源、sitemap、rss、llms、robots，跳过 middleware 合理。

### 9.4 本地浏览器验证受限

曾尝试用 in-app Browser 访问 `localhost:3001` 做页面渲染检查，但当前浏览器插件安全策略拒绝访问该地址。

已经完成的验证：

- `npm run build` 通过。
- 构建路由输出正常。
- lint warning 已收敛。

仍建议上线前手动访问：

- `/`
- `/articles`
- `/web-llm`
- `/reading`
- `/community`
- `/opengraph-image`
- `/robots.txt`
- `/sitemap.xml`

## 10. 后续优化建议

### 10.1 建立真实性能基线

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

### 10.2 单独治理 `/web-llm`

`/web-llm` 后续值得单独做：

- 模型资源放 R2 + 自定义域 + 长缓存。
- WASM 资源明确缓存策略。
- 首屏只加载 UI，用户点击后再加载模型 runtime。
- 加模型加载进度和缓存命中提示。
- 如果 WebGPU 不可用，提前降级，避免无效下载。

### 10.3 CSS 体积治理

构建中 CSS raw size 曾观察到主 CSS 约 `144 KB`。

建议：

- 把重复的 Tailwind arbitrary class 抽成语义化 class。
- 减少重复阴影、边框、渐变写法。
- 特殊页面 CSS 放在对应 route 内，不进入全局。

### 10.4 评估 Cloudflare OpenNext

当前项目使用 `@cloudflare/next-on-pages`。如果继续跟随 Next 15+，建议评估迁移 Cloudflare OpenNext。

收益：

- 与新版本 Next 的兼容性更稳。
- 部署和运行时模型更清晰。
- 后续边缘缓存和 server function 行为更可控。

### 10.5 更新 Browserslist 数据

构建提示 Browserslist 数据过期。

建议定期执行：

```bash
npx update-browserslist-db@latest
```

这不会直接决定首页速度，但会影响 CSS/JS 兼容产物和构建提示质量。

## 11. 结论

本次优化不是一次“压缩 bundle 立刻少几十 KB”的改动，而是一次加载路径和架构边界优化。

最核心的结果：

- 主站和 `/web-llm` 从 layout 层解耦。
- 根 layout 从复杂运行时容器变成最小 HTML 外壳。
- 全局 client 逻辑减少。
- middleware 不再拦截公开静态资源。
- Cloudflare 静态缓存策略补齐。
- 首页关键图片调度更明确。
- 构建 warning 收敛。

预估综合收益：

- 首页冷启动：`3% - 10%`。
- 二次访问 / 跨页面访问：`10% - 30%` 体感提升。
- 静态资源请求：单资源 TTFB 可能减少 `5ms - 30ms`。
- 静态资源重复下载量：可能减少 `50% - 95%`。
- `/web-llm` 主站逻辑开销：减少约 `20ms - 80ms` JS 执行 / hydration 成本。

后续如果要继续明显降低首页 `First Load JS`，需要进入更细的 bundle 分析阶段，例如用 bundle analyzer 定位 shared chunk 内部组成，再决定是否替换依赖、拆分 provider、减少全局 CSS 或调整交互组件。
