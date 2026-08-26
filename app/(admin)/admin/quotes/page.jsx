import AdminPageGate from '../../components/AdminPageGate'
import QuotesConsole from './QuotesConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '名言生成',
  description: '根据提示语生成并展示一句原创短句。',
  robots: { index: false, follow: false },
}

export default function QuotesAdminPage() {
  return (
    <AdminPageGate
      label="名言生成"
      returnTo="/admin/quotes"
      description="根据提示语生成并立即展示一句原创短句，仅站长本人可用。"
    >
      <QuotesConsole />
    </AdminPageGate>
  )
}
