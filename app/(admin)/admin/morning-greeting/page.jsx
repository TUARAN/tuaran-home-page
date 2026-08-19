import AdminPageGate from '../../components/AdminPageGate'
import MorningGreetingClient from './MorningGreetingClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'X 发布任务',
  description: '手动生成并发布 NAS Qwen AI 资讯，同时管理早安、午安、晚安自动问候。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  return (
    <AdminPageGate
      label="X 发布任务"
      returnTo="/admin/morning-greeting"
      description="管理 NAS Qwen AI 资讯手动发布、问候模板与每日三次 X 自动发布，仅站长本人可见。"
    >
      <MorningGreetingClient />
    </AdminPageGate>
  )
}
