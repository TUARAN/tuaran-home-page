import AdminPageGate from '../../components/AdminPageGate'
import XReplyTasksClient from './XReplyTasksClient'

export const metadata = {
  title: 'X 回复任务',
  description: '创建、复核并发布符合 X 自动化规则的回复任务。',
  robots: { index: false, follow: false },
}

export default function XReplyTasksPage() {
  return (
    <AdminPageGate
      label="X 回复任务"
      returnTo="/admin/x-replies"
      description="回复必须经过人工确认；短句库和模型只生成草稿，不会自动发布。"
    >
      <XReplyTasksClient />
    </AdminPageGate>
  )
}
