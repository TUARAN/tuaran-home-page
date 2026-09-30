import AdminPageGate from '../../components/AdminPageGate'
import AutomationWorkspace from './AutomationWorkspace'

export const metadata = {
  title: '自动化',
  description: '任务调度、运行观测、自动研究与社交发布。',
  robots: { index: false, follow: false },
}

export default function AdminAutomationPage() {
  return (
    <AdminPageGate label="自动化" returnTo="/admin/automation" description="自动任务、运行观测与内容流水线，仅站长本人可见。">
      <AutomationWorkspace />
    </AdminPageGate>
  )
}
