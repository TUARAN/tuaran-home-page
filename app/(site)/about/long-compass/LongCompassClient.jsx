'use client'

import { Marked } from 'marked'
import { useEffect, useMemo, useState } from 'react'

const markdown = new Marked({ gfm: true, breaks: true })

function renderMarkdown(text) {
  if (!text) return ''
  try {
    return markdown.parse(text)
  } catch {
    return ''
  }
}

const KIND_LABELS = {
  snapshot: '资产现状',
  strategy: '行动框架',
  review: '阶段复盘',
}

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 120) }
  }
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function deriveKey(password, salt, iterations) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function decryptRecord(payload, password) {
  const salt = base64ToBytes(payload.salt)
  const iv = base64ToBytes(payload.iv)
  const encrypted = base64ToBytes(payload.data)
  const key = await deriveKey(password, salt, payload.iter)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return JSON.parse(new TextDecoder().decode(decrypted))
}

function login() {
  window.location.href = `/api/auth/login?returnTo=${encodeURIComponent('/about/long-compass')}`
}

export default function LongCompassClient() {
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)
  const [encryptedItems, setEncryptedItems] = useState([])
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [records, setRecords] = useState([])
  const [activeKind, setActiveKind] = useState('snapshot')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/private-records', { cache: 'no-store' })
        const data = await safeJson(res)
        if (res.status === 401) {
          setAuthError('UNAUTHORIZED')
          return
        }
        if (res.status === 403) {
          setAuthError('FORBIDDEN')
          return
        }
        if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
        setUser(data?.user || null)
        setEncryptedItems(Array.isArray(data?.items) ? data.items : [])
      } catch (e) {
        setError(e?.message || 'LOAD_FAILED')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const currentRecords = useMemo(
    () =>
      records
        .filter((item) => item.kind === activeKind)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [activeKind, records]
  )

  const counts = useMemo(() => {
    return records.reduce(
      (acc, item) => {
        acc[item.kind] = (acc[item.kind] || 0) + 1
        return acc
      },
      { snapshot: 0, strategy: 0, review: 0 }
    )
  }, [records])

  async function handleUnlock(e) {
    e.preventDefault()
    const value = password.trim()
    if (!value || busy) return
    setBusy(true)
    setError('')
    try {
      const decrypted = []
      for (const item of encryptedItems) {
        const plain = await decryptRecord(item.payload, value)
        decrypted.push({ ...item, plain })
      }
      setRecords(decrypted)
      setUnlocked(true)
      setPassword('')
    } catch {
      setError('口令错误，无法解密资料库。')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1080px] items-center px-4 py-8">
        <p className="font-mono text-xs text-[#8f8069] dark:text-[#8e9ab0]">Loading private workspace...</p>
      </main>
    )
  }

  if (authError) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[680px] flex-col justify-center px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
          Long Compass
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">长期罗盘</h1>
        <p className="mt-3 text-sm leading-7 text-[#5d554a] dark:text-gray-300">
          {authError === 'UNAUTHORIZED' ? '需要先登录。' : '当前账号没有访问权限。'}
        </p>
        {authError === 'UNAUTHORIZED' ? (
          <button
            type="button"
            onClick={login}
            className="mt-5 w-fit rounded-lg bg-[#3f3527] px-4 py-2 text-sm font-medium text-white hover:bg-[#221f19] dark:bg-gray-200 dark:text-[#111]"
          >
            登录
          </button>
        ) : null}
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 py-8">
      <header className="border-b border-[#e8dfd0] pb-5 dark:border-gray-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
              Long Compass
            </p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#221f19] dark:text-gray-100">
              长期罗盘
            </h1>
          </div>
          <span className="rounded-full border border-[#e8dfd0] px-3 py-1 text-xs text-[#6b5f4d] dark:border-[#2d3440] dark:text-gray-300">
            {unlocked ? '已解锁' : user?.name || user?.login || '已登录'}
          </span>
        </div>
      </header>

      {!unlocked ? (
        <section className="mt-8 max-w-md rounded-lg border border-[#e8dfd0] bg-white/82 p-5 dark:border-gray-800 dark:bg-[#121821]/82">
          <h2 className="font-serif text-lg font-semibold text-[#221f19] dark:text-gray-100">解锁资料库</h2>
          <p className="mt-2 text-sm leading-6 text-[#5d554a] dark:text-gray-300">
            当前共有 {encryptedItems.length} 条密文记录。口令只在浏览器本地使用。
          </p>
          <form onSubmit={handleUnlock} className="mt-4 flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              placeholder="资料库口令"
              className="rounded-lg border border-[#d8cdbb] bg-white px-3 py-2 text-sm text-[#221f19] outline-none focus:border-[#9c8e72] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={busy || !password.trim()}
              className="rounded-lg bg-[#3f3527] px-4 py-2 text-sm font-medium text-white hover:bg-[#221f19] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-gray-200 dark:text-[#111]"
            >
              {busy ? '解锁中...' : '解锁'}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-[#b42318] dark:text-red-400">{error}</p> : null}
        </section>
      ) : (
        <section className="mt-6">
          <div className="flex flex-wrap gap-2 border-b border-[#e8dfd0] pb-3 dark:border-gray-800">
            {Object.entries(KIND_LABELS).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setActiveKind(kind)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeKind === kind
                    ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                    : 'border border-[#e8dfd0] text-[#6b5f4d] hover:bg-white dark:border-[#2d3440] dark:text-gray-300 dark:hover:bg-[#121821]'
                }`}
              >
                {label} · {counts[kind] || 0}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {currentRecords.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#d8cdbb] px-4 py-6 text-sm text-[#847a67] dark:border-gray-700 dark:text-gray-400">
                暂无记录。
              </p>
            ) : (
              currentRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-lg border border-[#e8dfd0] bg-white/78 p-4 dark:border-gray-800 dark:bg-[#121821]/78"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-base font-semibold text-[#221f19] dark:text-gray-100">
                        {record.plain?.title || '未命名记录'}
                      </h2>
                      {record.plain?.summary ? (
                        <p className="mt-1 text-xs leading-5 text-[#847a67] dark:text-gray-400">
                          {record.plain.summary}
                        </p>
                      ) : null}
                    </div>
                    <span className="font-mono text-[10px] text-[#a09176] dark:text-[#8e9ab0]">
                      {new Date(record.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm mt-3 max-w-none rounded-lg bg-[#faf7f1] px-3 py-2.5 text-[#4d463c] dark:prose-invert dark:bg-[#0d1218] dark:text-gray-300 prose-headings:font-serif prose-headings:text-[#221f19] dark:prose-headings:text-gray-100 prose-p:leading-7 prose-li:leading-7 prose-table:text-xs prose-th:bg-[#f0e9d8] dark:prose-th:bg-[#1a222d] prose-blockquote:border-l-[#c5b89c] prose-blockquote:text-[#5d554a] dark:prose-blockquote:border-l-[#475061] dark:prose-blockquote:text-gray-400 prose-code:text-[#6b4f21] dark:prose-code:text-[#e0c38f]"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(record.plain?.content) }}
                  />
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  )
}
