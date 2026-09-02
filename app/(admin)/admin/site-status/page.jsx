import AdminPageGate from '../../components/AdminPageGate'
import SiteStatusConsole from './SiteStatusConsole'

export const metadata = {
  title: '故障公告',
  description: '管理站点故障公告与自动健康检查。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminSiteStatusPage() {
  return (
    <AdminPageGate
      label="故障公告"
      returnTo="/admin/site-status"
      description="站长运维入口，用于发布维护或故障公告，并查看自动探测状态。"
    >
      <SiteStatusConsole />
    </AdminPageGate>
  )
}
