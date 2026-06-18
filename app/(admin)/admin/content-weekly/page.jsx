import AdminPageGate from '../../components/AdminPageGate'
import ContentWeeklyClient from './ContentWeeklyClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '内容数据周报',
  description: '近 7 天站内被读/被赞 top 与趋势,仅站长本人可访问。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminContentWeeklyPage() {
  return (
    <AdminPageGate
      label="内容数据周报"
      returnTo="/admin/content-weekly"
      description="近 7 天站内被读/被赞 top 与趋势,仅站长本人可见。"
    >
      <ContentWeeklyClient />
    </AdminPageGate>
  )
}
