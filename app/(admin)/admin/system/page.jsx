import AdminPageGate from '../../components/AdminPageGate'
import SystemOperations from './SystemOperations'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '站点运维',
  description: '数据健康与自动化运行管理。',
  robots: { index: false, follow: false },
}

export default function AdminSystemOperationsPage() {
  return (
    <AdminPageGate label="站点运维" returnTo="/admin/system" description="查看数据健康、站点配置与治理状态，仅站长本人可见。">
      <SystemOperations />
    </AdminPageGate>
  )
}
