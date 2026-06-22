import AdminPageGate from '../../../components/AdminPageGate'
import ArticleEditor from '../ArticleEditor'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const metadata = { title: '写文章', robots: { index: false, follow: false } }

export default function NewArticlePage() {
  return <AdminPageGate label="写文章" returnTo="/admin/articles/new"><ArticleEditor /></AdminPageGate>
}
