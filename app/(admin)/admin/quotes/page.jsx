import AdminPageGate from '../../components/AdminPageGate'
import QuotesConsole from './QuotesConsole'

export const metadata = {
  title: '短句内容',
  description: '维护原创短句、保留记录并供前台随机展示。',
  robots: { index: false, follow: false },
}

export default function QuotesAdminPage() {
  return (
    <AdminPageGate
      label="短句内容"
      returnTo="/admin/quotes"
      description="维护原创短句与前台随机展示内容，仅站长本人可用。"
    >
      <QuotesConsole />
    </AdminPageGate>
  )
}
