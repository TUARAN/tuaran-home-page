'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useSessionAccount } from '../components/SessionProvider'
import UserAvatar from '../components/UserAvatar'
import { LoadingDots, LoadingState, Skeleton } from '../../components/loading/LoadingPrimitives'

const PAGE_SIZE = 10
const LOGIN_HREF = '/login?returnTo=%2Fnotifications'

const FILTER_TABS = [
  { id: 'all', label: '全部' },
  { id: 'interaction', label: '互动' },
  { id: 'rss', label: '订阅' },
  { id: 'automation', label: '监控' },
]

function relativeTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  const diff = Date.now() - n
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))} 分钟前`
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))} 小时前`
  if (diff < 86_400_000 * 7) return `${Math.max(1, Math.floor(diff / 86_400_000))} 天前`
  return new Date(n).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function absoluteTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  try {
    return new Date(n).toLocaleString('zh-CN', {
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

function NotificationCard({ item, onOpen }) {
  const unread = !item.readAt
  const href = item.href || '/notifications'
  const when = relativeTime(item.createdAt)
  const exact = absoluteTime(item.createdAt)

  return (
    <Link
      href={href}
      onClick={() => onOpen?.(item.id)}
      aria-label={`${item.title}${item.destinationLabel ? `，${item.destinationLabel}` : ''}`}
      className={[
        'notification-inbox-item',
        unread ? 'is-unread' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className="notification-inbox-aside">
        <span className={unread ? 'notification-inbox-dot is-on' : 'notification-inbox-dot'} aria-hidden="true" />
        <UserAvatar
          seed={item.actorUserName || item.actorUserId || item.type}
          size="md"
          title={item.actorUserName || item.typeLabel || '通知'}
        />
      </span>
      <span className="notification-inbox-body">
        <span className="notification-inbox-top">
          <span className="notification-inbox-kind">{item.typeLabel || '通知'}</span>
          {when ? (
            <time className="notification-inbox-time" dateTime={item.createdAt ? new Date(Number(item.createdAt)).toISOString() : undefined} title={exact}>
              {when}
            </time>
          ) : null}
        </span>
        <span className="notification-inbox-title">{item.title || '新的站内通知'}</span>
        {item.messageExcerpt ? (
          <span className="notification-inbox-excerpt">{item.messageExcerpt}</span>
        ) : null}
        <span className="notification-inbox-go">
          {item.destinationLabel || '查看详情'}
          <span aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  )
}

export default function NotificationsClient() {
  const { loading, user, markNotificationsRead } = useSessionAccount()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('idle')
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [filter, setFilter] = useState('all')
  const requestIdRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const loadMoreRef = useRef(null)
  const sentinelRef = useRef(null)

  const openNotification = useCallback((id) => {
    const notificationId = Number(id)
    if (!Number.isInteger(notificationId) || notificationId <= 0) return
    const openedItem = items.find((item) => Number(item.id) === notificationId)
    setItems((current) => current.map((item) => (
      Number(item.id) === notificationId ? { ...item, readAt: item.readAt || Date.now() } : item
    )))
    if (openedItem && !openedItem.readAt) setUnread((current) => Math.max(0, current - 1))
    void markNotificationsRead({ id: notificationId })
  }, [items, markNotificationsRead])

  const fetchPage = useCallback(async (offset, requestId) => {
    const typeParam = filter !== 'all' ? `&type=${filter}` : ''
    const res = await fetch(
      `/api/notifications?limit=${PAGE_SIZE}&offset=${offset}${typeParam}`,
      { cache: 'no-store', credentials: 'same-origin' }
    )
    const json = await res.json().catch(() => null)
    if (!res.ok || !json) throw new Error('load failed')
    if (requestId !== requestIdRef.current) return null
    return json
  }, [filter])

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    const requestId = ++requestIdRef.current
    setStatus('loading')
    fetchPage(0, requestId)
      .then((json) => {
        if (!alive || !json) return
        setItems(Array.isArray(json.items) ? json.items : [])
        setUnread(Number(json.unread) || 0)
        setTotal(Number(json.total) || 0)
        setStatus('ready')
      })
      .catch(() => {
        if (alive) setStatus('error')
      })
    return () => {
      alive = false
      requestIdRef.current += 1
    }
  }, [user?.id, filter, fetchPage])

  const refresh = useCallback(() => {
    if (!user?.id) return
    const requestId = ++requestIdRef.current
    setStatus('loading')
    fetchPage(0, requestId)
      .then((json) => {
        if (!json) return
        setItems(Array.isArray(json.items) ? json.items : [])
        setUnread(Number(json.unread) || 0)
        setTotal(Number(json.total) || 0)
        setStatus('ready')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [user?.id, fetchPage])

  const loadMore = async () => {
    if (loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    const requestId = ++requestIdRef.current
    try {
      const json = await fetchPage(items.length, requestId)
      if (!json) return
      const seen = new Set(items.map((item) => item.id))
      setItems((prev) => [
        ...prev,
        ...(Array.isArray(json.items) ? json.items : []).filter((item) => !seen.has(item.id)),
      ])
      setUnread(Number(json.unread) || 0)
      setTotal(Number(json.total) || 0)
    } catch {
      // 保留已加载内容，下次点击再重试
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadMoreRef.current = loadMore
  })

  // 下滑到列表底部附近自动加载下一页（每页 10 条）。
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current()
      },
      { rootMargin: '320px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [status, items.length, total])

  const markAllRead = async () => {
    if (markingAll) return
    setMarkingAll(true)
    try {
      await markNotificationsRead({ all: true })
      const requestId = ++requestIdRef.current
      const json = await fetchPage(0, requestId)
      if (json) {
        setItems(Array.isArray(json.items) ? json.items : [])
        setUnread(Number(json.unread) || 0)
        setTotal(Number(json.total) || 0)
      }
    } finally {
      setMarkingAll(false)
    }
  }

  if (loading) {
    return <LoadingState label="正在检查登录状态" />
  }

  if (!user) {
    return (
      <div className="notification-empty">
        <p className="notification-empty-title">登录后查看站内通知</p>
        <p className="notification-empty-copy">
          回复、点赞、订阅和监控提醒会集中出现在这里。
        </p>
        <Link href={LOGIN_HREF} className="discussion-primary-link">
          登录查看通知
        </Link>
      </div>
    )
  }

  return (
    <div className="notification-center">
      <header className="notification-center-head">
        <div>
          <h1>通知</h1>
          <p>回复、点赞、订阅和监控。点一条就去对应评论、内容、订阅源或运维台。</p>
        </div>
      </header>

      <div className="notification-center-toolbar">
        <div className="community-feed-filters" role="tablist" aria-label="通知分类">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              disabled={status === 'loading'}
              className={filter === tab.id ? 'is-active' : ''}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="notification-center-actions">
          <p className="notification-center-meta">
            {total > 0 ? (
              unread > 0 ? `${total} 条 · ${unread} 未读` : `${total} 条 · 全部已读`
            ) : (
              '还没有通知'
            )}
          </p>
          <button
            type="button"
            onClick={refresh}
            disabled={status === 'loading'}
            className="discussion-text-link text-xs disabled:opacity-50"
          >
            刷新
          </button>
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll || unread === 0}
            className="discussion-text-link text-xs disabled:opacity-40"
          >
            {markingAll ? '处理中…' : '全部标为已读'}
          </button>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="notification-inbox" role="status" aria-label="正在加载通知">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              className="h-[4.5rem] rounded-none border-0 border-b border-[var(--site-line)]"
            />
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="notification-empty">
          <p className="notification-empty-copy">通知暂时加载失败。</p>
          <button type="button" onClick={refresh} className="discussion-text-link text-sm">
            重新加载
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="notification-empty is-dashed">
          <p className="notification-empty-title">还没有新的站内通知</p>
          <p className="notification-empty-copy">
            {filter === 'automation'
              ? '定时任务失败时，监控提醒会出现在这里。'
              : filter === 'rss'
                ? '收录的 RSS 源有新条目时会出现在这里，点开对应订阅源。'
                : '有人评论、回复或点赞时会出现在这里。'}
          </p>
        </div>
      ) : (
        <>
          <div className="notification-inbox">
            {items.map((item) => (
              <NotificationCard key={item.id} item={item} onOpen={openNotification} />
            ))}
          </div>
          {items.length < total ? (
            <div ref={sentinelRef} className="notification-inbox-more">
              {loadingMore ? (
                <LoadingDots label="正在加载更多通知" className="text-[var(--site-faint)]" />
              ) : typeof IntersectionObserver === 'undefined' ? (
                <button
                  type="button"
                  onClick={loadMore}
                  className="rounded-full border border-[var(--site-line)] px-5 py-2 text-sm font-medium text-[var(--site-ink)] transition-colors hover:border-[var(--site-muted)] hover:bg-[var(--site-panel-strong)]"
                >
                  加载更多（还有 {Math.max(0, total - items.length)} 条）
                </button>
              ) : (
                <span className="text-xs text-[var(--site-faint)]">继续下滑加载更多</span>
              )}
            </div>
          ) : total > 0 ? (
            <p className="notification-inbox-more text-xs text-[var(--site-faint)]">
              已加载全部 {total} 条
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
