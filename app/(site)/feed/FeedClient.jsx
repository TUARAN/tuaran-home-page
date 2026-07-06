'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import ArticleActionsDropdown from '../components/ArticleActionsDropdown'
import DistributeContentButton from '../components/DistributeContentButton'
import SharePageButton from '../components/SharePageButton'
import { FEED_TYPE_META } from './data'

function TypeBadge({ type }) {
  const meta = FEED_TYPE_META[type]
  if (!meta) return null
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: meta.accent, background: `${meta.accent}1a` }}
    >
      {meta.label}
    </span>
  )
}

const ALL_FILTER_ACCENT = '#7352a2'
const INITIAL_RENDER_COUNT = 7
const RENDER_BATCH_SIZE = 6

function itemShareText(item) {
  return [
    `看到一个灵感：${item.title}`,
    item.summary,
  ].filter(Boolean).join('\n')
}

function itemDistributeSummary(item) {
  return [item.summary || item.quote || '', item.prompt ? `提示词：\n${item.prompt}` : ''].filter(Boolean).join('\n\n')
}

function MetaRow({ item, showShare = true, showDetail = false, maxTags = Infinity }) {
  const tags = item.tags || []
  const visibleTags = Number.isFinite(maxTags) ? tags.slice(0, maxTags) : tags
  const hiddenTagCount = Math.max(0, tags.length - visibleTags.length)
  const sourceLink = item.source?.href ? (
    <a
      href={item.source.href}
      target="_blank"
      rel="noreferrer"
      className="article-action-button px-3 py-1 text-xs no-underline"
    >
      <span>来源：{item.source.label || '链接'}</span>
      <span aria-hidden="true">↗</span>
    </a>
  ) : null

  return (
    <div className="mt-5 flex flex-col gap-2 text-[11px] text-[var(--site-muted)]">
      <div className="flex min-w-0 items-center gap-x-2 gap-y-2 overflow-x-auto whitespace-nowrap pb-1">
        {item.date ? <time>{item.date}</time> : null}
        {visibleTags.length ? (
          <>
            <span aria-hidden="true">·</span>
            {visibleTags.map((t) => (
              <span key={t} className="rounded-md bg-[var(--site-panel-strong)] px-2 py-1">
                #{t}
              </span>
            ))}
            {hiddenTagCount ? (
              <span
                className="rounded-md bg-[var(--site-panel-strong)] px-2 py-1 font-mono text-[10px]"
                title={tags.slice(visibleTags.length).map((t) => `#${t}`).join(' ')}
              >
                +{hiddenTagCount}
              </span>
            ) : null}
          </>
        ) : null}
      </div>
      {sourceLink || showDetail || showShare ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {sourceLink}
          {showDetail ? (
            <Link href={`/feed/${item.id}`} className="article-action-button px-3 py-1 text-xs no-underline">
              查看
            </Link>
          ) : null}
          {showShare ? (
            <SharePageButton
              title={item.title}
              text={itemShareText(item)}
              url={`/feed/${item.id}`}
              exactUrl
              idleLabel="转发"
            />
          ) : null}
          <ArticleActionsDropdown label="更多">
            <DistributeContentButton
              title={item.title}
              summary={itemDistributeSummary(item)}
              images={[item.src, item.image, item.poster].filter(Boolean)}
              url={`/feed/${item.id}`}
              category="feed"
              slug={item.id}
              tags={item.tags || []}
              kindLabel="灵感"
            />
          </ArticleActionsDropdown>
        </div>
      ) : null}
    </div>
  )
}

function PromptBlock({ prompt }) {
  if (!prompt) return null
  return (
    <details className="mt-4 rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] p-3">
      <summary className="cursor-pointer text-[12px] font-semibold text-[var(--site-ink)]">
        查看完整提示词
      </summary>
      <pre className="mb-0 mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md bg-[var(--site-bg)] p-3 text-[12px] leading-6 text-[var(--site-muted)]">
        {prompt}
      </pre>
    </details>
  )
}

function MediaFrame({ aspect = '16/9', children, frameRef }) {
  return (
    <div
      ref={frameRef}
      className="relative min-w-0 w-full max-w-full overflow-hidden rounded-lg bg-black/90"
      style={{ aspectRatio: aspect }}
    >
      {children}
    </div>
  )
}

