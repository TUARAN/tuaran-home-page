import { notFound } from 'next/navigation'

import {
  TEMPLATE_COMMUNITY_TOPICS,
  getCommunityTopicBySlug,
} from '../../../../lib/communityTopics'
import CircleTopicPage from '../CircleTopicPage'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return TEMPLATE_COMMUNITY_TOPICS.map((topic) => ({ slug: topic.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const topic = getCommunityTopicBySlug(slug)
  if (!topic) return { title: '圈子未找到' }

  return {
    title: topic.label,
    description: topic.desc,
    keywords: [topic.label, topic.eyebrow, '创作者社群', '内容互助', '创作圈子'],
    alternates: { canonical: topic.href },
    openGraph: {
      title: topic.label,
      description: topic.desc,
      url: `https://2aran.com${topic.href}`,
      type: 'website',
    },
  }
}

export default async function CommunityTopicRoute({ params }) {
  const { slug } = await params
  const topic = getCommunityTopicBySlug(slug)
  if (!topic) notFound()

  return <CircleTopicPage topic={topic} />
}
