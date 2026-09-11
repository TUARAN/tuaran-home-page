'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  IconDatabase,
  IconEdit,
  IconExternalLink,
  IconFileImport,
  IconList,
  IconPlus,
  IconTrash,
  IconTypography,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, AdminPagination, Section } from '../../components/ui'
import ContentIndexConsole from '../content-index/ContentIndexConsole'
import ResearchStyleClient from '../research-style/ResearchStyleClient'
import ResearchImportConsole from './research-import/ResearchImportConsole'
import { LoadingState } from '../../../components/loading/LoadingPrimitives'

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

const SOURCE_LABELS = {
  editor: '在线创作',
  manual: '手工登记',
  git: 'Git 调研',
  sync: '构建同步',
}

const PANELS = [
  { id: 'list', label: '全部内容', icon: IconList },
  { id: 'import', label: '导入调研', icon: IconFileImport },
  { id: 'index', label: '索引与登记', icon: IconDatabase },
  { id: 'style', label: '写作规范', icon: IconTypography },
]

const PANEL_IDS = PANELS.map((panel) => panel.id)

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function useContentPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('panel')
  const panel = PANEL_IDS.includes(raw) ? raw : 'list'

  function setPanel(next) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'list') params.delete('panel')
    else params.set('panel', next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return [panel, setPanel]
}

function PublishChannels({ onOpenImport }) {
  return (
    <Section
      title="现在怎么上线"
      description="公开站读 D1。Git 只保存调研正本；新调研不会因为 push 就出现在目录里。"
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <article className="flex flex-col rounded-lg border border-[#eceee6] p-4 dark:border-[#243041]">
          <p className="mb-1 font-mono text-[11px] tracking-wide text-[#8b8d82]">通道一</p>
          <h3 className="font-serif text-[1.02rem] font-semibold text-[#15140f] dark:text-gray-100">普通文章</h3>
          <p className="mt-2 flex-1 text-[13px] leading-6 text-[#55574f] dark:text-gray-400">
            在后台编辑器写，点发布写入 <code>article_posts</code>。目录立刻可读，不经过 Git，也不重建站点。
          </p>
          <div className="mt-3">
            <AdminButton href="/admin/articles/new" size="sm" variant="primary">
              <IconPlus size={15} />写文章
            </AdminButton>
          </div>
        </article>
        <article className="flex flex-col rounded-lg border border-[#eceee6] p-4 dark:border-[#243041]">
          <p className="mb-1 font-mono text-[11px] tracking-wide text-[#8b8d82]">通道二</p>
          <h3 className="font-serif text-[1.02rem] font-semibold text-[#15140f] dark:text-gray-100">Git 调研</h3>
          <p className="mt-2 flex-1 text-[13px] leading-6 text-[#55574f] dark:text-gray-400">
            正本在 <code>research/*.md</code>。commit 用 <code>[CF-Pages-Skip]</code> 只存仓库；导出 JSON 后切到「导入调研」，核对再写入 D1。读者这才看得到。
          </p>
          <div className="mt-3">
            <AdminButton type="button" size="sm" onClick={onOpenImport}>
              <IconFileImport size={15} />导入调研
            </AdminButton>
          </div>
        </article>
        <article className="flex flex-col rounded-lg border border-[#eceee6] p-4 dark:border-[#243041]">
          <p className="mb-1 font-mono text-[11px] tracking-wide text-[#8b8d82]">通道三</p>
          <h3 className="font-serif text-[1.02rem] font-semibold text-[#15140f] dark:text-gray-100">A 股 / 加密观察</h3>
          <p className="mt-2 flex-1 text-[13px] leading-6 text-[#55574f] dark:text-gray-400">
            定时任务起草，专用发布器同时写 Git 正本和 D1 快照。复核、退回、自动发布都在自动化工作台，不走本页导入。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminButton href="/admin/a-share-research" size="sm">A 股研究</AdminButton>
            <AdminButton href="/admin/crypto-research" size="sm">加密调研</AdminButton>
          </div>
        </article>
      </div>
    </Section>
  )
}

function ArticlesConsoleBody() {
  const [panel, setPanel] = useContentPanel()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const PAGE_SIZE = 20

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
      description="三条通道汇入同一份列表。页内切换列表、导入、索引和规范；写文章进入独立编辑器。"
      stickyHeader
      actions={(
        <AdminButton href="/admin/articles/new" variant="primary">
          <IconPlus size={16} />写文章
        </AdminButton>
      )}
    >
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="内容管理工作区">
        {PANELS.map((item) => {
          const Icon = item.icon
          const active = panel === item.id
          return (
            <AdminButton
              key={item.id}
              type="button"
              variant={active ? 'default' : 'ghost'}
              aria-selected={active}
              onClick={() => setPanel(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </AdminButton>
          )
        })}
      </div>

      {panel === 'list' && error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </div>
      ) : null}

      {panel === 'list' ? (
        <div className="space-y-4">
          <PublishChannels onOpenImport={() => setPanel('import')} />
          <Section
            title="全部内容"
            description={`共 ${counts?.all ?? '…'} 条 · 已发布 ${counts?.published ?? '…'} · 草稿 ${counts?.draft ?? '…'} · 已下线 ${counts?.retired ?? '…'}。右侧按钮进入该条所属通道。`}
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

            {loading ? <LoadingState label="正在加载文章列表" compact /> : null}
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
                const isResearch = item.entity === 'research-document'
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
                          {SOURCE_LABELS[item.source] || item.source}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-[#898b80] dark:text-gray-500">
                        {item.contentKey}
                        {item.updatedAt ? ` · 更新于 ${formatTime(item.updatedAt)}` : item.date ? ` · ${item.date}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {item.status === 'published' ? (
                        <AdminButton href={item.href} size="sm" target="_blank" rel="noreferrer">
                          <IconExternalLink size={15} />查看
                        </AdminButton>
                      ) : null}
                      {isResearch ? (
                        <AdminButton type="button" size="sm" onClick={() => setPanel('import')}>
                          导入新版本 / 撤回
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
        </div>
      ) : null}

      {panel === 'import' ? <ResearchImportConsole embedded /> : null}

      {panel === 'index' ? <ContentIndexConsole embedded /> : null}

      {panel === 'style' ? <ResearchStyleClient embedded /> : null}
    </AdminPage>
  )
}

export default function ArticlesConsole() {
  return (
    <Suspense fallback={<LoadingState label="正在打开内容管理" />}>
      <ArticlesConsoleBody />
    </Suspense>
  )
}
