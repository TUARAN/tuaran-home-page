'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IconArrowUpRight, IconMessageCircle2 } from '@tabler/icons-react'
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

export default function HomeOpinionSignals() {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [activeTopic, setActiveTopic] = useState('all')

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
  const filteredPosts = activeTopic === 'all'
    ? allPosts
    : allPosts.filter((post) => post.topicId === activeTopic)
  const events = liveData?.snapshot?.events || []
  const featured = events.find((event) => activeTopic === 'all' || event.topicId === activeTopic)
  const otherPosts = filteredPosts.filter((post) => !featured?.postIds?.includes(post.id))
  const posts = selectHomeOpinionPosts(otherPosts.length ? otherPosts : filteredPosts, 5)
  const topics = (liveData?.topics || []).filter((topic) => allPosts.some((post) => post.topicId === topic.id))
  const featuredTopic = topics.find((topic) => topic.id === featured?.topicId)?.title
  const collectedAt = Number(liveData?.meta?.lastCollectAt)
  const updated = collectedAt > 0 && Number.isFinite(collectedAt)
    ? new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date(collectedAt * 1000))
    : ''
  const status = failed
    ? { zh: '刷新失败', en: 'Refresh failed' }
    : !data
      ? { zh: '加载中', en: 'Loading' }
      : !liveData
        ? { zh: '暂无实时数据', en: 'No live data' }
        : liveData.meta?.isStale
          ? { zh: '待更新', en: 'Outdated' }
          : { zh: '已采集', en: 'Collected' }

  return (
    <div className="home-opinion-overview">
      <div className="home-opinion-heading">
        <span className="home-opinion-heading-icon" aria-hidden="true">
          <IconMessageCircle2 size={16} stroke={1.8} />
        </span>
        <div>
          <p><T zh="公开讨论与观点" en="Public discussions and viewpoints" /></p>
          <small>{updated
            ? <T zh={`采集于 ${updated} · 北京时间`} en={`Collected ${updated} · UTC+8`} />
            : <T zh="追踪公开来源中的科技话题" en="Following technology topics in public sources" />}</small>
        </div>
        <span className="home-opinion-status" role="status"><T {...status} /></span>
      </div>

      {liveData && allPosts.length ? (
        <>
          <div className="home-opinion-topic-tabs" role="group" aria-label="舆情话题">
            <button type="button" className={activeTopic === 'all' ? 'is-active' : ''} aria-pressed={activeTopic === 'all'} onClick={() => setActiveTopic('all')}><T zh="全部" en="All" /></button>
            {topics.map((topic) => (
              <button key={topic.id} type="button" className={activeTopic === topic.id ? 'is-active' : ''} aria-pressed={activeTopic === topic.id} onClick={() => setActiveTopic(topic.id)}>{topic.title}</button>
            ))}
          </div>

          <div className="home-opinion-counts">
            <span><strong>{filteredPosts.length}</strong><T zh="条公开动态" en="public posts" /></span>
            <span><strong>{events.filter((event) => activeTopic === 'all' || event.topicId === activeTopic).length}</strong><T zh="个聚合事件" en="grouped events" /></span>
          </div>

          {featured ? (
            <Link href="/public-opinion" className="home-opinion-feature no-underline">
              <span className="home-opinion-feature-kicker"><T zh="焦点事件" en="Featured event" />{featuredTopic ? ` · ${featuredTopic}` : ''}</span>
              <strong>{featured.title}</strong>
              <span className="home-opinion-feature-summary">{featured.summary}</span>
              <span className="home-opinion-feature-meta">
                <span><T zh="热度" en="Heat" /> {featured.heat}/{featured.heatScaleMax || 100}</span>
                <span>{featured.reportCount} <T zh="条讨论" en="posts" /></span>
                <span>{featured.sourceCount} <T zh="个来源" en="sources" /></span>
                <IconArrowUpRight size={16} stroke={1.8} aria-hidden="true" />
              </span>
            </Link>
          ) : null}

          <div className="home-opinion-list">
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
                  <strong>{post.text}</strong>
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
