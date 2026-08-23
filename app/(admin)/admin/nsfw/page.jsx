import AdminPageGate from '../../components/AdminPageGate'
import NsfwConsole from './NsfwConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '私有媒体库',
  description: '仅站长可访问的私有 R2 媒体管理台。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminNsfwPage() {
  return (
    <AdminPageGate
      label="私有媒体库"
      returnTo="/admin/nsfw"
      description="仅站长本人可访问。文件使用独立的私有 R2 桶保存，预览与下载均经受保护的后台接口。"
    >
      <NsfwConsole />
    </AdminPageGate>
  )
}
