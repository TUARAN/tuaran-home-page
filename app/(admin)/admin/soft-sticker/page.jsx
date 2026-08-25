import AdminPageGate from '../../components/AdminPageGate'
import SoftStickerClient from './SoftStickerClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SoftSticker',
  description: '仅站长可见的私人体验时间线与画像看板。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function SoftStickerPage() {
  return (
    <AdminPageGate
      label="SoftSticker"
      returnTo="/admin/soft-sticker"
      description="仅站长本人可访问；记录在浏览器内解密，页面提供时间线、筛选表格与聚合画像。"
    >
      <SoftStickerClient />
    </AdminPageGate>
  )
}
