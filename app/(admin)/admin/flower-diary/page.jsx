import AdminPageGate from '../../components/AdminPageGate'
import FlowerDiaryClient from './FlowerDiaryClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '采花日记',
  description: '仅站长可见的私人体验时间线与画像看板。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function FlowerDiaryPage() {
  return (
    <AdminPageGate
      label="采花日记"
      returnTo="/admin/flower-diary"
      description="仅站长本人可访问；记录在浏览器内解密，页面提供时间线、筛选表格与聚合画像。"
    >
      <FlowerDiaryClient />
    </AdminPageGate>
  )
}
