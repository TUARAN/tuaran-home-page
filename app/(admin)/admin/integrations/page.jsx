import AdminPageGate from '../../components/AdminPageGate'
import IntegrationsClient from './IntegrationsClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '集成与 API Keys',
  description: '统一登记外部服务凭证、Webhook 与定时任务。',
  robots: { index: false, follow: false },
}

export default function AdminIntegrationsPage() {
  return (
    <AdminPageGate
      label="集成与 API Keys"
      returnTo="/admin/integrations"
      description="统一登记外部服务凭证、Webhook 与定时任务，仅站长本人可见。"
    >
      <IntegrationsClient />
    </AdminPageGate>
  )
}
