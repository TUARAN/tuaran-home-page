import PageContainer from '../../components/PageContainer'
import PublishingCheckinClient from './PublishingCheckinClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '发文打卡 · 每日内容发布记录',
  description: '记录掘金、小红书、X、CSDN 等平台的每日发文完成情况，用月历回看持续发布节奏。',
  alternates: { canonical: '/checkin/publishing' },
  robots: { index: false, follow: false },
}

export default function PublishingCheckinPage() {
  return (
    <PageContainer className="py-5 md:py-10">
      <PublishingCheckinClient />
    </PageContainer>
  )
}
