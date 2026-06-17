import AgentWorldCupClient from './AgentWorldCupClient'

// 客户端组件:用 fetch('/api/wc/data') 拉数据,本身不需要 Edge runtime。
// 但 Cloudflare Pages 强制所有非静态路由声明 edge runtime。
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Agent世界杯 · 2026 FIFA World Cup',
  description:
    '2026 FIFA世界杯赛程、积分榜、射手榜、助攻榜、红黄牌 · 48队·104场·16城 · 美国·加拿大·墨西哥 · 数据每 3 小时自动同步',
  keywords: [
    '2026世界杯',
    'FIFA World Cup',
    '世界杯赛程',
    '世界杯积分榜',
    '世界杯射手榜',
    '世界杯助攻榜',
    'Agent世界杯',
  ],
  alternates: { canonical: '/agent-world-cup' },
}

export default function AgentWorldCupPage() {
  return <AgentWorldCupClient />
}
