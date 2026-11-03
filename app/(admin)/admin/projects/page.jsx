import AdminPageGate from '../../components/AdminPageGate'
import ProjectWorkspace from './ProjectWorkspace'

export const metadata = {
  title: '工程与运维',
  description: '规划交付、站点配置、现场运行与检查验证。',
  robots: { index: false, follow: false },
}

export default function AdminProjectWorkspacePage() {
  return (
    <AdminPageGate label="工程与运维" returnTo="/admin/projects" description="从项目规划、站点配置到现场运行和检查验证的统一入口，仅站长本人可见。">
      <ProjectWorkspace />
    </AdminPageGate>
  )
}
