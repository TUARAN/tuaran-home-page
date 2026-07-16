import AdminPageGate from '../../components/AdminPageGate'
import UsersConsole from './UsersConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '用户管理',
  description: '登录用户目录 / 角色、游客身份与 MCP 授权。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminUsersPage() {
  return (
    <AdminPageGate
      label="用户管理"
      returnTo="/admin/users"
      description="站点用户目录、角色、游客身份与 MCP 授权管理，仅站长本人可见。"
    >
      <UsersConsole />
    </AdminPageGate>
  )
}
