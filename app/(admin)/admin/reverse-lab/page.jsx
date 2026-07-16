import AdminPageGate from '../../components/AdminPageGate'
import ReverseLabClient from './ReverseLabClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '逆向测试',
  description: '安全、可复盘的逆向学习路线、基础实验与知识测试。',
  robots: { index: false, follow: false },
}

export default function AdminReverseLabPage() {
  return (
    <AdminPageGate
      label="逆向测试"
      returnTo="/admin/reverse-lab"
      description="仅用于自有或明确授权样本的学习与测试，仅站长本人可见。"
    >
      <ReverseLabClient />
    </AdminPageGate>
  )
}
