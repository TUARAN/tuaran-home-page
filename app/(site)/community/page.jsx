import DiscussionHubClient from './DiscussionHubClient'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '讨论',
  description:
    '涂阿燃站内讨论中心：统一收纳留言、文章评论、回复通知与社群入口。',
  keywords: ['涂阿燃', 'tuaran', '讨论', '留言', '评论', '社群', '通知'],
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
    <PageContainer className="py-8 md:py-10">
      <DiscussionHubClient />
    </PageContainer>
  )
}
