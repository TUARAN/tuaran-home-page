import AdminPageGate from '../../components/AdminPageGate'
import ContentWeeklyClient from './ContentWeeklyClient'

export const metadata = {
  title: '阅读分析',
  description: '多维阅读分析：今日排行、读者与游客、来源归因、内容表现及 7/30/90 天趋势，仅站长本人可访问。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminContentWeeklyPage() {
  return (
    <AdminPageGate
      label="阅读分析"
      returnTo="/admin/content-weekly"
      description="按今日、7 天、30 天和 90 天查看内容、读者与来源，仅站长本人可见。"
    >
      <ContentWeeklyClient />
    </AdminPageGate>
  )
}
