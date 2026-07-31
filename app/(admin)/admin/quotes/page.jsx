import AdminPageGate from '../../components/AdminPageGate'
import QuotesConsole from './QuotesConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '名言管理',
  description: '管理统一内容目录随机展示的短名言。',
  robots: { index: false, follow: false },
}

export default function QuotesAdminPage() {
  return (
    <AdminPageGate
      label="名言管理"
      returnTo="/admin/quotes"
      description="管理公开目录随机展示的名言，仅站长本人可见。"
    >
      <QuotesConsole />
    </AdminPageGate>
  )
}
