import AdminPageGate from '../../components/AdminPageGate'
import ContentCenter from './ContentCenter'

export const metadata = {
  title: '内容',
  description: '内容生产、组织治理、分发触达、数据复盘与资源归档。',
  robots: { index: false, follow: false },
}

export default function AdminContentCenterPage() {
  return (
    <AdminPageGate label="内容" returnTo="/admin/content" description="管理内容从生产、组织到分发、复盘和归档的完整流程，仅站长本人可见。">
      <ContentCenter />
    </AdminPageGate>
  )
}
