import AdminPageGate from '../../components/AdminPageGate'
import SoftStickerWorkspace from './SoftStickerWorkspace'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '软贴空间',
  description: '仅站长可见的私人体验记录、自控复盘与关系专题。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function SoftStickerPage({ searchParams }) {
  const params = await searchParams
  const initialTab = ['self-regulation', 'strawberry'].includes(params?.tab) ? params.tab : 'records'
  return (
    <AdminPageGate
      label="软贴空间"
      returnTo="/admin/soft-sticker"
      description="仅站长本人可访问；体验记录、自控复盘和草莓专题集中在同一私密工作区。"
    >
      <SoftStickerWorkspace initialTab={initialTab} />
    </AdminPageGate>
  )
}
