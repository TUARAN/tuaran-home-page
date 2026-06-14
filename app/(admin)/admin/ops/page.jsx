import AdminPageGate from '../../components/AdminPageGate'
import OpsConsoleClient from './OpsConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '自动化控制台',
  description: 'ops.2aran.com 健康检查 / Agent Ops 入口。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminOpsPage() {
  return (
    <AdminPageGate
      label="自动化控制台"
      returnTo="/admin/ops"
      description="外部 Agent Ops 控制台的站内入口，仅站长本人可见。"
    >
      <OpsConsoleClient />
    </AdminPageGate>
  )
}