function LazyVideo({ item, eager = false }) {
  const [activated, setActivated] = useState(eager)
  const shouldLoad = eager || activated

  return (
    <MediaFrame aspect={item.aspect}>
      {shouldLoad ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={item.src}
          poster={item.poster || undefined}
          controls
          preload="metadata"
          playsInline
          autoPlay={activated && !eager}
          aria-label={item.title}
        />
      ) : (
        <button
          type="button"
          className="absolute inset-0 block h-full w-full overflow-hidden bg-[#282824] text-left text-white"
          onClick={() => setActivated(true)}
          aria-label={`加载视频：${item.title}`}
        >
          {item.poster ? (
            // 静态 poster 已经是视频缩略图，这里用原生 img 避免给 feed 卡片引入 next/image 包装尺寸。
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={item.poster}
              alt=""
              loading="lazy"
            />
          ) : (
            <span
              className="absolute inset-0 block bg-[radial-gradient(circle_at_18%_18%,rgba(255,77,106,0.32),transparent_34%),linear-gradient(135deg,#394340,#1f211d_58%,#111)]"
              aria-hidden="true"
            />
          )}
          <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true" />
          <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
            视频
          </span>
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/45 bg-black/35 shadow-lg shadow-black/35 backdrop-blur-sm" aria-hidden="true">
            <span className="ml-1 h-0 w-0 border-y-[9px] border-y-transparent border-l-[14px] border-l-white" />
          </span>
          {!item.poster ? (
            <span className="absolute inset-x-4 bottom-4 line-clamp-2 font-serif text-[18px] leading-tight text-white drop-shadow">
              {item.title}
            </span>
          ) : null}
        </button>
      )}
    </MediaFrame>
  )
}

