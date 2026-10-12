import AdminPageGate from '../../components/AdminPageGate'
import CommunityActionsClient from './CommunityActionsClient'

export const metadata = {
  title: '社区动作',
  description: '查看 X 和小红书高频助手的在线状态与动作回执。',
  robots: { index: false, follow: false },
}

export default function CommunityActionsPage() {
  return (
    <AdminPageGate
      label="社区动作"
      returnTo="/admin/community-actions"
      description="收集 X 与小红书高频助手的动作回执。仅站长本人可见。"
    >
      <CommunityActionsClient />
    </AdminPageGate>
  )
}
