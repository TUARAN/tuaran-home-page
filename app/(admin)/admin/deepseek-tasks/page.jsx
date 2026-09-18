import AdminPageGate from '../../components/AdminPageGate'
import DeepSeekTasksClient from './DeepSeekTasksClient'

export const metadata = {
  title: '模型服务',
  description: '管理 DeepSeek 密钥与 NAS Ollama 服务。',
  robots: { index: false, follow: false },
}

export default function AdminDeepSeekTasksPage() {
  return (
    <AdminPageGate
      label="模型服务"
      returnTo="/admin/deepseek-tasks"
      description="管理 DeepSeek 密钥与 NAS Ollama 服务，仅站长本人可见。"
    >
      <DeepSeekTasksClient />
    </AdminPageGate>
  )
}
