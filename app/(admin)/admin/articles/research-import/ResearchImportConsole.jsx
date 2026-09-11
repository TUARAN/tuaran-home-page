'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  IconArrowLeft,
  IconExternalLink,
  IconRefresh,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, CollapsibleSection, EmptyState, Section, StatusPill } from '../../../components/ui'

const labels = { draft: '草稿', published: '已发布', retired: '已撤回' }
const reasonLabels = { new: '待审批', draft: '草稿', retired: '已撤回', updated: 'Git 有更新' }
const STATUS_TONE = { draft: 'warning', published: 'success', retired: 'danger' }
const fieldClass =
  'mt-1 w-full rounded-lg border border-[#d9dbd0] bg-white px-3 py-2 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200'

function errorText(data, fallback) {
  return data?.message || data?.error || fallback
}

export default function ResearchImportConsole({ embedded = false }) {
  const searchParams = useSearchParams()
  const requestedPath = searchParams.get('path') || ''
  const [queue, setQueue] = useState(null)
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

  useEffect(() => {
    let active = true
    fetch('/api/admin/research-documents?queue=1', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(errorText(data, '读取待审批列表失败'))
        if (!active) return
        setQueue(data)
        setSourcePath((currentPath) => {
          if (currentPath && (data.pending.some((item) => item.sourcePath === currentPath) || data.files.some((item) => item.sourcePath === currentPath))) return currentPath
          if (requestedPath && (data.pending.some((item) => item.sourcePath === requestedPath) || data.files.some((item) => item.sourcePath === requestedPath))) return requestedPath
          return data.pending[0]?.sourcePath || ''
        })
      })
      .catch((error) => {
        if (!active) return
        setMessageTone('danger')
        setMessage(error.message)
      })
    return () => { active = false }
  }, [reload, requestedPath])

  useEffect(() => {
    let active = true
    setReady(false)
    setSnapshot(null)
    setCurrent(null)
    setUnchanged(false)
    if (!sourcePath) return
    fetch(`/api/admin/research-documents?sourcePath=${encodeURIComponent(sourcePath)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(errorText(data, '读取 GitHub 正文失败'))
        if (!active) return
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
  }, [sourcePath])

  async function save(status) {
    if (!sourcePath || !ready || busy) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/research-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePath, status, expectedRevision: current?.revision || 0 }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.error === 'REVISION_CONFLICT') throw new Error('其他页面已更新此调研。请刷新后再次审批。')
        throw new Error(errorText(data, '保存失败'))
      }
      setCurrent({ revision: data.revision, status: data.status || status, source_hash: snapshot?.sourceHash })
      setUnchanged((data.status || status) === 'published')
      setMessageTone(status === 'retired' ? 'warning' : 'success')
      setMessage(data.unchanged ? 'GitHub 正文与线上一致，没有新的修订。' : `${labels[status]}，版本 ${data.revision}。`)
      setReload((value) => value + 1)
    } catch (error) {
      setMessageTone('danger')
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const body = (
    <div className="space-y-4">
      <Section
        title="待审批"
        description="push 到 GitHub main 之后，这里会列出尚未发布或刚改过的调研。点开核对，再发布。不必导出 JSON，也不必找本地路径。"
        actions={
          <AdminButton type="button" variant="ghost" disabled={busy} onClick={() => setReload((value) => value + 1)}>
            <IconRefresh size={15} />刷新列表
          </AdminButton>
        }
      >
        {queue ? (
          <p className="mb-3 text-[13px] text-[#7a7c70] dark:text-gray-500">
            {queue.repo} · 待处理 {pending.length} 篇 · 已发布 {queue.publishedCount} 篇
          </p>
        ) : (
          <p className="mb-3 text-[13px] text-[#7a7c70]">正在读取 GitHub main…</p>
        )}
        <label className="block text-xs text-[#67695d] dark:text-gray-400">
          筛选
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="标题、slug、文件名"
            className={fieldClass}
          />
        </label>
        {queue && !pending.length ? (
          <div className="mt-4">
            <EmptyState
              title="没有待审批的调研"
              description="GitHub main 上的调研都已发布。若要撤回或重新发布某一篇，用下面的列表选中即可。"
            />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[#eceee6] dark:divide-[#1b2430]">
            {visiblePending.map((item) => {
              const active = item.sourcePath === sourcePath
              return (
                <li key={item.sourcePath}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setSourcePath(item.sourcePath); setMessage('') }}
                    className={`flex w-full items-center justify-between gap-3 px-1 py-3 text-left ${active ? 'text-[#15140f] dark:text-gray-100' : 'text-[#55574f] dark:text-gray-400'}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.title || item.slug}</span>
                      <span className="block truncate font-mono text-[12px] text-[#8b8d82]">{item.filename}</span>
                    </span>
                    <StatusPill tone={item.reason === 'updated' ? 'info' : item.reason === 'retired' ? 'danger' : 'warning'} size="sm">
                      {reasonLabels[item.reason] || item.reason}
                    </StatusPill>
                  </button>
                </li>
              )
            })}
          </ul>
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

      {message ? (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            messageTone === 'danger'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
              : messageTone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
          }`}
        >
          {message}
        </p>
      ) : null}

      {!sourcePath ? (
        <Section title="核对与发布">
          <EmptyState title="先选一篇" description="待审批列表会在 push 之后自动出现。选中后可以直接发布或撤回。" />
        </Section>
      ) : (
        <Section
          title="核对与发布"
          description="发布写入的是 GitHub main 上的当前正文，不是本地导出包。"
          actions={
            liveStatus ? (
              <StatusPill tone={STATUS_TONE[liveStatus] || 'neutral'} size="sm">
                {labels[liveStatus]} · 版本 {current.revision}
              </StatusPill>
            ) : ready ? (
              <StatusPill tone="info" size="sm">尚未写入 D1</StatusPill>
            ) : (
              <StatusPill tone="neutral" size="sm">读取中</StatusPill>
            )
          }
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['源文件', sourcePath],
              ['标题', snapshot?.entry?.title || selectedMeta?.title || selectedMeta?.slug || '读取中'],
              ['SHA-256', snapshot?.sourceHash || '读取中'],
              ['当前状态', ready ? (current ? `${labels[current.status]} · 版本 ${current.revision}` : '尚未写入 D1') : '读取中'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#eceee6] bg-[#fbfbf8] px-3 py-2.5 dark:border-[#243041] dark:bg-[#151c26]">
                <dt className="text-[11px] tracking-wide text-[#8b8d82] dark:text-gray-500">{label}</dt>
                <dd className="mb-0 mt-1 break-all font-mono text-[12.5px] leading-5 text-[#3f4039] dark:text-gray-200">{value}</dd>
              </div>
            ))}
          </dl>
          {unchanged ? (
            <p className="mt-4 rounded-lg border border-[#e2e3da] px-3 py-2 text-sm text-[#67695d] dark:border-[#243041] dark:text-gray-400">
              这篇已经按当前 GitHub 正文发布过。
            </p>
          ) : null}

          {snapshot?.entry?.encrypted ? (
            <p className="mt-4 rounded-lg border border-[#e2e3da] px-3 py-2 text-sm text-[#67695d] dark:border-[#243041] dark:text-gray-400">
              加密调研：只发布密文，不在此展示正文。
            </p>
          ) : snapshot ? (
            <div className="mt-4 space-y-3">
              {(snapshot.entry.variants.length ? snapshot.entry.variants : [{ id: 'body', label: '正文', content: snapshot.entry.content }]).map((variant, index) => (
                <CollapsibleSection
                  key={variant.id}
                  id={`research-review-variant-${variant.id}`}
                  title={variant.label || variant.id}
                  defaultOpen={index === 0}
                >
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">{variant.content}</pre>
                </CollapsibleSection>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {liveStatus === 'published' ? (
              <AdminButton href={`https://2aran.com${liveHref}`} size="sm" target="_blank" rel="noreferrer">
                <IconExternalLink size={15} />查看线上
              </AdminButton>
            ) : null}
            <AdminButton type="button" disabled={!ready || busy} onClick={() => save('draft')}>保存为草稿</AdminButton>
            <AdminButton type="button" variant="primary" disabled={!ready || busy} onClick={() => save('published')}>审批并发布</AdminButton>
            <AdminButton type="button" variant="danger" disabled={!ready || busy} onClick={() => save('retired')}>撤回</AdminButton>
          </div>
        </Section>
      )}
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
