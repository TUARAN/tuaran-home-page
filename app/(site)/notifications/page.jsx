import PageContainer from '../components/PageContainer'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '通知中心',
  description: '集中查看评论回复、点赞等站内通知，并跳回原内容位置。',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/notifications',
  },
}

export default function NotificationsPage() {
  return (
    <PageContainer width="narrow" className="py-8 md:py-10">
      <NotificationsClient />
    </PageContainer>
  )
}
