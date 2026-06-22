'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { IconEdit, IconExternalLink, IconPlus, IconTrash } from '@tabler/icons-react'

import AdminPage from '../../components/ui/AdminPage'
import AdminButton from '../../components/ui/AdminButton'
import Section from '../../components/ui/Section'

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function ArticlesConsole() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/articles', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || data?.error || '文章读取失败')
      setArticles(data.articles || [])
      if (data.status === 'unavailable') setError('当前环境没有 D1 绑定。')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function remove(article) {
    if (!window.confirm(`确认删除“${article.title || '未命名草稿'}”？此操作不可恢复。`)) return
    const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' })
    if (res.ok) setArticles((items) => items.filter((item) => item.id !== article.id))
    else setError('删除失败，请稍后重试。')
  }

  const counts = useMemo(() => ({
    all: articles.length,
    draft: articles.filter((item) => item.status === 'draft').length,
    published: articles.filter((item) => item.status === 'published').length,
  }), [articles])

  return (
    <AdminPage
      title="文章编辑器"
      description={`共 ${counts.all} 篇 · 草稿 ${counts.draft} · 已发布 ${counts.published}`}
      actions={<AdminButton href="/admin/articles/new" variant="primary"><IconPlus size={16} />写文章</AdminButton>}
    >
      {error ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{error}</div> : null}
      <Section title="文章列表" description="草稿不会出现在公开站点。">
        {loading ? <p className="text-sm text-[#67695d] dark:text-gray-400">加载中…</p> : null}
        {!loading && !articles.length ? <p className="py-8 text-center text-sm text-[#77796e] dark:text-gray-400">还没有在线文章。</p> : null}
        <div className="divide-y divide-[#eceee6] dark:divide-[#1b2430]">
          {articles.map((article) => (
            <div key={article.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/articles/${article.id}/edit`} className="truncate font-medium text-[#15140f] hover:underline dark:text-gray-100">
                    {article.title || '未命名草稿'}
                  </Link>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${article.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                    {article.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-[#898b80] dark:text-gray-500">/{article.slug} · 更新于 {formatTime(article.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                {article.status === 'published' ? <AdminButton href={`/articles/${article.slug}`} size="sm" target="_blank"><IconExternalLink size={15} />查看</AdminButton> : null}
                <AdminButton href={`/admin/articles/${article.id}/edit`} size="sm"><IconEdit size={15} />编辑</AdminButton>
                <AdminButton size="sm" variant="danger" onClick={() => remove(article)} aria-label="删除"><IconTrash size={15} /></AdminButton>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </AdminPage>
  )
}
