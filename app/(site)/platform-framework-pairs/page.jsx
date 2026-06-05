import PlatformFrameworkPairsClient from './PlatformFrameworkPairsClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '平台 × 前端框架捆绑配对调研',
  description:
    '10 组「平台 × 框架」配对的可视化对照：从 Vercel × Next.js 到 Cloudflare × Vue 的捆绑深度、社区反弹、AI 整合度与生命周期状态。基于公开信号 + 主观打分，不构成投资建议。',
  alternates: {
    canonical: '/platform-framework-pairs',
  },
}

export default function PlatformFrameworkPairsPage() {
  return <PlatformFrameworkPairsClient />
}
