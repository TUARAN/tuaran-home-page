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

function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0%'
  return `${Math.round(n * 1000) / 10}%`
}

function deltaVsPrev(current, previous, previousLabel) {
  const d = current - previous
  return { d, label: `${previousLabel} ${previous}` }
}

function formatDateTime(value) {
  const n = Number(value) || 0
  if (!n) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(n))
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

function DailyPvChart({ rows, loading }) {
  const safeRows = Array.isArray(rows) ? rows : []
  if (loading) return <p className="text-sm text-[#82847a]">加载中…</p>
  if (!safeRows.length) return <EmptyState title="暂无每日 PV 数据" description="有访问后这里会自动出现最近 7 天走势。" />

  const max = Math.max(...safeRows.map((row) => Number(row.pv) || 0), 1)
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[520px] grid-cols-7 gap-3">
        {safeRows.map((row, index) => {
          const pv = Number(row.pv) || 0
          const height = Math.max(10, Math.round((pv / max) * 132))
          const isToday = index === safeRows.length - 1
          return (
            <div key={row.date || index} className="flex min-w-0 flex-col items-center gap-2">
              <div className="h-5 font-mono text-[12px] font-semibold text-[#15140f] dark:text-gray-100">
                {pv}
              </div>
              <div className="flex h-36 w-full items-end rounded-lg border border-[#eceee6] bg-[#f8f7f1] px-2 pb-2 dark:border-[#1b2430] dark:bg-[#0b1119]">
                <div
                  className={[
                    'w-full rounded-md transition-all',
                    isToday ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-[#b6aa91] dark:bg-[#596777]',
                  ].join(' ')}
                  style={{ height }}
                  title={`${row.date || row.label}: ${pv} PV`}
                />
              </div>
              <div className="text-center">
                <p className="mb-0 font-mono text-[11px] text-[#67695d] dark:text-gray-400">{row.label || row.date}</p>
                {isToday ? (
                  <p className="mb-0 mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    今天
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
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

function CommentFollowUp({ comments, loading, deletingId, onDelete }) {
  const total = comments?.total || { all: 0, thisWeek: 0, thisMonth: 0, articles: 0 }
  const recent = comments?.recent || []

  return (
    <Section
      title="评论跟进"
      description="最近 20 条站内评论；可直接打开原文评论区，垃圾评论可由站长删除。"
      className="mt-4"
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="累计评论" value={loading ? '—' : total.all} />
        <StatCard label="本周新增" value={loading ? '—' : total.thisWeek} />
        <StatCard label="本月新增" value={loading ? '—' : total.thisMonth} />
        <StatCard label="有评论文章" value={loading ? '—' : total.articles} />
      </div>

      {loading ? (
        <p className="text-sm text-[#82847a]">加载中…</p>
      ) : recent.length ? (
        <ol className="grid gap-2">
          {recent.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-[#e6e7df] bg-white/60 p-3 dark:border-[#243041] dark:bg-[#0e141d]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#82847a] dark:text-gray-500">
                    <span className="font-medium text-[#15140f] dark:text-gray-100">{comment.userName || '匿名用户'}</span>
                    <span className="rounded bg-[#eef0e8] px-1.5 py-0.5 font-mono text-[10px] dark:bg-[#1b2330]">
                      {comment.userProvider || 'unknown'}
                    </span>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs">
                    {comment.href ? (
                      <a
                        href={comment.href}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-medium text-[#476a75] hover:underline dark:text-[#9fc5ad]"
                        title={comment.articleTitle}
                      >
                        {comment.articleTitle}
                      </a>
                    ) : (
                      <span className="truncate font-medium text-[#476a75] dark:text-[#9fc5ad]" title={comment.articleTitle}>
                        {comment.articleTitle}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-[#9a9c8f] dark:text-gray-600">{comment.articleKey}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(comment)}
                  disabled={deletingId === comment.id}
                  className="shrink-0 rounded-md border border-rose-200 px-2.5 py-1 text-xs text-rose-700 hover:border-rose-300 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
                >
                  {deletingId === comment.id ? '删除中…' : '删除'}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#4c4f46] dark:text-gray-300">
                {comment.message}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="暂无评论" description="有新评论后会显示在这里。" />
      )}
    </Section>
  )
}

export default function ContentWeeklyClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState(null)

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

  const deleteComment = useCallback(async (comment) => {
    if (!comment?.id) return
    if (!window.confirm(`确认删除「${comment.userName || '匿名用户'}」的这条评论？`)) return
    setDeletingCommentId(comment.id)
    setError('')
    try {
      const res = await fetch(`/api/admin/comments?id=${encodeURIComponent(comment.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const json = await safeJson(res)
      if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP_${res.status}`)
      await refresh()
    } catch (e) {
      setError(e?.message || 'COMMENT_DELETE_FAILED')
    } finally {
      setDeletingCommentId(null)
    }
  }, [refresh])

  const reads = data?.reads || { top: [], byType: [], daily: [], total: { thisWeek: 0, prevWeek: 0, today: 0, yesterday: 0 } }
  const likes = data?.likes || { top: [], total: { thisWeek: 0, prevWeek: 0 } }
  const month = data?.month || {
    reads: { top: [], byType: [], total: { thisMonth: 0, prevMonth: 0 } },
    likes: { top: [], total: { thisMonth: 0, prevMonth: 0 } },
  }
  const byType = reads.byType || []
  const monthByType = month.reads.byType || []
  const comments = data?.comments || { recent: [], total: { all: 0, thisWeek: 0, thisMonth: 0, articles: 0 } }
  const ops = data?.ops || {
    visitors: { total: 0, returning: 0, returnRate: 0 },
    comments: { commenters: 0, comments: 0, conversionRate: 0 },
    newsletter: { active: 0, thisWeek: 0 },
  }
  const readsDelta = deltaVsPrev(reads.total.thisWeek, reads.total.prevWeek, '上周')
  const todayReadsDelta = deltaVsPrev(reads.total.today || 0, reads.total.yesterday || 0, '昨日')
  const likesDelta = deltaVsPrev(likes.total.thisWeek, likes.total.prevWeek, '上周')
  const monthReadsDelta = deltaVsPrev(month.reads.total.thisMonth, month.reads.total.prevMonth, '上月')
  const monthLikesDelta = deltaVsPrev(month.likes.total.thisMonth, month.likes.total.prevMonth, '上月')
  const monthLabel = data?.window?.monthLabel || '本月'
  const generatedAtLabel = data?.generatedAt ? formatDateTime(data.generatedAt) : loading ? '计算中…' : '—'

  return (
    <AdminPage
      title="阅读分析"
      maxWidth="1100px"
      description={
        <>
          自建阅读统计：调研 / 资料·资源 / 灵感的被读、被赞，今日 PV、近 7 天走势、回访率 / 评论转化率 / 订阅数 + 自然月统计。
          <br />
          刷新时间：{generatedAtLabel}（北京时间；打开页面或点击重新计算时实时聚合，不走定时缓存）。
        </>
      }
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

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="今日 PV"
          value={loading ? '—' : reads.total.today}
          sub={`${todayReadsDelta.label} · ${trendText(todayReadsDelta.d)}`}
          tone={trendTone(todayReadsDelta.d)}
        />
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

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <StatCard
          label="回访率"
          value={loading ? '—' : formatPercent(ops.visitors.returnRate)}
          sub={loading ? '近 7 天唯一访客' : `${ops.visitors.returning}/${ops.visitors.total} 访客 · 近 7 天`}
          tone="info"
        />
        <StatCard
          label="评论转化率"
          value={loading ? '—' : formatPercent(ops.comments.conversionRate)}
          sub={loading ? '近 7 天评论用户 / 访客' : `${ops.comments.commenters} 人评论 · ${ops.comments.comments || 0} 条`}
          tone="warning"
        />
        <StatCard
          label="订阅数"
          value={loading ? '—' : ops.newsletter.active}
          sub={loading ? 'Newsletter active' : `近 7 天新增 +${ops.newsletter.thisWeek || 0}`}
          tone="success"
        />
      </section>

      <Section title="每日 PV · 最近 7 天" description="按北京时间自然日统计 research_pv_hits；最后一根柱子是今天截至当前刷新时的 PV。" className="mb-4">
        <DailyPvChart rows={reads.daily} loading={loading} />
      </Section>

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

      <CommentFollowUp
        comments={comments}
        loading={loading}
        deletingId={deletingCommentId}
        onDelete={deleteComment}
      />
    </AdminPage>
  )
}
