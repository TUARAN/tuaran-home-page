import AdminPageGate from '../../components/AdminPageGate'
import SystemOperations from './SystemOperations'

export const metadata = {
  title: '工程与运维',
  description: '旧站点运维入口，内容已合并到工程与运维。',
  robots: { index: false, follow: false },
}

export default function AdminSystemOperationsPage() {
  return (
    <AdminPageGate label="工程与运维" returnTo="/admin/projects" description="项目规划、工程交付与站点运行的统一入口，仅站长本人可见。">
      <SystemOperations />
    </AdminPageGate>
  )
}
