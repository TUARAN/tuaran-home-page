'use client'

import Link from 'next/link'
import {
  IconArrowRight,
  IconChevronRight,
  IconMessageCircle2,
  IconQrcode,
  IconSparkles,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'

import { DISCUSSION_COMMUNITY_TOPICS } from '../../../lib/communityTopics'
import { commentProviderLabel } from '../../../lib/userDisplayName'
import { PUBLIC_READER_HINT, READER_PROVIDER } from '../../../lib/engagementBot'
import StompPanel from '../components/StompPanel'
import UserAvatar from '../components/UserAvatar'
import CommunityMembershipCard from '../components/CommunityMembershipCard'

const TOPIC_ACCENTS = {
  'x-mutual-aid-circle': '#1d9bf0',
  'xiaohongshu-creator-circle': '#e94b68',
  'juejin-creator-circle': '#1677ff',
}

const FEED_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'comment', label: '文章评论' },
  { id: 'message', label: '圈子留言' },
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

function Stat({ value, label }) {
  return (
    <div className="community-stat">
      <strong>{value ?? '—'}</strong>
      <span>{label}</span>
    </div>
  )
}

function TopicCircleCard({ topic, index }) {
  const accent = TOPIC_ACCENTS[topic.id] || topic.accent || 'var(--site-accent)'
  return (
    <Link
      href={topic.href}
      className="community-topic-card no-underline hover:no-underline"
      style={{ '--topic-accent': accent }}
    >
      <div className="community-topic-card-head">
        <span className="community-topic-number">0{index + 1}</span>
        <span className="community-topic-status">{topic.tag}</span>
      </div>
      <div>
        <p className="community-topic-platform">{topic.eyebrow}</p>
        <h3>{topic.label}</h3>
        <p className="community-topic-desc">{topic.desc}</p>
      </div>
      <span className="community-topic-action">
        进入圈子 <IconArrowRight size={16} aria-hidden="true" />
      </span>
    </Link>
  )
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
          <span>{isMessage ? '在圈子留言' : commentProviderLabel(item.userProvider)}</span>
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

function JoinPanel({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="community-join-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-panel-title"
        className="community-join-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="community-join-head">
          <div>
            <p className="community-kicker">JOIN THE CIRCLE</p>
            <h2 id="join-panel-title">付费加入圈子</h2>
            <p>查看入圈费用、付款方式和人工核对流程。</p>
          </div>
          <button type="button" onClick={onClose} className="community-icon-button" aria-label="关闭加入面板">
            <IconX size={19} aria-hidden="true" />
          </button>
        </div>

        <CommunityMembershipCard compact />
      </section>
    </div>
  )
}

export default function DiscussionHubClient() {
  const [data, setData] = useState({ status: 'loading', items: [], messages: [], threads: [], stats: null })
  const [filter, setFilter] = useState('all')
  const [joinOpen, setJoinOpen] = useState(false)

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
        stats: discussion?.stats || null,
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

  const stats = data.stats || {}
  const loading = data.status === 'loading'

  return (
    <>
      <div className="community-page">
        <header className="community-hero">
          <div className="community-hero-copy">
            <p className="community-kicker"><span /> COMMUNITY</p>
            <h1>圈子</h1>
            <p className="community-hero-lead">找到同路的人，让一次留言变成持续的交流。</p>
            <div className="community-hero-actions">
              <a href="#topic-circles" className="community-primary-button">
                浏览圈子 <IconArrowRight size={17} aria-hidden="true" />
              </a>
              <button type="button" className="community-secondary-button" onClick={() => setJoinOpen(true)}>
                <IconQrcode size={17} aria-hidden="true" /> ¥99 / 年加入
              </button>
            </div>
          </div>
          <div className="community-hero-side">
            <div className="community-hero-orbit" aria-hidden="true">
              <span className="orbit-center"><IconUsers size={28} /></span>
              <span className="orbit-dot orbit-dot-one" />
              <span className="orbit-dot orbit-dot-two" />
              <span className="orbit-dot orbit-dot-three" />
            </div>
            <div className="community-stats">
              <Stat value={stats.comments} label="公开评论" />
              <Stat value={stats.weekComments} label="近 7 天" />
              <Stat value={stats.participants} label="参与者" />
            </div>
          </div>
        </header>

        <section id="topic-circles" className="community-section scroll-mt-24" aria-labelledby="topic-circles-title">
          <div className="community-section-head">
            <div>
              <p className="community-kicker">TOPIC CIRCLES</p>
              <h2 id="topic-circles-title">从共同话题开始</h2>
            </div>
            <p>每个圈子都有明确的主题和参与方式，先看看哪个更像你。</p>
          </div>
          <div className="community-topic-grid">
            {DISCUSSION_COMMUNITY_TOPICS.map((topic, index) => (
              <TopicCircleCard key={topic.id} topic={topic} index={index} />
            ))}
          </div>
        </section>

        <section className="community-section" aria-label="付费入圈">
          <CommunityMembershipCard id="join" />
        </section>

        <section className="community-section" aria-labelledby="community-feed-title">
          <div className="community-section-head community-feed-heading">
            <div>
              <p className="community-kicker">NOW TALKING</p>
              <h2 id="community-feed-title">大家最近在聊</h2>
            </div>
            <div className="community-feed-filters" role="tablist" aria-label="筛选圈子动态">
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

              <button type="button" className="community-join-card" onClick={() => setJoinOpen(true)}>
                <span><IconSparkles size={18} aria-hidden="true" /></span>
                <div>
                  <strong>付费加入微信群聊</strong>
                  <p>¥99 / 年，付款核对后按主题拉群。</p>
                </div>
                <IconChevronRight size={18} aria-hidden="true" />
              </button>
            </aside>
          </div>
        </section>
      </div>

      <JoinPanel open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  )
}
