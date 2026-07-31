import AdminPageGate from '../../components/AdminPageGate'
import ContentTaxonomyClient from './ContentTaxonomyClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '分类管理',
  description: '维护内容分类定义，审计主题覆盖与推断内容。',
  robots: { index: false, follow: false },
}

export default function ContentTaxonomyPage() {
  return (
    <AdminPageGate
      label="分类管理"
      returnTo="/admin/content-taxonomy"
      description="维护内容分类定义，查看主题分布与待治理内容。"
    >
      <ContentTaxonomyClient />
    </AdminPageGate>
  )
}
