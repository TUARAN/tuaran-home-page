import AdminPageGate from '../../components/AdminPageGate'
import PointsConsole from './PointsConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '燃币管理',
  description: '燃币流水 / 资源门槛设置 / 手动增减燃币。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminPointsPage() {
  return (
    <AdminPageGate
      label="燃币管理"
      returnTo="/admin/points"
      description="燃币流水、资源门槛设置与手动增减，仅站长本人可见。"
    >
      <PointsConsole />
    </AdminPageGate>
  )
}
