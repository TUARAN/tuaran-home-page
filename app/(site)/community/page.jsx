import DiscussionHubClient from './DiscussionHubClient'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '讨论',
  description:
    '涂阿燃站内讨论与圈子中心：统一收纳留言、文章评论、回复通知、社群入口和专题圈子。',
  keywords: ['涂阿燃', 'tuaran', '讨论', '留言', '评论', '社群', '专题圈子', '通知'],
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
    <PageContainer className="py-3 md:py-10">
      <DiscussionHubClient />
    </PageContainer>
  )
}
