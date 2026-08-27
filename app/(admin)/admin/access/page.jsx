import AdminPageGate from '../../components/AdminPageGate'
import AccessWorkspace from './AccessWorkspace'

export const metadata = {
  title: '用户与权限',
  description: '账号身份、授权关系、燃币权益与菜单可见性。',
  robots: { index: false, follow: false },
}

export default function AdminAccessPage() {
  return (
    <AdminPageGate label="用户与权限" returnTo="/admin/access" description="账号身份、授权和权益管理，仅站长本人可见。">
      <AccessWorkspace />
    </AdminPageGate>
  )
}
