import AdminPageGate from '../../components/AdminPageGate'
import QuotesConsole from './QuotesConsole'

export const metadata = {
  title: '短句存档',
  description: '查看原创短句的历史记录。',
  robots: { index: false, follow: false },
}

export default function QuotesAdminPage() {
  return (
    <AdminPageGate
      label="短句存档"
      returnTo="/admin/quotes"
      description="原创短句历史记录，仅站长本人可用。"
    >
      <QuotesConsole />
    </AdminPageGate>
  )
}
