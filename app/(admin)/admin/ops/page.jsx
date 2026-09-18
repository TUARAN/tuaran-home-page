import AdminPageGate from '../../components/AdminPageGate'
import OpsConsoleClient from './OpsConsole'

export const metadata = {
  title: '自动化台账',
  description: '云端与本地自动化列表，仅站长本人可访问。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminOpsPage() {
  return (
    <AdminPageGate
      label="自动化台账"
      returnTo="/admin/ops"
      description="云端与本地自动化列表，仅站长本人可见。"
    >
      <OpsConsoleClient />
    </AdminPageGate>
  )
}
