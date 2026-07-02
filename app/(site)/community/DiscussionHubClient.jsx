'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useSessionAccount } from '../components/SessionProvider'
import UserAvatar from '../components/UserAvatar'

const QR_ITEMS = [
  { src: '/qrcode-community1.jpg', label: '前端周刊群' },
  { src: '/qrcode-community2.jpg', label: '抽奖粉丝群' },
  { src: '/qrcode-community3.jpg', label: 'AI资讯群' },
  { src: '/qrcode-wechat.jpg', label: '微信号' },
]

function formatTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  try {
    return new Date(n).toLocaleString('zh-CN', {
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

function Stat({ value, label }) {
  return (
    <div className="discussion-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function DiscussionItem({ item }) {
  const body = (
    <article className="discussion-feed-item">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar seed={item.userName || item.userId || 'guest'} size="sm" title={item.userName} />
          <div className="min-w-0">
            <p className="mb-0 truncate text-sm font-semibold text-[var(--site-ink)]">
              {item.userName || '用户'}
            </p>
            <p className="mb-0 text-[11px] text-[var(--site-faint)]">
              {providerLabel(item.userProvider)}
              {item.replyToUserName ? ` · 回复 @${item.replyToUserName}` : ''}
            </p>
          </div>
        </div>
        <time className="shrink-0 font-mono text-[11px] text-[var(--site-faint)]">
          {formatTime(item.createdAt)}
        </time>
      </div>

      <p className="mb-0 mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[var(--site-muted)]">
        {item.message}
      </p>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-[var(--site-line)] pt-3">
        <span className="min-w-0 truncate text-xs text-[var(--site-faint)]">
          评论在：{item.articleTitle}
        </span>
        <span className="shrink-0 text-xs font-medium text-[var(--site-accent)]">
          查看文章
        </span>
      </div>
    </article>
  )

  if (!item.href) return body
  return (
    <Link href={item.href} className="block no-underline hover:no-underline">
      {body}
    </Link>
  )
}

function ThreadItem({ thread }) {
  const content = (
    <div className="discussion-thread-item">
      <div className="min-w-0">
        <p className="mb-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--site-ink)]">
          {thread.title}
        </p>
        <p className="mb-0 text-[11px] text-[var(--site-faint)]">
          {thread.participants} 人参与 · 最新 {formatTime(thread.latestAt)}
        </p>
      </div>
      <span>{thread.comments}</span>
    </div>
  )

  if (!thread.href) return content
  return (
    <Link href={thread.href} className="block no-underline hover:no-underline">
      {content}
    </Link>
  )
}

function formatNotificationTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  const diff = Date.now() - n
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))} 分钟前`
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))} 小时前`
  return formatTime(n)
}

function NotificationPanel() {
  const {
    loading,
    user,
    notifications,
    refreshNotifications,
    markNotificationsRead,
  } = useSessionAccount()
  const items = Array.isArray(notifications?.items) ? notifications.items.slice(0, 4) : []
  const unread = Number(notifications?.unread) || 0

  if (loading) {
    return <p className="mb-0 text-sm text-[var(--site-muted)]">正在检查登录状态...</p>
  }

  if (!user) {
    return (
      <>
        <p className="mb-3 text-sm text-[var(--site-muted)]">
          登录后，别人回复你的评论会出现在顶部账号菜单，也会跳转到具体评论。
        </p>
        <Link href="/login?returnTo=%2Fcommunity" className="discussion-primary-link">
          登录查看通知
        </Link>
      </>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="mb-0 text-sm text-[var(--site-muted)]">
          已登录。{unread ? `你有 ${unread} 条未读回复。` : '暂无未读回复。'}
        </p>
        <button
          type="button"
          onClick={() => refreshNotifications?.()}
          className="discussion-text-link shrink-0 text-xs"
        >
          刷新
        </button>
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href || '/community'}
              onClick={() => item.id && markNotificationsRead?.({ id: item.id })}
              className="block rounded-xl border border-[var(--site-line)] px-3 py-2 no-underline hover:no-underline"
            >
              <p className="mb-1 line-clamp-2 text-xs leading-5 text-[var(--site-muted)]">
                {item.messageExcerpt || '有人回复了你的评论'}
              </p>
              <p className="mb-1 line-clamp-1 text-[11px] text-[var(--site-faint)]">
                {item.articleTitle}
              </p>
              <p className="mb-0 font-mono text-[10px] text-[var(--site-faint)]">
                {item.actorUserName || '访客'} · {formatNotificationTime(item.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mb-0 text-sm text-[var(--site-muted)]">
          还没有新的评论回复。你回复别人或在文章底部留言后，这里会跟顶部账号菜单同步。
        </p>
      )}
    </div>
  )
}

