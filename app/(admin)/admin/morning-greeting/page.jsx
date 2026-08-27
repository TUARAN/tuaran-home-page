import AdminPageGate from '../../components/AdminPageGate'
import MorningGreetingClient from './MorningGreetingClient'

export const metadata = {
  title: 'X 发布任务',
  description: '管理全自动发布的每日问候、社区内容、加密观点和美区英文帖。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  return (
    <AdminPageGate
      label="X 发布任务"
      returnTo="/admin/morning-greeting"
      description="管理每日问候、朋友图文、文化短故事、加密观点和美区英文帖的全自动发布，仅站长本人可见。"
    >
      <MorningGreetingClient />
    </AdminPageGate>
  )
}
