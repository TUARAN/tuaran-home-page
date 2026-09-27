import DiscussionHubClient from './DiscussionHubClient'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '讨论中心',
  description:
    '涂阿燃站内讨论中心：查看公开留言、文章评论与活跃讨论。',
  keywords: ['涂阿燃', 'tuaran', '讨论', '留言', '文章评论'],
  alternates: {
    canonical: '/community',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function CommunityPage() {
  return (
    <PageContainer className="py-4 md:py-10">
      <DiscussionHubClient />
    </PageContainer>
  )
}
