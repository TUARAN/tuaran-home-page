import AdminPageGate from '../../components/AdminPageGate'
import RewardsConsole from './RewardsConsole'

export const metadata = {
  title: '签到礼物',
  description: '维护燃币礼物与兑换履约。',
  robots: { index: false, follow: false },
}

export default function AdminRewardsPage() {
  return (
    <AdminPageGate label="签到礼物" returnTo="/admin/rewards" description="维护礼物库存和兑换履约，仅站长本人可见。">
      <RewardsConsole />
    </AdminPageGate>
  )
}
