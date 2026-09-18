'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  IconArrowLeft,
  IconExternalLink,
  IconRefresh,
} from '@tabler/icons-react'

import { LoadingSpinner, LoadingState, Skeleton } from '../../../../components/loading/LoadingPrimitives'
import { renderMarkdown } from '../../../../../lib/research/markdown'
import { AdminButton, AdminPage, EmptyState, Section, StatusPill } from '../../../components/ui'
import {
  applyVisibleSelection,
  pruneSelectedPaths,
  summarizeBatchPublish,
  toggleSelectedPath,
  visibleSelectionState,
} from './researchApprovalSelection'

const labels = { draft: '草稿', published: '已发布', retired: '已撤回' }
const reasonLabels = { new: '待审批', draft: '草稿', retired: '已撤回', updated: '正文已改' }
const STATUS_TONE = { draft: 'warning', published: 'success', retired: 'danger' }
const fieldClass =
  'mt-1 w-full rounded-lg border border-[#d9dbd0] bg-white px-3 py-2 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200'
const QUEUE_CACHE_KEY = 'admin-research-approval-queue-v1'
const QUEUE_CACHE_TTL_MS = 5 * 60 * 1000
const QUEUE_FRESH_MS = 20 * 1000

function errorText(data, fallback) {
  return data?.message || data?.error || fallback
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

function ResearchReviewPreview({ snapshot }) {
  const variants = previewVariants(snapshot)
  const [variantId, setVariantId] = useState(variants[0]?.id || 'body')
  const [view, setView] = useState('preview')
  const active = variants.find((item) => item.id === variantId) || variants[0]
  const html = useMemo(
    () => renderMarkdown(active?.content || '', { images: snapshot?.entry?.images || [] }),
    [active?.content, snapshot?.entry?.images],
  )

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
          <p className="text-[12px] text-[#8b8d82] dark:text-gray-500">阅览按线上正文排版，可随时对照原文。</p>
        )}
        <div className="flex rounded-lg bg-[#f1f2ea] p-0.5 dark:bg-[#1a222d]">
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
      <div className="max-h-[min(72vh,54rem)] overflow-auto rounded-xl border border-[#eceee6] bg-white px-5 py-5 dark:border-[#243041] dark:bg-[#0f141c]">
        {view === 'source' ? (
          <pre className="mb-0 whitespace-pre-wrap font-mono text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">{active?.content || ''}</pre>
        ) : (
          <article className="prose-tuaran mb-0 max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  )
}

export default function ResearchImportConsole({ embedded = false }) {
  const searchParams = useSearchParams()
  const requestedPath = searchParams.get('path') || ''
  const [queue, setQueue] = useState(null)
  const [queueLoading, setQueueLoading] = useState(true)
  const [sourcePath, setSourcePath] = useState(requestedPath)
  const [filter, setFilter] = useState('')
  const [snapshot, setSnapshot] = useState(null)
  const [current, setCurrent] = useState(null)
  const [unchanged, setUnchanged] = useState(false)
  const [ready, setReady] = useState(false)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const [selectedPaths, setSelectedPaths] = useState(() => new Set())
  const selectAllRef = useRef(null)
  const documentCacheRef = useRef(new Map())
  const forceRefreshRef = useRef(false)
  const forceDocumentRefreshRef = useRef(false)

  const pending = queue?.pending || []
  const files = queue?.files || []
  const query = filter.trim().toLowerCase()
  const visiblePending = useMemo(() => {
    if (!query) return pending
    return pending.filter((item) => [item.title, item.slug, item.filename, item.sourcePath, item.reason].some((value) => String(value || '').toLowerCase().includes(query)))
  }, [pending, query])
  const visibleFiles = useMemo(() => {
    if (!query) return files
    return files.filter((item) => [item.title, item.slug, item.filename, item.sourcePath].some((value) => String(value || '').toLowerCase().includes(query)))
  }, [files, query])
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

  function noticeClass(tone) {
    if (tone === 'danger') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
    if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
    if (tone === 'info') return 'border-[#d9dbd0] bg-[#f7f8f3] text-[#55574f] dark:border-[#243041] dark:bg-[#151c26] dark:text-gray-300'
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
  }

  const listPane = (
    <Section
      title="待审批"
      description="push 到 GitHub main 之后会出现在这里。点开右侧核对，也可以勾选后一次发布多篇。"
      actions={
        <AdminButton type="button" variant="ghost" disabled={busy || queueLoading} onClick={refreshQueue}>
          {queueLoading ? <LoadingSpinner size="sm" /> : <IconRefresh size={15} />}
          刷新
        </AdminButton>
      }
    >
      {queue ? (
        <p className="mb-3 text-[13px] text-[#7a7c70] dark:text-gray-500">
          {queue.repo} · 待处理 {pending.length} 篇 · 已发布 {queue.publishedCount} 篇。已发布但 GitHub 正文与线上不一致时会回到待处理。
          {queue.fetchedAt ? ` · ${formatSyncedAt(queue.fetchedAt)}` : ''}
        </p>
      ) : null}
      {queueLoading && !queue ? (
        <div className="rounded-xl border border-[#eceee6] dark:border-[#243041]" aria-busy="true">
          <LoadingState
            label="正在读取 GitHub main"
            detail="正在拉取待审批调研列表"
            size="lg"
          />
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
        <>
          <label className="block text-xs text-[#67695d] dark:text-gray-400">
            筛选
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="标题、slug、文件名"
              className={fieldClass}
            />
          </label>
          {queueLoading ? (
            <LoadingState className="my-3" compact label="正在同步 GitHub main" />
          ) : null}
          {queue && !pending.length ? (
            <div className="mt-4">
              <EmptyState
                title="没有待审批的调研"
                description="GitHub main 上的调研都已发布。若要撤回或重新发布某一篇，用下面的列表选中即可。"
              />
            </div>
          ) : (
            <>
              {visiblePending.length ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex min-w-0 items-center gap-2 text-[13px] text-[#55574f] dark:text-gray-400">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={selection.all}
                      disabled={busy}
                      onChange={(event) => setSelectedPaths((current) => applyVisibleSelection(current, visiblePendingPaths, event.target.checked))}
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
              ) : null}
              {message && (busy || selection.selectedCount) ? (
                <p role="status" className={`mt-3 rounded-lg border px-3 py-2 text-sm ${noticeClass(messageTone)}`}>
                  {message}
                </p>
              ) : null}
              <ul className="mt-2 max-h-[min(56vh,36rem)] divide-y divide-[#eceee6] overflow-auto dark:divide-[#1b2430] lg:max-h-[calc(100vh-22rem)]">
                {visiblePending.map((item) => {
                  const active = item.sourcePath === sourcePath
                  const checked = selectedPaths.has(item.sourcePath)
                  return (
                    <li key={item.sourcePath}>
                      <div
                        className={`flex items-center gap-2 rounded-lg px-2 py-2.5 ${
                          active
                            ? 'bg-[#f3f4ee] text-[#15140f] dark:bg-[#151c26] dark:text-gray-100'
                            : 'text-[#55574f] hover:bg-[#f7f8f3] dark:text-gray-400 dark:hover:bg-[#121820]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={busy}
                          onChange={() => setSelectedPaths((current) => toggleSelectedPath(current, item.sourcePath))}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 shrink-0 accent-[#15140f]"
                          aria-label={`勾选 ${item.title || item.slug}`}
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => { setSourcePath(item.sourcePath); setMessage('') }}
                          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{item.title || item.slug}</span>
                            <span className="block truncate font-mono text-[12px] text-[#8b8d82]">{item.filename}</span>
                          </span>
                          <StatusPill tone={item.reason === 'updated' ? 'info' : item.reason === 'retired' ? 'danger' : 'warning'} size="sm">
                            {reasonLabels[item.reason] || item.reason}
                          </StatusPill>
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </>
      )}
      {query && !visiblePending.length && visibleFiles.length ? (
        <label className="mt-4 block text-xs text-[#67695d] dark:text-gray-400">
          已发布篇目
          <select
            className={fieldClass}
            value={sourcePath}
            disabled={busy}
            onChange={(event) => { setSourcePath(event.target.value); setMessage('') }}
          >
            {visibleFiles.map((item) => (
              <option value={item.sourcePath} key={item.sourcePath}>{item.title || item.filename}</option>
            ))}
          </select>
        </label>
      ) : null}
    </Section>
  )

  const reviewPane = !sourcePath ? (
    queueLoading ? null : (
      <Section title="核对与发布">
        <EmptyState title="先选一篇" description="待审批列表会在 push 之后自动出现。选中后可以直接发布或撤回。" />
      </Section>
    )
  ) : (
    <Section
      title={snapshot?.entry?.title || selectedMeta?.title || selectedMeta?.slug || '核对与发布'}
      description={snapshot?.entry?.summary || '核对 GitHub 正文后发布'}
      actions={
        liveStatus ? (
          <StatusPill tone={STATUS_TONE[liveStatus] || 'neutral'} size="sm">
            {labels[liveStatus]} · 版本 {current.revision}
          </StatusPill>
        ) : ready ? (
          <StatusPill tone="info" size="sm">尚未写入 D1</StatusPill>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#67695d] dark:text-gray-400">
            <LoadingSpinner size="sm" label="正在读取调研正文" />
            读取中
          </span>
        )
      }
    >
      {!ready ? (
        <div className="rounded-xl border border-[#eceee6] dark:border-[#243041]" aria-busy="true">
          <LoadingState
            label="正在读取调研正文"
            detail={sourcePath}
            size="lg"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#7a7c70] dark:text-gray-500">
            <span>{snapshot?.entry?.category || selectedMeta?.category}</span>
            <span className="font-mono">{snapshot?.entry?.filename || selectedMeta?.filename}</span>
            {snapshot?.entry?.date ? <span>{snapshot.entry.date}</span> : null}
            {unchanged ? <span>已按当前 GitHub 正文发布</span> : null}
          </div>
          {snapshot?.entry?.encrypted ? (
            <p className="mt-4 rounded-lg border border-[#e2e3da] px-3 py-2 text-sm text-[#67695d] dark:border-[#243041] dark:text-gray-400">
              加密调研：只发布密文，不在此展示正文。
            </p>
          ) : snapshot ? (
            <ResearchReviewPreview key={snapshot.sourcePath} snapshot={snapshot} />
          ) : null}
        </>
      )}

      {message ? (
        <p role="status" className={`mt-4 rounded-lg border px-3 py-2 text-sm ${noticeClass(messageTone)}`}>
          {message}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--admin-line-soft)] bg-[var(--admin-surface)] pt-3">
        {liveStatus === 'published' ? (
          <AdminButton href={`https://2aran.com${liveHref}`} size="sm" target="_blank" rel="noreferrer">
            <IconExternalLink size={15} />查看线上
          </AdminButton>
        ) : null}
        {githubHref ? (
          <AdminButton href={githubHref} size="sm" target="_blank" rel="noreferrer">
            <IconExternalLink size={15} />GitHub
          </AdminButton>
        ) : null}
        <AdminButton type="button" disabled={!ready || busy} onClick={() => save('draft')}>保存为草稿</AdminButton>
        <AdminButton type="button" variant="primary" disabled={!ready || busy} onClick={() => save('published')}>审批并发布</AdminButton>
        <AdminButton type="button" variant="danger" disabled={!ready || busy} onClick={() => save('retired')}>撤回</AdminButton>
      </div>
    </Section>
  )

  const body = (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
      <div className="min-w-0">{listPane}</div>
      <div className="min-w-0">{reviewPane}</div>
    </div>
  )

  if (embedded) return body
  return (
    <AdminPage
      title="审批调研"
      description="GitHub 里的 Markdown 是正本。push 之后在这里核对并发布，不用再找导出文件。"
      actions={(
        <AdminButton href="/admin/articles?panel=import" variant="ghost">
          <IconArrowLeft size={16} />打开内容管理
        </AdminButton>
      )}
    >
      {body}
    </AdminPage>
  )
}
