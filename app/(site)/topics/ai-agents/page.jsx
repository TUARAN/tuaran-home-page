import TopicHubView, { topicHubJsonLd } from '../TopicHubView'
import { getTopicHub } from '../../../../lib/content/topicHubs'

const hub = getTopicHub('ai-agents')
const title = 'AI 智能体 · 涂阿燃 TUARAN'

export const dynamic = 'force-static'

export const metadata = {
  title,
  description: hub.description,
  keywords: ['涂阿燃', 'TUARAN', 'AI 智能体', 'OpenClaw', '2aran.com'],
  alternates: { canonical: '/topics/ai-agents' },
  openGraph: {
    title,
    description: hub.description,
    url: '/topics/ai-agents',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function AiAgentsHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(topicHubJsonLd(hub)).replace(/</g, '\\u003c') }}
      />
      <TopicHubView hub={hub} />
    </>
  )
}
