import AgentWorldCupClient from '../../agent-world-cup/AgentWorldCupClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Agent 世界杯 2026 · 活动存档',
  description: 'Agent 世界杯 2026 活动存档：保留赛事赛程、分组、积分榜与排行榜的最后采集结果。',
  alternates: { canonical: '/archives/agent-world-cup' },
  robots: { index: false, follow: true },
}

export default function AgentWorldCupArchivePage() {
  return <AgentWorldCupClient archived />
}
