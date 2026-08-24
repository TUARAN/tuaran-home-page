import AdminPageGate from '../../components/AdminPageGate'
import MorningGreetingClient from './MorningGreetingClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'X 发布任务',
  description: '管理自动发布的每日问候、文化短故事和 X 长文章。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  return (
    <AdminPageGate
      label="X 发布任务"
      returnTo="/admin/morning-greeting"
      description="管理每日问候、文化短故事和 X 长文章自动发布，仅站长本人可见。"
    >
      <MorningGreetingClient />
    </AdminPageGate>
  )
}
