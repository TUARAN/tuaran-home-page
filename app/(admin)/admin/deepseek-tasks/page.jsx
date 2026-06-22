import AdminPageGate from '../../components/AdminPageGate'
import DeepSeekTasksClient from './DeepSeekTasksClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'LLM API 任务管理',
  description: 'LLM API 调用记录、规划审阅与运行状态管理。',
  robots: { index: false, follow: false },
}

export default function AdminDeepSeekTasksPage() {
  return (
    <AdminPageGate
      label="LLM API 任务管理"
      returnTo="/admin/deepseek-tasks"
      description="LLM API 调用记录、规划审阅与运行状态管理，仅站长本人可见。"
    >
      <DeepSeekTasksClient />
    </AdminPageGate>
  )
}
