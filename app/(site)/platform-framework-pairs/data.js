// 平台 × 前端框架捆绑配对调研
//
// 口径说明：
//  - frameworkStars：代表性框架在 GitHub 的 stars 估算（单位：千），取近年公开值的近似
//  - platformTier：平台商业体量分级（1=个人/小团队，3=focused 平台，5=超大云）
//      tier 1 (~10)   非商业 / 早期
//      tier 2 (~100)  小规模 ARR
//      tier 3 (~1000) focused 平台
//      tier 4 (~10k)  significant cloud business
//      tier 5 (~100k) hyperscaler
//  - lockIn / backlash / aiIntegration：主观打分 0–100，按下述 rubric
//      lockIn：0 = 框架在哪都跑得一样好；100 = 离开平台无法用核心特性
//      backlash：0 = 社区无怨言；100 = 公开 fork 或大规模迁离运动
//      aiIntegration：0 = 平台无 AI 整合；100 = 框架原生暴露 AI SDK / Agents
//  - verified：true = 有 CF/SEC/官方公告或一手财报；false = 传闻 / 估算 / 推断
//  - status：active / forming（关系正在建立）/ historical（绑定已松动）/ neutral（明确不绑）
//
// 所有 ARR / 收入数字均为公开报道与社区估算的范围，非审计数字。
// 主观打分由作者基于 2024-2026 公开信号判断，请勿作为投资 / 战略决策依据。

export const PAIRS = [
  {
    id: 'vercel-nextjs',
    platform: 'Vercel',
    framework: 'Next.js',
    color: '#1d1d1d',
    status: 'active',
    verified: true,
    foundedPairing: 2016,
    frameworkStars: 130,
    platformTier: 3,
    lockIn: 88,
    backlash: 75,
    aiIntegration: 92,
    primaryLockIn: 'ISR / Image Optimization / Fluid Compute / RSC 调度',
    latestSignal: '2025 Fluid Compute 仅在 Vercel 完整工作，OpenNext fork 持续维护',
    developerNote: '默认部署到 Vercel 才能拿到所有新特性；想跑别处先评估「特性差距」',
    competitorNote: '其它平台必须靠 OpenNext / next-on-pages 追，永远晚 1–2 个版本',
    sourceUrl: 'https://vercel.com/blog',
  },
  {
    id: 'cloudflare-vue',
    platform: 'Cloudflare',
    framework: 'Vite / Vue / Nuxt',
    color: '#f6821f',
    status: 'active',
    verified: true,
    foundedPairing: 2026,
    frameworkStars: 207,
    platformTier: 4,
    lockIn: 30,
    backlash: 10,
    aiIntegration: 88,
    primaryLockIn: 'Vite / Vitest / Rolldown / Oxc 原生进 Workers 平台；vite deploy → 全球生产一键',
    latestSignal: '2026-06-04 CF 正式收购 VoidZero，Evan You 团队入 ETI；MIT 开源 + $1M 独立 Vite 生态基金',
    developerNote: '官方承诺 vendor-agnostic + 独立基金；但 deploy 默认体验会自然把流量引向 CF。先观察 12 个月再下结论',
    competitorNote: 'Vercel 锁 React，CF 直接拿下 JS 工具链上游（每周 1 亿次 Vite 下载）；Vue 只是顺带',
    sourceUrl: 'https://blog.cloudflare.com/voidzero-joins-cloudflare/',
  },
  {
    id: 'netlify-astro',
    platform: 'Netlify',
    framework: 'Astro',
    color: '#00ad9f',
    status: 'active',
    verified: true,
    foundedPairing: 2022,
    frameworkStars: 47,
    platformTier: 2,
    lockIn: 30,
    backlash: 15,
    aiIntegration: 45,
    primaryLockIn: 'Netlify Edge Functions / Build Plugins / DevCycle 整合',
    latestSignal: '2024 Netlify 收购 Stackbit + DevCycle，深度整合 Astro 工作流',
    developerNote: 'Astro 故意保持中立，Netlify 提供最佳开箱体验，但其它平台也跑得动',
    competitorNote: '在 Vercel / CF 的夹缝中靠 Astro 与 islands 架构差异化',
    sourceUrl: 'https://www.netlify.com/blog/',
  },
  {
    id: 'aws-amplify',
    platform: 'AWS',
    framework: 'Amplify (Gen 2)',
    color: '#ff9900',
    status: 'active',
    verified: true,
    foundedPairing: 2017,
    frameworkStars: 12,
    platformTier: 5,
    lockIn: 70,
    backlash: 55,
    aiIntegration: 80,
    primaryLockIn: 'AppSync / Cognito / DataStore / Bedrock 绑定',
    latestSignal: '2024 Amplify Gen 2 GA，Gen 1 → Gen 2 迁移痛点持续',
    developerNote: '一旦深度用 Amplify，迁出 AWS 几乎不可能；规划期就要决定要不要上车',
    competitorNote: '其它云对应位置：Azure Static Web Apps / Firebase Hosting',
    sourceUrl: 'https://aws.amazon.com/amplify/',
  },
  {
    id: 'microsoft-blazor',
    platform: 'Microsoft Azure',
    framework: 'Blazor',
    color: '#5c2d91',
    status: 'active',
    verified: true,
    foundedPairing: 2018,
    frameworkStars: 33,
    platformTier: 5,
    lockIn: 65,
    backlash: 20,
    aiIntegration: 80,
    primaryLockIn: '.NET 生态 + Azure App Service + Copilot 整合',
    latestSignal: '2024 Blazor United 预览 + .NET 9，AOT 编译大幅改善体积',
    developerNote: '只在 .NET 体系内有价值；非 .NET 团队基本不会考虑',
    competitorNote: '与主流 JS 框架不直接竞争，靠企业 .NET 存量市场守土',
    sourceUrl: 'https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor',
  },
  {
    id: 'google-angular',
    platform: 'Google Cloud',
    framework: 'Angular',
    color: '#dd1b16',
    status: 'historical',
    verified: true,
    foundedPairing: 2010,
    frameworkStars: 96,
    platformTier: 5,
    lockIn: 25,
    backlash: 35,
    aiIntegration: 55,
    primaryLockIn: 'Firebase / Vertex AI 整合，框架本身已脱钩平台',
    latestSignal: '2024 Angular v18，"Angular Renaissance"叙事，但增长仍慢于 React/Vue',
    developerNote: '企业内残留大量 Angular 项目，新项目首选率持续下降',
    competitorNote: 'Google 内部已不再把 Angular 作为云推广抓手',
    sourceUrl: 'https://angular.dev/',
  },
  {
    id: 'meta-react',
    platform: 'Meta（无商业平台）',
    framework: 'React',
    color: '#61dafb',
    status: 'neutral',
    verified: true,
    foundedPairing: 2013,
    frameworkStars: 240,
    platformTier: 1,
    lockIn: 0,
    backlash: 25,
    aiIntegration: 30,
    primaryLockIn: '无（Meta 不卖云）；RSC 设计被 Vercel 实际推动',
    latestSignal: 'React 19 RC，RSC 路线由 Vercel 主导，社区担忧治理倾向',
    developerNote: 'React 本体无平台绑定，但 Next.js + Vercel 间接代理了治理',
    competitorNote: 'Meta 没有云业务可绑定，护城河靠生态而非锁定',
    sourceUrl: 'https://react.dev/',
  },
  {
    id: 'deno-fresh',
    platform: 'Deno Deploy',
    framework: 'Fresh',
    color: '#000000',
    status: 'active',
    verified: true,
    foundedPairing: 2022,
    frameworkStars: 13,
    platformTier: 2,
    lockIn: 80,
    backlash: 10,
    aiIntegration: 50,
    primaryLockIn: 'Deno runtime + KV + 全栈一体化默认',
    latestSignal: '2024 Deno 2.0 + Fresh 2 Alpha，向 Node 兼容大幅靠拢',
    developerNote: 'Fresh 离开 Deno 几乎没意义；上车前先确认 Deno 长期投入',
    competitorNote: 'Deno 公司体量小，与 CF / Vercel 比仍处早期',
    sourceUrl: 'https://fresh.deno.dev/',
  },
  {
    id: 'bun-elysia',
    platform: 'Bun（runtime）',
    framework: 'Elysia / Hono',
    color: '#fbf0df',
    status: 'forming',
    verified: true,
    foundedPairing: 2023,
    frameworkStars: 12,
    platformTier: 1,
    lockIn: 70,
    backlash: 10,
    aiIntegration: 35,
    primaryLockIn: 'Bun-only API（Bun.serve / FFI / sqlite）+ 启动速度优势',
    latestSignal: '2024 Bun 1.1 + Elysia 1.0，类型推导与 OpenAPI 集成做到极致',
    developerNote: 'Bun runtime 押注没错就跟着上；担心 runtime 单押风险就用 Hono（跨 runtime）',
    competitorNote: '没有平台支撑，靠 runtime 性能差异化；商业化路径未明',
    sourceUrl: 'https://elysiajs.com/',
  },
  {
    id: 'supabase-neutral',
    platform: 'Supabase',
    framework: '无独占（刻意中立）',
    color: '#3ecf8e',
    status: 'neutral',
    verified: true,
    foundedPairing: 2020,
    frameworkStars: 0,
    platformTier: 2,
    lockIn: 10,
    backlash: 5,
    aiIntegration: 75,
    primaryLockIn: 'Postgres + pgvector + Auth + RLS（PG 体系，可迁移）',
    latestSignal: '2024 Supabase AI Toolkit 强推，pgvector 成 RAG 默认存储',
    developerNote: '反例：明确不绑框架，靠开源 Postgres 兼容性换迁移自由',
    competitorNote: '与 Vercel × Next 的相反策略；适合不想被框架锁定的团队',
    sourceUrl: 'https://supabase.com/blog',
  },
]

