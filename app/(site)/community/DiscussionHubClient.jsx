'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { DISCUSSION_COMMUNITY_TOPICS } from '../../../lib/communityTopics'
import { commentProviderLabel } from '../../../lib/userDisplayName'
import { PUBLIC_READER_HINT, READER_PROVIDER } from '../../../lib/engagementBot'
import { useSessionAccount } from '../components/SessionProvider'
import StompPanel from '../components/StompPanel'
import UserAvatar from '../components/UserAvatar'

const WECHAT_QR_ITEM = {
  src: '/qrcode-wechat.jpg',
  label: '个人微信号',
  desc: '群二维码失效时，先加我拉你进群。',
  tag: '联系站长',
}

const GROUP_QR_ITEMS = [
  { src: '/qrcode-x-group.jpg', label: 'X 互帮互助群', desc: 'X 互关、账号增长、创作者互助。', tag: '互助' },
  { src: '/qrcode-community1.jpg', label: '前端周刊群', desc: '前端、AI 工程、技术内容同步。', tag: '技术' },
  { src: '/qrcode-community2.jpg', label: '抽奖粉丝群', desc: '抽奖活动、福利通知和粉丝互动。', tag: '活动' },
  { src: '/qrcode-community3.jpg', label: 'AI 资讯群', desc: 'AI 产品、工具、资讯和案例分享。', tag: 'AI' },
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
          <UserAvatar
            seed={item.userName || item.userId || 'guest'}
            size="sm"
            title={item.userProvider === READER_PROVIDER ? `${item.userName} · ${PUBLIC_READER_HINT}` : item.userName}
          />
          <div className="min-w-0">
            <p className="mb-0 truncate text-sm font-semibold text-[var(--site-ink)]">
              {item.userName || '用户'}
            </p>
            <p className="mb-0 text-[11px] text-[var(--site-faint)]">
              {commentProviderLabel(item.userProvider)}
              {item.replyToUserName ? ` · 回复 @${item.replyToUserName}` : ''}
            </p>
          </div>
        </div>
        <time className="shrink-0 font-mono text-[11px] text-[var(--site-faint)]">
          {formatTime(item.createdAt)}
        </time>
      </div>

      <p className="mb-0 mt-2 line-clamp-2 whitespace-pre-wrap text-[13px] leading-5 text-[var(--site-muted)] md:mt-3 md:line-clamp-3 md:text-sm md:leading-6">
        {item.message}
      </p>

      <div className="mt-2 flex min-w-0 items-center justify-between gap-3 border-t border-[var(--site-line)] pt-2 md:mt-3 md:pt-3">
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

function QrEntry({ item, primary = false }) {
  return (
    <div className={`discussion-qr-entry ${primary ? 'discussion-qr-entry-primary' : ''}`}>
      <div className="discussion-qr-image">
        <Image
          src={item.src}
          alt={item.label}
          width={96}
          height={96}
          sizes="96px"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <h3 className="mb-0 truncate border-0 p-0 text-sm font-semibold text-[var(--site-ink)]">
            {item.label}
          </h3>
          <span className="discussion-qr-tag">{item.tag}</span>
        </div>
        <p className="mb-0 text-xs leading-5 text-[var(--site-muted)]">{item.desc}</p>
      </div>
    </div>
  )
}

function TopicCircleCard({ topic }) {
  return (
    <Link href={topic.href} className="h5-feed-row discussion-topic-card flex items-center justify-between gap-3 no-underline hover:no-underline">
      <div className="min-w-0">
        <h3 className="h5-feed-title mb-0 border-0 p-0 text-[16px] font-semibold text-[var(--site-ink)] md:text-base">
          {topic.label}
        </h3>
        <p className="mb-0 mt-2 hidden text-sm leading-6 text-[var(--site-muted)] md:block">
          {topic.desc}
        </p>
      </div>
      <span className="shrink-0 text-[12px] text-[var(--site-faint)] md:hidden">进入</span>
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
          登录后，评论回复和与你相关的站内通知会出现在顶部账号菜单。
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
              <p className="mb-1 line-clamp-1 text-xs font-medium text-[var(--site-ink)]">
                {item.title || '新的站内通知'}
              </p>
              <p className="mb-1 line-clamp-2 text-xs leading-5 text-[var(--site-muted)]">
                {item.messageExcerpt || '查看详情'}
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
          还没有新的站内通知。这里会与顶部账号菜单同步。
        </p>
      )}
      <Link
        href="/notifications"
        className="discussion-text-link mt-3 inline-flex items-center gap-1 text-xs"
      >
        查看全部通知
        <span aria-hidden="true">→</span>
      </Link>
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
    <div className="h5-community-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0">
        <section className="discussion-hero">
          <p className="discussion-eyebrow">Community Feed</p>
          <h1>讨论</h1>
          <p>
            留言也是讨论的一部分。这里统一收纳给站长的留言、全站公开评论、回复通知和社群入口。
          </p>
          <div className="discussion-stats hidden md:grid">
            <Stat value={stats.comments ?? '—'} label="全部评论" />
            <Stat value={stats.weekComments ?? '—'} label="近 7 天" />
            <Stat value={stats.participants ?? '—'} label="参与者" />
          </div>
        </section>

        <section className="mt-4 md:mt-6" aria-labelledby="topic-circles-title">
          <div className="mb-2 md:mb-3">
            <p className="discussion-eyebrow mb-1">Topic Circles</p>
            <h2 id="topic-circles-title" className="mb-0 border-0 p-0 text-[15px] md:text-lg">专题圈子</h2>
            <p className="mb-0 mt-1 hidden text-sm text-[var(--site-muted)] md:block">
              三个平台，找到同路创作者。
            </p>
          </div>
          <div className="h5-topic-list divide-y divide-[var(--site-line)] overflow-hidden rounded-lg border border-[var(--site-line)] md:grid md:grid-cols-3 md:gap-3 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0">
            {DISCUSSION_COMMUNITY_TOPICS.map((topic) => (
              <TopicCircleCard key={topic.id} topic={topic} />
            ))}
          </div>
        </section>

        <section id="message" className="mt-4 scroll-mt-24 md:mt-6">
          <div className="mb-2 md:mb-3">
            <p className="discussion-eyebrow mb-1">Message</p>
            <h2 className="mb-0 border-0 p-0 text-[15px] md:text-lg">留下想法</h2>
            <p className="mb-0 mt-1 hidden text-sm text-[var(--site-muted)] md:block">
              可以写近况、建议、问题或合作想法，最新留言也会在这里展示。
            </p>
          </div>
          <StompPanel />
        </section>

        <section className="mt-4 md:mt-6">
          <div className="mb-2 flex items-end justify-between gap-3 md:mb-3">
            <div>
              <p className="discussion-eyebrow mb-1">Live</p>
              <h2 className="mb-0 border-0 p-0 text-[15px] md:text-lg">最新 10 条评论</h2>
            </div>
            <a href="#message" className="discussion-text-link">留下想法</a>
          </div>

          {loading ? (
            <div className="discussion-empty">正在加载最新评论...</div>
          ) : hasItems ? (
            <div className="space-y-0 divide-y divide-[var(--site-line)] md:space-y-3 md:divide-y-0">
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
          <div className="space-y-2.5">
            <QrEntry item={WECHAT_QR_ITEM} primary />
            {GROUP_QR_ITEMS.map((item) => (
              <QrEntry key={item.src} item={item} />
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
