import AdminPageGate from '../../components/AdminPageGate'
import ContentCenter from './ContentCenter'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '内容中心',
  description: '内容创作、索引发布、规范与运营反馈。',
  robots: { index: false, follow: false },
}

export default function AdminContentCenterPage() {
  return (
    <AdminPageGate label="内容中心" returnTo="/admin/content" description="管理内容从创作到发布和反馈的完整流程，仅站长本人可见。">
      <ContentCenter />
    </AdminPageGate>
  )
}
