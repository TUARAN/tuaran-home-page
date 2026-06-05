// 调研报告框架：CF × VoidZero vs Vercel × Next
// 这一份是页面的"判断层"，下方的散点 + 排行 + 对比表是"证据层"
//
// 维护约定：
//  - 事实需要核实的地方，body 末尾用「⚠ 待核实」标注
//  - 不虚构数字 / 公告内容；不确定就明说"未公布"
//  - 每节正文控制在 80 字内，留给读者空间，详细展开放到独立调研页

export const FRAMEWORK_META = {
  title: '《Cloudflare 收购 VoidZero vs Vercel 收购 Next：双巨头割据前端、AI 原生 Web 时代产业深度研判》',
  subtitle: '研报框架 · 不是结论，是结构',
  thesis:
    '当平台拥有了框架，框架就成为平台分发自身能力的渠道。Vercel × Next 用九年验证了这条路径。2026-06-04 Cloudflare 收购 VoidZero —— Vite 工具链上游被拿下，AI 原生 Web 的"双巨头割据"正式成形。Evan You 团队公开承诺保持 vendor-agnostic + $1M 独立基金，但这套承诺值多少，要看未来 12 个月。',
  eventBadge: '事件层 · 2026-06-04 已确认',
  estDate: '2026-06-04 · Cloudflare 正式公告收购 VoidZero',
}

export const FRAMEWORK_SECTIONS = [
  {
    id: 'event',
    number: '01',
    title: '事件层：2026-06-04 已落地',
    body:
      'Cloudflare 正式收购 VoidZero（Vite / Vitest / Rolldown / Oxc 背后的公司）。Vite 每周下载 1 亿+。整套工具链原生进 Workers 平台；vite deploy → 全球生产一键。Evan You 团队整体加入 CF 的 ETI（Emerging Technology & Incubation）。MIT 协议保持开源，CF 同时承诺 100 万美元独立 Vite 生态基金，由 Vite core team 管理。',
    accent: 'highlight',
  },
  {
    id: 'mirror',
    number: '02',
    title: '历史镜像：Vercel × Next.js 走过的路',
    body:
      '2016 Next.js 由 Zeit (Vercel) 开源；2020 起 ISR、Image Optimization、App Router、Server Actions、Fluid Compute 等核心特性首发 Vercel。结果是 Next.js 越来越像"Vercel 运行时的前端"，OpenNext / next-on-pages 持续做 fork 自救。这条路径已经被验证：平台拥有框架，商业回报巨大。',
  },
  {
    id: 'ecosystem',
    number: '03',
    title: '生态地图：Vue / Vite / Nuxt 上的各方',
    body:
      '核心人物：Evan You（Vue / Vite）/ Anthony Fu（VueUse / Vite plugin / Nuxt） / Sébastien Chopin & Daniel Roe（Nuxt）。商业实体：VoidZero / NuxtLabs / Vercel（多年赞助 Vue） / Storyblok / Sentry / Cloudflare。Vue 在中国渗透率显著高于 React，是 CF 路径中的隐性筹码。',
  },
  {
    id: 'motivation',
    number: '04',
    title: 'Cloudflare 的动机解构',
    body:
      'CF 官方原话："统一软件开发生命周期 —— 开发者和自主 AI Agent 都能从 idea 一键到全球生产"。四条逻辑叠加：① Vite 是 JS 工具链上游，拿下它等于拿下下游所有框架（含 React / Svelte / Solid），比 Vercel × Next 单一框架格局大；② 把 Workers AI / Agents SDK 通过工具链分发；③ 对冲 Vercel，从 build / dev / test 这条线上提前卡位；④ 人才并购 —— Evan You + Vitest / Rolldown / Oxc 团队是稀缺资产。',
    accent: 'highlight',
  },
  {
    id: 'developer',
    number: '05',
    title: '对前端开发者的实际影响',
    body:
      'Vue / Nuxt 用户：默认部署路径、新特性首发、文档模板渠道权可能集中到 CF。Vite 用户（含 React / Svelte / Solid）：Vite 的中立性是核心问题，影响远超 Vue 阵营。非 Vue 用户：表面无关，但工具链一旦倾斜，整个 JS 生态都受影响。',
    accent: 'highlight',
  },
  {
    id: 'competitors',
    number: '06',
    title: '对竞争对手的连锁反应',
    body:
      'Vercel：可能加码 AI SDK + v0 + Next 锁定，或反向收购 SvelteKit / Remix。Netlify：进一步被边缘化，并购 / 转型压力增大。AWS / Azure / GCP：可能扩大 Amplify / Static Web Apps / Firebase 的 SSR 调度能力。中国云厂商：扶持国产替代（Rspack + 国产 SSR）的窗口期出现。',
  },
  {
    id: 'ai',
    number: '07',
    title: 'AI 大模型背景下的三条演变线',
    body:
      '① 代码生成层：谁的官方文档质量更高、模板更标准，谁就被 LLM 默认推荐 —— 训练集即事实标准；② AI 工程入口层：CF 已有 Workers AI / Vectorize / Agents SDK，框架深度集成后变成"AI 应用前端运行时"，与 Vercel AI SDK 形成两极；③ 端侧 / Edge AI 层：CF 边缘节点 + Vue 客户端响应式 + WebGPU，是 Vercel 暂时弱势的领域。',
    accent: 'highlight',
  },
  {
    id: 'risks',
    number: '08',
    title: '风险与未解之问',
    body:
      'CF / Evan 官方承诺 vendor-agnostic + $1M 独立基金，但「承诺保持中立的收购」最终如何兑现，要看 12 个月后的实际 commit 走向 —— Vite 团队的精力会自然偏向 Workers 集成、CF 用例、CF Demo。其它平台（Vercel / Netlify / AWS）必须重新考虑 Vite 依赖。中国 Vue 用户在 CF 可用性受限环境下可能被推向国产替代（Rspack / 国产 SSR）。CF 同时握有 CDN / DNS / Edge / 框架 / AI infra，反垄断视角值得关注。社区分叉风险存在但门槛高。',
  },
  {
    id: 'conclusion',
    number: '09',
    title: '个人结论与跟进策略',
    body:
      '定性：「双巨头割据 + AI 原生 Web」格局正式成立。对 Vue / Nuxt 用户：CF 体验会很快超过其他平台，可以尝试但保留多云能力。对 React / Svelte / Solid 用户：你也在被收购，因为你用 Vite。对独立开发者：在 LLM 默认推荐固化之前，主动建立自己的「框架 + 平台」偏好，别让 AI 替你选。对内容创作者：这事值得做长期跟踪 —— vite deploy 的真实体验、独立基金的实际 grant 流向、12 个月后的 commit 分布，都是后续观察点。',
    accent: 'highlight',
  },
  {
    id: 'sources',
    number: '10',
    title: '信息来源（一手优先）',
    body:
      'Cloudflare blog/voidzero-joins-cloudflare（2026-06-04）；VoidZero blog/posts/voidzero-cloudflare；Cloudflare press release "AI-Native Web"；NET 股价新闻 + BusinessWire；SiliconANGLE / InfotechLead 行业评论；Evan You / Anthony Fu 推特表态；Nuxt 团队声明；Vercel 高管反应（Guillermo Rauch / Lee Robinson）；中文一手：Vue 中国社区 + 掘金 + V2EX。',
  },
]

