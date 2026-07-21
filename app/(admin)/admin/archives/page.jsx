import AdminPageGate from '../../components/AdminPageGate'
import ArchiveManagementConsole from './ArchiveManagementConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '存档管理',
  description: '管理已结束活动页面的归档入口、下线范围与保留资产。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminArchivesPage() {
  return (
    <AdminPageGate
      label="存档管理"
      returnTo="/admin/archives"
      description="活动页面归档台账，仅站长本人可见。"
    >
      <ArchiveManagementConsole />
    </AdminPageGate>
  )
}
