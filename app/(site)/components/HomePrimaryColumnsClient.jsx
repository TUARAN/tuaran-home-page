'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import HomeFeaturedReadingClient from './HomeFeaturedReadingClient'
import { T } from './LocaleProvider'
import {
  DEFAULT_FEED_CATEGORY,
  FEED_CATEGORY_KEYS,
  FEED_CATEGORY_META,
  feedCategoryHref,
  filterFeedItemsByCategory,
} from '../feed/data'

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
      <header className="home-inspiration-meta hidden md:flex">
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

function HomeInspirations({ items }) {
  const [scope, setScope] = useState(DEFAULT_FEED_CATEGORY)
  const visibleItems = useMemo(
    () => filterFeedItemsByCategory(items, scope),
    [items, scope],
  )
  const moreHref = feedCategoryHref(scope)

  return (
    <section id="inspirations" className="home-section home-inspirations scroll-mt-24">
      <div className="home-primary-heading hidden md:grid">
        <p className="home-kicker">02 · Sparks</p>
        <h2 className="home-section-title"><T zh="灵感" en="Inspiration" /></h2>
        <div className="home-primary-heading-actions">
          <Link href={moreHref} className="home-section-more no-underline">
            <T zh="查看全部" en="View all" /> <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="home-section-description"><T zh="随手记下的发现、念头与启发" en="Quick discoveries, ideas, and sparks" /></p>
      </div>
      <div className="home-inspiration-scopes">
        <p className="h5-feed-label md:hidden">灵感</p>
        <nav className="home-section-tabs" role="tablist" aria-label="首页灵感范围">
          {FEED_CATEGORY_KEYS.map((key) => {
            const active = scope === key
            const meta = FEED_CATEGORY_META[key]
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`home-inspiration-scope-${key}`}
                aria-selected={active}
                aria-controls="home-inspiration-list"
                className={`home-tab-link ${active ? 'is-active' : ''}`}
                onClick={() => setScope(key)}
              >
                <T zh={meta.label} en={meta.labelEn} />
              </button>
            )
          })}
        </nav>
      </div>
      <div className="relative min-h-0">
        <div
          id="home-inspiration-list"
          role="tabpanel"
          aria-labelledby={`home-inspiration-scope-${scope}`}
          className="home-inspiration-list"
        >
          {visibleItems.map((inspiration) => (
            <InspirationCard
              key={inspiration.id}
              inspiration={inspiration}
            />
          ))}
          {visibleItems.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-[#77746a] dark:text-[#98a3b1]">
              这个分类下还没有灵感
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default function HomePrimaryColumnsClient({ catalog, inspirations }) {
  return (
    <>
      <div className="min-w-0 self-start">
        <HomeFeaturedReadingClient catalog={catalog} />
      </div>
      <HomeInspirations items={inspirations} />
    </>
  )
}
