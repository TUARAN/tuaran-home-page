import AdminPageGate from '../../components/AdminPageGate'
import PayConsole from './PayConsole'

export const metadata = {
  title: '支付订单',
  description: '虎皮椒收款订单跟踪、补单与内容现金定价。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminPayPage() {
  return (
    <AdminPageGate
      label="支付订单"
      returnTo="/admin/pay"
      description="虎皮椒收款订单、补单与内容现金定价，仅站长本人可见。"
    >
      <PayConsole />
    </AdminPageGate>
  )
}
