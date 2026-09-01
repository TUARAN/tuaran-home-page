import AdminPageGate from '../../components/AdminPageGate'
import ContentWeeklyClient from './ContentWeeklyClient'

export const metadata = {
  title: '数据统计',
  description: '集中查看 Umami 站点访问、自建有效阅读与 Cloudflare 边缘流量，并按统一时间窗解释统计差异。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminContentWeeklyPage() {
  return (
    <AdminPageGate
      label="数据统计"
      returnTo="/admin/content-weekly"
      description="按今日、7 天、30 天和 90 天查看站点访问、有效阅读与边缘流量，仅站长本人可见。"
    >
      <ContentWeeklyClient />
    </AdminPageGate>
  )
}
