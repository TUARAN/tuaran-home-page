import AdminPageGate from '../../components/AdminPageGate'
import ProjectWorkspace from './ProjectWorkspace'

export const metadata = {
  title: '工程与运维',
  description: '项目管理、研发建设、运行保障、配置安全与工程实验。',
  robots: { index: false, follow: false },
}

export default function AdminProjectWorkspacePage() {
  return (
    <AdminPageGate label="工程与运维" returnTo="/admin/projects" description="从项目规划、工程交付到站点运行和持续治理的统一入口，仅站长本人可见。">
      <ProjectWorkspace />
    </AdminPageGate>
  )
}
