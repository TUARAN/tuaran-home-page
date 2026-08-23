import AdminPageGate from '../../components/AdminPageGate'
import DeepSeekTasksClient from './DeepSeekTasksClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '模型管理',
  description: '云调用、本地 Mac → NAS Qwen 调用与统一记录审计。',
  robots: { index: false, follow: false },
}

export default function AdminDeepSeekTasksPage() {
  return (
    <AdminPageGate
      label="模型管理"
      returnTo="/admin/deepseek-tasks"
      description="云调用、本地 Mac → NAS Qwen 调用与统一记录审计，仅站长本人可见。"
    >
      <DeepSeekTasksClient />
    </AdminPageGate>
  )
}
