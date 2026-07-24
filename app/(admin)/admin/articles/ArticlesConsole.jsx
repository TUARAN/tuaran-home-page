'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowLeft,
  IconDatabase,
  IconEdit,
  IconExternalLink,
  IconPlus,
  IconTrash,
  IconTypography,
} from '@tabler/icons-react'

import AdminPage from '../../components/ui/AdminPage'
import AdminButton from '../../components/ui/AdminButton'
import Section from '../../components/ui/Section'
import ContentIndexConsole from '../content-index/ContentIndexConsole'
import ResearchStyleClient from '../research-style/ResearchStyleClient'

const TYPE_LABELS = {
  article: '文章',
  research: '调研',
  resource: '资源',
  feed: '灵感',
}

const STATUS_LABELS = {
  published: '已发布',
  draft: '草稿',
  retired: '已下线',
}

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function toTimestamp(entry) {
  if (entry.updatedAt) return Number(entry.updatedAt)
  const parsed = Date.parse(entry.date)
  return Number.isNaN(parsed) ? 0 : parsed
}

export default function ArticlesConsole() {
  const [articles, setArticles] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activePanel, setActivePanel] = useState('content')

  function openPanel(panel, anchorId) {
    setActivePanel(panel)
    if (!anchorId) return
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [articlesRes, indexRes] = await Promise.all([
        fetch('/api/admin/articles', { cache: 'no-store' }),
        fetch('/api/admin/content-index', { cache: 'no-store' }),
      ])
      const [articlesData, indexData] = await Promise.all([articlesRes.json(), indexRes.json()])
      if (!articlesRes.ok) {
        throw new Error(articlesData?.detail || articlesData?.error || '文章读取失败')
      }
      setArticles(articlesData.articles || [])
      if (indexRes.ok) {
        setEntries(indexData.entries || [])
      } else {
        setEntries([])
        setError(`在线文章已加载；内容索引暂不可用：${indexData?.message || indexData?.error || '读取失败'}`)
      }
      if (articlesData.status === 'unavailable') setError('当前环境没有 D1 绑定。')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const items = useMemo(() => {
    const articleKeys = new Set(articles.map((article) => `article:${article.slug}`))
    const articleItems = articles.map((article) => ({
      key: `article-post:${article.id}`,
      entity: 'article-post',
      contentKey: `article:${article.slug}`,
      type: 'article',
      source: 'editor',
      title: article.title || '未命名草稿',
      href: `/articles/${article.slug}`,
      status: article.status,
      updatedAt: article.updatedAt,
      article,
    }))
    const indexItems = entries
      .filter((entry) => !articleKeys.has(entry.contentKey))
      .map((entry) => ({
        ...entry,
        key: `content-index:${entry.contentKey}`,
        entity: 'content-index',
      }))
    return [...articleItems, ...indexItems].sort((a, b) => toTimestamp(b) - toTimestamp(a))
  }, [articles, entries])

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!normalizedQuery) return true
      return `${item.title} ${item.contentKey} ${item.summary || ''}`.toLowerCase().includes(normalizedQuery)
    })
  }, [items, query, statusFilter, typeFilter])

  const counts = useMemo(() => ({
    all: items.length,
    draft: items.filter((item) => item.status === 'draft').length,
    published: items.filter((item) => item.status === 'published').length,
    retired: items.filter((item) => item.status === 'retired').length,
  }), [items])

  async function removeArticle(article) {
    if (!window.confirm(`确认删除“${article.title || '未命名草稿'}”？此操作不可恢复。`)) return
    const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' })
    if (res.ok) {
      setArticles((current) => current.filter((item) => item.id !== article.id))
      setEntries((current) => current.filter((item) => item.contentKey !== `article:${article.slug}`))
    } else {
      setError('删除失败，请稍后重试。')
    }
  }

  async function updateEntry(entry, nextStatus) {
    setError('')
    try {
      const res = await fetch('/api/admin/content-index', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', entry: { ...entry, status: nextStatus } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || '状态更新失败')
      setEntries((current) => current.map((item) => (
        item.contentKey === entry.contentKey ? { ...item, status: nextStatus } : item
      )))
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeEntry(entry) {
    if (!window.confirm(`确认删除“${entry.title}”？`)) return
    try {
      const res = await fetch(
        `/api/admin/content-index?contentKey=${encodeURIComponent(entry.contentKey)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('删除失败')
      setEntries((current) => current.filter((item) => item.contentKey !== entry.contentKey))
    } catch (err) {
      setError(err.message)
    }
  }

  const filterClass =
    'h-9 rounded-lg border border-[#d9dbd0] bg-white px-3 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200'

  return (
    <AdminPage
      title="内容管理"
      description={`共 ${counts.all} 条 · 已发布 ${counts.published} · 草稿 ${counts.draft} · 已下线 ${counts.retired}`}
      actions={(
        <>
          {activePanel !== 'content' ? (
            <AdminButton type="button" variant="ghost" onClick={() => setActivePanel('content')}>
              <IconArrowLeft size={16} />内容列表
            </AdminButton>
          ) : null}
          <AdminButton
            type="button"
            variant={activePanel === 'style' ? 'default' : 'ghost'}
            onClick={() => openPanel('style')}
          >
            <IconTypography size={16} />写作规范
          </AdminButton>
          <AdminButton
            type="button"
            variant={activePanel === 'index' ? 'default' : 'ghost'}
            onClick={() => openPanel('index', 'content-index-sync')}
          >
            <IconDatabase size={16} />索引与登记
          </AdminButton>
          <AdminButton href="/admin/articles/new" variant="primary"><IconPlus size={16} />写文章</AdminButton>
        </>
      )}
    >
      {activePanel === 'content' && error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </div>
      ) : null}

      {activePanel === 'style' ? (
        <Section
          title="写作规范"
          description="调研表达规则、禁用措辞与存量内容复核；操作始终留在内容管理页面。"
          actions={(
            <AdminButton type="button" size="sm" onClick={() => setActivePanel('content')}>
              <IconArrowLeft size={15} />返回内容列表
            </AdminButton>
          )}
        >
          <ResearchStyleClient embedded />
        </Section>
      ) : null}

      {activePanel === 'index' ? (
        <Section
          title="索引维护与内容登记"
          description="同步构建期内容、登记免构建条目，并维护条目的上线状态。"
          actions={(
            <AdminButton type="button" size="sm" onClick={() => setActivePanel('content')}>
              <IconArrowLeft size={15} />返回内容列表
            </AdminButton>
          )}
        >
          <ContentIndexConsole embedded />
        </Section>
      ) : null}

      {activePanel === 'content' ? (
        <Section
          title="全部内容"
          description="在线文章可直接编辑；构建期内容和手工登记内容统一在这里查看。"
        >
        <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、摘要或 content key"
            className={filterClass}
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={filterClass}
            aria-label="按内容类型筛选"
          >
            <option value="all">全部类型</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={filterClass}
            aria-label="按发布状态筛选"
          >
            <option value="all">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {loading ? <p className="text-sm text-[#67695d] dark:text-gray-400">加载中…</p> : null}
        {!loading && !items.length ? (
          <p className="py-8 text-center text-sm text-[#77796e] dark:text-gray-400">还没有内容。</p>
        ) : null}
        {!loading && items.length && !visibleItems.length ? (
          <p className="py-8 text-center text-sm text-[#77796e] dark:text-gray-400">没有符合筛选条件的内容。</p>
        ) : null}

        <div className="divide-y divide-[#eceee6] dark:divide-[#1b2430]">
          {visibleItems.map((item) => {
            const isArticlePost = item.entity === 'article-post'
            const isManualEntry = item.entity === 'content-index' && item.source === 'manual'
            return (
              <div key={item.key} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isArticlePost ? (
                      <Link
                        href={`/admin/articles/${item.article.id}/edit`}
                        className="truncate font-medium text-[#15140f] hover:underline dark:text-gray-100"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-medium text-[#15140f] hover:underline dark:text-gray-100"
                      >
                        {item.title}
                      </a>
                    )}
                    <span className="rounded-full bg-[#f1f2ec] px-2 py-0.5 text-[11px] text-[#66685f] dark:bg-[#1a222d] dark:text-gray-400">
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                      item.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : item.status === 'draft'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                    }`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    <span className="text-[11px] text-[#94968b] dark:text-gray-500">
                      {item.source === 'editor' ? '在线创作' : item.source === 'manual' ? '手工登记' : '构建同步'}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-[#898b80] dark:text-gray-500">
                    {item.contentKey}
                    {item.updatedAt ? ` · 更新于 ${formatTime(item.updatedAt)}` : item.date ? ` · ${item.date}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {item.status === 'published' ? (
                    <AdminButton href={item.href} size="sm" target="_blank">
                      <IconExternalLink size={15} />查看
                    </AdminButton>
                  ) : null}
                  {isArticlePost ? (
                    <>
                      <AdminButton href={`/admin/articles/${item.article.id}/edit`} size="sm">
                        <IconEdit size={15} />编辑
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="danger"
                        onClick={() => removeArticle(item.article)}
                        aria-label="删除文章"
                      >
                        <IconTrash size={15} />
                      </AdminButton>
                    </>
                  ) : null}
                  {isManualEntry ? (
                    <>
                      <AdminButton
                        size="sm"
                        onClick={() => updateEntry(item, item.status === 'published' ? 'retired' : 'published')}
                      >
                        {item.status === 'published' ? '下线' : '上线'}
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="danger"
                        onClick={() => removeEntry(item)}
                        aria-label="删除登记内容"
                      >
                        <IconTrash size={15} />
                      </AdminButton>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
        </Section>
      ) : null}
    </AdminPage>
  )
}
