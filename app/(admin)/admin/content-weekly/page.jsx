import AdminPageGate from '../../components/AdminPageGate'
import ContentWeeklyClient from './ContentWeeklyClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '阅读分析',
  description: '自建阅读统计：调研 / 资料 / 灵感被读 / 被赞 top、周趋势与月统计,仅站长本人可访问。',
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
      description="自建阅读统计：调研 / 资料 / 灵感被读 / 被赞 top、周趋势与月统计,仅站长本人可见。"
    >
      <ContentWeeklyClient />
    </AdminPageGate>
  )
}
