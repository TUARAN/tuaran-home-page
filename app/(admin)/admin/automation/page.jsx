import AdminPageGate from '../../components/AdminPageGate'
import AutomationWorkspace from './AutomationWorkspace'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '自动化',
  description: '自动任务、内容流水线、模型服务与运行审计。',
  robots: { index: false, follow: false },
}

export default function AdminAutomationPage() {
  return (
    <AdminPageGate label="自动化" returnTo="/admin/automation" description="自动任务、模型服务与运行审计，仅站长本人可见。">
      <AutomationWorkspace />
    </AdminPageGate>
  )
}
