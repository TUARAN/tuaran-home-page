import AdminPageGate from '../../components/AdminPageGate'
import ArticlesConsole from './ArticlesConsole'

export const metadata = {
  title: '内容管理',
  description: '统一创作、登记和管理文章、调研与资源。',
  robots: { index: false, follow: false },
}

export default function AdminArticlesPage() {
  return (
    <AdminPageGate label="内容管理" returnTo="/admin/articles" description="统一管理内容创作、登记与发布状态，仅站长本人可见。">
      <ArticlesConsole />
    </AdminPageGate>
  )
}
