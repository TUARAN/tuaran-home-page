import AdminPageGate from '../../components/AdminPageGate'
import ShortLinksConsole from './ShortLinksConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '短链管理',
  description: '管理站内分享短链与原始 URL 映射。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminShortLinksPage() {
  return (
    <AdminPageGate
      label="短链管理"
      returnTo="/admin/short-links"
      description="后台管理控制台，仅站长本人可见，用来查看、搜索和维护全站短链映射。"
    >
      <ShortLinksConsole />
    </AdminPageGate>
  )
}
