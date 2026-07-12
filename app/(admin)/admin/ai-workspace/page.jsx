import AdminPageGate from '../../components/AdminPageGate'
import AiWorkspace from './AiWorkspace'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI 协同工作台',
  description: 'AI 任务规划、Agent 分派与调用审计。',
  robots: { index: false, follow: false },
}

export default function AdminAiWorkspacePage() {
  return (
    <AdminPageGate label="AI 协同工作台" returnTo="/admin/ai-workspace" description="AI 任务从规划、分派到调用审计的统一入口，仅站长本人可见。">
      <AiWorkspace />
    </AdminPageGate>
  )
}
