import AdminPageGate from '../../components/AdminPageGate'
import ContentIndexConsole from './ContentIndexConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '内容索引管理台',
  description: 'D1 内容索引：同步构建期注册表 + 手工登记新内容 metadata。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminContentIndexPage() {
  return (
    <AdminPageGate
      label="内容索引管理台"
      returnTo="/admin/content-index"
      description="统一内容索引（content_index）：一键同步构建期注册表进 D1，手工登记的条目无需构建即出现在 /articles 索引。仅站长本人可见。"
    >
      <ContentIndexConsole />
    </AdminPageGate>
  )
}
