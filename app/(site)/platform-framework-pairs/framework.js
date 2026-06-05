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
    '当平台拥有了框架，框架就成为平台分发自身能力的渠道。Vercel × Next 验证了这条路径；CF × VoidZero 一旦落地，意味着这件事开始有第二条对称力量。AI 大模型既是这场博弈的加速器，也是新的赌注。',
  eventBadge: '事件层 · 部分细节待官方确认',
  estDate: '2024-09 起 · CF × VoidZero 整合存在但收购细节未官方确认',
}

export const FRAMEWORK_SECTIONS = [
  {
    id: 'event',
    number: '01',
    title: '事件层：到底发生了什么',
    body:
      'VoidZero 由 Evan You 于 2024-09 成立，专做 Vite / Rolldown / OXC 的商业化，Accel 领投。Cloudflare 是 Vite 长期赞助方，Workers / Pages 模板里 Vite 已是一等公民。CF 是否实质性收购 / 控股 VoidZero —— 公开信源未明确披露，需以官方公告为准。',
    accent: 'warning',
    needsFact: true,
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
      '四条逻辑叠加：① 把 Vite / Nuxt 默认绑定 Workers / D1 / R2 / KV，复制 Vercel × Next 的捆绑收益；② 用框架做 Workers AI / Agents SDK 的分发渠道；③ 对冲 Vercel —— 它锁了 React 一侧，CF 走 Vue 一侧建立对称力量；④ 人才并购 —— Evan You / Anthony Fu 影响力本身就是稀缺资产。',
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
      'Vite 中立性是否能维持（直接影响 React / Svelte / Solid 用户）；开源治理决定权变化（参考 Babel / webpack 衰落教训）；中国 Vue 用户在 CF 可用性受限环境下可能被推向国产替代；CF 同时握有 CDN / DNS / Edge runtime / 框架 / AI infra，是否触及反垄断红线；Evan You 等核心人物的长期承诺；社区分叉风险（独立 Vue / 纯 Vite fork）。',
    accent: 'warning',
  },
  {
    id: 'conclusion',
    number: '09',
    title: '个人结论与跟进策略',
    body:
      '事件未官方核实之前，定性留空。对 Vue 用户：保持多云部署能力，不要默认 CF。对 React 用户：开始关注 Vite 中立性这件事。对独立开发者：在 LLM 默认推荐固化之前，主动建立自己的"框架 + 平台"偏好，而不是等 AI 替你选。对内容创作者：这个事件适合做一篇长期跟踪的富页面调研。',
  },
  {
    id: 'sources',
    number: '10',
    title: '信息来源（一手优先）',
    body:
      'Cloudflare 官方博客 + S-1 + 财报电话会议；Evan You 个人推特 / VoidZero 官网；Nuxt 团队声明；Vercel 高管推特（Guillermo Rauch / Lee Robinson）；Hacker News 主帖 + TheNewStack + InfoQ；中文一手：Vue 中国社区 / 掘金 / V2EX 相关讨论。',
  },
]

export const SIGNAL_TIMELINE = [
  { year: 2016, label: 'Next.js 由 Zeit (Vercel 前身) 开源' },
  { year: 2020, label: 'ISR / Image Optimization 首发 Vercel，捆绑加深' },
  { year: 2022, label: 'App Router / Server Components 推出，社区争议升温' },
  { year: 2024, label: 'VoidZero 成立（Vite/Rolldown 商业化），Accel 领投' },
  { year: 2024, label: 'Fluid Compute 公布，仅 Vercel 完整工作' },
  { year: 2025, label: 'CF × Vue / Vite 整合传闻 · 待官方确认', highlight: true },
]
