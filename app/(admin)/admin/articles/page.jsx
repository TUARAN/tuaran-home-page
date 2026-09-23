import { redirect } from 'next/navigation'

import AdminPageGate from '../../components/AdminPageGate'
import ArticlesConsole from './ArticlesConsole'

export const metadata = {
  title: '内容管理',
  description: '统一管理三条上线通道：普通文章、Git 调研、A 股/加密观察。',
  robots: { index: false, follow: false },
}

export default async function AdminArticlesPage({ searchParams }) {
  const params = await searchParams
  if (params?.panel === 'import') {
    const rawPath = Array.isArray(params.path) ? params.path[0] : params.path
    const path = typeof rawPath === 'string' ? rawPath : ''
    redirect(path
      ? `/admin/articles/research-import?path=${encodeURIComponent(path)}`
      : '/admin/articles/research-import')
  }

  return (
      <AdminPageGate label="内容管理" returnTo="/admin/articles" description="三条上线通道汇入同一份列表，仅站长本人可见。">
      <ArticlesConsole />
    </AdminPageGate>
  )
}
