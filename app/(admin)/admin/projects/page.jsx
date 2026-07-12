import AdminPageGate from '../../components/AdminPageGate'
import ProjectWorkspace from './ProjectWorkspace'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '项目与工程',
  description: '项目治理、本站开发与架构管理。',
  robots: { index: false, follow: false },
}

export default function AdminProjectWorkspacePage() {
  return (
    <AdminPageGate label="项目与工程" returnTo="/admin/projects" description="从项目方向到本站工程交付的统一入口，仅站长本人可见。">
      <ProjectWorkspace />
    </AdminPageGate>
  )
}
