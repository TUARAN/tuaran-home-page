import AdminPageGate from '../../components/AdminPageGate'
import NavAdminClient from '../../../(site)/agent-ops/nav-admin/NavAdminClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '菜单权限管理',
  description: '设置每个菜单项对谁可见。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminNavPage() {
  return (
    <AdminPageGate
      label="菜单权限管理"
      returnTo="/admin/nav"
      description="后台管理控制台，仅站长本人可见，用来调整主导航与站点地图里每一项的可见用户。"
    >
      <NavAdminClient />
    </AdminPageGate>
  )
}
