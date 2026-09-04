'use client'

import { useEffect, useState } from 'react'
import { IconMessageCircle2 } from '@tabler/icons-react'
import { getSentimentBucket } from '../../../lib/publicOpinionData'
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

  const posts = data?.source === 'd1'
    ? data.posts.filter((post) => /^https?:\/\//i.test(post.url || '')).slice(0, 6)
    : []
  const collectedAt = Number(data?.meta?.lastCollectAt)
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
      : !posts.length
        ? { zh: '暂无数据', en: 'No data' }
        : data.meta?.isStale
          ? { zh: '待更新', en: 'Outdated' }
          : { zh: '已采集', en: 'Collected' }

  function renderLoop(hidden = false) {
    return (
      <div className="home-opinion-loop" aria-hidden={hidden || undefined}>
        {posts.map((post) => {
          const sentiment = getSentimentBucket(post.sentiment)
          const stance = STANCES[post.stance] ? post.stance : 'neutral'
          return (
            <a key={post.id} href={post.url} target="_blank" rel="noreferrer"
              className="home-opinion-sample no-external-arrow" tabIndex={hidden ? -1 : undefined}>
              <span className="home-opinion-sample-meta">
                <span>{post.platform}</span>
                <span>{post.time}</span>
                <span className={`is-${sentiment}`}><T {...SENTIMENTS[sentiment]} /></span>
                <span className={`is-${stance}`}><T {...STANCES[stance]} /></span>
              </span>
              <strong>{post.text}</strong>
              <small>{post.viewpoint}</small>
              <small><T zh="查看原文 ↗" en="Read source ↗" /></small>
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <div className="home-builder-group">
      <div className="home-opinion-heading">
        <span className="home-opinion-heading-icon" aria-hidden="true">
          <IconMessageCircle2 size={16} stroke={1.8} />
        </span>
        <div>
          <p><T zh="公开讨论与观点" en="Public discussions and viewpoints" /></p>
          <small>{updated
            ? <T zh={`采集于 ${updated} · 北京时间`} en={`Collected ${updated} · UTC+8`} />
            : <T zh="与舆情工作台共用采集数据" en="Shared with the opinion dashboard" />}</small>
        </div>
        <span className="text-[10px] text-[var(--site-faint)]" role="status"><T {...status} /></span>
      </div>
      {posts.length ? (
        <div className="home-opinion-viewport">
          <div className="home-opinion-track">
            {renderLoop()}
            {renderLoop(true)}
          </div>
        </div>
      ) : (
        <p className="py-6 text-sm text-[var(--site-faint)]">
          {!data && !failed
            ? <T zh="正在读取公开讨论…" en="Loading public discussions…" />
            : <T zh="暂时无法获取采集内容，请稍后重试。" en="Collected discussions are unavailable. Please try again later." />}
        </p>
      )}
    </div>
  )
}
