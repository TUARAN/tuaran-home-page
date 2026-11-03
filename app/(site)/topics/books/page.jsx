import TopicHubView, { topicHubJsonLd } from '../TopicHubView'
import { getTopicHub } from '../../../../lib/content/topicHubs'

const hub = getTopicHub('books')
const title = '著作 · 涂阿燃 TUARAN'

export const dynamic = 'force-static'

export const metadata = {
  title,
  description: hub.description,
  keywords: ['涂阿燃', 'TUARAN', '著作', 'AI大模型的底层逻辑', '2aran.com'],
  alternates: { canonical: '/topics/books' },
  openGraph: {
    title,
    description: hub.description,
    url: '/topics/books',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function BooksHubPage() {
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
