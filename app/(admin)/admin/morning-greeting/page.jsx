import AdminPageGate from '../../components/AdminPageGate'
import MorningGreetingClient from './MorningGreetingClient'

export const metadata = {
  title: 'X 发布任务',
  description: '管理每日 5 条早午安和互关交友帖。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  return (
    <AdminPageGate
      label="X 发布任务"
      returnTo="/admin/morning-greeting"
      description="管理每日早午安、互关交友和蓝 V 交流的自动发布，仅站长本人可见。"
    >
      <MorningGreetingClient />
    </AdminPageGate>
  )
}
