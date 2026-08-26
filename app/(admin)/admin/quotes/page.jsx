import AdminPageGate from '../../components/AdminPageGate'
import QuotesConsole from './QuotesConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '名言生成',
  description: '自动生成原创短句、保留记录并随机展示。',
  robots: { index: false, follow: false },
}

export default function QuotesAdminPage() {
  return (
    <AdminPageGate
      label="名言生成"
      returnTo="/admin/quotes"
      description="自动生成原创短句、保留记录并随机展示，仅站长本人可用。"
    >
      <QuotesConsole />
    </AdminPageGate>
  )
}
