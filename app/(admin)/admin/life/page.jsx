import AdminPageGate from '../../components/AdminPageGate'
import HolidayJournalClient from './HolidayJournalClient'

export const metadata = {
  title: '生活记录',
  description: '按大型节假日整理私人生活片段，仅站长本人可见。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminLifePage() {
  return (
    <AdminPageGate
      label="生活记录"
      returnTo="/admin/life"
      description="节假日生活记录仅站长本人可见。"
    >
      <HolidayJournalClient />
    </AdminPageGate>
  )
}