export default function DiscussionHubClient() {
  const [data, setData] = useState({ status: 'loading', items: [], threads: [], stats: null })

  useEffect(() => {
    let alive = true
    fetch('/api/discussions?limit=10', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((json) => {
        if (alive) setData(json || { status: 'error', items: [], threads: [], stats: null })
      })
      .catch(() => {
        if (alive) setData({ status: 'error', items: [], threads: [], stats: null })
      })
    return () => {
      alive = false
    }
  }, [])

  const stats = data.stats || {}
  const hasItems = Array.isArray(data.items) && data.items.length > 0
  const loading = data.status === 'loading'
  const statusText = useMemo(() => {
    if (loading) return '正在加载讨论动态'
    if (data.status === 'unavailable') return '本地数据库暂不可用'
    if (data.status === 'error') return '讨论动态暂时加载失败'
    return '最近讨论'
  }, [data.status, loading])

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0">
        <section className="discussion-hero">
          <p className="discussion-eyebrow">Community Feed</p>
          <h1>讨论</h1>
          <p>
            看看大家在聊什么。这里展示最近 10 条公开评论，点击后可以跳到对应文章和具体评论位置。
          </p>
          <div className="discussion-stats">
            <Stat value={stats.comments ?? '—'} label="全部评论" />
            <Stat value={stats.weekComments ?? '—'} label="近 7 天" />
            <Stat value={stats.participants ?? '—'} label="参与者" />
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="discussion-eyebrow mb-1">Live</p>
              <h2 className="mb-0 border-0 p-0 text-lg">最新 10 条评论</h2>
            </div>
            <Link href="/messages" className="discussion-text-link">
              去留言板
            </Link>
          </div>

          {loading ? (
            <div className="discussion-empty">正在加载最新评论...</div>
          ) : hasItems ? (
            <div className="space-y-3">
              {data.items.map((item) => (
                <DiscussionItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="discussion-empty">{statusText}。先去任意文章底部留下第一条评论。</div>
          )}
        </section>
      </main>

      <aside className="space-y-4">
        <section className="discussion-side-panel">
          <p className="discussion-eyebrow">Groups</p>
          <h2 className="mb-2 border-0 p-0 text-base">社群入口</h2>
          <p className="mb-3 text-sm text-[var(--site-muted)]">
            加群二维码会不定期更新，失效时可先加微信号。
          </p>
          <div className="grid grid-cols-2 gap-3">
            {QR_ITEMS.map((item) => (
              <div key={item.src} className="discussion-qr-card">
                <Image
                  src={item.src}
                  alt={item.label}
                  width={132}
                  height={132}
                  sizes="132px"
                  className="h-auto w-full object-contain"
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="discussion-side-panel">
          <p className="discussion-eyebrow">Threads</p>
          <h2 className="mb-3 border-0 p-0 text-base">活跃讨论</h2>
          {data.threads?.length ? (
            <div className="space-y-2">
              {data.threads.map((thread) => (
                <ThreadItem key={thread.articleKey} thread={thread} />
              ))}
            </div>
          ) : (
            <p className="mb-0 text-sm text-[var(--site-muted)]">暂无活跃讨论。</p>
          )}
        </section>

        <section className="discussion-side-panel">
          <p className="discussion-eyebrow">Notify</p>
          <h2 className="mb-2 border-0 p-0 text-base">通知中心</h2>
          <NotificationPanel />
        </section>
      </aside>
    </div>
  )
}
