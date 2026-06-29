'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSessionAccount } from './SessionProvider'
import UserAvatar from './UserAvatar'
import RanbiBalance from './RanbiBalance'

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
  if (provider === 'guest') return '游客'
  return 'GitHub'
}

function mentionName(name) {
  return String(name || '用户').replace(/\s+/g, '').slice(0, 32) || '用户'
}

export default function ArticleComments({ articleKey }) {
  const {
    user,
    loading: userLoading,
    notifications,
    refreshNotifications,
    markNotificationsRead,
  } = useSessionAccount()
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const textareaRef = useRef(null)

  const remaining = useMemo(() => 1000 - message.trim().length, [message])
  const isAuthed = !!user
  const unreadNotifications = (notifications?.items || []).filter((item) => !item.readAt)

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
    refresh()
  }, [refresh])

  function goToLogin() {
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
        body: JSON.stringify({ articleKey, message: trimmed, replyToId: replyTarget?.id || null }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)

      setMessage('')
      setReplyTarget(null)
      await refresh()
      if (isAuthed) await refreshNotifications?.()
    } catch (e) {
      setError(e?.message || 'POST_FAILED')
    } finally {
      setLoading(false)
    }
  }

  function replyTo(item) {
    const name = mentionName(item.user_name)
    const prefix = `@${name} `
    setReplyTarget({ id: item.id, userName: item.user_name || name })
    setMessage((current) => {
      const text = current.trimStart()
      if (text.startsWith(prefix)) return current
      if (!text) return prefix
      return `${prefix}${current}`
    })
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange?.(prefix.length, prefix.length)
    })
  }

  async function markAllRepliesRead() {
    await markNotificationsRead?.({ all: true })
  }

  return (
    <section className="mx-auto mt-12 max-w-[72ch] border-t border-[#dee0db] pt-8 dark:border-gray-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#444] dark:text-gray-200">评论</h2>
          <p className="mt-1 text-xs text-[#777] dark:text-gray-400">
            {items.length ? `${items.length} 条评论` : '还没有评论'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RanbiBalance />
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
              onClick={goToLogin}
              className="rounded-full border border-gray-200/80 bg-white/80 px-4 py-1 text-xs text-gray-700 hover:bg-white disabled:opacity-60 dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200"
            >
              登录
            </button>
          )}
        </div>
      </div>

      {isAuthed && unreadNotifications.length ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">你有 {unreadNotifications.length} 条新的评论回复</p>
            <button
              type="button"
              onClick={markAllRepliesRead}
              className="self-start rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs text-rose-700 hover:bg-white dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
            >
              全部已读
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {unreadNotifications.slice(0, 3).map((item) => (
              <li key={item.id} className="leading-5">
                <a
                  href={item.href || '#comments'}
                  onClick={() => markNotificationsRead?.({ id: item.id })}
                  className="font-medium text-rose-800 underline-offset-4 hover:underline dark:text-rose-100"
                >
                  {item.actorUserName || '有人'} 回复了你
                </a>
                <span className="text-rose-700/80 dark:text-rose-100/75">：{item.messageExcerpt}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          {isAuthed ? (
            <>
              <UserAvatar user={user} size="md" />
              <span>{user?.name || user?.login || '已登录'}</span>
            </>
          ) : (
            <span>
              以<span className="font-medium">游客</span>身份发表 —— 登录后历史评论会自动绑定到你的账号
            </span>
          )}
        </div>
        {replyTarget ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200/80 bg-white/70 px-3 py-2 text-xs text-gray-600 dark:border-gray-700/70 dark:bg-gray-900/60 dark:text-gray-300">
            <span>正在回复 @{replyTarget.userName}</span>
            <button type="button" onClick={() => setReplyTarget(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
              取消回复
            </button>
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
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
            disabled={loading || userLoading || !message.trim() || remaining < 0}
            className="rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs text-gray-700 shadow-sm hover:bg-white disabled:opacity-60 dark:border-gray-700/70 dark:bg-gray-900/80 dark:text-gray-200"
          >
            {loading ? '发送中...' : isAuthed ? '发表评论' : '以游客身份发表'}
          </button>
        </div>
      </form>

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}

      <div className="mt-6">
        {items.length ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                id={`comment-${item.id}`}
                className="rounded-lg border border-gray-200/80 bg-white/70 p-3 dark:border-gray-700/70 dark:bg-gray-900/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <UserAvatar seed={item.user_name || item.user_id || 'guest'} size="sm" title={item.user_name} />
                    <div className="min-w-0">
                      <div className="truncate text-sm text-gray-800 dark:text-gray-100">{item.user_name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {providerLabel(item.user_provider)}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => replyTo(item)}
                      className="rounded-full border border-gray-200/80 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-white dark:border-gray-700/70 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      回复
                    </button>
                    <time className="text-[11px] text-gray-500 dark:text-gray-400">
                      {formatTime(item.created_at)}
                    </time>
                  </div>
                </div>
                {item.reply_to_user_name ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    回复 @{item.reply_to_user_name}
                  </p>
                ) : null}
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
