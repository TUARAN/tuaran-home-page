'use client'

import Link from 'next/link'
import {
  IconChevronRight,
  IconMessageCircle2,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'

import { commentProviderLabel } from '../../../lib/userDisplayName'
import { PUBLIC_READER_HINT, READER_PROVIDER } from '../../../lib/engagementBot'
import StompPanel from '../components/StompPanel'
import UserAvatar from '../components/UserAvatar'

const FEED_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'comment', label: '文章评论' },
  { id: 'message', label: '公开留言' },
]

function formatTime(ts) {
  const value = Number(ts)
  if (!value) return ''
  const diff = Date.now() - value
  if (diff >= 0 && diff < 60_000) return '刚刚'
  if (diff >= 0 && diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))} 分钟前`
  if (diff >= 0 && diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))} 小时前`
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function FeedItem({ item }) {
  const isMessage = item.type === 'message'
  const content = (
    <article className="community-feed-item">
      <UserAvatar
        seed={item.userName || item.userId || 'guest'}
        size="md"
        title={item.userProvider === READER_PROVIDER ? `${item.userName} · ${PUBLIC_READER_HINT}` : item.userName}
      />
      <div className="min-w-0 flex-1">
        <div className="community-feed-meta">
          <strong>{item.userName || '用户'}</strong>
          <span>{isMessage ? '在讨论中心留言' : commentProviderLabel(item.userProvider)}</span>
          <span aria-hidden="true">·</span>
          <time>{formatTime(item.createdAt)}</time>
        </div>
        <p className="community-feed-copy">{item.message}</p>
        {!isMessage && item.articleTitle ? (
          <div className="community-feed-source">
            <IconMessageCircle2 size={14} aria-hidden="true" />
            <span className="truncate">{item.replyToUserName ? `回复 @${item.replyToUserName} · ` : ''}{item.articleTitle}</span>
            <IconChevronRight size={14} className="ml-auto shrink-0" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </article>
  )

  if (!item.href) return content
  return <Link href={item.href} className="block no-underline hover:no-underline">{content}</Link>
}

export default function DiscussionHubClient() {
  const [data, setData] = useState({ status: 'loading', items: [], messages: [], threads: [] })
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let alive = true
    Promise.allSettled([
      fetch('/api/discussions?limit=20', { cache: 'no-store', credentials: 'same-origin' }).then((res) => res.json()),
      fetch('/api/stomp?limit=20', { cache: 'no-store', credentials: 'same-origin' }).then((res) => res.ok ? res.json() : null),
    ]).then(([discussionResult, messageResult]) => {
      if (!alive) return
      const discussion = discussionResult.status === 'fulfilled' ? discussionResult.value : null
      const messages = messageResult.status === 'fulfilled' && Array.isArray(messageResult.value?.items)
        ? messageResult.value.items
        : []
      setData({
        status: discussion?.status || 'error',
        items: Array.isArray(discussion?.items) ? discussion.items : [],
        threads: Array.isArray(discussion?.threads) ? discussion.threads : [],
        messages,
      })
    })
    return () => { alive = false }
  }, [])

  const feed = useMemo(() => {
    const comments = data.items.map((item) => ({ ...item, type: 'comment' }))
    const messages = data.messages.map((item) => ({
      id: `message-${item.id}`,
      type: 'message',
      userId: item.user_id,
      userName: item.user_name,
      message: item.message,
      createdAt: item.created_at,
      href: null,
    }))
    return [...comments, ...messages]
      .filter((item) => filter === 'all' || item.type === filter)
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      .slice(0, 16)
  }, [data.items, data.messages, filter])

  function handlePublished(item) {
    if (!item) return
    setData((current) => ({ ...current, messages: [item, ...current.messages] }))
    setFilter('all')
  }

  const loading = data.status === 'loading'

  return (
    <div className="community-page">
      <section id="message" className="community-section community-feed-section scroll-mt-24" aria-labelledby="community-feed-title">
        <div className="community-section-head community-feed-heading">
          <div>
            <p className="community-kicker">NOW TALKING</p>
            <h2 id="community-feed-title">大家最近在聊</h2>
          </div>
          <div className="community-feed-filters" role="tablist" aria-label="筛选讨论动态">
            {FEED_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={filter === item.id ? 'is-active' : ''}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="community-content-grid">
          <div className="community-feed" aria-live="polite">
            {loading ? (
              <div className="community-empty">正在收集最近的讨论…</div>
            ) : feed.length ? (
              feed.map((item) => <FeedItem key={`${item.type}-${item.id}`} item={item} />)
            ) : (
              <div className="community-empty">这个分类里还没有动态。可以先留下第一句话。</div>
            )}
          </div>

          <aside className="community-rail">
            <StompPanel onPublished={handlePublished} />

            {data.threads.length ? (
              <section className="community-thread-panel">
                <p className="community-kicker">ACTIVE THREADS</p>
                <h3>正在升温</h3>
                <div>
                  {data.threads.slice(0, 4).map((thread) => (
                    <Link key={thread.articleKey} href={thread.href || '/community'} className="community-thread-link no-underline hover:no-underline">
                      <span className="line-clamp-2">{thread.title}</span>
                      <strong>{thread.comments}</strong>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  )
}
