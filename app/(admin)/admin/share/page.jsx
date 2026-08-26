import AdminPageGate from '../../components/AdminPageGate'
import ShareAdminClient from './ShareConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '加密分享',
  description: '后台明文管理，公开链接密码保护分享。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminSharePage() {
  return (
    <AdminPageGate
      label="加密分享"
      returnTo="/admin/share"
      description="后台明文管理，公开链接仅返回密文，仅站长本人可见。"
    >
      <ShareAdminClient />
    </AdminPageGate>
  )
}
