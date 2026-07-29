import AdminPageGate from '../../components/AdminPageGate'
import ModelDispatchConsole from './ModelDispatchConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI 规划与分派',
  description: '规划中心内的 AI 任务拆解、模型选型与 Agent 分派工具。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminModelDispatchPage() {
  return (
    <AdminPageGate
      label="AI 规划与分派"
      returnTo="/admin/model-dispatch"
      description="规划中心内的 AI 任务拆解、模型选型与 Agent 分派工具，仅站长本人可见。"
    >
      <ModelDispatchConsole />
    </AdminPageGate>
  )
}