// 仅渲染媒体本体（视频 / 图片），供普通卡与头条卡复用
function ItemMedia({ item, eager = false }) {
  if (item.type === 'video') {
    return <LazyVideo item={item} eager={eager} />
  }
  if (item.type === 'image' || (item.type === 'link' && item.image)) {
    return (
      <MediaFrame aspect={item.aspect || '16/9'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={item.type === 'image' ? item.src : item.image}
          alt={item.title}
          loading={eager ? 'eager' : 'lazy'}
        />
      </MediaFrame>
    )
  }
  return null
}

const HEADLINE_ACCENT = {
  video: '#ff4d6a',
  image: '#6c5ce7',
  link: '#00a978',
  quote: '#f5a623',
}

// 头条卡：占满整行，桌面端媒体在左、文案在右
function HeadlineCard({ item }) {
  const accent = HEADLINE_ACCENT[item.type] || '#f5a623'
  const media = <ItemMedia item={item} eager />
  const hasMedia = item.type === 'video' || item.type === 'image' || (item.type === 'link' && item.image)

  const text = (
    <div className={`flex min-w-0 flex-col justify-start ${hasMedia ? 'p-4 md:p-0 lg:py-3' : 'lg:py-3'}`}>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: accent, background: `${accent}1a` }}
        >
          头条 · {FEED_TYPE_META[item.type]?.label || ''}
        </span>
      </div>
      <h2 className="mb-0 mt-3 border-b border-[var(--site-ink)] pb-2 font-serif text-[24px] leading-tight text-[var(--site-ink)] md:text-[28px]">
        {item.type === 'link' && item.href ? (
          <a href={item.href} target="_blank" rel="noreferrer" className="no-underline hover:underline">
            {item.title} ↗
          </a>
        ) : (
          item.title
        )}
      </h2>
      {item.type === 'quote' ? (
        <blockquote className="mt-4 border-l-2 pl-4 font-serif text-[18px] leading-8 text-[var(--site-ink)]" style={{ borderColor: accent }}>
          {item.quote || item.summary}
        </blockquote>
      ) : item.summary ? (
        <p className="mb-0 mt-4 text-[15px] leading-7 text-[var(--site-muted)]">{item.summary}</p>
      ) : null}
      <PromptBlock prompt={item.prompt} />
      {item.author ? <p className="mb-0 mt-3 text-[13px] text-[var(--site-muted)]">—— {item.author}</p> : null}
      <MetaRow item={item} />
    </div>
  )

  return (
    <article
      id={item.id}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[var(--site-bg)] transition-colors md:p-6 ${hasMedia ? 'p-0' : 'p-4'}`}
      style={{ borderColor: `${accent}40` }}
    >
      {hasMedia ? (
        <div className="grid min-w-0 gap-0 md:gap-5 lg:grid-cols-[1.45fr_minmax(320px,0.95fr)] lg:items-start lg:gap-7">
          <div className="min-w-0">{media}</div>
          {text}
        </div>
      ) : (
        text
      )}
    </article>
  )
}

function VideoCard({ item }) {
  return (
    <article id={item.id} className="flex h-full scroll-mt-24 flex-col rounded-xl border border-[var(--site-line)] bg-[var(--site-bg)] p-4 transition-colors hover:border-[#ff4d6a]/50">
      <LazyVideo item={item} />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mt-3 flex items-center gap-2">
          <TypeBadge type={item.type} />
          <h2 className="mb-0 line-clamp-2 border-b-0 pb-0 font-serif text-[18px] leading-tight text-[var(--site-ink)]">
            <Link href={`/feed/${item.id}`} className="no-underline hover:underline">
              {item.title}
            </Link>
          </h2>
        </div>
        {item.summary ? (
          <p className="mb-0 mt-2 line-clamp-4 text-[13.5px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
        ) : null}
        <div className="mt-auto">
          <MetaRow item={item} showDetail maxTags={3} />
        </div>
      </div>
    </article>
  )
}

function ImageCard({ item }) {
  return (
    <article id={item.id} className="flex h-full scroll-mt-24 flex-col rounded-xl border border-[var(--site-line)] bg-[var(--site-bg)] p-4 transition-colors hover:border-[#6c5ce7]/50">
      <MediaFrame aspect={item.aspect}>
        {/* 静态资源，沿用站内 <img> 约定 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="absolute inset-0 h-full w-full object-cover" src={item.src} alt={item.title} loading="lazy" />
      </MediaFrame>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mt-3 flex items-center gap-2">
          <TypeBadge type={item.type} />
          <h2 className="mb-0 line-clamp-2 border-b-0 pb-0 font-serif text-[18px] leading-tight text-[var(--site-ink)]">
            <Link href={`/feed/${item.id}`} className="no-underline hover:underline">
              {item.title}
            </Link>
          </h2>
        </div>
        {item.summary ? (
          <p className="mb-0 mt-2 line-clamp-4 text-[13.5px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
        ) : null}
        <div className="mt-auto">
          <MetaRow item={item} showDetail maxTags={3} />
        </div>
      </div>
    </article>
  )
}

function LinkCard({ item }) {
  return (
    <article id={item.id} className="flex h-full scroll-mt-24 flex-col rounded-xl border border-[var(--site-line)] bg-[var(--site-bg)] transition-colors hover:border-[#00a978]/50">
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <a href={item.href} target="_blank" rel="noreferrer" className="block no-underline">
          {item.image ? (
            <MediaFrame aspect={item.aspect || '16/9'}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="absolute inset-0 h-full w-full object-cover" src={item.image} alt={item.title} loading="lazy" />
            </MediaFrame>
          ) : null}
          <div className={`flex items-center gap-2 ${item.image ? 'mt-3' : ''}`}>
            <TypeBadge type={item.type} />
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-[18px] leading-tight text-[var(--site-ink)]">{item.title} ↗</h2>
          </div>
        </a>
        {item.summary ? (
          <p className="mb-0 mt-2 line-clamp-4 text-[13.5px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
        ) : null}
        <div className="mt-auto">
          <MetaRow item={item} showDetail maxTags={3} />
        </div>
      </div>
    </article>
  )
}

function QuoteCard({ item }) {
  return (
    <article id={item.id} className="flex h-full scroll-mt-24 flex-col rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5 transition-colors hover:border-[#f5a623]/50">
      <div className="mb-3"><TypeBadge type={item.type} /></div>
      <blockquote className="line-clamp-6 border-l-2 border-[#f5a623] pl-4 font-serif text-[17px] leading-8 text-[var(--site-ink)]">
        {item.quote || item.summary}
      </blockquote>
      {item.author ? (
        <p className="mb-0 mt-3 text-right text-[12px] text-[var(--site-muted)]">—— {item.author}</p>
      ) : null}
      <div className="mt-auto">
        <MetaRow item={item} showDetail maxTags={3} />
      </div>
    </article>
  )
}

function FeedCard({ item }) {
  if (item.type === 'video') return <VideoCard item={item} />
  if (item.type === 'image') return <ImageCard item={item} />
  if (item.type === 'link') return <LinkCard item={item} />
  if (item.type === 'quote') return <QuoteCard item={item} />
  return null
}

function prioritizeItem(items, itemId) {
  if (!itemId) return items
  const selected = items.find((item) => item.id === itemId)
  if (!selected) return items
  return [selected, ...items.filter((item) => item.id !== itemId)]
}

function LoadMoreTrigger({ hasMore, onLoadMore, remainingCount }) {
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!hasMore) return undefined
    const node = triggerRef.current
    if (!node) return undefined

    if (typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore()
      },
      { rootMargin: '700px 0px', threshold: 0.01 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  if (!hasMore) return null

  return (
    <div ref={triggerRef} className="flex justify-center pt-1">
      <button
        type="button"
        className="article-action-button px-4 py-2 text-xs"
        onClick={onLoadMore}
      >
        继续浏览 {remainingCount}
      </button>
    </div>
  )
}

export default function FeedClient({ items, typesPresent, featuredItemId = '' }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [hashFeaturedItemId, setHashFeaturedItemId] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT)
  const activeFeaturedItemId = featuredItemId || hashFeaturedItemId

  useEffect(() => {
    if (featuredItemId || typeof window === 'undefined') return

    function syncHashFeaturedItem() {
      const nextId = decodeURIComponent(window.location.hash || '').replace(/^#/, '')
      setHashFeaturedItemId(nextId)
    }

    syncHashFeaturedItem()
    window.addEventListener('hashchange', syncHashFeaturedItem)
    return () => window.removeEventListener('hashchange', syncHashFeaturedItem)
  }, [featuredItemId])

  const filtered = useMemo(
    () => {
      const tabItems = typeFilter === 'all' ? items : items.filter((i) => i.type === typeFilter)
      return prioritizeItem(tabItems, activeFeaturedItemId)
    },
    [items, typeFilter, activeFeaturedItemId]
  )
  const visibleItems = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const remainingCount = Math.max(0, filtered.length - visibleCount)

  useEffect(() => {
    setVisibleCount(INITIAL_RENDER_COUNT)
  }, [typeFilter, activeFeaturedItemId])

  const loadMore = () => {
    setVisibleCount((count) => Math.min(count + RENDER_BATCH_SIZE, filtered.length))
  }

  const chips = [{ key: 'all', label: '全部' }, ...typesPresent.map((t) => ({ key: t, label: FEED_TYPE_META[t]?.label || t }))]

  return (
    <div>
      {/* 类型筛选 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = typeFilter === chip.key
          const accent = FEED_TYPE_META[chip.key]?.accent || ALL_FILTER_ACCENT
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setTypeFilter(chip.key)}
              className={[
                'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                active
                  ? ''
                  : 'border-[var(--site-line)] text-[var(--site-muted)] hover:border-[var(--site-ink)] hover:text-[var(--site-ink)]',
              ].join(' ')}
              style={active ? { borderColor: accent, color: accent, background: `${accent}14` } : undefined}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--site-line)] p-12 text-center text-[14px] text-[var(--site-muted)]">
          这个分类下还没有内容。
        </div>
      ) : (
        <div className="space-y-5">
          {/* 首条作为头条，占满整行大版面 */}
          <HeadlineCard item={visibleItems[0]} />

          {visibleItems.length > 1 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.slice(1).map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          <LoadMoreTrigger
            hasMore={hasMore}
            onLoadMore={loadMore}
            remainingCount={remainingCount}
          />
        </div>
      )}
    </div>
  )
}
