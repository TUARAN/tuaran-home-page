import AdminPageGate from '../../components/AdminPageGate'
import MorningGreetingClient from './MorningGreetingClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'X 每日问候自动化',
  description: '管理早安、午安、晚安的模板库与 DeepSeek Flash 意图生成，每天三个时段各发布一条。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  return (
    <AdminPageGate
      label="X 每日问候自动化"
      returnTo="/admin/morning-greeting"
      description="管理模板库、LLM 意图与每日三次 X 发布，仅站长本人可见。"
    >
      <MorningGreetingClient />
    </AdminPageGate>
  )
}
