'use client'

import { useEffect, useMemo, useState } from 'react'
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

function itemShareText(item) {
  return [
    `看到一个灵感：${item.title}`,
    item.summary,
  ].filter(Boolean).join('\n')
}

function MetaRow({ item, showShare = true, maxTags = Infinity }) {
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
      {sourceLink || showShare ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {sourceLink}
          {showShare ? (
            <SharePageButton
              title={item.title}
              text={itemShareText(item)}
              url={`/feed/${item.id}`}
              exactUrl
              idleLabel="转发"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function MediaFrame({ aspect = '16/9', children }) {
  return (
    <div
      className="relative min-w-0 w-full max-w-full overflow-hidden rounded-lg bg-black/90"
      style={{ aspectRatio: aspect }}
    >
      {children}
    </div>
  )
}

// 仅渲染媒体本体（视频 / 图片），供普通卡与头条卡复用
function ItemMedia({ item }) {
  if (item.type === 'video') {
    return (
      <MediaFrame aspect={item.aspect}>
        <video
          className="absolute inset-0 h-full w-full"
          src={item.src}
          poster={item.poster || undefined}
          controls
          preload="metadata"
          playsInline
          aria-label={item.title}
        />
      </MediaFrame>
    )
  }
  if (item.type === 'image' || (item.type === 'link' && item.image)) {
    return (
      <MediaFrame aspect={item.aspect || '16/9'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={item.type === 'image' ? item.src : item.image}
          alt={item.title}
          loading="lazy"
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
  const media = <ItemMedia item={item} />
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
    <article id={item.id} className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-bg)] p-4 transition-colors hover:border-[#ff4d6a]/50">
      <MediaFrame aspect={item.aspect}>
        <video
          className="absolute inset-0 h-full w-full"
          src={item.src}
          poster={item.poster || undefined}
          controls
          preload="metadata"
          playsInline
          aria-label={item.title}
        />
      </MediaFrame>
      <div className="mt-3 flex items-center gap-2">
        <TypeBadge type={item.type} />
        <h2 className="mb-0 border-b-0 pb-0 font-serif text-[18px] leading-tight text-[var(--site-ink)]">{item.title}</h2>
      </div>
      {item.summary ? (
        <p className="mb-0 mt-2 text-[13.5px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
      ) : null}
      <MetaRow item={item} />
    </article>
  )
}

function ImageCard({ item }) {
  return (
    <article id={item.id} className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-bg)] p-4 transition-colors hover:border-[#6c5ce7]/50">
      <MediaFrame aspect={item.aspect}>
        {/* 静态资源，沿用站内 <img> 约定 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="absolute inset-0 h-full w-full object-cover" src={item.src} alt={item.title} loading="lazy" />
      </MediaFrame>
      <div className="mt-3 flex items-center gap-2">
        <TypeBadge type={item.type} />
        <h2 className="mb-0 border-b-0 pb-0 font-serif text-[18px] leading-tight text-[var(--site-ink)]">{item.title}</h2>
      </div>
      {item.summary ? (
        <p className="mb-0 mt-2 text-[13.5px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
      ) : null}
      <MetaRow item={item} />
    </article>
  )
}

function LinkCard({ item }) {
  return (
    <article id={item.id} className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-bg)] transition-colors hover:border-[#00a978]/50">
      <div className="p-4">
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
          <p className="mb-0 mt-2 text-[13.5px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
        ) : null}
        <MetaRow item={item} />
      </div>
    </article>
  )
}

function QuoteCard({ item }) {
  return (
    <article id={item.id} className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5 transition-colors hover:border-[#f5a623]/50">
      <div className="mb-3"><TypeBadge type={item.type} /></div>
      <blockquote className="border-l-2 border-[#f5a623] pl-4 font-serif text-[17px] leading-8 text-[var(--site-ink)]">
        {item.quote || item.summary}
      </blockquote>
      {item.author ? (
        <p className="mb-0 mt-3 text-right text-[12px] text-[var(--site-muted)]">—— {item.author}</p>
      ) : null}
      <MetaRow item={item} />
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

export default function FeedClient({ items, typesPresent, featuredItemId = '' }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [hashFeaturedItemId, setHashFeaturedItemId] = useState('')
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
          <HeadlineCard item={filtered[0]} />

          {filtered.length > 1 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(1).map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
