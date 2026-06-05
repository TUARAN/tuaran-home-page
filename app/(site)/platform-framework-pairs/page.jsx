import PlatformFrameworkPairsClient from './PlatformFrameworkPairsClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Cloudflare 收购 VoidZero vs Vercel 收购 Next：双巨头割据前端、AI 原生 Web 时代产业深度研判',
  description:
    '2026-06-04 Cloudflare 正式收购 VoidZero（Vite / Vitest / Rolldown / Oxc 背后公司），与 Vercel × Next 形成对称力量。包含 10 节研报框架 + 10 组「平台 × 框架」捆绑配对的多维数据可视化（捆绑深度 / 社区反弹 / AI 整合度 / 生命周期）。',
  alternates: {
    canonical: '/platform-framework-pairs',
  },
}

export default function PlatformFrameworkPairsPage() {
  return <PlatformFrameworkPairsClient />
}
