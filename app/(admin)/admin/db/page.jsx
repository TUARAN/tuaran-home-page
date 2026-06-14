import AdminPageGate from '../../components/AdminPageGate'
import DbAdminClient from './DbConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '数据库管理',
  description: 'D1 状态 / 表统计 / 数据量。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminDbPage() {
  return (
    <AdminPageGate
      label="数据库管理"
      returnTo="/admin/db"
      description="Cloudflare D1 数据库状态快照，仅站长本人可见。"
    >
      <DbAdminClient />
    </AdminPageGate>
  )
}
