'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconArrowLeft,
  IconCopy,
  IconExternalLink,
  IconRefresh,
  IconUpload,
} from '@tabler/icons-react'

import { normalizeResearchSnapshot } from '../../../../../lib/researchDocument.mjs'
import { AdminButton, AdminPage, CollapsibleSection, EmptyState, Section, StatusPill } from '../../../components/ui'

const labels = { draft: '草稿', published: '已发布', retired: '已撤回' }
const EXPORT_COMMAND = 'node scripts/export-research-content.mjs --output /tmp/research-content.json'
const STATUS_TONE = { draft: 'warning', published: 'success', retired: 'danger' }
const fieldClass =
  'mt-1 w-full rounded-lg border border-[#d9dbd0] bg-white px-3 py-2 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200'

export default function ResearchImportConsole({ embedded = false }) {
  const fileRef = useRef(null)
  const [documents, setDocuments] = useState([])
  const [selected, setSelected] = useState(0)
  const [filter, setFilter] = useState('')
  const [fileName, setFileName] = useState('')
  const [current, setCurrent] = useState(null)
  const [ready, setReady] = useState(false)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const snapshot = documents[selected]
  const key = snapshot ? `research:${snapshot.entry.category}:${snapshot.entry.slug}` : ''
  const query = filter.trim().toLowerCase()
  const filteredIndexes = documents
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!query) return true
      return [item.entry.title, item.entry.slug, item.sourcePath].some((value) => String(value || '').toLowerCase().includes(query))
    })

  useEffect(() => {
    let active = true
    setReady(false)
    setCurrent(null)
    if (!key) return
    fetch(`/api/admin/research-documents?key=${encodeURIComponent(key)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '读取失败')
        if (active) { setCurrent(data.document); setReady(true) }
      })
      .catch((error) => { if (active) { setMessage(error.message); setMessageTone('danger') } })
    return () => { active = false }
  }, [key, reload])

  async function importFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMessage('')
    try {
      if (file.size > 32 * 1024 * 1024) throw new Error('导入包超过 32 MiB，请拆分后导入。')
      const bundle = JSON.parse(await file.text())
      if (bundle.version !== 1 || !Array.isArray(bundle.documents) || !bundle.documents.length) throw new Error('请选择调研导出工具生成的 JSON 包。')
      const seen = new Set()
      for (const item of bundle.documents) {
        const result = normalizeResearchSnapshot(item)
        if (result.error) throw new Error(`${item.sourcePath || '调研'}：${result.error}`)
        if (seen.has(result.document.contentKey)) throw new Error('导入包存在重复调研。')
        seen.add(result.document.contentKey)
      }
      setDocuments(bundle.documents)
      setSelected(0)
      setFilter('')
      setFileName(file.name)
      setMessageTone('success')
      setMessage(`已检查 ${bundle.documents.length} 篇。选择文章并核对内容后发布。`)
    } catch (error) {
      setMessageTone('danger')
      setMessage(error.message)
    }
  }

  async function save(status) {
    if (!snapshot || !ready || busy) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/admin/research-documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: { ...snapshot, status }, expectedRevision: current?.revision || 0 }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.error === 'REVISION_CONFLICT') { setReady(false); throw new Error('其他页面已更新此调研。请重新选择文章以读取最新版本，再核对发布。') }
        throw new Error(data.error || '保存失败')
      }
      setCurrent({ revision: data.revision, status, source_hash: snapshot.sourceHash })
      setMessageTone(status === 'retired' ? 'warning' : 'success')
      setMessage(`${labels[status]}，版本 ${data.revision}。`)
    } catch (error) {
      setMessageTone('danger')
      setMessage(error.message)
    }
    finally { setBusy(false) }
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(EXPORT_COMMAND)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setMessageTone('danger')
      setMessage('复制失败，请手动选择命令。')
    }
  }

  const liveHref = snapshot ? `/articles/research/${snapshot.entry.category}/${snapshot.entry.slug}` : ''
  const liveStatus = ready ? (current ? current.status : null) : null
  const optionIndexes = filteredIndexes.some(({ index }) => index === selected)
    ? filteredIndexes
    : snapshot
      ? [{ item: snapshot, index: selected }, ...filteredIndexes]
      : filteredIndexes

  const body = (
      <div className="space-y-4">
        <Section
          title="选择导出包"
          description="本地仓库生成 JSON 后在这里上传。源哈希用于追踪版本，不是服务器验签。"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-[#e2e3da] bg-[#f7f7f2] px-3 py-2 font-mono text-[12.5px] leading-6 text-[#3f4039] dark:border-[#243041] dark:bg-[#151c26] dark:text-gray-300">
              {EXPORT_COMMAND}
            </code>
            <AdminButton type="button" onClick={copyCommand}>
              <IconCopy size={15} />{copied ? '已复制' : '复制命令'}
            </AdminButton>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              disabled={busy}
              className="hidden"
              onChange={importFile}
            />
            <AdminButton type="button" variant="primary" disabled={busy} onClick={() => fileRef.current?.click()}>
              <IconUpload size={16} />选择 JSON 包
            </AdminButton>
            <span className="text-[13px] text-[#7a7c70] dark:text-gray-500">
              {fileName || '尚未选择文件'}
            </span>
          </div>
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

        {!snapshot ? (
          <Section title="核对与发布">
            <EmptyState
              title="还没有导入包"
              description="先在仓库导出 JSON，再选择文件。可以只导出要发布的那一篇，不必把历史调研整包再导一遍。"
            />
          </Section>
        ) : (
          <Section
            title="核对与发布"
            description="草稿和撤回会隐藏同一路径的历史归档。导入包须由可信的本地仓库生成。"
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
            {documents.length > 8 ? (
              <label className="mb-3 block text-xs text-[#67695d] dark:text-gray-400">
                筛选调研
                <input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="标题、slug 或源路径"
                  className={fieldClass}
                />
              </label>
            ) : null}
            <label className="block text-xs text-[#67695d] dark:text-gray-400">
              选择调研
              <select
                className={fieldClass}
                value={selected}
                disabled={busy}
                onChange={(event) => { setSelected(Number(event.target.value)); setMessage('') }}
              >
                {optionIndexes.map(({ item, index }) => (
                  <option value={index} key={`${item.entry.category}/${item.entry.slug}`}>
                    {item.entry.title}
                  </option>
                ))}
              </select>
            </label>
            {query && !filteredIndexes.length ? (
              <p className="mt-2 text-[13px] text-[#7a7c70]">没有匹配的调研，下拉框仍显示当前选中篇。</p>
            ) : null}

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['源文件', snapshot.sourcePath],
                ['SHA-256', snapshot.sourceHash],
                ['访问路径', liveHref],
                ['当前状态', ready ? (current ? `${labels[current.status]} · 版本 ${current.revision}` : '尚未写入 D1（可能有历史归档）') : '读取中或暂时不可用'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#eceee6] bg-[#fbfbf8] px-3 py-2.5 dark:border-[#243041] dark:bg-[#151c26]">
                  <dt className="text-[11px] tracking-wide text-[#8b8d82] dark:text-gray-500">{label}</dt>
                  <dd className="mb-0 mt-1 break-all font-mono text-[12.5px] leading-5 text-[#3f4039] dark:text-gray-200">{value}</dd>
                </div>
              ))}
            </dl>

            {snapshot.entry.encrypted ? (
              <p className="mt-4 rounded-lg border border-[#e2e3da] px-3 py-2 text-sm text-[#67695d] dark:border-[#243041] dark:text-gray-400">
                加密调研：仅上传密文，不在此展示正文。
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {(snapshot.entry.variants.length ? snapshot.entry.variants : [{ id: 'body', label: '正文', content: snapshot.entry.content }]).map((variant, index) => (
                  <CollapsibleSection
                    key={variant.id}
                    id={`research-import-variant-${variant.id}`}
                    title={variant.label || variant.id}
                    defaultOpen={index === 0}
                  >
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">{variant.content}</pre>
                  </CollapsibleSection>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AdminButton type="button" variant="ghost" disabled={busy} onClick={() => setReload((value) => value + 1)}>
                <IconRefresh size={15} />刷新发布状态
              </AdminButton>
              {liveStatus === 'published' ? (
                <AdminButton href={`https://2aran.com${liveHref}`} size="sm" target="_blank" rel="noreferrer">
                  <IconExternalLink size={15} />查看线上
                </AdminButton>
              ) : null}
              <span className="mx-1 hidden h-5 w-px bg-[#e2e3da] sm:block dark:bg-[#2d3744]" />
              <AdminButton type="button" disabled={!ready || busy} onClick={() => save('draft')}>保存为草稿</AdminButton>
              <AdminButton type="button" variant="primary" disabled={!ready || busy} onClick={() => save('published')}>发布当前调研</AdminButton>
              <AdminButton type="button" variant="danger" disabled={!ready || busy} onClick={() => save('retired')}>撤回当前调研</AdminButton>
            </div>
          </Section>
        )}
      </div>
  )

  if (embedded) return body
  return (
    <AdminPage
      title="导入调研"
      description="从 Git 导出调研快照，核对后逐篇发布。正文修改请回到 Markdown 源文件，再重新导入。"
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
