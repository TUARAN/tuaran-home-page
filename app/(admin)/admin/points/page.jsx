import AdminPageGate from '../../components/AdminPageGate'
import PointsConsole from './PointsConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '燃币与权益',
  description: '燃币规则 / 资源权益设置 / 手动增减燃币。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminPointsPage() {
  return (
    <AdminPageGate
      label="燃币与权益"
      returnTo="/admin/points"
      description="燃币规则、资源权益设置与手动增减，仅站长本人可见。"
    >
      <PointsConsole />
    </AdminPageGate>
  )
}
