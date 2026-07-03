import AdminPageGate from '../../components/AdminPageGate'
import SiteDevManagerClient from './SiteDevManagerClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '本站开发管理',
  description: 'GitHub / npm 项目进度、Issue 待办与开源发布状态管理。',
  robots: { index: false, follow: false },
}

export default function AdminSiteDevPage() {
  return (
    <AdminPageGate
      label="本站开发管理"
      returnTo="/admin/site-dev"
      description="GitHub / npm 项目进度、Issue 待办与开源发布状态管理，仅站长本人可见。"
    >
      <SiteDevManagerClient />
    </AdminPageGate>
  )
}
