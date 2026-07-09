import AdminPageGate from '../../components/AdminPageGate'
import LongCompassAdminTabs from './LongCompassAdminTabs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '私域与分享',
  description: '长期罗盘强私密 + 加密分享分发入口。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminLongCompassPage() {
  return (
    <AdminPageGate
      label="私域与分享"
      returnTo="/admin/long-compass"
      description="一个入口同时管理长期罗盘强私密内容和加密分享分发内容，仅站长本人可见。"
    >
      <LongCompassAdminTabs />
    </AdminPageGate>
  )
}
