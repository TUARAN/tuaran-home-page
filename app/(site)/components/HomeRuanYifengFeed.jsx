'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { T } from './LocaleProvider'

export default function HomeRuanYifengFeed() {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/rss-fetch?id=ruanyifeng', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        setEntries(Array.isArray(data?.entries)
          ? data.entries.filter((entry) => /^https?:\/\//i.test(entry.link || '')).slice(0, 4)
          : [])
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setEntries([])
      })
    return () => controller.abort()
  }, [])

  return (
    <section className="home-section home-opinion-panel min-w-0" aria-labelledby="home-ruanyifeng-title">
      <div className="home-inspiration-heading">
        <div>
          <p className="home-kicker">RSS · Reading</p>
          <h2 id="home-ruanyifeng-title" className="home-section-title"><T zh="阮一峰的网络日志" en="Ruan Yifeng's Weblog" /></h2>
        </div>
        <Link href="/resources/rss#rss-feed-ruanyifeng" className="home-section-more no-underline">
          <T zh="订阅" en="Subscribe" /> <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-opinion-list">
        {entries?.map((entry) => (
          <a key={entry.guid || entry.link} href={entry.link} target="_blank" rel="noopener noreferrer" className="home-opinion-sample no-external-arrow">
            <span className="home-opinion-sample-meta">
              <span className="home-opinion-sample-source"><T zh="最新文章" en="Latest post" /></span>
              {entry.date ? <time className="home-opinion-sample-time" dateTime={entry.date}>{entry.date}</time> : null}
            </span>
            <span className="home-opinion-sample-title">
              <strong>{entry.title}</strong>
              <span className="home-opinion-external-arrow" aria-hidden="true">↗</span>
            </span>
            {entry.summary ? <small>{entry.summary}</small> : null}
          </a>
        ))}
      </div>
      {entries?.length === 0 ? (
        <p className="mb-0 py-5 text-sm text-[var(--site-muted)]">
          <T zh="暂时无法获取最新文章。" en="Latest posts are temporarily unavailable." />
          {' '}<a href="https://www.ruanyifeng.com/blog/" target="_blank" rel="noopener noreferrer"><T zh="访问原站 ↗" en="Visit the weblog ↗" /></a>
        </p>
      ) : null}
      {entries === null ? <p className="mb-0 py-5 text-sm text-[var(--site-muted)]"><T zh="正在读取最新文章…" en="Loading latest posts…" /></p> : null}
    </section>
  )
}
