import AdminPageGate from '../../components/AdminPageGate'
import ArticlesConsole from './ArticlesConsole'

export const metadata = {
  title: '内容管理',
  description: '统一管理三条上线通道：普通文章、Git 调研、A 股/加密观察。',
  robots: { index: false, follow: false },
}

export default function AdminArticlesPage() {
  return (
      <AdminPageGate label="内容管理" returnTo="/admin/articles" description="三条上线通道汇入同一份列表，仅站长本人可见。">
      <ArticlesConsole />
    </AdminPageGate>
  )
}
