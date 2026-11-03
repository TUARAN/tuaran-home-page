import TopicHubView, { topicHubJsonLd } from '../TopicHubView'
import { getTopicHub } from '../../../../lib/content/topicHubs'

const hub = getTopicHub('editorial')
const title = '内容说明 · 涂阿燃 TUARAN'

export const dynamic = 'force-static'

export const metadata = {
  title,
  description: hub.description,
  keywords: ['涂阿燃', 'TUARAN', '内容说明', '更正', '2aran.com'],
  alternates: { canonical: '/topics/editorial' },
  openGraph: {
    title,
    description: hub.description,
    url: '/topics/editorial',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function EditorialHubPage() {
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
