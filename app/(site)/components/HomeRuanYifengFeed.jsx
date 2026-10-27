'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { interleaveRssPicks, normalizeAiHotItems, normalizeRuanYifengEntries } from '../../../lib/home/homeRssPicks.mjs'
import { T } from './LocaleProvider'

const TABS = [
  { id: 'all', zh: '全部', en: 'All' },
  { id: 'ai-hot', zh: 'AI HOT', en: 'AI HOT' },
  { id: 'ruanyifeng', zh: '阮一峰', en: 'Ruan Yifeng' },
]

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value)
}

export default function HomeRuanYifengFeed() {
  const [activeTab, setActiveTab] = useState('all')
  const [feeds, setFeeds] = useState({ 'ai-hot': null, ruanyifeng: null })

  useEffect(() => {
    const controller = new AbortController()
    async function loadAiHot() {
      try {
        const response = await fetch('https://aihot.news/api/v1/items?mode=selected&window=7d&limit=20', { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (!Array.isArray(data.items)) throw new Error('Invalid AI HOT feed')
        setFeeds((current) => ({ ...current, 'ai-hot': normalizeAiHotItems(data.items) }))
      } catch (error) {
        if (error.name !== 'AbortError') setFeeds((current) => ({ ...current, 'ai-hot': [] }))
      }
    }
    async function loadRuanYifeng() {
      try {
        const response = await fetch('/api/rss-fetch?id=ruanyifeng', { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (!Array.isArray(data.entries)) throw new Error('Invalid RSS feed')
        setFeeds((current) => ({ ...current, ruanyifeng: normalizeRuanYifengEntries(data.entries) }))
      } catch (error) {
        if (error.name !== 'AbortError') setFeeds((current) => ({ ...current, ruanyifeng: [] }))
      }
    }
    loadAiHot()
    loadRuanYifeng()
    return () => controller.abort()
  }, [])

  const aiHot = feeds['ai-hot'] || []
  const ruanYifeng = feeds.ruanyifeng || []
  const entries = activeTab === 'all'
    ? interleaveRssPicks(aiHot, ruanYifeng)
    : (activeTab === 'ai-hot' ? aiHot : ruanYifeng).slice(0, 8)
  const loading = activeTab === 'all'
    ? feeds['ai-hot'] === null || feeds.ruanyifeng === null
    : feeds[activeTab] === null

  return (
    <section className="home-section home-opinion-panel min-w-0" aria-labelledby="home-rss-picks-title">
      <div className="home-inspiration-heading">
        <div>
          <p className="home-kicker">RSS · Reading</p>
          <h2 id="home-rss-picks-title" className="home-section-title"><T zh="RSS 精选" en="RSS picks" /></h2>
        </div>
        <Link href="/resources/rss" className="home-section-more no-underline">
          <T zh="订阅" en="Subscribe" /> <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-section-tabs home-opinion-topic-tabs" role="group" aria-label="RSS 来源">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={`home-tab-link ${activeTab === tab.id ? 'is-active' : ''}`} aria-pressed={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            <T zh={tab.zh} en={tab.en} />
          </button>
        ))}
      </div>
      <div className="home-opinion-list">
        {entries.map((entry) => (
          <a key={entry.id} href={entry.link} target="_blank" rel="noopener noreferrer" className="home-opinion-sample no-external-arrow">
            <span className="home-opinion-sample-meta">
              <span className="home-opinion-sample-source">{entry.source === 'ai-hot' ? 'AI HOT' : <T zh="阮一峰" en="Ruan Yifeng" />}</span>
              {entry.publishedAt ? <time className="home-opinion-sample-time" dateTime={new Date(entry.publishedAt).toISOString()}>{formatDate(entry.publishedAt)}</time> : null}
            </span>
            <span className="home-opinion-sample-title">
              <strong>{entry.title}</strong>
              <span className="home-opinion-external-arrow" aria-hidden="true">↗</span>
            </span>
            {entry.summary ? <small>{entry.summary}</small> : null}
          </a>
        ))}
      </div>
      {loading && entries.length === 0 ? <p className="mb-0 py-5 text-sm text-[var(--site-muted)]"><T zh="正在读取最新文章…" en="Loading latest posts…" /></p> : null}
      {!loading && entries.length === 0 ? (
        <p className="mb-0 py-5 text-sm text-[var(--site-muted)]"><T zh="暂时无法获取最新文章。" en="Latest posts are temporarily unavailable." /></p>
      ) : null}
    </section>
  )
}
