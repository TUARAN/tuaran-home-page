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

function deltaVsPrev(current, previous, previousLabel) {
  const d = current - previous
  return { d, label: `${previousLabel} ${previous}` }
}

function RankList({ rows, unit, valueKey = 'thisWeek', emptyTitle = '近 7 天暂无数据' }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description="等有访问/点赞后这里会自动出现。" />
  }
  return (
    <ol className="grid min-w-0 gap-2">
      {rows.map((row, i) => {
        const value = Number(row[valueKey]) || 0
        return (
          <li
            key={row.key}
            className="flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-[#e6e7df] bg-white/60 px-3 py-2.5 dark:border-[#243041] dark:bg-[#0e141d]"
          >
            <span className="w-5 shrink-0 text-center font-mono text-sm text-[#9a9c8f] dark:text-gray-500">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                {row.type ? (
                  <span className="shrink-0 rounded bg-[#eef0e8] px-1.5 py-0.5 font-mono text-[10px] text-[#67695d] dark:bg-[#1b2330] dark:text-gray-400">
                    {row.type}
                  </span>
                ) : null}
                {row.href ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 truncate text-sm font-medium text-[#15140f] hover:underline dark:text-gray-100"
                    title={row.title}
                  >
                    {row.title}
                  </a>
                ) : (
                  <span className="min-w-0 truncate text-sm font-medium text-[#15140f] dark:text-gray-100" title={row.title}>
                    {row.title}
                  </span>
                )}
              </div>
              <span className="block truncate font-mono text-[11px] text-[#9a9c8f] dark:text-gray-600" title={row.key}>
                {row.key}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-semibold text-[#15140f] dark:text-gray-100">
                {value}
                <span className="ml-1 text-[11px] font-normal text-[#9a9c8f] dark:text-gray-500">{unit}</span>
              </span>
              <StatusPill tone={trendTone(row.delta)} size="sm" icon={false}>
                {trendText(row.delta)}
              </StatusPill>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TypeDistribution({ rows, valueKey, previousKey, previousLabel }) {
  if (!rows.length) return null
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {rows.map((t) => (
        <div
          key={t.type}
          className="flex items-center justify-between gap-3 rounded-lg border border-[#e6e7df] bg-white/60 px-3 py-2.5 dark:border-[#243041] dark:bg-[#0e141d]"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#15140f] dark:text-gray-100">{t.type}</p>
            <p className="font-mono text-[11px] text-[#9a9c8f] dark:text-gray-500">{previousLabel} {t[previousKey]}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-base font-semibold text-[#15140f] dark:text-gray-100">{t[valueKey]}</span>
            <StatusPill tone={trendTone(t.delta)} size="sm" icon={false}>
              {trendText(t.delta)}
            </StatusPill>
          </div>
        </div>
      ))}
    </div>
  )
}

function InlineRankPanel({ title, description, children }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-[#e6e7df] bg-white/40 p-3 dark:border-[#243041] dark:bg-[#0e141d]/60">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#82847a] dark:text-gray-500">{description}</p>
      </div>
      {children}
    </div>
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

  const reads = data?.reads || { top: [], byType: [], total: { thisWeek: 0, prevWeek: 0 } }
  const likes = data?.likes || { top: [], total: { thisWeek: 0, prevWeek: 0 } }
  const month = data?.month || {
    reads: { top: [], byType: [], total: { thisMonth: 0, prevMonth: 0 } },
    likes: { top: [], total: { thisMonth: 0, prevMonth: 0 } },
  }
  const byType = reads.byType || []
  const monthByType = month.reads.byType || []
  const readsDelta = deltaVsPrev(reads.total.thisWeek, reads.total.prevWeek, '上周')
  const likesDelta = deltaVsPrev(likes.total.thisWeek, likes.total.prevWeek, '上周')
  const monthReadsDelta = deltaVsPrev(month.reads.total.thisMonth, month.reads.total.prevMonth, '上月')
  const monthLikesDelta = deltaVsPrev(month.likes.total.thisMonth, month.likes.total.prevMonth, '上月')
  const monthLabel = data?.window?.monthLabel || '本月'

  return (
    <AdminPage
      title="阅读分析"
      maxWidth="1100px"
      description="自建阅读统计：调研 / 资料·资源 / 灵感的被读、被赞，近 7 天趋势 + 自然月统计。打开即实时计算，看看什么内容真的打动人。"
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

      {byType.length ? (
        <Section title="内容类型分布 · 近 7 天" description="自建阅读统计按大类汇总，对比上一个 7 天。" className="mb-4">
          <TypeDistribution rows={byType} valueKey="thisWeek" previousKey="prevWeek" previousLabel="上周" />
        </Section>
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Section
          title="被读最多 · 近 7 天"
          description="数据源 research_pv_hits（调研 / 资料 / 灵感）；趋势对比上一个 7 天。"
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

      <Section
        title={`月统计 · ${monthLabel}`}
        description="按北京时间自然月统计，本月对比上月；用于看月度选题和内容类型表现。"
        className="mt-4"
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="本月阅读"
            value={loading ? '—' : month.reads.total.thisMonth}
            sub={`${monthReadsDelta.label} · ${trendText(monthReadsDelta.d)}`}
            tone={trendTone(monthReadsDelta.d)}
          />
          <StatCard
            label="本月点赞"
            value={loading ? '—' : month.likes.total.thisMonth}
            sub={`${monthLikesDelta.label} · ${trendText(monthLikesDelta.d)}`}
            tone={trendTone(monthLikesDelta.d)}
          />
          <StatCard label="月榜文章(读)" value={loading ? '—' : month.reads.top.length} />
          <StatCard label="月榜文章(赞)" value={loading ? '—' : month.likes.top.length} />
        </div>

        {monthByType.length ? (
          <div className="mb-4">
            <TypeDistribution rows={monthByType} valueKey="thisMonth" previousKey="prevMonth" previousLabel="上月" />
          </div>
        ) : null}

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <InlineRankPanel
            title="被读最多 · 本月"
            description="数据源 research_pv_hits（调研 / 资料 / 灵感）；趋势对比上一自然月。"
          >
            {loading ? (
              <p className="text-sm text-[#82847a]">加载中…</p>
            ) : (
              <RankList rows={month.reads.top} unit="次" valueKey="thisMonth" emptyTitle="本月暂无阅读数据" />
            )}
          </InlineRankPanel>
          <InlineRankPanel
            title="被赞最多 · 本月"
            description="数据源 article_likes；趋势对比上一自然月。"
          >
            {loading ? (
              <p className="text-sm text-[#82847a]">加载中…</p>
            ) : (
              <RankList rows={month.likes.top} unit="赞" valueKey="thisMonth" emptyTitle="本月暂无点赞数据" />
            )}
          </InlineRankPanel>
        </div>
      </Section>
    </AdminPage>
  )
}
