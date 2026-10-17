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
const HOME_TOPIC_PRIORITY = { llm: 0, 'ai-agents': 1 }

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
  const [activeTopic, setActiveTopic] = useState('recommended')
  const [recommended, setRecommended] = useState(null)
  const [recommendedFailed, setRecommendedFailed] = useState(false)
  const [recommendationRetry, setRecommendationRetry] = useState(0)
  const [expandedRecommendation, setExpandedRecommendation] = useState('')

  useEffect(() => {
    let active = true
    let controller
    async function refresh() {
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch('/api/rss-fetch?id=ai-hot', { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const next = await response.json()
        if (next.status !== 'ok' || !Array.isArray(next.entries)) throw new Error('Invalid RSS feed')
        if (active) {
          setRecommended(next.entries.filter((entry) => /^https?:\/\//i.test(entry.link || '')))
          setRecommendedFailed(false)
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') setRecommendedFailed(true)
      }
    }
    refresh()
    const timer = setInterval(refresh, 5 * 60 * 1000)
    return () => {
      active = false
      controller?.abort()
      clearInterval(timer)
    }
  }, [recommendationRetry])

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
  const topics = (liveData?.topics || [])
    .filter((topic) => topic.id === 'llm' || topic.id === 'ai-agents' || allPosts.some((post) => post.topicId === topic.id))
    .sort((left, right) => (HOME_TOPIC_PRIORITY[left.id] ?? 2) - (HOME_TOPIC_PRIORITY[right.id] ?? 2))
  const featuredTopic = topics.find((topic) => topic.id === featured?.topicId)?.title
  const collectedAt = Number(liveData?.meta?.lastCollectAt)
  const updated = collectedAt > 0 && Number.isFinite(collectedAt)
    ? formatOpinionTime(collectedAt * 1000)
    : ''
  const featuredTime = formatOpinionTime(featured?.latestAt)
  const featuredSentiment = featured ? getSentimentBucket(featured.sentiment) : null
  return (
    <div className="home-opinion-overview">
      <div className="home-section-tabs home-opinion-topic-tabs" role="group" aria-label="舆情话题">
        <button type="button" className={`home-tab-link ${activeTopic === 'recommended' ? 'is-active' : ''}`} aria-label="推荐" title="推荐" aria-pressed={activeTopic === 'recommended'} onClick={() => setActiveTopic('recommended')}>
          <T zh="推荐" en="For you" />
        </button>
        {topics.map((topic) => (
          <button key={topic.id} type="button" className={`home-tab-link ${activeTopic === topic.id ? 'is-active' : ''}`} aria-label={topic.title} title={topic.title} aria-pressed={activeTopic === topic.id} onClick={() => setActiveTopic(topic.id)}>{topic.homeTitle || topic.title}</button>
        ))}
      </div>
      {activeTopic === 'recommended' ? (
        recommended?.length ? (
          <>
            <div className="home-opinion-list">
              {recommended.map((entry) => {
                const key = entry.guid || entry.link
                const expanded = expandedRecommendation === key
                return (
                  <article key={key} className="home-opinion-sample">
                    <button type="button" className="w-full text-left" aria-expanded={expanded} onClick={() => setExpandedRecommendation(expanded ? '' : key)}>
                      <span className="home-opinion-sample-meta">
                        <span className="home-opinion-sample-source">AI HOT</span>
                        {entry.date ? <time className="home-opinion-sample-time" dateTime={entry.date}>{entry.date}</time> : null}
                      </span>
                      <span className="home-opinion-sample-title"><strong>{entry.title}</strong><span className="home-opinion-external-arrow" aria-hidden="true">{expanded ? '−' : '+'}</span></span>
                      {!expanded && entry.summary ? <small>{entry.summary}</small> : null}
                    </button>
                    {expanded ? (
                      <div className="home-opinion-reader">
                        <p>{entry.summary || <T zh="此条订阅没有提供摘要。" en="This feed item has no summary." />}</p>
                        <a href={entry.link} target="_blank" rel="noopener noreferrer" className="no-external-arrow"><T zh="阅读原文（站外）" en="Read original (external)" /> ↗</a>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
            <Link href="/resources/rss#rss-feed-ai-hot" className="home-opinion-cta no-underline"><T zh="查看 AI HOT 订阅" en="View AI HOT feed" /> <span aria-hidden="true">→</span></Link>
          </>
        ) : (
          <div className="home-opinion-empty">
            <p>{recommendedFailed || recommended ? <T zh="AI HOT 订阅暂时不可用。" en="AI HOT feed is unavailable." /> : <T zh="正在获取 AI HOT 订阅…" en="Loading AI HOT feed…" />}</p>
            {recommendedFailed || recommended ? (
              <button type="button" className="home-section-more" onClick={() => {
                setRecommended(null)
                setRecommendedFailed(false)
                setRecommendationRetry((value) => value + 1)
              }}><T zh="重试" en="Retry" /></button>
            ) : null}
          </div>
        )
      ) : liveData && allPosts.length ? (
        <>
          {updated ? (
            <div className="home-opinion-collection-meta">
              <small className="home-opinion-collection-status">
                <span className="home-opinion-collection-live">
                  <span className="home-opinion-collection-dot" aria-hidden="true" />
                  <T zh="持续采集中" en="Collecting" />
                </span>
                <T zh={`更新于 ${updated}`} en={`Updated ${updated}`} />
              </small>
            </div>
          ) : null}

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
          <Link href="/public-opinion" className="home-opinion-cta no-underline"><T zh="查看完整舆情分析" en="View the full public opinion analysis" /> <span aria-hidden="true">→</span></Link>
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
          <Link href="/public-opinion" className="home-section-more no-underline"><T zh="查看舆情分析 →" en="View public opinion analysis →" /></Link>
        </div>
      )}
    </div>
  )
}
