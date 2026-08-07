import AdminPageGate from '../../components/AdminPageGate'
import MorningGreetingClient from './MorningGreetingClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '推特问早自动化',
  description: '早安文案模板管理：每天按日期随机选一条发布到 X。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  return (
    <AdminPageGate
      label="推特问早自动化"
      returnTo="/admin/morning-greeting"
      description="管理早安文案模板，每天按日期随机选一条发布到 X，仅站长本人可见。"
    >
      <MorningGreetingClient />
    </AdminPageGate>
  )
}
