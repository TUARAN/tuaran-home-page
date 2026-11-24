'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoadingState } from '../../components/loading/LoadingPrimitives'

import { renderMarkdown } from '../../../lib/research/markdown'

function formatTs(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

const SOURCE_META = {
  codex: { label: 'Codex 项目规则与记忆' },
  'codex-memory': { label: 'Codex 项目记忆文件' },
  claude: { label: 'Claude Code 项目记忆' },
  'ai-context': { label: '仓库 docs/context/' },
}

export default function MemoryVault() {
  const [versions, setVersions] = useState(null)
  const [manifestError, setManifestError] = useState('')
  const [active, setActive] = useState(null) // { sourceId, slug }
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

  const findFile = (sourceId, slug) => {
    for (const g of grouped) {
      if (g.sourceId !== sourceId) continue
      for (const f of g.files) if (f.slug === slug) return f
    }
    return null
  }

  const activeFile = active ? findFile(active.sourceId, active.slug) : null

  async function loadVersion(file, idx) {
    const version = file.versions[idx]
    if (!version) return
    setBusy(true)
    setLoadError('')
    try {
      const res = await fetch(`/api/admin/site-memory?id=${version.id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setContentHtml(renderMarkdown(data.content || '', { breaks: true }))
    } catch (err) {
      setLoadError(String(err?.message || err))
      setContentHtml('')
    } finally {
      setBusy(false)
    }
  }

  function selectFile(file) {
    setActive({ sourceId: file.sourceId, slug: file.slug })
    const latestIdx = file.versions.length - 1
    setVersionIdx(latestIdx)
    setContentHtml('')
    setLoadError('')
    if (latestIdx >= 0) loadVersion(file, latestIdx)
  }

  function selectVersion(file, idx) {
    setVersionIdx(idx)
    setContentHtml('')
    setLoadError('')
    loadVersion(file, idx)
  }

  if (manifestError) {
    return (
      <div className="rounded-md border border-dashed border-[#b0b1a3] bg-[#f1f2ec] p-4 text-sm text-[#575a43] dark:border-[#3a4554] dark:bg-[#161d27] dark:text-[#a9b3c4]">
        站点记忆读取失败：{manifestError}。确认已登录后台，并已执行 migration 0132。
      </div>
    )
  }

  if (!versions) {
    return (
      <LoadingState label="正在加载记忆索引" compact />
    )
  }

  const generatedAt = versions.length
    ? formatTs(versions.reduce((m, v) => (v.created_at > m ? v.created_at : m), ''))
    : '—'
  const totalFiles = grouped.reduce((a, g) => a + g.files.length, 0)
  const totalVersions = versions.length

  return (
    <div className="space-y-3">
      {/* Header: meta */}
      <div className="rounded-md border border-[#cdcfc5] bg-[#f3f4ee] p-3 dark:border-[#2b3744] dark:bg-[#0f1722]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[#67695d] dark:text-[#9aa6b7]">
          <span>更新 {generatedAt}</span>
          <span className="opacity-50">·</span>
          <span>文件 {totalFiles}</span>
          <span className="opacity-50">·</span>
          <span>版本累计 {totalVersions}</span>
        </div>
      </div>

      {/* 两栏：左侧紧凑文件树，右侧内容视图 */}
      <div className="grid gap-3 md:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Left: grouped file tree */}
        <aside className="rounded-md border border-[#cdcfc5] bg-white/70 p-2 text-sm dark:border-[#2b3744] dark:bg-[#0f1722]">
          {grouped.length === 0 && (
            <p className="px-2 py-3 text-xs text-[#767869] dark:text-[#8ea0b7]">
              暂无记录。本地跑 <code className="font-mono">pnpm snapshot-memory</code> 写入。
            </p>
          )}
          <div className="space-y-3">
            {grouped.map((group) => (
              <div key={group.sourceId}>
                <div className="flex items-baseline justify-between border-b border-[#dcdfd4] px-1.5 pb-1 dark:border-[#1c2632]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-[#8ea0b7]">
                    {group.label}
                  </span>
                  <span className="font-mono text-[10px] text-[#929587] dark:text-[#6e7a8c]">
                    {group.files.length}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {group.files.map((file) => {
                    const isActive =
                      active?.sourceId === file.sourceId && active?.slug === file.slug
                    return (
                      <li key={`${file.sourceId}/${file.slug}`}>
                        <button
                          type="button"
                          onClick={() => selectFile(file)}
                          className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs transition ${
                            isActive
                              ? 'bg-[#15140f] text-white dark:bg-[#3a4554]'
                              : 'text-[#30312b] hover:bg-[#e6e7df] dark:text-gray-300 dark:hover:bg-[#10202e]'
                          }`}
                          title={file.description || file.title}
                        >
                          <span className="truncate">{file.title}</span>
                          <span
                            className={`shrink-0 font-mono text-[10px] ${
                              isActive ? 'opacity-70' : 'opacity-50'
                            }`}
                          >
                            v{file.versions.length}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: viewer */}
        <div className="min-h-[20rem] rounded-md border border-[#cdcfc5] bg-white p-4 dark:border-[#2b3744] dark:bg-[#0b1118]">
          {!activeFile ? (
            <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-3 text-sm text-[#767869] dark:text-[#8ea0b7]">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em]">empty state</div>
              <p className="max-w-sm text-center text-[13px] leading-7">
                左侧选一个文件查看内容。
                <br />
                当前共 {totalFiles} 个文件 · {totalVersions} 个版本。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File header */}
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#dcdfd4] pb-2 dark:border-[#1c2632]">
                <div>
                  <h3 className="text-base font-semibold text-[#15140f] dark:text-gray-100">
                    {activeFile.title}
                  </h3>
                  {activeFile.description && (
                    <p className="mt-0.5 text-xs leading-6 text-[#676a5f] dark:text-gray-400">
                      {activeFile.description}
                    </p>
                  )}
                </div>
                <span className="font-mono text-[10px] text-[#929587] dark:text-[#6e7a8c]">
                  {active.sourceId}/{activeFile.slug}
                </span>
              </div>

              {/* Version timeline */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767869] dark:text-[#8ea0b7]">
                  版本：
                </span>
                {activeFile.versions.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVersion(activeFile, i)}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      i === versionIdx
                        ? 'bg-[#15140f] text-white dark:bg-[#3a4554]'
                        : 'bg-[#e6e7df] text-[#505247] hover:bg-[#d0d3c4] dark:bg-[#10202e] dark:text-[#a9b3c4] dark:hover:bg-[#172c3e]'
                    }`}
                    title={`${v.hash.slice(0, 12)}… · ${v.bytes}B`}
                  >
                    {formatTs(v.ts)}
                  </button>
                ))}
              </div>

              {/* Content */}
              {contentHtml ? (
                <article
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-pre:bg-[#1a1f28] prose-pre:text-[#dadcd3]"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              ) : (
                <div className="rounded border border-dashed border-[#c2c6b8] bg-[#f1f2ec] px-3 py-8 text-center text-xs text-[#575a43] dark:border-[#33425a] dark:bg-[#0a1119] dark:text-[#9aa6b7]">
                  {busy ? '加载中…' : loadError || '等待加载'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
