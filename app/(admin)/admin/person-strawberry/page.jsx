import AdminPageGate from '../../components/AdminPageGate'
import StrawberryProfile from './StrawberryProfile'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '草莓专题',
  description: '仅站长可见的私人关系、联系时间线与资金账目复盘。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function StrawberryProfilePage() {
  return (
    <AdminPageGate
      label="草莓专题"
      returnTo="/admin/person-strawberry"
      description="私人关系记录仅供站长本人复盘；身份线索已脱敏。"
    >
      <StrawberryProfile />
    </AdminPageGate>
  )
}
