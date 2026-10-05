import PageContainer from '../components/PageContainer'
import NotificationsClient from '../notifications/NotificationsClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '消息',
  description: '查看与你有关的回复、评论和点赞，并回到对应内容继续交流。',
  robots: { index: false, follow: false },
  alternates: { canonical: '/messages' },
}

export default function MessagesPage() {
  return (
    <PageContainer width="narrow" className="py-8 md:py-10">
      <NotificationsClient />
    </PageContainer>
  )
}
