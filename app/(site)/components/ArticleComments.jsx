'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'

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

function providerLabel(provider) {
  if (provider === 'google') return 'Google'
  return 'GitHub'
}

export default function ArticleComments({ articleKey }) {
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const remaining = useMemo(() => 1000 - message.trim().length, [message])
  const isAuthed = !!user

  const refresh = useCallback(async () => {
    if (!articleKey) return
    setError('')
    try {
      const params = new URLSearchParams({ articleKey, limit: '50' })
      const res = await fetch(`/api/comments?${params.toString()}`, { cache: 'no-store' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    }
  }, [articleKey])

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
  }, [refresh])

  function login(provider) {
    const returnTo = `${window.location.pathname}${window.location.search || ''}`
    window.location.href = `/api/auth/login?provider=${provider}&returnTo=${encodeURIComponent(returnTo)}`
  }

  function emailLogin() {
    const returnTo = `${window.location.pathname}${window.location.search || ''}`
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
  }

  function logout() {
    const returnTo = `${window.location.pathname}${window.location.search || ''}`
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  }

  async function submit(e) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || !articleKey) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleKey, message: trimmed }),
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
    <section className="mx-auto mt-12 max-w-[72ch] border-t border-[#e8dfd0] pt-8 dark:border-gray-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#444] dark:text-gray-200">评论</h2>
          <p className="mt-1 text-xs text-[#777] dark:text-gray-400">
            {items.length ? `${items.length} 条评论` : '还没有评论'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-gray-200/80 bg-white/80 px-3 py-1 text-xs text-gray-700 hover:bg-white dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200"
          >
            刷新
          </button>
          {isAuthed ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-gray-200/80 bg-white/80 px-3 py-1 text-xs text-gray-700 hover:bg-white dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200"
            >
              退出
            </button>
          ) : (
            <button
              type="button"
              disabled={userLoading}
              onClick={() => setLoginOpen(true)}
              className="rounded-full border border-gray-200/80 bg-white/80 px-4 py-1 text-xs text-gray-700 hover:bg-white disabled:opacity-60 dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200"
            >
              登录
            </button>
          )}
        </div>
      </div>

      {loginOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-[#fdfaf3] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] dark:border-gray-700 dark:bg-[#10161f]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="mb-1 text-base font-semibold text-[#221f19] dark:text-gray-100">选择登录方式</h3>
                <p className="mb-0 text-xs leading-5 text-gray-600 dark:text-gray-400">
                  登录后可以发表评论，当前页面会自动返回。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                aria-label="关闭登录弹窗"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={emailLogin}
                className="rounded-xl border border-[#ddd2c0] bg-white px-4 py-3 text-left text-sm font-medium text-[#31291d] transition hover:bg-[#f7efe2] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100 dark:hover:bg-[#19212b]"
              >
                邮箱登录
              </button>
              <button
                type="button"
                onClick={() => login('github')}
                className="rounded-xl border border-[#ddd2c0] bg-white px-4 py-3 text-left text-sm font-medium text-[#31291d] transition hover:bg-[#f7efe2] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100 dark:hover:bg-[#19212b]"
              >
                GitHub 登录
              </button>
              <button
                type="button"
                onClick={() => login('google')}
                className="rounded-xl border border-[#ddd2c0] bg-white px-4 py-3 text-left text-sm font-medium text-[#31291d] transition hover:bg-[#f7efe2] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100 dark:hover:bg-[#19212b]"
              >
                Google 登录
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAuthed ? (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            {user?.image ? (
              <Image
                src={user.image}
                alt=""
                width={24}
                height={24}
                unoptimized
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <span className="inline-block h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
            )}
            <span>{user?.name || user?.login || '已登录'}</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="写下你的评论（最多 1000 字）"
            className="w-full rounded-lg border border-gray-200/80 bg-white/80 p-3 text-sm leading-6 text-gray-700 outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200 dark:focus:ring-gray-700"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${remaining < 0 ? 'text-red-600' : 'text-gray-500'} dark:text-gray-400`}>
              {remaining} 字
            </span>
            <button
              type="submit"
              disabled={loading || !message.trim() || remaining < 0}
              className="rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs text-gray-700 shadow-sm hover:bg-white disabled:opacity-60 dark:border-gray-700/70 dark:bg-gray-900/80 dark:text-gray-200"
            >
              {loading ? '发送中...' : '发表评论'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-gray-200/80 px-3 py-3 text-sm text-gray-600 dark:border-gray-700/70 dark:text-gray-300">
          登录后可以评论，支持邮箱、GitHub 或 Google。
        </p>
      )}

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}

      <div className="mt-6">
        {items.length ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-200/80 bg-white/70 p-3 dark:border-gray-700/70 dark:bg-gray-900/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.user_image ? (
                      <Image
                        src={item.user_image}
                        alt=""
                        width={28}
                        height={28}
                        unoptimized
                        className="h-7 w-7 rounded-full"
                      />
                    ) : (
                      <span className="inline-block h-7 w-7 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm text-gray-800 dark:text-gray-100">{item.user_name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {providerLabel(item.user_provider)}
                      </div>
                    </div>
                  </div>
                  <time className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
                    {formatTime(item.created_at)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">来留下第一条评论。</div>
        )}
      </div>
    </section>
  )
}
