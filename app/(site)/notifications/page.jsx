import PageContainer from '../components/PageContainer'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '通知中心',
  description: '查看回复、点赞、订阅和监控提醒，并跳到对应评论、内容、订阅源或运维台。',
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
