import AdminPageGate from '../../components/AdminPageGate'
import AiWorkspace from './AiWorkspace'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI 执行工作台',
  description: '自动化运行、Agent 执行与调用审计。',
  robots: { index: false, follow: false },
}

export default function AdminAiWorkspacePage() {
  return (
    <AdminPageGate label="AI 执行工作台" returnTo="/admin/ai-workspace" description="承接规划中心输出的任务，统一跟进自动化运行与调用审计，仅站长本人可见。">
      <AiWorkspace />
    </AdminPageGate>
  )
}
