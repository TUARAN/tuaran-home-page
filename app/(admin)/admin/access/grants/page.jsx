import AdminPageGate from '../../../components/AdminPageGate'
import UsersConsole from '../../users/UsersConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '授权管理',
  description: '管理用户与 MCP OAuth 客户端之间的授权关系。',
  robots: { index: false, follow: false },
}

export default function AdminAccessGrantsPage() {
  return (
    <AdminPageGate label="授权管理" returnTo="/admin/access/grants" description="外部客户端授权关系管理，仅站长本人可见。">
      <UsersConsole initialTab="mcp" mode="mcp" />
    </AdminPageGate>
  )
}
