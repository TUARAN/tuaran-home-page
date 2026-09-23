'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  IconArrowLeft,
  IconExternalLink,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react'

import { LoadingSpinner, LoadingState, Skeleton } from '../../../../components/loading/LoadingPrimitives'
import { renderMarkdown } from '../../../../../lib/research/markdown'
import { AdminButton, AdminPage, EmptyState, StatusPill } from '../../../components/ui'
import {
  applyVisibleSelection,
  pruneSelectedPaths,
  summarizeBatchPublish,
  toggleSelectedPath,
  visibleSelectionState,
} from './researchApprovalSelection'

const labels = { draft: '草稿', published: '已发布', retired: '已撤回' }
const reasonLabels = { new: '待审批', draft: '草稿', retired: '已撤回', updated: '正文已改' }
const categoryLabels = { topics: '话题', companies: '公司', people: '人物' }
const STATUS_TONE = { draft: 'warning', published: 'success', retired: 'danger' }
const QUEUE_CACHE_KEY = 'admin-research-approval-queue-v1'
const QUEUE_CACHE_TTL_MS = 5 * 60 * 1000
const QUEUE_FRESH_MS = 20 * 1000
const paneClass = 'admin-section flex max-h-[70vh] min-h-0 flex-col overflow-hidden rounded-xl border lg:h-full lg:max-h-none'

function errorText(data, fallback) {
  if (data?.message) return data.message
  if (data?.error && !/^[A-Z0-9_]+$/.test(String(data.error))) return data.error
  return fallback
}

function readQueueCache() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(QUEUE_CACHE_KEY) || 'null')
    if (!parsed?.queue || !Number(parsed.fetchedAt)) return null
    if (Date.now() - Number(parsed.fetchedAt) > QUEUE_CACHE_TTL_MS) return null
    return { queue: parsed.queue, fetchedAt: Number(parsed.fetchedAt) }
  } catch {
    return null
  }
}

function writeQueueCache(queue) {
  try {
    const fetchedAt = Number(queue?.fetchedAt) || Date.now()
    sessionStorage.setItem(QUEUE_CACHE_KEY, JSON.stringify({ queue: { ...queue, fetchedAt }, fetchedAt }))
  } catch {
    // Safari 隐私模式等场景可能禁用 sessionStorage，忽略即可。
  }
}

function formatSyncedAt(value) {
  const fetchedAt = Number(value) || 0
  if (!fetchedAt) return ''
  const delta = Date.now() - fetchedAt
  if (delta < 15_000) return '刚刚同步'
  if (delta < 60_000) return `${Math.max(1, Math.round(delta / 1000))} 秒前同步`
  if (delta < 3_600_000) return `${Math.max(1, Math.round(delta / 60_000))} 分钟前同步`
  return '超过一小时前同步'
}

function previewVariants(snapshot) {
  const variants = snapshot?.entry?.variants
  if (Array.isArray(variants) && variants.length) return variants
  return [{ id: 'body', label: '正文', content: snapshot?.entry?.content || '' }]
}

function noticeClass(tone) {
  if (tone === 'danger') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
  if (tone === 'info') return 'border-[#d9dbd0] bg-[#f7f8f3] text-[#55574f] dark:border-[#243041] dark:bg-[#151c26] dark:text-gray-300'
  return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
}

function reasonClass(reason) {
  if (reason === 'updated') return 'text-blue-700 dark:text-blue-300'
  if (reason === 'retired') return 'text-rose-700 dark:text-rose-300'
  if (reason === 'draft' || reason === 'new') return 'text-amber-800 dark:text-amber-200'
  return 'text-[#8b8d82] dark:text-gray-500'
}

