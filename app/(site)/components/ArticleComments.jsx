'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSessionAccount } from './SessionProvider'
import UserAvatar from './UserAvatar'
import { commentProviderLabel } from '../../../lib/userDisplayName'
import { PUBLIC_READER_HINT, READER_PROVIDER } from '../../../lib/engagementBot'
import { isInteractionNotification } from '../../../lib/siteNotificationsCore'

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

function mentionName(name) {
  return String(name || '用户').replace(/\s+/g, '').slice(0, 32) || '用户'
}

function CommentCard({ item, unread, notificationReady, onReply, nested = false }) {
  return (
    <article
      id={`comment-${item.id}`}
      data-notification-ready={notificationReady ? 'true' : 'false'}
      className={`discussion-comment-card ${nested ? 'ml-5 mt-2 border-l-2 sm:ml-10' : ''} ${unread ? 'has-unread-notification' : ''}`}
    >
      {unread ? <span className="discussion-notification-dot" aria-label="未读互动" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar
            seed={item.user_name || item.user_id || 'guest'}
            size="sm"
            title={item.user_provider === READER_PROVIDER ? `${item.user_name} · ${PUBLIC_READER_HINT}` : item.user_name}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[var(--site-ink)]">{item.user_name}</div>
            <div className="text-[11px] text-[var(--site-faint)]">{commentProviderLabel(item.user_provider)}</div>
          </div>
        </div>
        <time className="shrink-0 text-[11px] text-[var(--site-faint)]">{formatTime(item.created_at)}</time>
      </div>
      {nested && item.reply_to_user_name ? (
        <p className="mb-0 mt-2 text-xs text-[var(--site-faint)]">回复 @{item.reply_to_user_name}</p>
      ) : null}
      <p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--site-muted)]">{item.message}</p>
      <button type="button" onClick={() => onReply(item)} className="discussion-ghost-button mt-2 px-2 py-0.5 text-[11px]">
        回复
      </button>
    </article>
  )
}

