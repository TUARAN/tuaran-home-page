'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useSessionAccount } from '../components/SessionProvider'
import { LoadingDots, LoadingState, Skeleton } from '../../components/loading/LoadingPrimitives'

const PAGE_SIZE = 10
const LOGIN_HREF = '/login?returnTo=%2Fnotifications'

const FILTER_TABS = [
  { id: 'all', label: '全部' },
  { id: 'interaction', label: '互动' },
  { id: 'automation', label: '自动化监控' },
]

function relativeTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  const diff = Date.now() - n
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))} 分钟前`
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))} 小时前`
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
  return (
    <Link
      href={item.href || '/notifications'}
      onClick={() => onOpen(item)}
      className={[
        'group flex items-start gap-3 rounded-2xl border px-4 py-3 no-underline transition-colors',
        unread
          ? 'border-[color-mix(in_srgb,var(--site-accent)_28%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-accent)_7%,transparent)]'
          : 'border-[var(--site-line)] hover:border-[var(--site-muted)] hover:bg-[var(--site-panel-strong)]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          unread ? 'bg-[var(--site-accent)]' : 'bg-[color-mix(in_srgb,var(--site-line)_70%,transparent)]',
        ].join(' ')}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span
            className={[
              'text-sm font-semibold text-[var(--site-ink)]',
              unread ? '' : 'opacity-75',
            ].join(' ')}
          >
            {item.title || '新的站内通知'}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[var(--site-faint)]">
            {relativeTime(item.createdAt)}
            {item.createdAt ? ` · ${absoluteTime(item.createdAt)}` : ''}
          </span>
        </span>
        {item.messageExcerpt ? (
          <span className="mt-1 line-clamp-2 block text-[13px] leading-5 text-[var(--site-muted)]">
            {item.messageExcerpt}
          </span>
        ) : null}
        <span className="mt-1 block text-xs text-[var(--site-faint)]">
          {item.articleTitle ? `${item.articleTitle} · ` : ''}
          {item.actorUserName || '访客'}
          <span className="ml-1 inline-block text-[var(--site-faint)] transition-transform group-hover:translate-x-0.5">
            →
          </span>
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

  const openItem = (item) => {
    if (item.readAt || !item.id) return
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, readAt: Date.now() } : entry))
    )
    setUnread((count) => Math.max(0, count - 1))
    markNotificationsRead?.({ id: item.id })
  }

  if (loading) {
    return <LoadingState label="正在检查登录状态" />
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[var(--site-line)] px-6 py-12 text-center">
        <p className="mx-auto mb-2 max-w-md text-base font-semibold text-[var(--site-ink)]">
          登录后查看站内通知
        </p>
        <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-[var(--site-muted)]">
          评论回复、点赞等与你相关的通知会集中出现在这里，并可直接跳回原内容位置。
        </p>
        <Link href={LOGIN_HREF} className="discussion-primary-link">
          登录查看通知
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-6">
        <p className="discussion-eyebrow mb-1">Notifications</p>
        <h1 className="mb-1 text-2xl font-bold text-[var(--site-ink)]">通知中心</h1>
        <p className="mb-0 text-sm leading-6 text-[var(--site-muted)]">
          评论回复、点赞和站内提醒都会在这里汇总，点击任意一条即可跳回原内容。
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            disabled={status === 'loading'}
            className={[
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
              filter === tab.id
                ? 'border-[var(--site-accent)] bg-[var(--site-accent)] text-[var(--site-panel)]'
                : 'border-[var(--site-line)] text-[var(--site-muted)] hover:border-[var(--site-muted)] hover:bg-[var(--site-panel-strong)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="mb-0 text-sm text-[var(--site-muted)]">
          {total > 0 ? (
            <>
              共 <strong className="text-[var(--site-ink)]">{total}</strong> 条，
              {unread > 0 ? (
                <>
                  其中 <strong className="text-[var(--site-accent)]">{unread}</strong> 条未读
                </>
              ) : (
                '全部已读'
              )}
            </>
          ) : (
            '还没有站内通知'
          )}
        </p>
        <div className="flex items-center gap-2">
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
        <div className="space-y-3" role="status" aria-label="正在加载通知">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              className="h-24 rounded-2xl border border-[var(--site-line)]"
            />
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="rounded-2xl border border-[var(--site-line)] px-6 py-10 text-center">
          <p className="mb-3 text-sm text-[var(--site-muted)]">通知暂时加载失败。</p>
          <button type="button" onClick={refresh} className="discussion-text-link text-sm">
            重新加载
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--site-line)] px-6 py-12 text-center">
          <p className="mb-1 text-base font-semibold text-[var(--site-ink)]">还没有新的站内通知</p>
          <p className="mb-0 text-sm leading-6 text-[var(--site-muted)]">
            {filter === 'automation'
              ? '定时自动化任务运行失败时，监控提醒会出现在这里。'
              : '有人在你的内容下评论、回复或点赞时，会出现在这里。'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {items.map((item) => (
              <NotificationCard key={item.id} item={item} onOpen={openItem} />
            ))}
          </div>
          {items.length < total ? (
            <div ref={sentinelRef} className="mt-5 flex min-h-10 items-center justify-center text-center">
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
            <p className="mt-5 text-center text-xs text-[var(--site-faint)]">
              已加载全部 {total} 条
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