function QueueRow({ item, active, busy, onOpen, leading }) {
  const reason = item.reason ? (reasonLabels[item.reason] || item.reason) : ''
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border-l-2 px-2 py-2 ${
        active
          ? 'border-[#15140f] bg-[#f3f4ee] text-[#15140f] dark:border-gray-200 dark:bg-[#151c26] dark:text-gray-100'
          : 'border-transparent text-[#55574f] hover:bg-[#f7f8f3] dark:text-gray-400 dark:hover:bg-[#121820]'
      }`}
    >
      {leading}
      <button
        type="button"
        data-review-path={item.sourcePath}
        disabled={busy}
        onClick={() => onOpen(item.sourcePath)}
        className="min-w-0 flex-1 rounded-md py-0.5 text-left"
        aria-current={active ? 'true' : undefined}
      >
        <span className="block truncate text-[13.5px] font-medium">{item.title || item.slug}</span>
        <span className="mt-0.5 flex min-w-0 items-baseline gap-2">
          <span className="truncate font-mono text-[12px] text-[#8b8d82]">{item.filename}</span>
          {reason ? <span className={`shrink-0 text-[12px] font-medium ${reasonClass(item.reason)}`}>{reason}</span> : null}
        </span>
      </button>
    </div>
  )
}

function ReviewCanvas({ snapshot }) {
  const variants = previewVariants(snapshot)
  const [variantId, setVariantId] = useState(variants[0]?.id || 'body')
  const [view, setView] = useState('preview')
  const active = variants.find((item) => item.id === variantId) || variants[0]
  const html = useMemo(
    () => renderMarkdown(active?.content || '', { images: snapshot?.entry?.images || [] }),
    [active?.content, snapshot?.entry?.images],
  )

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-line-soft)] px-4 py-2.5 md:px-5">
        {variants.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            {variants.map((variant) => {
              const selected = (active?.id || variantId) === variant.id
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    selected
                      ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
                      : 'bg-[#f1f2ea] text-[#67695d] hover:bg-[#e7e8e0] dark:bg-[#1a222d] dark:text-gray-400'
                  }`}
                >
                  {variant.label || variant.id}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="mb-0 text-[12px] text-[#8b8d82] dark:text-gray-500">阅览按线上正文排版，可随时对照原文。</p>
        )}
        <div className="flex rounded-lg bg-[#f1f2ea] p-0.5 dark:bg-[#1a222d]" role="group" aria-label="正文视图">
          {[
            ['preview', '阅览'],
            ['source', '原文'],
          ].map(([id, label]) => {
            const selected = view === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={selected}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${
                  selected
                    ? 'bg-white text-[#15140f] shadow-sm dark:bg-[#10161f] dark:text-gray-100'
                    : 'text-[#67695d] dark:text-gray-400'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[var(--admin-surface-subtle)]" data-review-scroll>
        {view === 'source' ? (
          <pre className="mb-0 min-h-full whitespace-pre-wrap break-words px-5 py-5 font-mono text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">{active?.content || ''}</pre>
        ) : (
          <div className="px-4 py-6 sm:px-6">
            <article
              className="prose-tuaran admin-section mx-auto mb-0 max-w-[40rem] rounded-xl border px-5 py-6 sm:px-8"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default function ResearchImportConsole({ embedded = false }) {
  const searchParams = useSearchParams()
  const requestedPath = searchParams.get('path') || ''
  const [queue, setQueue] = useState(null)
  const [queueLoading, setQueueLoading] = useState(true)
  const [sourcePath, setSourcePath] = useState(requestedPath)
  const [filter, setFilter] = useState('')
  const [listMode, setListMode] = useState('pending')
  const [snapshot, setSnapshot] = useState(null)
  const [current, setCurrent] = useState(null)
  const [unchanged, setUnchanged] = useState(false)
  const [ready, setReady] = useState(false)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const [confirmRetire, setConfirmRetire] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState(() => new Set())
  const selectAllRef = useRef(null)
  const documentCacheRef = useRef(new Map())
  const forceRefreshRef = useRef(false)
  const forceDocumentRefreshRef = useRef(false)
  const sourceBucketRef = useRef('')

  const pending = queue?.pending || []
  const files = queue?.files || []
  const query = filter.trim().toLowerCase()
  const visiblePending = useMemo(() => {
    if (!query) return pending
    return pending.filter((item) => [item.title, item.slug, item.filename, item.sourcePath, item.reason].some((value) => String(value || '').toLowerCase().includes(query)))
  }, [pending, query])
  const library = useMemo(() => {
    const pendingPaths = new Set(pending.map((item) => item.sourcePath))
    return files.filter((item) => !pendingPaths.has(item.sourcePath))
  }, [files, pending])
  const visibleFiles = useMemo(() => {
    if (!query) return library
    return library.filter((item) => [item.title, item.slug, item.filename, item.sourcePath].some((value) => String(value || '').toLowerCase().includes(query)))
  }, [library, query])
  const selectedMeta = pending.find((item) => item.sourcePath === sourcePath) || files.find((item) => item.sourcePath === sourcePath)
  const liveHref = snapshot ? `/articles/research/${snapshot.entry.category}/${snapshot.entry.slug}` : ''
  const liveStatus = ready ? (current ? current.status : null) : null
  const githubHref = queue?.repo && sourcePath ? `https://github.com/${queue.repo}/blob/main/${sourcePath}` : ''
  const visiblePendingPaths = useMemo(() => visiblePending.map((item) => item.sourcePath), [visiblePending])
  const selection = visibleSelectionState(selectedPaths, visiblePendingPaths)
  const selectedItems = useMemo(
    () => pending.filter((item) => selectedPaths.has(item.sourcePath)),
    [pending, selectedPaths],
  )
  const visibleList = listMode === 'published' ? visibleFiles : visiblePending

  const applyQueue = useCallback((data, nextPath = requestedPath) => {
    const nextQueue = { ...data, fetchedAt: Number(data.fetchedAt) || Date.now() }
    setQueue(nextQueue)
    writeQueueCache(nextQueue)
    setSourcePath((currentPath) => {
      if (currentPath && (nextQueue.pending.some((item) => item.sourcePath === currentPath) || nextQueue.files.some((item) => item.sourcePath === currentPath))) return currentPath
      if (nextPath && (nextQueue.pending.some((item) => item.sourcePath === nextPath) || nextQueue.files.some((item) => item.sourcePath === nextPath))) return nextPath
      return nextQueue.pending[0]?.sourcePath || currentPath || ''
    })
  }, [requestedPath])

  const openPath = useCallback((path) => {
    setSourcePath(path)
    setMessage('')
    setConfirmRetire(false)
  }, [])

  useEffect(() => {
    let active = true
    const cached = readQueueCache()
    const forceRefresh = forceRefreshRef.current
    forceRefreshRef.current = false
    if (cached && !forceRefresh) {
      applyQueue(cached.queue, requestedPath)
      setQueueLoading(false)
      if (Date.now() - cached.fetchedAt < QUEUE_FRESH_MS) return () => { active = false }
    } else {
      setQueueLoading(true)
    }
    fetch(`/api/admin/research-documents?queue=1${forceRefresh ? '&refresh=1' : ''}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(errorText(data, '读取待审批列表失败'))
        if (!active) return
        setMessage('')
        applyQueue(data, requestedPath)
      })
      .catch((error) => {
        if (!active) return
        setMessageTone('danger')
        setMessage(error.message)
      })
      .finally(() => {
        if (active) setQueueLoading(false)
      })
    return () => { active = false }
  }, [applyQueue, reload, requestedPath])

  useEffect(() => {
    let active = true
    if (!sourcePath) {
      setReady(false)
      setSnapshot(null)
      setCurrent(null)
      setUnchanged(false)
      return undefined
    }
    const refreshDocument = forceDocumentRefreshRef.current
    forceDocumentRefreshRef.current = false
    const cached = refreshDocument ? null : documentCacheRef.current.get(sourcePath)
    if (cached) {
      setSnapshot(cached.snapshot)
      setCurrent(cached.document)
      setUnchanged(Boolean(cached.unchanged))
      setReady(true)
      return undefined
    }
    setReady(false)
    setSnapshot(null)
    setCurrent(null)
    setUnchanged(false)
    fetch(`/api/admin/research-documents?sourcePath=${encodeURIComponent(sourcePath)}${refreshDocument ? '&refresh=1' : ''}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(errorText(data, '读取 GitHub 正文失败'))
        if (!active) return
        setMessage('')
        documentCacheRef.current.set(sourcePath, data)
        setSnapshot(data.snapshot)
        setCurrent(data.document)
        setUnchanged(Boolean(data.unchanged))
        setReady(true)
      })
      .catch((error) => {
        if (!active) return
        setMessageTone('danger')
        setMessage(error.message)
      })
    return () => { active = false }
  }, [reload, sourcePath])

  useEffect(() => {
    const paths = (queue?.pending || []).map((item) => item.sourcePath)
    setSelectedPaths((current) => pruneSelectedPaths(current, paths))
  }, [queue?.pending])

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selection.some
  }, [selection.some])

  useEffect(() => {
    setConfirmRetire(false)
  }, [sourcePath])

  useEffect(() => {
    if (!queue || !sourcePath) return undefined
    const inPending = queue.pending.some((item) => item.sourcePath === sourcePath)
    const bucket = inPending ? 'pending' : 'published'
    if (sourceBucketRef.current === bucket) return undefined
    sourceBucketRef.current = bucket
    setListMode(bucket)
    return undefined
  }, [queue, sourcePath])

  useEffect(() => {
    if (embedded || !sourcePath) return undefined
    const url = new URL(window.location.href)
    if (url.searchParams.get('path') === sourcePath) return undefined
    url.searchParams.set('path', sourcePath)
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
    return undefined
  }, [embedded, sourcePath])

  useEffect(() => {
    if (!sourcePath) return undefined
    const node = document.querySelector(`[data-review-path="${CSS.escape(sourcePath)}"]`)
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return undefined
  }, [sourcePath, listMode])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey || busy) return
      const forward = event.key === 'ArrowDown' || event.key === 'j'
      const backward = event.key === 'ArrowUp' || event.key === 'k'
      if (!forward && !backward) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (!target.closest('[data-review-queue]')) return
      if (!visibleList.length) return
      const index = visibleList.findIndex((item) => item.sourcePath === sourcePath)
      const nextIndex = forward
        ? Math.min(visibleList.length - 1, index < 0 ? 0 : index + 1)
        : Math.max(0, index < 0 ? 0 : index - 1)
      const next = visibleList[nextIndex]
      if (!next || next.sourcePath === sourcePath) return
      event.preventDefault()
      openPath(next.sourcePath)
      requestAnimationFrame(() => {
        document.querySelector(`[data-review-path="${CSS.escape(next.sourcePath)}"]`)?.focus()
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, openPath, sourcePath, visibleList])

  function refreshQueue() {
    documentCacheRef.current.clear()
    setReady(false)
    setSnapshot(null)
    setCurrent(null)
    forceRefreshRef.current = true
    forceDocumentRefreshRef.current = true
    setReload((value) => value + 1)
  }

  function patchQueueAfterSave(targetPath, status, revision, { wasPublished } = {}) {
    setQueue((currentQueue) => {
      if (!currentQueue) return currentQueue
      const target = currentQueue.pending.find((item) => item.sourcePath === targetPath)
      const publishedBefore = wasPublished ?? target?.d1Status === 'published'
      let publishedCount = currentQueue.publishedCount
      if (status === 'published' && !publishedBefore) publishedCount += 1
      if (status !== 'published' && publishedBefore) publishedCount = Math.max(0, publishedCount - 1)
      const pendingItems = currentQueue.pending
        .map((item) => {
          if (item.sourcePath !== targetPath) return item
          return { ...item, reason: status === 'published' ? 'updated' : status, d1Status: status, revision }
        })
        .filter((item) => item.sourcePath !== targetPath || status !== 'published')
      const nextQueue = { ...currentQueue, pending: pendingItems, publishedCount }
      writeQueueCache(nextQueue)
      return nextQueue
    })
  }

  function applyPublishedDocument(targetPath, data, status) {
    const nextStatus = data.status || status
    if (targetPath === sourcePath && snapshot) {
      const nextCurrent = { revision: data.revision, status: nextStatus, source_hash: snapshot.sourceHash }
      const nextUnchanged = nextStatus === 'published'
      setCurrent(nextCurrent)
      setUnchanged(nextUnchanged)
      documentCacheRef.current.set(targetPath, { snapshot, document: nextCurrent, unchanged: nextUnchanged })
      return
    }
    documentCacheRef.current.delete(targetPath)
  }

  async function publishPath(targetPath, status, expectedRevision) {
    const response = await fetch('/api/admin/research-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath: targetPath, status, expectedRevision }),
    })
    const data = await response.json()
    if (!response.ok) {
      if (data.error === 'REVISION_CONFLICT') throw new Error('其他页面已更新此调研。请刷新后再次审批。')
      throw new Error(errorText(data, '保存失败'))
    }
    return data
  }

  async function save(status) {
    if (!sourcePath || !ready || busy) return
    setBusy(true)
    setMessage('')
    setConfirmRetire(false)
    try {
      const data = await publishPath(sourcePath, status, current?.revision || 0)
      applyPublishedDocument(sourcePath, data, status)
      patchQueueAfterSave(sourcePath, data.status || status, data.revision, {
        wasPublished: current?.status === 'published' || selectedMeta?.d1Status === 'published',
      })
      setSelectedPaths((currentSelected) => {
        const next = new Set(currentSelected)
        next.delete(sourcePath)
        return next
      })
      setMessageTone(status === 'retired' ? 'warning' : 'success')
      setMessage(data.unchanged ? 'GitHub 正文与线上一致，没有新的修订。' : `${labels[status]}，版本 ${data.revision}。`)
    } catch (error) {
      setMessageTone('danger')
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveSelected(status = 'published') {
    if (!selectedItems.length || busy) return
    setBusy(true)
    setMessage('')
    const results = []
    try {
      for (let index = 0; index < selectedItems.length; index += 1) {
        const item = selectedItems[index]
        const label = item.title || item.slug || item.filename
        setMessageTone('info')
        setMessage(`正在发布 ${index + 1}/${selectedItems.length}：${label}`)
        try {
          const expectedRevision = item.sourcePath === sourcePath ? (current?.revision || 0) : (item.revision || 0)
          const data = await publishPath(item.sourcePath, status, expectedRevision)
          applyPublishedDocument(item.sourcePath, data, status)
          patchQueueAfterSave(item.sourcePath, data.status || status, data.revision, { wasPublished: item.d1Status === 'published' })
          setSelectedPaths((currentSelected) => {
            const next = new Set(currentSelected)
            next.delete(item.sourcePath)
            return next
          })
          results.push({ ok: true, label })
        } catch (error) {
          results.push({ ok: false, label, error: error.message })
        }
      }
      const summary = summarizeBatchPublish(results)
      setMessageTone(summary.tone)
      setMessage(summary.text)
    } finally {
      setBusy(false)
    }
  }

  const syncedLabel = queue?.fetchedAt ? formatSyncedAt(queue.fetchedAt) : ''
  const category = snapshot?.entry?.category || selectedMeta?.category || ''
  const filename = snapshot?.entry?.filename || selectedMeta?.filename || ''

  const listPane = (
    <section className={paneClass} data-review-queue aria-label="调研队列">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--admin-line-soft)] px-3 py-3">
        <div className="flex min-w-0 rounded-lg bg-[#f1f2ea] p-0.5 dark:bg-[#1a222d]" role="tablist" aria-label="队列">
          {[
            ['pending', '待审批', pending.length],
            ['published', '已发布', library.length],
          ].map(([id, label, count]) => {
            const selected = listMode === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setListMode(id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium ${
                  selected
                    ? 'bg-white text-[#15140f] shadow-sm dark:bg-[#10161f] dark:text-gray-100'
                    : 'text-[#67695d] dark:text-gray-400'
                }`}
              >
                {label}
                <span className={selected ? 'text-[#8b8d82] dark:text-gray-500' : 'text-[#9a9c90] dark:text-gray-600'}>{count}</span>
              </button>
            )
          })}
        </div>
        <AdminButton type="button" variant="ghost" size="sm" disabled={busy || queueLoading} onClick={refreshQueue} title={syncedLabel || '刷新'}>
          {queueLoading ? <LoadingSpinner size="sm" /> : <IconRefresh size={15} />}
          刷新
        </AdminButton>
      </header>

      <div className="border-b border-[var(--admin-line-soft)] px-3 py-2.5">
        <div className="relative">
          <IconSearch size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b8d82]" aria-hidden="true" />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="标题、slug、文件名"
            aria-label="筛选"
            className="w-full rounded-lg border border-[#d9dbd0] bg-white py-2 pl-8 pr-3 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200"
          />
        </div>
        {listMode === 'pending' ? (
          <p className="mb-0 mt-2 text-[12px] leading-5 text-[#7a7c70] dark:text-gray-500">
            已发布但 GitHub 正文与线上不一致时会回到待处理。
            {syncedLabel ? ` ${syncedLabel}。` : ''}
          </p>
        ) : (
          <p className="mb-0 mt-2 text-[12px] leading-5 text-[#7a7c70] dark:text-gray-500">
            {queue?.repo || 'GitHub main'}
            {query ? ` · 匹配 ${visibleFiles.length} 篇` : ''}
            {syncedLabel ? ` · ${syncedLabel}` : ''}
          </p>
        )}
      </div>

      {queueLoading && !queue ? (
        <div className="min-h-0 flex-1" aria-busy="true">
          <LoadingState label="正在读取 GitHub main" detail="正在拉取待审批调研列表" size="lg" />
          <ul className="divide-y divide-[#eceee6] px-4 pb-4 dark:divide-[#1b2430]">
            {[0, 1, 2].map((index) => (
              <li key={index} className="flex items-center justify-between gap-3 py-3" style={{ '--skeleton-index': index }}>
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5 rounded-full" />
                  <Skeleton className="h-3 w-1/3 rounded-full" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain" data-review-list>
          {queueLoading ? <LoadingState className="my-3" compact label="正在同步 GitHub main" /> : null}
          {listMode === 'pending' && queue && !pending.length ? (
            <EmptyState
              title="没有待审批的调研"
              description="GitHub main 上的调研都已发布。若要撤回或重新发布某一篇，从已发布里打开。"
              action={(
                <AdminButton type="button" size="sm" onClick={() => setListMode('published')}>
                  查看已发布
                </AdminButton>
              )}
            />
          ) : null}
          {listMode === 'pending' && query && !visiblePending.length && pending.length ? (
            <EmptyState
              title="待审批里没有匹配"
              description={visibleFiles.length ? `已发布里有 ${visibleFiles.length} 篇。` : '换个标题、slug 或文件名。'}
              action={visibleFiles.length ? (
                <AdminButton type="button" size="sm" onClick={() => setListMode('published')}>在已发布中查看</AdminButton>
              ) : null}
            />
          ) : null}
          {listMode === 'published' && queue && !library.length ? (
            <EmptyState title="还没有已发布的调研" description="审批通过后会出现在这里。" />
          ) : null}
          {listMode === 'published' && query && library.length && !visibleFiles.length ? (
            <EmptyState title="没有匹配的调研" description="换个标题、slug 或文件名。" />
          ) : null}
          <ul className="space-y-0.5 px-1.5 py-1.5">
            {listMode === 'pending' ? visiblePending.map((item) => {
              const active = item.sourcePath === sourcePath
              const checked = selectedPaths.has(item.sourcePath)
              return (
                <li key={item.sourcePath}>
                  <QueueRow
                    item={item}
                    active={active}
                    busy={busy}
                    onOpen={openPath}
                    leading={(
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={() => setSelectedPaths((currentSelected) => toggleSelectedPath(currentSelected, item.sourcePath))}
                        className="h-4 w-4 shrink-0 accent-[#15140f]"
                        aria-label={`勾选 ${item.title || item.slug}`}
                      />
                    )}
                  />
                </li>
              )
            }) : visibleFiles.map((item) => (
              <li key={item.sourcePath}>
                <QueueRow
                  item={item}
                  active={item.sourcePath === sourcePath}
                  busy={busy}
                  onOpen={openPath}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {listMode === 'pending' && visiblePending.length ? (
        <div className="flex items-center justify-between gap-2 border-t border-[var(--admin-line-soft)] px-3 py-2.5">
          <label className="flex min-w-0 items-center gap-2 text-[13px] text-[#55574f] dark:text-gray-400">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={selection.all}
              disabled={busy}
              onChange={(event) => setSelectedPaths((currentSelected) => applyVisibleSelection(currentSelected, visiblePendingPaths, event.target.checked))}
              className="h-4 w-4 shrink-0 accent-[#15140f]"
              aria-label="全选当前列表"
            />
            <span>{selection.selectedCount ? `已选 ${selection.selectedCount} 篇` : '全选'}</span>
          </label>
          <AdminButton
            type="button"
            variant="primary"
            size="sm"
            disabled={busy || !selection.selectedCount}
            onClick={() => saveSelected('published')}
          >
            审批并发布
          </AdminButton>
        </div>
      ) : visibleList.length ? (
        <div className="border-t border-[var(--admin-line-soft)] px-3 py-2.5 text-[12px] text-[#8b8d82] dark:text-gray-500">
          在列表里用 ↑↓ 切换篇目
        </div>
      ) : null}
    </section>
  )

  const reviewPane = !sourcePath ? (
    <section className={paneClass}>
      <div className="flex flex-1 items-center justify-center">
        {queueLoading ? (
          <LoadingState label="正在读取调研正文" />
        ) : (
          <EmptyState title="先选一篇" description="待审批列表会在 push 之后自动出现。选中后可以直接发布或撤回。" />
        )}
      </div>
    </section>
  ) : (
    <section className={paneClass} aria-busy={!ready}>
      <header className="px-4 py-3.5 md:px-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 font-serif text-[1.15rem] font-semibold leading-7 text-[var(--admin-ink)]">
            {snapshot?.entry?.title || selectedMeta?.title || selectedMeta?.slug || '核对与发布'}
          </h2>
          {liveStatus ? (
            <StatusPill tone={STATUS_TONE[liveStatus] || 'neutral'} size="sm">
              {labels[liveStatus]} · 版本 {current.revision}
            </StatusPill>
          ) : ready ? (
            <StatusPill tone="info" size="sm">尚未写入 D1</StatusPill>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[#67695d] dark:text-gray-400">
              <LoadingSpinner size="sm" label="正在读取调研正文" />
              读取中
            </span>
          )}
        </div>
        {snapshot?.entry?.summary ? (
          <p className="mb-0 mt-1 line-clamp-2 text-[13px] leading-6 text-[#67695d] dark:text-gray-400">{snapshot.entry.summary}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#7a7c70] dark:text-gray-500">
          {category ? <span>{categoryLabels[category] || category}</span> : null}
          {snapshot?.entry?.date ? <span>{snapshot.entry.date}</span> : null}
          {filename ? <span className="font-mono">{filename}</span> : null}
          {unchanged ? <span>已按当前 GitHub 正文发布</span> : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {liveStatus === 'published' ? (
            <AdminButton href={`https://2aran.com${liveHref}`} size="sm" target="_blank" rel="noreferrer">
              <IconExternalLink size={15} />查看线上
            </AdminButton>
          ) : null}
          {githubHref ? (
            <AdminButton href={githubHref} size="sm" variant="ghost" target="_blank" rel="noreferrer">
              <IconExternalLink size={15} />GitHub
            </AdminButton>
          ) : null}
        </div>
      </header>

      {!ready ? (
        <div className="min-h-0 flex-1" aria-busy="true">
          <LoadingState label="正在读取调研正文" detail={sourcePath} size="lg" />
        </div>
      ) : snapshot?.entry?.encrypted ? (
        <div className="min-h-0 flex-1 px-4 py-4 md:px-5">
          <p className="rounded-lg border border-[#e2e3da] px-3 py-2 text-sm text-[#67695d] dark:border-[#243041] dark:text-gray-400">
            加密调研：只发布密文，不在此展示正文。
          </p>
        </div>
      ) : snapshot ? (
        <ReviewCanvas key={snapshot.sourcePath} snapshot={snapshot} />
      ) : (
        <div className="min-h-0 flex-1" />
      )}

      {message ? (
        <p role="status" className={`mx-4 mb-3 mt-3 rounded-lg border px-3 py-2 text-sm md:mx-5 ${noticeClass(messageTone)}`}>
          {message}
        </p>
      ) : null}

      <footer className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-line-soft)] px-4 py-3 md:px-5">
        {confirmRetire ? (
          <>
            <p className="mb-0 text-[13px] text-rose-700 dark:text-rose-300">撤回后读者将看不到这篇。</p>
            <div className="ml-auto flex items-center gap-2">
              <AdminButton type="button" size="sm" disabled={busy} onClick={() => setConfirmRetire(false)}>取消</AdminButton>
              <AdminButton type="button" size="sm" variant="danger" disabled={!ready || busy} onClick={() => save('retired')}>确认撤回</AdminButton>
            </div>
          </>
        ) : (
          <>
            <AdminButton type="button" variant="danger" disabled={!ready || busy} onClick={() => setConfirmRetire(true)}>撤回</AdminButton>
            <div className="ml-auto flex items-center gap-2">
              <AdminButton type="button" disabled={!ready || busy} onClick={() => save('draft')}>保存为草稿</AdminButton>
              <AdminButton type="button" variant="primary" disabled={!ready || busy} onClick={() => save('published')}>审批并发布</AdminButton>
            </div>
          </>
        )}
      </footer>
    </section>
  )

  const body = (
    <>
      {message && !sourcePath ? (
        <p role="status" className={`mb-4 rounded-lg border px-3 py-2 text-sm ${noticeClass(messageTone)}`}>{message}</p>
      ) : null}
      <div className="grid items-stretch gap-4 lg:h-[calc(100dvh-15rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
        <div className="min-h-0 min-w-0">{listPane}</div>
        <div className="min-h-0 min-w-0">{reviewPane}</div>
      </div>
    </>
  )

  if (embedded) return body
  return (
    <AdminPage
      title="审批调研"
      description="GitHub 里的 Markdown 是正本。push 之后在这里核对并发布，不用再找导出文件。"
      actions={(
        <AdminButton href="/admin/articles" variant="ghost">
          <IconArrowLeft size={16} />打开内容管理
        </AdminButton>
      )}
    >
      {body}
    </AdminPage>
  )
}
