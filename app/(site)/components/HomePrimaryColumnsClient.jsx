'use client'

import Link from 'next/link'

import HomeFeaturedReadingClient from './HomeFeaturedReadingClient'
import { T } from './LocaleProvider'

function FeedThumbnail({ src }) {
  // 灵感源同时包含本地与远端媒体，原生图片避免为每个来源维护 Next Image 域名白名单。
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" />
}

function InspirationCard({ inspiration }) {
  const formattedDate = inspiration.date.replaceAll('-', '.')
  const thumbnail = inspiration.poster || inspiration.image || (inspiration.type === 'image' ? inspiration.src : '')

  return (
    <article className="h5-feed-row home-inspiration-item">
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
          <time className="home-inspiration-date" dateTime={inspiration.date}>
            {formattedDate}
          </time>
        </div>
      </div>
    </article>
  )
}

export function HomeInspirations({ items, instance = 'desktop' }) {
  const sectionId = instance === 'mobile' ? 'inspirations-mobile' : 'inspirations'

  return (
    <section id={sectionId} className="home-section home-inspirations scroll-mt-24">
      <div className="home-inspiration-heading">
        <div>
          <p className="home-kicker">Sparks</p>
          <h2 className="home-section-title"><T zh="灵感" en="Inspiration" /></h2>
        </div>
        <Link href="/feed" className="home-section-more no-underline">
          <T zh="查看全部" en="View all" /> <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-inspiration-list">
        {items.slice(0, instance === 'mobile' ? 2 : 8).map((inspiration) => (
          <InspirationCard key={inspiration.id} inspiration={inspiration} />
        ))}
        {!items.length ? <p className="mb-0 py-3 text-xs text-[var(--site-faint)]"><T zh="暂无灵感" en="No inspirations yet" /></p> : null}
      </div>
    </section>
  )
}

export default function HomePrimaryColumnsClient({ catalog }) {
  return (
    <div className="min-w-0 self-start">
      <HomeFeaturedReadingClient catalog={catalog} />
    </div>
  )
}