export const SIGNAL_TIMELINE = [
  { year: 2016, label: 'Next.js 由 Zeit (Vercel 前身) 开源' },
  { year: 2020, label: 'ISR / Image Optimization 首发 Vercel，捆绑加深' },
  { year: 2022, label: 'App Router / Server Components 推出，社区争议升温' },
  { year: '2024-09', label: 'VoidZero 成立（Vite / Vitest / Rolldown / Oxc 商业化），Accel 领投' },
  { year: 2025, label: 'Vercel Fluid Compute 公布，仅 Vercel 完整工作' },
  { year: '2026-06-04', label: 'Cloudflare 收购 VoidZero · "AI 原生 Web 的未来"', highlight: true },
]

export const PRIMARY_SOURCES = [
  { label: 'Cloudflare 官方博客', url: 'https://blog.cloudflare.com/voidzero-joins-cloudflare/' },
  { label: 'VoidZero 公告', url: 'https://voidzero.dev/posts/voidzero-cloudflare' },
  { label: 'Cloudflare 正式新闻稿', url: 'https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-voidzero-to-build-the-future-of-the-ai-native-web/' },
]

// 单一分享文案源（meta description / og: / twitter: / SharePageButton / 剪贴板共用）
export const SHARE_COPY = {
  // 浏览器 <title> + og:title + twitter:title。完整研报名
  title: 'Cloudflare 收购 VoidZero vs Vercel 收购 Next：双巨头割据前端、AI 原生 Web 时代产业深度研判',
  // meta description / og:description / twitter:description（120 字内，平台抓预览用）
  lead: '6/4 Cloudflare 收购 Evan You 的 VoidZero —— Vite / Vitest / Rolldown / Oxc 全套 JS 工具链上游被拿下，与 Vercel × Next 正式形成「双巨头割据」。10 节研报框架 + 10 组「平台 × 框架」捆绑配对可视化。',
  // 完整分享段（navigator.share text / 桌面复制时一起带出去）
  full:
    '6/4 Cloudflare 正式收购了 Evan You 的 VoidZero —— Vite / Vitest / Rolldown / Oxc 全套 JS 工具链上游被拿下，与 Vercel × Next 正式形成「双巨头割据」。\n\n顺手做了一份带 10 节研报框架 + 10 组「平台 × 框架」捆绑配对可视化的研判页，能筛、能对比、能分享。AI 原生 Web 时代这件事对 Vue / React / Svelte 用户分别意味着什么，都拆开讲了。',
}
