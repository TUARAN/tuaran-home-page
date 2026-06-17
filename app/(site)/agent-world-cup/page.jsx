import AgentWorldCupClient from './AgentWorldCupClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Agent世界杯 · 2026 FIFA World Cup',
  description:
    '2026 FIFA世界杯赛程、分组、场馆与资讯 — 48队·104场·16城 · 美国·加拿大·墨西哥',
  keywords: [
    '2026世界杯',
    'FIFA World Cup',
    '世界杯赛程',
    '世界杯分组',
    'Agent世界杯',
  ],
  alternates: { canonical: '/agent-world-cup' },
}

export default function AgentWorldCupPage() {
  return <AgentWorldCupClient />
}