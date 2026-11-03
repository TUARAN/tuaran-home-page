import TopicHubView, { topicHubJsonLd } from '../TopicHubView'
import { getTopicHub } from '../../../../lib/content/topicHubs'

const hub = getTopicHub('frontend-cloud')

export const dynamic = 'force-static'

export const metadata = {
  title: '前端与云工程 · 涂阿燃 TUARAN',
  description: hub.description,
  keywords: ['涂阿燃', 'TUARAN', '前端工程', 'Cloudflare', 'Next.js', '2aran.com'],
  alternates: { canonical: '/topics/frontend-cloud' },
  openGraph: {
    title: '前端与云工程 · 涂阿燃 TUARAN',
    description: hub.description,
    url: '/topics/frontend-cloud',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function FrontendCloudHubPage() {
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