export default function ArticleComments({ articleKey }) {
  const {
    user,
    loading: userLoading,
    refreshNotifications,
  } = useSessionAccount()
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [articleNotifications, setArticleNotifications] = useState([])
  const [notificationsLoaded, setNotificationsLoaded] = useState(false)
  const textareaRef = useRef(null)
  const sectionRef = useRef(null)

  const remaining = useMemo(() => 1000 - message.trim().length, [message])
  const isAuthed = !!user
  const unreadNotifications = useMemo(() => articleNotifications.filter((item) => (
    !item.readAt && isInteractionNotification(item.type) && item.articleKey === articleKey
  )), [articleNotifications, articleKey])
  const commentThreads = useMemo(() => {
    const nodes = new Map(items.map((item) => [Number(item.id), { ...item, replies: [] }]))
    const roots = []
    for (const node of nodes.values()) {
      let parent = nodes.get(Number(node.reply_to_id))
      if (!parent) {
        roots.push(node)
        continue
      }
      const visited = new Set([Number(node.id)])
      while (parent && parent.reply_to_id && !visited.has(Number(parent.id))) {
        visited.add(Number(parent.id))
        const next = nodes.get(Number(parent.reply_to_id))
        if (!next) break
        parent = next
      }
      parent.replies.push(node)
    }
    for (const node of nodes.values()) node.replies.sort((a, b) => Number(a.created_at) - Number(b.created_at))
    return roots.sort((a, b) => Number(b.created_at) - Number(a.created_at))
  }, [items])

  const refreshArticleNotifications = useCallback(async () => {
    if (!user?.id || !articleKey) return
    try {
      const params = new URLSearchParams({ articleKey, limit: '100', unreadOnly: '1' })
      const selectedId = Number(new URLSearchParams(window.location.search).get('notification'))
      const requests = [fetch(`/api/notifications?${params}`, { cache: 'no-store', credentials: 'same-origin' })]
      if (Number.isInteger(selectedId) && selectedId > 0) {
        requests.push(fetch(`/api/notifications?id=${selectedId}`, { cache: 'no-store', credentials: 'same-origin' }))
      }
      const [res, selectedRes] = await Promise.all(requests)
      if (res.ok) {
        const data = await res.json()
        const notices = Array.isArray(data.items) ? data.items : []
        if (selectedRes?.ok) {
          const selected = (await selectedRes.json())?.items?.[0]
          if (selected?.articleKey === articleKey && !notices.some((item) => item.id === selected.id)) notices.push(selected)
        }
        setArticleNotifications(notices)
        setNotificationsLoaded(true)
      }
    } catch {
      // The discussion still works when notifications are unavailable.
    }
  }, [articleKey, user?.id])

  useEffect(() => {
    setArticleNotifications([])
    setNotificationsLoaded(false)
    refreshArticleNotifications()
  }, [refreshArticleNotifications])

  useEffect(() => {
    function onRead(event) {
      const id = Number(event.detail?.id)
      setArticleNotifications((prev) => prev.map((item) => item.id === id ? { ...item, readAt: Date.now() } : item))
    }
    window.addEventListener('tuaran:notification-read', onRead)
    return () => window.removeEventListener('tuaran:notification-read', onRead)
  }, [])

  const refresh = useCallback(async () => {
    if (!articleKey) return
    setError('')
    try {
      const params = new URLSearchParams({ articleKey, limit: '50' })
      const hashCommentId = window.location.hash.match(/^#comment-(\d+)$/)?.[1]
      if (hashCommentId) params.set('commentId', hashCommentId)
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
    window.addEventListener('hashchange', refresh)
    return () => window.removeEventListener('hashchange', refresh)
  }, [refresh])

  useEffect(() => {
    if (!items.length || typeof window === 'undefined') return undefined

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const behavior = prefersReduced ? 'auto' : 'smooth'

    const revealHashComment = () => {
      const hash = window.location.hash || ''
      const match = hash.match(/^#comment-(\d+)$/)
      if (!match) return
      const target = document.getElementById(`comment-${match[1]}`)
        || document.getElementById('comments')
        || sectionRef.current
      if (!target) return
      target.scrollIntoView({ block: target.id?.startsWith('comment-') ? 'center' : 'start', behavior })
    }

    const timer = window.setTimeout(revealHashComment, 60)
    window.addEventListener('hashchange', revealHashComment)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('hashchange', revealHashComment)
    }
  }, [items])

  function goToLogin() {
    const returnTo = `${window.location.pathname}${window.location.search || ''}`
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
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
      if (isAuthed) {
        await refreshNotifications?.()
        await refreshArticleNotifications()
      }
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

  return (
    <section ref={sectionRef} className="discussion-comments mt-12 w-full">
      <div className="discussion-comments-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="discussion-eyebrow mb-1">COMMENTS</p>
          <h2 className="mb-0 border-0 p-0 text-xl font-semibold">评论</h2>
          <p className="mb-0 mt-1 text-xs text-[var(--site-faint)]">
            {items.length ? `${items.length} 条评论` : '还没有评论'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isAuthed ? (
            <button
              type="button"
              disabled={userLoading}
              onClick={goToLogin}
              className="discussion-ghost-button"
            >
              登录
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={submit} className="discussion-composer mt-4 flex flex-col gap-3">
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
          <div className="flex items-center justify-between rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-2 text-xs text-[var(--site-muted)]">
            <span>正在回复 @{replyTarget.userName}</span>
            <button type="button" onClick={() => setReplyTarget(null)} className="text-[var(--site-faint)] hover:text-[var(--site-ink)]">
              取消回复
            </button>
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="补充观点、提出问题，或分享你的经验…"
          className="discussion-textarea"
        />
        <div className="flex items-center justify-between">
          <span className={`text-xs ${remaining < 0 ? 'text-red-600' : 'text-[var(--site-faint)]'}`}>
            {remaining} 字
          </span>
          <button
            type="submit"
            disabled={loading || userLoading || !message.trim() || remaining < 0}
            className="discussion-submit-button"
          >
            {loading ? '发送中...' : isAuthed ? '发表评论' : '以游客身份发表'}
          </button>
        </div>
      </form>

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}

      <div className="mt-6">
        {items.length ? (
          <ul className="space-y-4">
            {commentThreads.map((item) => (
              <li key={item.id}>
                <CommentCard
                  item={item}
                  unread={unreadNotifications.some((notice) => notice.commentId === Number(item.id) && notice.type !== 'content_like')}
                  notificationReady={notificationsLoaded}
                  onReply={replyTo}
                />
                {item.replies.map((reply) => (
                  <CommentCard
                    key={reply.id}
                    item={reply}
                    nested
                    unread={unreadNotifications.some((notice) => notice.commentId === Number(reply.id) && notice.type !== 'content_like')}
                    notificationReady={notificationsLoaded}
                    onReply={replyTo}
                  />
                ))}
              </li>
            ))}
          </ul>
        ) : (
          <div className="discussion-empty">还没有评论。可以从一个具体问题或补充开始。</div>
        )}
      </div>
    </section>
  )
}
