import AdminPageGate from '../../components/AdminPageGate'
import ArticlesConsole from './ArticlesConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '文章编辑器',
  description: '在线撰写、保存草稿并发布精选文章。',
  robots: { index: false, follow: false },
}

export default function AdminArticlesPage() {
  return (
    <AdminPageGate label="文章编辑器" returnTo="/admin/articles" description="仅站长本人可管理文章。">
      <ArticlesConsole />
    </AdminPageGate>
  )
}
