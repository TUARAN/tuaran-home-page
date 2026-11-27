import AdminPageGate from '../../components/AdminPageGate'
import ArticleDistributionClient from './ArticleDistributionClient'

export const runtime = 'edge'

export const metadata = {
  title: '分发智能体',
  description: '把站内文章交给本机智能体发到各平台，查看逐平台结果。',
  robots: { index: false, follow: false },
}
export default async function AdminArticleDistributionPage({ searchParams }) {
  const params = await searchParams
  const requestedContentKey = String(params?.contentKey || '').trim()
  const returnTo = requestedContentKey
    ? `/admin/article-distribution?contentKey=${encodeURIComponent(requestedContentKey)}`
    : '/admin/article-distribution'

  return (
    <AdminPageGate
      label="分发智能体"
      returnTo={returnTo}
      description="建分发任务、查看结果仅站长本人可操作。"
    >
      <ArticleDistributionClient
        key={requestedContentKey || 'default'}
        requestedContentKey={requestedContentKey}
      />
    </AdminPageGate>
  )
}
