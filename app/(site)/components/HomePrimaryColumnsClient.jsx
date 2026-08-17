'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'

import HomeFeaturedReadingClient from './HomeFeaturedReadingClient'
import { T } from './LocaleProvider'

const INSPIRATION_SKELETON_ITEMS = Array.from({ length: 10 }, (_, index) => ({
  id: `inspiration-skeleton-${index}`,
  hasThumbnail: index % 3 !== 2,
  titleWidth: `${62 + ((index * 13) % 31)}%`,
  copyWidth: `${68 + ((index * 11) % 27)}%`,
  copyTailWidth: `${42 + ((index * 17) % 30)}%`,
}))

function FeedThumbnail({ src }) {
  // 灵感源同时包含本地与远端媒体，原生图片避免为每个来源维护 Next Image 域名白名单。
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" />
}

function InspirationCard({ inspiration, isPinned = false }) {
  const formattedDate = inspiration.date.replaceAll('-', '.')
  const thumbnail = inspiration.poster || inspiration.image || (inspiration.type === 'image' ? inspiration.src : '')

  return (
    <article className="home-inspiration-item">
      <header className="home-inspiration-meta">
        {isPinned ? <span className="home-badge home-badge-pinned"><T zh="置顶" en="Pinned" /></span> : null}
        <time dateTime={inspiration.date}>{formattedDate}</time>
      </header>
      <Link href={`/feed/${inspiration.id}`} className="home-inspiration-title no-underline">
        {inspiration.title}
      </Link>
      <div className={`home-inspiration-body ${thumbnail ? 'has-thumbnail' : ''}`}>
        {thumbnail ? (
          <Link href={`/feed/${inspiration.id}`} className="home-inspiration-thumbnail no-underline" aria-label={`查看灵感：${inspiration.title}`}>
            <FeedThumbnail src={thumbnail} />
          </Link>
        ) : null}
        <div className="min-w-0">
          <p className="home-inspiration-copy">
            {inspiration.summary || inspiration.quote}
          </p>
        </div>
      </div>
    </article>
  )
}

function InspirationSkeleton() {
  return (
    <div className="home-inspiration-skeleton" role="status" aria-label="正在加载灵感内容">
      {INSPIRATION_SKELETON_ITEMS.map((item, index) => (
        <div
          key={item.id}
          className="home-inspiration-skeleton-item"
          style={{ '--skeleton-index': index }}
          aria-hidden="true"
        >
          <span className="home-skeleton-block home-inspiration-skeleton-date" />
          <span className="home-skeleton-block home-inspiration-skeleton-title" style={{ width: item.titleWidth }} />
          <div className={`home-inspiration-skeleton-body ${item.hasThumbnail ? 'has-thumbnail' : ''}`}>
            {item.hasThumbnail ? <span className="home-skeleton-block home-inspiration-skeleton-thumbnail" /> : null}
            <div>
              <span className="home-skeleton-block home-inspiration-skeleton-copy" style={{ width: item.copyWidth }} />
              <span className="home-skeleton-block home-inspiration-skeleton-copy" style={{ width: item.copyTailWidth }} />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">正在加载灵感内容</span>
    </div>
  )
}

function HomeInspirations({ items, pinnedIds, ready }) {
  const pinnedIdSet = new Set(pinnedIds)

  return (
    <section id="inspirations" className="home-section home-inspirations scroll-mt-24">
      <div className="home-section-heading compact">
        <div className="w-full">
          <p className="home-kicker">02 · Sparks</p>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="home-section-title"><T zh="灵感" en="Inspiration" /></h2>
            <Link href="/feed" className="home-section-more no-underline">
              <T zh="查看全部" en="View all" /> <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="home-section-description"><T zh="随手记下的发现、念头与启发" en="Quick discoveries, ideas, and sparks" /></p>
        </div>
      </div>
      <div className="relative" aria-busy={!ready}>
        <div
          className={`home-inspiration-list transition-opacity duration-200 ${ready ? 'opacity-100' : 'invisible opacity-0'}`}
          aria-hidden={!ready}
        >
          {items.map((inspiration) => (
            <InspirationCard
              key={inspiration.id}
              inspiration={inspiration}
              isPinned={pinnedIdSet.has(inspiration.id)}
            />
          ))}
        </div>
        {!ready ? <InspirationSkeleton /> : null}
      </div>
    </section>
  )
}

export default function HomePrimaryColumnsClient({ catalog, inspirations, pinnedInspirationIds }) {
  const [ready, setReady] = useState(false)
  const handleReadyChange = useCallback((nextReady) => setReady(nextReady), [])

  return (
    <>
      <HomeFeaturedReadingClient catalog={catalog} onReadyChange={handleReadyChange} />
      <HomeInspirations items={inspirations} pinnedIds={pinnedInspirationIds} ready={ready} />
    </>
  )
}
