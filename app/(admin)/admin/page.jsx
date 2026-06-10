import AdminPageGate from '../components/AdminPageGate'
import AdminDashboardClient from './AdminDashboardClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '后台总览',
  description: '2aran.com 站长控制台统一入口。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminDashboardPage() {
  return (
    <AdminPageGate
      label="后台总览"
      returnTo="/admin"
      description="站长后台控制台，仅本人可见。聚合 D1 健康、Agent Ops 探活与各管理台入口。"
    >
      <AdminDashboardClient />
    </AdminPageGate>
  )
}
