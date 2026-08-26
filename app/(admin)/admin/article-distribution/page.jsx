import AdminPageGate from '../../components/AdminPageGate'
import ArticleDistributionClient from './ArticleDistributionClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '文章一键分发',
  description: '把站内公开文章写入多个内容平台的草稿箱。',
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
      label="文章一键分发"
      returnTo={returnTo}
      description="文章选择、平台登录态和草稿写入仅站长本人可操作。"
    >
      <ArticleDistributionClient
        key={requestedContentKey || 'default'}
        requestedContentKey={requestedContentKey}
      />
    </AdminPageGate>
  )
}
