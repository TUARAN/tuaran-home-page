'use client'

import Link from 'next/link'

import HomeFeaturedReadingClient from './HomeFeaturedReadingClient'
import { T } from './LocaleProvider'

function FeedThumbnail({ src }) {
  // 灵感源同时包含本地与远端媒体，原生图片避免为每个来源维护 Next Image 域名白名单。
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" />
}

function InspirationCard({ inspiration, isPinned = false }) {
  const formattedDate = inspiration.date.replaceAll('-', '.')
  const thumbnail = inspiration.poster || inspiration.image || (inspiration.type === 'image' ? inspiration.src : '')

  return (
    <article className="h5-feed-row home-inspiration-item">
      <header className="home-inspiration-meta hidden md:flex">
        {isPinned ? <span className="home-badge home-badge-pinned"><T zh="置顶" en="Pinned" /></span> : null}
        <time dateTime={inspiration.date}>{formattedDate}</time>
      </header>
      <div className={`home-inspiration-body ${thumbnail ? 'has-thumbnail' : ''}`}>
        {thumbnail ? (
          <Link href={`/feed/${inspiration.id}`} className="h5-feed-thumb home-inspiration-thumbnail no-underline" aria-label={`查看灵感：${inspiration.title}`}>
            <FeedThumbnail src={thumbnail} />
          </Link>
        ) : null}
        <div className="min-w-0">
          <Link href={`/feed/${inspiration.id}`} className="h5-feed-title home-inspiration-title no-underline">
            {inspiration.title}
          </Link>
          <p className="h5-feed-summary home-inspiration-copy">
            {inspiration.summary || inspiration.quote}
          </p>
          <time className="h5-feed-meta mt-1 block text-[11px] text-[var(--site-faint)] md:hidden" dateTime={inspiration.date}>
            {formattedDate}
          </time>
        </div>
      </div>
    </article>
  )
}

function HomeInspirations({ items, pinnedIds }) {
  const pinnedIdSet = new Set(pinnedIds)

  return (
    <section id="inspirations" className="home-section home-inspirations scroll-mt-24">
      <p className="h5-feed-label md:hidden">灵感</p>
      <div className="home-section-heading compact hidden md:flex">
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
      <div className="relative">
        <div className="home-inspiration-list">
          {items.map((inspiration) => (
            <InspirationCard
              key={inspiration.id}
              inspiration={inspiration}
              isPinned={pinnedIdSet.has(inspiration.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePrimaryColumnsClient({ catalog, inspirations, pinnedInspirationIds }) {
  return (
    <>
      <HomeFeaturedReadingClient catalog={catalog} />
      <HomeInspirations items={inspirations} pinnedIds={pinnedInspirationIds} />
    </>
  )
}
