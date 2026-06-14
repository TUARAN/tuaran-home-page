import AdminPageGate from '../../components/AdminPageGate'
import ShareAdminClient from './ShareConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '加密分享管理',
  description: 'E2E 加密的家庭文档分享链接。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminSharePage() {
  return (
    <AdminPageGate
      label="加密分享管理"
      returnTo="/admin/share"
      description="管理端到端加密分享链接，仅站长本人可见。"
    >
      <ShareAdminClient />
    </AdminPageGate>
  )
}
