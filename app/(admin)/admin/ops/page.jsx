import AdminPageGate from '../../components/AdminPageGate'
import OpsConsoleClient from './OpsConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '自动化控制台',
  description: '站内自动化控制台，仅站长本人可访问。',
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
      description="站内自动化控制台，仅站长本人可见。"
    >
      <OpsConsoleClient />
    </AdminPageGate>
  )
}
