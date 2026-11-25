'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoadingState } from '../../../components/loading/LoadingPrimitives'
import BookNavigation from '../../components/BookNavigation'
import { BookCover, BookProse, BookShell, BookSpread, PaperPage } from '../../components/ResearchBook'
import styles from '../../components/ResearchBook.module.css'
import { renderMarkdown } from '../../../../lib/research/markdown'

const BOOK_TITLE = '站点记忆'

const SOURCE_META = {
  codex: { label: 'Codex 项目规则与记忆' },
  'codex-memory': { label: 'Codex 项目记忆文件' },
  claude: { label: 'Claude Code 项目记忆' },
  'ai-context': { label: '仓库 docs/context/' },
}

function formatTs(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fileKey = (file) => `${file.sourceId}/${file.slug}`

export default function MemoryVault({ description }) {
  const [versions, setVersions] = useState(null)
  const [manifestError, setManifestError] = useState('')
  const [activeKey, setActiveKey] = useState('overview')
  const [versionIdx, setVersionIdx] = useState(-1)
  const [contentHtml, setContentHtml] = useState('')
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/admin/site-memory', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => setVersions(data.versions || []))
      .catch((e) => setManifestError(String(e?.message || e)))
  }, [])

  const grouped = useMemo(() => {
    if (!versions) return []
    const sources = new Map()
    for (const v of versions) {
      if (!sources.has(v.source_id)) sources.set(v.source_id, new Map())
      const files = sources.get(v.source_id)
      if (!files.has(v.slug)) {
        files.set(v.slug, { sourceId: v.source_id, slug: v.slug, title: v.title, description: v.description, versions: [] })
      }
      const file = files.get(v.slug)
      file.title = v.title
      file.description = v.description
      file.versions.push({ id: v.id, ts: v.created_at, hash: v.hash, bytes: v.bytes })
    }
    return [...sources.entries()].map(([sourceId, files]) => ({
      sourceId,
      label: SOURCE_META[sourceId]?.label || sourceId,
      files: [...files.values()].sort((x, y) => x.title.localeCompare(y.title)),
    }))
  }, [versions])

  const fileByKey = useMemo(() => {
    const map = new Map()
    for (const g of grouped) for (const f of g.files) map.set(fileKey(f), f)
    return map
  }, [grouped])

  const navGroups = useMemo(() => [
    { id: 'preface', label: '序', items: [{ id: 'overview', title: '翻开站点记忆' }] },
    ...grouped.map((g) => ({
      id: g.sourceId,
      label: `${g.label} · ${g.files.length}`,
      items: g.files.map((f) => ({ id: fileKey(f), title: `${f.title} · v${f.versions.length}` })),
    })),
  ], [grouped])

  const activeFile = fileByKey.get(activeKey) || null

  async function loadVersion(file, idx) {
    const version = file.versions[idx]
    if (!version) return
    setVersionIdx(idx)
    setContentHtml('')
    setLoadError('')
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/site-memory?id=${version.id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setContentHtml(renderMarkdown(data.content || '', { breaks: true }))
    } catch (err) {
      setLoadError(String(err?.message || err))
    } finally {
      setBusy(false)
    }
  }

  function select(id) {
    setActiveKey(id)
    const file = fileByKey.get(id)
    if (file) loadVersion(file, file.versions.length - 1)
  }

  const totalFiles = grouped.reduce((a, g) => a + g.files.length, 0)
  const totalVersions = versions?.length || 0
  const generatedAt = totalVersions
    ? formatTs(versions.reduce((m, v) => (v.created_at > m ? v.created_at : m), ''))
    : '—'

  let page
  if (manifestError) {
    page = (
      <PaperPage title="读取失败" summary={`站点记忆读取失败：${manifestError}。确认已登录后台，并已执行 migration 0132。`} running={BOOK_TITLE} folio={false} />
    )
  } else if (!versions) {
    page = (
      <PaperPage running={BOOK_TITLE} folio={false}>
        <LoadingState label="正在加载记忆索引" compact />
      </PaperPage>
    )
  } else if (!activeFile) {
    page = (
      <PaperPage chapter="序" title="翻开站点记忆" summary={`更新 ${generatedAt} · 文件 ${totalFiles} · 版本累计 ${totalVersions}`} running={BOOK_TITLE} folio={false}>
        <BookProse>
          <p className="text-[14px] leading-7">
            在左侧目录选一份快照，正文自动加载；沿版本时间线切换历史版本。
          </p>
          <p className="mt-3 text-[13px] leading-7 opacity-80">
            内容存放在 D1，只通过后台 owner 鉴权的接口读取，不进仓库和公开静态目录。本地运行 <code className="font-mono">pnpm snapshot-memory</code> 写入新版本。
          </p>
        </BookProse>
      </PaperPage>
    )
  } else {
    const group = grouped.find((g) => g.sourceId === activeFile.sourceId)
    page = (
      <PaperPage chapter={group?.label} title={activeFile.title} summary={activeFile.description} running={BOOK_TITLE} folio={false}>
        <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-[var(--rb-line)] pb-3">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--rb-faint)]">版本</span>
          {activeFile.versions.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => loadVersion(activeFile, i)}
              aria-pressed={i === versionIdx}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition ${
                i === versionIdx
                  ? 'bg-[var(--rb-gold)] text-[var(--rb-paper)]'
                  : 'bg-[var(--rb-paper-2)] text-[var(--rb-ink-soft)] hover:bg-[var(--rb-gold-soft)]'
              }`}
              title={`${v.hash.slice(0, 12)}… · ${v.bytes}B`}
            >
              {formatTs(v.ts)}
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] text-[var(--rb-faint)]">{fileKey(activeFile)}</span>
        </div>
        {contentHtml ? (
          <article
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-pre:bg-[#1a1f28] prose-pre:text-[#dadcd3]"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <p className="py-8 text-center text-xs text-[var(--rb-faint)]">{busy ? '加载中…' : loadError || '等待加载'}</p>
        )}
      </PaperPage>
    )
  }

  return (
    <BookShell>
      <BookCover title={BOOK_TITLE} subtitle={description} edition="站长手册" spine={BOOK_TITLE} line="" />
      <BookSpread>
        <BookNavigation title={BOOK_TITLE} groups={navGroups} activeId={activeKey} onSelect={select} />
        <div className={styles.chapters}>{page}</div>
      </BookSpread>
    </BookShell>
  )
}
