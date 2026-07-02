import DiscussionHubClient from './DiscussionHubClient'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '讨论 · TUARAN ｜ 涂阿燃',
  description:
    '涂阿燃站内讨论中心：汇总文章、调研和资源页评论，并连接通知、留言板与社群入口。',
  keywords: ['涂阿燃', 'tuaran', '讨论', '评论', '社群', '通知'],
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
