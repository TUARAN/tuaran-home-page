'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { selectHomeOpinionPosts } from '../../../lib/home/homeOpinionSignals'
import { getSentimentBucket } from '../../../lib/publicOpinion/publicOpinionData'
import { T } from './LocaleProvider'

const STANCES = {
  support: { zh: '支持', en: 'Support' },
  neutral: { zh: '中立', en: 'Neutral' },
  question: { zh: '质疑', en: 'Question' },
  oppose: { zh: '反对', en: 'Oppose' },
}
const SENTIMENTS = {
  positive: { zh: '正向', en: 'Positive' },
  neutral: { zh: '中性', en: 'Neutral' },
  negative: { zh: '负向', en: 'Negative' },
}

function formatOpinionTime(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

export default function HomeOpinionSignals() {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [activeTopic, setActiveTopic] = useState('ai-agents')

  useEffect(() => {
    let active = true
    let controller
    async function refresh() {
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch('/api/public-opinion', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const next = await response.json()
        if (!Array.isArray(next.posts)) throw new Error('Invalid opinion feed')
        if (active) {
          setData(next)
          setFailed(false)
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') setFailed(true)
      }
    }
    refresh()
    const timer = setInterval(refresh, 5 * 60 * 1000)
    return () => {
      active = false
      controller?.abort()
      clearInterval(timer)
    }
  }, [])

  const liveData = data?.source === 'd1' ? data : null
  const allPosts = liveData?.posts?.filter((post) => /^https?:\/\//i.test(post.url || '')) || []
  const filteredPosts = allPosts.filter((post) => post.topicId === activeTopic)
  const events = liveData?.snapshot?.events || []
  const groupedEvents = events.filter((event) => event.reportCount > 1 && event.topicId === activeTopic)
  const featured = groupedEvents[0]
  const otherPosts = filteredPosts.filter((post) => !featured?.postIds?.includes(post.id))
  const posts = selectHomeOpinionPosts(otherPosts, 14)
  const topics = (liveData?.topics || []).filter((topic) => topic.id === 'ai-agents' || allPosts.some((post) => post.topicId === topic.id))
  const featuredTopic = topics.find((topic) => topic.id === featured?.topicId)?.title
  const collectedAt = Number(liveData?.meta?.lastCollectAt)
  const updated = collectedAt > 0 && Number.isFinite(collectedAt)
    ? formatOpinionTime(collectedAt * 1000)
    : ''
  const featuredTime = formatOpinionTime(featured?.latestAt)
  const featuredSentiment = featured ? getSentimentBucket(featured.sentiment) : null
  return (
    <div className="home-opinion-overview">
      {liveData && allPosts.length ? (
        <>
          <div className="home-section-tabs home-opinion-topic-tabs" role="group" aria-label="舆情话题">
            {topics.map((topic) => (
              <button key={topic.id} type="button" className={`home-tab-link ${activeTopic === topic.id ? 'is-active' : ''}`} aria-label={topic.title} title={topic.title} aria-pressed={activeTopic === topic.id} onClick={() => setActiveTopic(topic.id)}>{topic.homeTitle || topic.title}</button>
            ))}
          </div>

          <div className="home-opinion-counts">
            <div className="home-opinion-count-metrics">
              <span><strong>{filteredPosts.length}</strong><T zh="条公开动态" en="public posts" /></span>
              <span><strong>{groupedEvents.length}</strong><T zh="个热点" en="hot topics" /></span>
            </div>
            {updated ? (
              <small className="home-opinion-collection-status">
                <span className="home-opinion-collection-live">
                  <span className="home-opinion-collection-dot" aria-hidden="true" />
                  <T zh="持续采集中" en="Collecting" />
                </span>
                <T zh={`更新于 ${updated}`} en={`Updated ${updated}`} />
              </small>
            ) : null}
          </div>

          <div className="home-opinion-list">
            {featured ? (
              <Link href="/public-opinion" className="home-opinion-sample home-opinion-featured no-underline">
                <span className="home-opinion-sample-meta">
                  <span className="home-opinion-sample-source"><T zh="热点聚焦" en="In focus" />{featuredTopic ? ` · ${featuredTopic}` : ''}</span>
                  <time className="home-opinion-sample-time" dateTime={featured.latestAt}>{featuredTime}</time>
                  <span className={`home-opinion-sample-signal is-${featuredSentiment}`} title="热点聚焦的平均情绪">
                    <T {...SENTIMENTS[featuredSentiment]} />
                  </span>
                </span>
                <strong>{featured.title}</strong>
                <small>{featured.summary}</small>
              </Link>
            ) : null}
            {posts.map((post) => {
              const sentiment = getSentimentBucket(post.sentiment)
              const stance = STANCES[post.stance] ? post.stance : 'neutral'
              return (
                <a key={post.id} href={post.url} target="_blank" rel="noreferrer" className="home-opinion-sample no-external-arrow">
                  <span className="home-opinion-sample-meta">
                    <span className="home-opinion-sample-source">{post.platform}</span>
                    <span className="home-opinion-sample-time">{post.time}</span>
                    <span className={`home-opinion-sample-signal is-${sentiment} is-${stance}`}>
                      <T {...SENTIMENTS[sentiment]} />
                      <span aria-hidden="true">·</span>
                      <T {...STANCES[stance]} />
                    </span>
                  </span>
                  <span className="home-opinion-sample-title">
                    <strong>{post.text}</strong>
                    <span className="home-opinion-external-arrow" aria-hidden="true">↗</span>
                  </span>
                  <small>{post.viewpoint}</small>
                </a>
              )
            })}
          </div>
          <Link href="/public-opinion" className="home-opinion-cta no-underline"><T zh="进入舆情工作台，查看完整研判" en="Open the dashboard for the full analysis" /> <span aria-hidden="true">→</span></Link>
        </>
      ) : (
        <div className="home-opinion-empty">
          <p>{!data && !failed
            ? <T zh="正在获取公开讨论…" en="Loading public discussions…" />
            : <T zh="采集内容暂时不可用，稍后可以再来看看。" en="Collected discussions are unavailable. Please try again later." />}</p>
          <div className="home-opinion-empty-links">
            <Link href="/public-opinion#hot"><T zh="看热点榜" en="Hot topics" /></Link>
            <Link href="/public-opinion#trend"><T zh="看趋势" en="Trends" /></Link>
            <Link href="/public-opinion#sources"><T zh="查来源" en="Sources" /></Link>
          </div>
          <Link href="/public-opinion" className="home-section-more no-underline"><T zh="进入舆情工作台 →" en="Open the opinion dashboard →" /></Link>
        </div>
      )}
    </div>
  )
}
