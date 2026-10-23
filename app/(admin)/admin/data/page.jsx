import AdminPageGate from '../../components/AdminPageGate'
import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/admin/adminRoutes'

export const metadata = {
  title: '数据',
  description: '访问与互动统计、数据库状态与表体检。',
  robots: { index: false, follow: false },
}

export default function AdminDataPage() {
  return (
    <AdminPageGate label="数据" returnTo="/admin/data" description="查看站点统计与数据库状态，仅站长本人可见。">
      <WorkspaceHub {...getWorkspaceHubProps('/admin/data')} />
    </AdminPageGate>
  )
}
