'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function trendTone(delta) {
  if (delta > 0) return 'success'
  if (delta < 0) return 'danger'
  return 'neutral'
}

function trendText(delta) {
  if (delta > 0) return `↑ +${delta}`
  if (delta < 0) return `↓ ${delta}`
  return '→ 持平'
}

function deltaVsPrev(thisWeek, prevWeek) {
  const d = thisWeek - prevWeek
  return { d, label: `上周 ${prevWeek}` }
}

function RankList({ rows, unit }) {
  if (!rows.length) {
    return <EmptyState title="近 7 天暂无数据" description="等有访问/点赞后这里会自动出现。" />
  }
  return (
    <ol className="grid min-w-0 gap-2">
      {rows.map((row, i) => (
        <li
          key={row.key}
          className="flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-[#e6e7df] bg-white/60 px-3 py-2.5 dark:border-[#243041] dark:bg-[#0e141d]"
        >
          <span className="w-5 shrink-0 text-center font-mono text-sm text-[#9a9c8f] dark:text-gray-500">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-sm font-medium text-[#15140f] hover:underline dark:text-gray-100"
                title={row.title}
              >
                {row.title}
              </a>
            ) : (
              <span className="block truncate text-sm font-medium text-[#15140f] dark:text-gray-100" title={row.title}>
                {row.title}
              </span>
            )}
            <span className="block truncate font-mono text-[11px] text-[#9a9c8f] dark:text-gray-600" title={row.key}>
              {row.key}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold text-[#15140f] dark:text-gray-100">
              {row.thisWeek}
              <span className="ml-1 text-[11px] font-normal text-[#9a9c8f] dark:text-gray-500">{unit}</span>
            </span>
            <StatusPill tone={trendTone(row.delta)} size="sm" icon={false}>
              {trendText(row.delta)}
            </StatusPill>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function ContentWeeklyClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/content-weekly', { cache: 'no-store', credentials: 'same-origin' })
      const json = await safeJson(res)
      if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP_${res.status}`)
      setData(json)
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const reads = data?.reads || { top: [], total: { thisWeek: 0, prevWeek: 0 } }
  const likes = data?.likes || { top: [], total: { thisWeek: 0, prevWeek: 0 } }
  const readsDelta = deltaVsPrev(reads.total.thisWeek, reads.total.prevWeek)
  const likesDelta = deltaVsPrev(likes.total.thisWeek, likes.total.prevWeek)

  return (
    <AdminPage
      title="内容数据周报"
      maxWidth="1100px"
      description="近 7 天站内文章被读 / 被赞 top 与上周趋势对比。打开即实时计算,看看什么内容真的打动人。"
      actions={
        <AdminButton type="button" onClick={refresh} disabled={loading}>
          {loading ? '刷新中…' : '重新计算'}
        </AdminButton>
      }
    >
      {error ? (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {data?.status === 'unavailable' ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          D1 不可用,暂时取不到数据。
        </div>
      ) : null}

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="本周阅读"
          value={loading ? '—' : reads.total.thisWeek}
          sub={`${readsDelta.label} · ${trendText(readsDelta.d)}`}
          tone={trendTone(readsDelta.d)}
        />
        <StatCard
          label="本周点赞"
          value={loading ? '—' : likes.total.thisWeek}
          sub={`${likesDelta.label} · ${trendText(likesDelta.d)}`}
          tone={trendTone(likesDelta.d)}
        />
        <StatCard label="上榜文章(读)" value={loading ? '—' : reads.top.length} />
        <StatCard label="上榜文章(赞)" value={loading ? '—' : likes.top.length} />
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Section
          title="被读最多 · 近 7 天"
          description="数据源 research_pv_hits;趋势对比上一个 7 天。"
          className="min-w-0 overflow-hidden"
        >
          {loading ? <p className="text-sm text-[#82847a]">加载中…</p> : <RankList rows={reads.top} unit="次" />}
        </Section>
        <Section
          title="被赞最多 · 近 7 天"
          description="数据源 article_likes;趋势对比上一个 7 天。"
          className="min-w-0 overflow-hidden"
        >
          {loading ? <p className="text-sm text-[#82847a]">加载中…</p> : <RankList rows={likes.top} unit="赞" />}
        </Section>
      </div>
    </AdminPage>
  )
}
