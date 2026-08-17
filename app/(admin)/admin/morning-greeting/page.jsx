import AdminPageGate from '../../components/AdminPageGate'
import MorningGreetingClient from './MorningGreetingClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'X 每日问候自动化',
  description: '早安、午安、晚安文案模板管理：每天三个时段各随机发布一条。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  return (
    <AdminPageGate
      label="X 每日问候自动化"
      returnTo="/admin/morning-greeting"
      description="管理早安、午安、晚安模板与每日三次 X 发布，仅站长本人可见。"
    >
      <MorningGreetingClient />
    </AdminPageGate>
  )
}
