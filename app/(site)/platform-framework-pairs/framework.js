// 调研报告框架：CF × VoidZero vs Vercel × Next
// 这一份是页面的"判断层"，下方的散点 + 排行 + 对比表是"证据层"
//
// 维护约定：
//  - 事实需要核实的地方，body 末尾用「⚠ 待核实」标注
//  - 不虚构数字 / 公告内容；不确定就明说"未公布"
//  - 每节正文控制在 80 字内，留给读者空间，详细展开放到独立调研页

export const FRAMEWORK_META = {
  title: '《Anthropic × Bun + Cloudflare × VoidZero + Vercel × Next：三极割据，AI 公司直接下场抢 Web Runtime》',
  subtitle: '研报框架 · 不是结论，是结构',
  thesis:
    '原来以为是 Vercel × Next 和 Cloudflare × VoidZero 双巨头割据。补上 2025-12-02 Anthropic 收购 Bun（公司首次收购）这一脚，叙事被重塑成三极格局 —— 而 Anthropic 是新形态：AI 模型公司直接拥有 runtime，绕过 deployment 平台层。CF × VoidZero 与其说是对冲 Vercel，不如说是 deployment 平台阵营对 AI 公司釜底抽薪的反击。',
  eventBadge: '三事件叠加 · 2025-12 起',
  estDate: '2025-12-02 Anthropic × Bun · 2026-06-04 Cloudflare × VoidZero · 2016 起 Vercel × Next',
}

export const FRAMEWORK_SECTIONS = [
  {
    id: 'event',
    number: '01',
    title: '事件层：三起收购，半年时间',
    body:
      '2025-12-02 Anthropic 收购 Bun（Jarred Sumner 团队 / Oven Inc，公司首次收购，Bun 月下载 700 万 / 82k stars / MIT 保持开源）—— AI 模型公司直接拿下 runtime + bundler + test runner + package manager。2026-06-04 Cloudflare 收购 VoidZero（Vite / Vitest / Rolldown / Oxc，Evan You 入 ETI，$1M 独立生态基金）。两起新事件叠加 2016 起 Vercel × Next 的存量绑定，三极格局成形。',
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
    title: '三家动机解构：先发的是 AI 公司',
    body:
      'Anthropic 是先发：Claude Code 6 个月做到 $1B run-rate，AI 编码工具核心依赖 runtime，与其租别家不如自己拿下。Bun 的 all-in-one toolkit 形态本就为快速 dev loop 优化，正好对口 AI agent 工作流。Cloudflare 是回应：deployment 平台层被 AI 公司釜底抽薪后，必须从工具链上游反包 —— Vite 在下游所有框架（含 React / Svelte / Solid）都有立足点。Vercel 是存量：九年 Next.js 绑定已经验证商业模型，问题是接下来怎么不被 Anthropic + CF 夹击。',
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
    title: 'AI 公司已经下场：从背景变量到直接玩家',
    body:
      '原来的叙事把 AI 当背景，争论的是"谁的框架被 LLM 默认推荐"。Anthropic × Bun 改变了游戏：AI 模型公司不再依赖 platform 厂商分发，直接拥有从 runtime 到 agent SDK 的全栈。① 代码生成层：Anthropic 现在可以让 Claude Code 默认推荐 Bun，反向定义"AI 时代 JS 怎么写"；② AI 工程入口层：从 CF × Vercel 两极，变成 Anthropic 直接拥有 + CF / Vercel 防御性扩张的三方博弈；③ 端侧 / Edge AI 层：CF 短期占优，但 Anthropic 一旦把 Claude 推到 Bun runtime 上，端侧本地推理可能从 CF 手里被抽走。',
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
      '定性：「三极割据 + AI 公司下场」格局正式成立 —— Anthropic 拥有 runtime，CF 拥有工具链上游，Vercel 拥有最成熟的部署 + 框架捆绑。三家的护城河形态不同，互相不能完全取代，未来 24 个月会持续互相侵入对方阵地。对 Agent 工程师：先想清楚自己的工作流要锚定哪一极 —— 用 Claude Code 做主力就接受 Bun 偏好；用 Vue/Nuxt 就接受 CF 偏好；用 Next.js 就接受 Vercel 偏好。对内容创作者：值得长期跟踪三个信号 —— Bun 在 Anthropic 治下的 commit 方向、Vite 独立基金的真实 grant 流向、Vercel 的反制动作。',
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
  { year: '2024-09', label: 'VoidZero 成立（Vite / Vitest / Rolldown / Oxc 商业化）' },
  { year: '2025-05', label: 'Claude Code 公开发布，半年内做到 $1B run-rate' },
  { year: '2025-12-02', label: 'Anthropic 收购 Bun · 公司首次收购，AI 公司直接下场抢 runtime', highlight: true },
  { year: '2026-06-04', label: 'Cloudflare 收购 VoidZero · deployment 平台从工具链上游反包', highlight: true },
]

export const PRIMARY_SOURCES = [
  { label: 'Anthropic × Bun 官方公告', url: 'https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone' },
  { label: 'Bun blog: Joining Anthropic', url: 'https://bun.com/blog/bun-joins-anthropic' },
  { label: 'Cloudflare × VoidZero 官方博客', url: 'https://blog.cloudflare.com/voidzero-joins-cloudflare/' },
  { label: 'VoidZero 公告', url: 'https://voidzero.dev/posts/voidzero-cloudflare' },
]

// 单一分享文案源（meta description / og: / twitter: / SharePageButton / 剪贴板共用）
export const SHARE_COPY = {
  // 浏览器 <title> + og:title + twitter:title
  title: 'Anthropic × Bun + Cloudflare × VoidZero + Vercel × Next：三极割据，AI 公司直接下场抢 Web Runtime',
  // meta description / og:description / twitter:description（120 字内，平台抓预览用）
  lead: '2025-12 Anthropic 收购 Bun + 2026-06 Cloudflare 收购 VoidZero + 2016 起 Vercel × Next：三极割据成形。AI 模型公司直接下场抢 runtime —— 这是新形态。10 节研报框架 + 11 组「平台 × 框架」配对可视化。',
  // 完整分享段（navigator.share text / 桌面复制时一起带出去）
  full:
    '原以为是双巨头：Vercel × Next 和 Cloudflare × VoidZero。补上 2025-12-02 Anthropic 收购 Bun（公司首次收购），叙事被重塑成三极格局 —— Anthropic 是新形态：AI 模型公司直接拥有 runtime，绕过 deployment 平台层。\n\n做了一份带 10 节研报框架 + 11 组「平台 × 框架」配对可视化的研判页，能筛、能对比、能分享。三家的护城河、动机、互相侵入方式都拆开讲了。',
}
