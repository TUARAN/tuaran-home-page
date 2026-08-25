import AdminPageGate from '../../components/AdminPageGate'
import SoftStickerWorkspace from './SoftStickerWorkspace'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SoftSticker',
  description: '仅站长可见的私人体验记录与锻炼自控复盘。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function SoftStickerPage({ searchParams }) {
  const params = await searchParams
  const initialTab = params?.tab === 'self-regulation' ? 'self-regulation' : 'records'
  return (
    <AdminPageGate
      label="SoftSticker"
      returnTo="/admin/soft-sticker"
      description="仅站长本人可访问；体验记录与锻炼自控复盘分别使用各自的口令和安全模型。"
    >
      <SoftStickerWorkspace initialTab={initialTab} />
    </AdminPageGate>
  )
}
