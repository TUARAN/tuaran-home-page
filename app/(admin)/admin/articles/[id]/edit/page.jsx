import AdminPageGate from '../../../../components/AdminPageGate'
import ArticleEditor from '../../ArticleEditor'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const metadata = { title: '编辑文章', robots: { index: false, follow: false } }

export default async function EditArticlePage({ params }) {
  const { id } = await params
  return <AdminPageGate label="编辑文章" returnTo={`/admin/articles/${id}/edit`}><ArticleEditor articleId={id} /></AdminPageGate>
}
