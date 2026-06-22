import AdminPageGate from '../../components/AdminPageGate'
import PointsConsole from './PointsConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '燃币与门槛',
  description: '燃币流水 / 资源门槛配置 / 手动加减燃币。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminPointsPage() {
  return (
    <AdminPageGate
      label="燃币与门槛"
      returnTo="/admin/points"
      description="燃币流水、资源门槛配置与手动加减，仅站长本人可见。"
    >
      <PointsConsole />
    </AdminPageGate>
  )
}
