import TopicHubView, { topicHubJsonLd } from '../TopicHubView'
import { getTopicHub } from '../../../../lib/content/topicHubs'

const hub = getTopicHub('openclaw')
const title = 'OpenClaw · 涂阿燃 TUARAN'

export const dynamic = 'force-static'

export const metadata = {
  title,
  description: hub.description,
  keywords: ['涂阿燃', 'TUARAN', 'OpenClaw', '2aran.com'],
  alternates: { canonical: '/topics/openclaw' },
  openGraph: {
    title,
    description: hub.description,
    url: '/topics/openclaw',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function OpenClawHubPage() {
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
