'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'

// 与 scripts/snapshot-memory.mjs 严格一致的解密
async function deriveKey(passphrase, salt, iterations) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
}

function b64ToBytes(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function decryptBlob(blob, passphrase) {
  const salt = b64ToBytes(blob.kdf.salt)
  const iv = b64ToBytes(blob.iv)
  const ct = b64ToBytes(blob.ciphertext)
  const key = await deriveKey(passphrase, salt, blob.kdf.iter)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

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

export default function MemoryVault() {
  const [manifest, setManifest] = useState(null)
  const [manifestError, setManifestError] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [active, setActive] = useState(null) // { sourceId, slug }
  const [versionIdx, setVersionIdx] = useState(-1)
  const [decryptedHtml, setDecryptedHtml] = useState('')
  const [decryptError, setDecryptError] = useState('')
  const [busy, setBusy] = useState(false)
  const [revealPwd, setRevealPwd] = useState(false)
  const decryptTimer = useRef(null)

  useEffect(() => {
    fetch('/data/memory/manifest.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setManifest)
      .catch((e) => setManifestError(String(e?.message || e)))
  }, [])

  // 按源分组的文件列表（保留 manifest 里的顺序，源内按标题排）
  const grouped = useMemo(() => {
    if (!manifest?.sources) return []
    return Object.entries(manifest.sources).map(([sid, src]) => ({
      sourceId: sid,
      label: src.label,
      description: src.description,
      files: Object.entries(src.files || {})
        .map(([slug, file]) => ({
          sourceId: sid,
          slug,
          title: file.title,
          description: file.description,
          versions: file.versions || [],
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
  }, [manifest])

  const findFile = (sourceId, slug) => {
    for (const g of grouped) {
      if (g.sourceId !== sourceId) continue
      for (const f of g.files) if (f.slug === slug) return f
    }
    return null
  }

  const activeFile = active ? findFile(active.sourceId, active.slug) : null

  async function decryptVersion(file, idx, pwd) {
    const passToUse = pwd ?? passphrase
    if (!passToUse) return
    const version = file.versions[idx]
    if (!version) return
    setBusy(true)
    setDecryptError('')
    try {
      const res = await fetch(`/data/memory/${version.path}`, {
        cache: 'force-cache',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.json()
      const plaintext = await decryptBlob(blob, passToUse)
      const html = marked.parse(plaintext, { breaks: true })
      setDecryptedHtml(html)
      setUnlocked(true)
    } catch (err) {
      const msg = String(err?.message || err)
      if (msg.includes('OperationError') || msg.includes('decrypt')) {
        setDecryptError('解密失败，密码错误或密文损坏')
      } else {
        setDecryptError(msg)
      }
      setDecryptedHtml('')
    } finally {
      setBusy(false)
    }
  }

  function selectFile(file) {
    setActive({ sourceId: file.sourceId, slug: file.slug })
    const latestIdx = file.versions.length - 1
    setVersionIdx(latestIdx)
    setDecryptedHtml('')
    setDecryptError('')
    if (passphrase && latestIdx >= 0) decryptVersion(file, latestIdx)
  }

  function selectVersion(file, idx) {
    setVersionIdx(idx)
    setDecryptedHtml('')
    setDecryptError('')
    if (passphrase) decryptVersion(file, idx)
  }

  // 密码变了 + 已选文件 → 防抖自动尝试解密
  useEffect(() => {
    if (decryptTimer.current) clearTimeout(decryptTimer.current)
    if (!passphrase || !activeFile || versionIdx < 0) return
    decryptTimer.current = setTimeout(() => {
      decryptVersion(activeFile, versionIdx)
    }, 300)
    return () => {
      if (decryptTimer.current) clearTimeout(decryptTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passphrase])

  if (manifestError) {
    return (
      <div className="rounded-md border border-dashed border-[#c8b9a3] bg-[#fbf6ec] p-4 text-sm text-[#7c6643] dark:border-[#3a4554] dark:bg-[#161d27] dark:text-[#a9b3c4]">
        manifest 读取失败：{manifestError}。先在本地跑一次 <code className="font-mono">pnpm snapshot-memory</code> 并 commit。
      </div>
    )
  }

  if (!manifest) {
    return (
      <div className="text-sm text-[#76705f] dark:text-gray-400">manifest 加载中…</div>
    )
  }

  const generatedAt = manifest.generatedAt ? formatTs(manifest.generatedAt) : '—'
  const totalFiles = grouped.reduce((a, g) => a + g.files.length, 0)
  const totalVersions = grouped.reduce(
    (a, g) => a + g.files.reduce((b, f) => b + f.versions.length, 0),
    0,
  )

  return (
    <div className="space-y-3">
      {/* Header: meta + password 一行搞定 */}
      <div className="rounded-md border border-[#dcd4c5] bg-[#fbf7ee] p-3 dark:border-[#2b3744] dark:bg-[#0f1722]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[#7a6f5d] dark:text-[#9aa6b7]">
          <span>更新 {generatedAt}</span>
          <span className="opacity-50">·</span>
          <span>文件 {totalFiles}</span>
          <span className="opacity-50">·</span>
          <span>版本累计 {totalVersions}</span>
          <span className="opacity-50">·</span>
          <span>PBKDF2-200k / AES-GCM-256</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type={revealPwd ? 'text' : 'password'}
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value)
              if (!e.target.value) {
                setUnlocked(false)
                setDecryptedHtml('')
              }
              setDecryptError('')
            }}
            placeholder="输入密码自动解密"
            autoComplete="off"
            className="min-w-[14rem] flex-1 rounded border border-[#d6cdb8] bg-white px-2 py-1.5 font-mono text-sm text-[#221f19] dark:border-[#33425a] dark:bg-[#091018] dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => setRevealPwd((v) => !v)}
            className="rounded border border-[#d6cdb8] bg-white px-2 py-1.5 text-xs text-[#615847] hover:bg-[#fbf6ec] dark:border-[#33425a] dark:bg-[#091018] dark:text-[#a9b3c4] dark:hover:bg-[#10202e]"
          >
            {revealPwd ? '隐藏' : '显示'}
          </button>
          {unlocked && (
            <span className="rounded bg-[#e2f1ec] px-2 py-1 font-mono text-[10px] text-[#22715c] dark:bg-[#14332b] dark:text-[#83d0bb]">
              ✓ 已解密
            </span>
          )}
          {busy && (
            <span className="font-mono text-[10px] text-[#7a6f5d] dark:text-[#9aa6b7]">解密中…</span>
          )}
          {decryptError && (
            <span className="font-mono text-[10px] text-[#a14545] dark:text-[#e69f9f]">{decryptError}</span>
          )}
        </div>
      </div>

      {/* 两栏：左侧紧凑文件树，右侧解密视图 */}
      <div className="grid gap-3 md:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Left: grouped file tree */}
        <aside className="rounded-md border border-[#dcd4c5] bg-white/70 p-2 text-sm dark:border-[#2b3744] dark:bg-[#0f1722]">
          {grouped.length === 0 && (
            <p className="px-2 py-3 text-xs text-[#8f8069] dark:text-[#8ea0b7]">
              暂无记录。本地跑 <code className="font-mono">pnpm snapshot-memory</code>。
            </p>
          )}
          <div className="space-y-3">
            {grouped.map((group) => (
              <div key={group.sourceId}>
                <div className="flex items-baseline justify-between border-b border-[#ece5d4] px-1.5 pb-1 dark:border-[#1c2632]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f8069] dark:text-[#8ea0b7]">
                    {group.label}
                  </span>
                  <span className="font-mono text-[10px] text-[#a59c87] dark:text-[#6e7a8c]">
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
                              ? 'bg-[#221f19] text-white dark:bg-[#3a4554]'
                              : 'text-[#3a342b] hover:bg-[#f3ecdf] dark:text-gray-300 dark:hover:bg-[#10202e]'
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
        <div className="min-h-[20rem] rounded-md border border-[#dcd4c5] bg-white p-4 dark:border-[#2b3744] dark:bg-[#0b1118]">
          {!activeFile ? (
            <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-3 text-sm text-[#8f8069] dark:text-[#8ea0b7]">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em]">empty state</div>
              <p className="max-w-sm text-center text-[13px] leading-7">
                左侧选一个文件后，在密码框输入即可自动解密。
                <br />
                公开元信息：{totalFiles} 个文件 · {totalVersions} 个版本。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File header */}
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece5d4] pb-2 dark:border-[#1c2632]">
                <div>
                  <h3 className="text-base font-semibold text-[#221f19] dark:text-gray-100">
                    {activeFile.title}
                  </h3>
                  {activeFile.description && (
                    <p className="mt-0.5 text-xs leading-6 text-[#76705f] dark:text-gray-400">
                      {activeFile.description}
                    </p>
                  )}
                </div>
                <span className="font-mono text-[10px] text-[#a59c87] dark:text-[#6e7a8c]">
                  {active.sourceId}/{activeFile.slug}
                </span>
              </div>

              {/* Version timeline */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8ea0b7]">
                  版本：
                </span>
                {activeFile.versions.map((v, i) => (
                  <button
                    key={v.path}
                    type="button"
                    onClick={() => selectVersion(activeFile, i)}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      i === versionIdx
                        ? 'bg-[#221f19] text-white dark:bg-[#3a4554]'
                        : 'bg-[#f3ecdf] text-[#615847] hover:bg-[#e6dbc4] dark:bg-[#10202e] dark:text-[#a9b3c4] dark:hover:bg-[#172c3e]'
                    }`}
                    title={`${v.hash.slice(0, 12)}… · ${v.bytes}B`}
                  >
                    {formatTs(v.ts)}
                  </button>
                ))}
              </div>

              {/* Content */}
              {decryptedHtml ? (
                <article
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-pre:bg-[#1a1f28] prose-pre:text-[#e7e1d3]"
                  dangerouslySetInnerHTML={{ __html: decryptedHtml }}
                />
              ) : (
                <div className="rounded border border-dashed border-[#d6cdb8] bg-[#fbf6ec] px-3 py-8 text-center text-xs text-[#7c6643] dark:border-[#33425a] dark:bg-[#0a1119] dark:text-[#9aa6b7]">
                  {passphrase
                    ? busy
                      ? '解密中…'
                      : decryptError || '等待解密'
                    : '上方密码框输入密码即自动解密'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
