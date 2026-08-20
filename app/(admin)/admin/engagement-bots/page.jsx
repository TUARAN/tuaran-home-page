import AdminPageGate from '../../components/AdminPageGate'
import EngagementBotsClient from './EngagementBotsClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '路过互动',
  description: '管理人设、随机点赞、DeepSeek 评论与运行记录。',
  robots: { index: false, follow: false },
}

export default function EngagementBotsAdminPage() {
  return (
    <AdminPageGate
      label="路过互动"
      returnTo="/admin/engagement-bots"
      description="管理路过读者人设、随机点赞与 DeepSeek 评论。仅站长本人可见。"
    >
      <EngagementBotsClient />
    </AdminPageGate>
  )
}
