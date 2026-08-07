'use client'

import { useCallback, useEffect, useState } from 'react'
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

import { AdminButton, AdminPage, AdminPagination, Section } from '../../components/ui'
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

export default function ArticlesConsole() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activePanel, setActivePanel] = useState('content')
  const PAGE_SIZE = 20

  function openPanel(panel, anchorId) {
    setActivePanel(panel)
    if (!anchorId) return
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  const loadList = useCallback(async (nextOffset = 0) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        type: typeFilter,
        status: statusFilter,
        offset: String(nextOffset),
        limit: String(PAGE_SIZE),
      })
      const res = await fetch(`/api/admin/content-list?${params}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.status !== 'ok') {
        throw new Error(data?.detail || data?.message || data?.error || `HTTP_${res.status}`)
      }
      setItems(Array.isArray(data.items) ? data.items : [])
      setTotal(Number(data.total) || 0)
      setCounts(data.counts || null)
      setOffset(nextOffset)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [query, typeFilter, statusFilter])

  // 搜索防抖 + 筛选变化自动回到第一页
  useEffect(() => {
    const timer = setTimeout(() => loadList(0), query.trim() ? 350 : 0)
    return () => clearTimeout(timer)
  }, [query, typeFilter, statusFilter, loadList])

  async function removeArticle(article) {
    if (!window.confirm(`确认删除“${article.title || '未命名草稿'}”？此操作不可恢复。`)) return
    const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' })
    if (res.ok) {
      await loadList(offset)
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
      await loadList(offset)
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
      await loadList(offset)
    } catch (err) {
      setError(err.message)
    }
  }

  const filterClass =
    'h-9 rounded-lg border border-[#d9dbd0] bg-white px-3 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200'

  return (
    <AdminPage
      title="内容管理"
      description={`共 ${counts?.all ?? '…'} 条 · 已发布 ${counts?.published ?? '…'} · 草稿 ${counts?.draft ?? '…'} · 已下线 ${counts?.retired ?? '…'}`}
      stickyHeader
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
            aria-label="按类型筛选"
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
        {!loading && !total ? (
          <p className="py-8 text-center text-sm text-[#77796e] dark:text-gray-400">还没有内容。</p>
        ) : null}
        {!loading && total && !items.length ? (
          <p className="py-8 text-center text-sm text-[#77796e] dark:text-gray-400">没有符合筛选条件的内容。</p>
        ) : null}

        <div className="divide-y divide-[#eceee6] dark:divide-[#1b2430]">
          {items.map((item) => {
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
        <AdminPagination
          total={total}
          offset={offset}
          limit={PAGE_SIZE}
          onOffsetChange={loadList}
          loading={loading}
        />
        </Section>
      ) : null}
    </AdminPage>
  )
}
