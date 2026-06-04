'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 120) }
  }
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function StompPanel() {
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAuthed = !!user

  const remaining = useMemo(() => 280 - message.trim().length, [message])

  async function refresh() {
    setError('')
    try {
      const res = await fetch('/api/stomp?limit=30', { cache: 'no-store' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        const data = await safeJson(res)
        setUser(data?.user || null)
      } catch {
        setUser(null)
      } finally {
        setUserLoading(false)
      }
    })()
    refresh()
  }, [])

  function login() {
    const returnTo = window.location.pathname || '/'
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
  }

  function logout() {
    const returnTo = window.location.pathname || '/'
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  }

  async function submit(e) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stomp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)

      setMessage('')
      await refresh()
    } catch (e) {
      setError(e?.message || 'POST_FAILED')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200/70 bg-white/80 p-4 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/70">
      <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-gray-200/70 bg-white/80 px-3 py-0.5 text-[12px] text-gray-700 hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200"
          >
            刷新
          </button>

          {isAuthed ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-gray-200/70 bg-white/80 px-3 py-0.5 text-[12px] text-gray-700 hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200"
            >
              退出
            </button>
          ) : (
            <button
              type="button"
              disabled={userLoading}
              onClick={login}
              className="rounded-full border border-gray-200/70 bg-white/80 px-3 py-0.5 text-[12px] text-gray-700 hover:bg-white disabled:opacity-60 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200"
            >
              GitHub 登录
            </button>
          )}
      </div>

      {isAuthed ? (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-300">
            {user?.image ? (
              <Image src={user.image} alt="avatar" width={20} height={20} unoptimized className="h-5 w-5 rounded-full" />
            ) : null}
            <span>{user?.name || user?.login || '已登录'}</span>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder="登录后可以留言（最多 280 字）"
            className="w-full rounded-lg border border-gray-200/70 bg-white/80 p-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200 dark:focus:ring-gray-700"
          />

          <div className="flex items-center justify-between">
            <span className={`text-[12px] ${remaining < 0 ? 'text-red-600' : 'text-gray-500'} dark:text-gray-400`}>
              {remaining} 字
            </span>
            <button
              type="submit"
              disabled={loading || !message.trim() || remaining < 0}
              className="rounded-full border border-gray-200/70 bg-white/80 px-4 py-1 text-[12px] text-gray-700 shadow-sm hover:bg-white disabled:opacity-60 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200"
            >
              {loading ? '发送中…' : '留言'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-[12px] text-gray-600 dark:text-gray-300">
          先用 GitHub 登录，才能在面板里留言。
        </p>
      )}

      {error ? (
        <p className="mt-3 text-[12px] text-red-600">{error}</p>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 text-[12px] text-gray-500 dark:text-gray-400">最新留言</div>
        {items.length ? (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="rounded-lg border border-gray-200/70 bg-white/60 p-2 dark:border-gray-700/60 dark:bg-gray-900/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {it.user_image ? (
                      <Image src={it.user_image} alt="avatar" width={20} height={20} unoptimized className="h-5 w-5 rounded-full" />
                    ) : (
                      <span className="inline-block h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                    )}
                    <span className="text-[12px] text-gray-700 dark:text-gray-200">{it.user_name}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{formatTime(it.created_at)}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{it.message}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[12px] text-gray-500 dark:text-gray-400">还没有留言，来留下第一条吧。</div>
        )}
      </div>
    </section>
  )
}
