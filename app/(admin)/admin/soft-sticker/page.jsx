import AdminPageGate from '../../components/AdminPageGate'
import SoftStickerWorkspace from './SoftStickerWorkspace'

export const runtime = 'edge'

export const metadata = {
  title: '软贴空间',
  description: '仅站长可见的 Notion 私人备份整理空间。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function SoftStickerPage({ searchParams }) {
  const params = await searchParams
  const initialTab = ['self-regulation', 'strawberry', 'long-compass'].includes(params?.tab) ? params.tab : 'records'
  return (
    <AdminPageGate
      label="软贴空间"
      returnTo="/admin/soft-sticker"
      description="仅站长本人可访问；Notion 备份整理出的体验记录、自控复盘、关系专题和长期档案集中在同一私密工作区。"
    >
      <SoftStickerWorkspace initialTab={initialTab} />
    </AdminPageGate>
  )
}