export const STATUS_META = {
  active: { label: '现役绑定', tone: 'violet', color: '#7558c9' },
  forming: { label: '形成中', tone: 'amber', color: '#c8902b' },
  historical: { label: '历史绑定（已松动）', tone: 'slate', color: '#7d8597' },
  neutral: { label: '明确中立', tone: 'emerald', color: '#3f8a64' },
}

export const STATUS_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'active', label: '现役绑定' },
  { id: 'forming', label: '形成中' },
  { id: 'historical', label: '历史' },
  { id: 'neutral', label: '中立' },
]

// 主观 vs 实测 字段分类
export const METRIC_KIND = {
  frameworkStars: 'measured',
  platformTier: 'measured',
  lockIn: 'subjective',
  backlash: 'subjective',
  aiIntegration: 'subjective',
}

// 评分 rubric 描述，渲染在 footer 与 detail panel
export const SCORING_RUBRIC = {
  lockIn: '0 = 框架在任何平台跑得一样好；100 = 离开该平台几乎无法使用核心特性。',
  backlash: '0 = 社区无怨言；50 = 公开讨论 / 评测频繁批评；100 = 出现 fork 或迁离运动。',
  aiIntegration: '0 = 平台无 AI 产品；50 = 平台 AI 可用但需自接；100 = 框架原生暴露 AI SDK / Agents。',
}

export const TOTALS = {
  pairs: 10,
  source: '公开新闻 + GitHub 数据 + 社区估算（2024–2026）',
}
