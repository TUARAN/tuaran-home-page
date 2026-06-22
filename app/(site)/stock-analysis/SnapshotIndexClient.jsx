'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const C = {
  accent: '#00e5a0',
  accent2: '#ff4d6a',
  accent3: '#f5a623',
  accent4: '#6c5ce7',
  ink: 'var(--site-ink)',
  muted: 'var(--site-muted)',
  line: 'var(--site-line)',
  panel: 'var(--site-panel)',
  panelStrong: 'var(--site-panel-strong)',
}

// 风险等级 → 颜色 & 排序权重
const RISK_META = {
  '高风险': { color: '#ff4d6a', order: 3, tagBg: 'rgba(255,77,106,0.12)' },
  '中等风险': { color: '#f5a623', order: 2, tagBg: 'rgba(245,166,35,0.12)' },
  '中低风险': { color: '#f5a623', order: 1, tagBg: 'rgba(245,166,35,0.08)' },
  '低风险': { color: '#00e5a0', order: 0, tagBg: 'rgba(0,229,160,0.1)' },
}

function fmtPrice(v, changePct) {
  if (typeof v !== 'number') return v
  return v.toFixed(v < 1 ? 5 : 2)
}

function fmtUsdt(v) {
  return typeof v === 'number' ? `${v.toFixed(2)} USDT` : v
}

function toneClass(tone) {
  const map = {
    danger: 'border-[#ff4d6a]/35 bg-[#ff4d6a]/10 text-[#ff4d6a]',
    warning: 'border-[#f5a623]/35 bg-[#f5a623]/10 text-[#f5a623]',
    success: 'border-[#00e5a0]/35 bg-[#00e5a0]/10 text-[#00a978]',
  }
  return map[tone] || 'border-[#d7d9cf] bg-[var(--site-panel)] text-[var(--site-muted)] dark:border-[#2b3644]'
}

function deriveActiveTags(summary) {
  const tags = []
  if (summary.riskSignals.highFundingRate) tags.push('资金费率异常')
  if (summary.riskSignals.volumePriceDivergence) tags.push('量价背离')
  if (summary.riskSignals.farFromMa) tags.push('均线乖离')
  if (summary.riskSignals.overbought) tags.push('超买')
  if (summary.gaugeValue >= 70) tags.push('高风险')
  return tags
}

function uniquePairs(summaries) {
  return Array.from(new Set(summaries.map((s) => s.pair))).sort()
}

function uniqueCategories(summaries) {
  const categories = new Map()
  summaries.forEach((s) => {
    if (s.category?.id) categories.set(s.category.id, s.category)
  })
  return Array.from(categories.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
}

function uniqueRiskLevels(summaries) {
  return Array.from(new Set(summaries.map((s) => s.analysisSummary.riskLevel))).sort(
    (a, b) => (RISK_META[b]?.order ?? 0) - (RISK_META[a]?.order ?? 0)
  )
}

function WeeklyAdvicePanel({ advice, locked, onUnlock }) {
  if (!advice) return null

  const position = advice.position || {}
  const sourceSnapshotCount = Array.isArray(advice.sourceSnapshotSlugs) ? advice.sourceSnapshotSlugs.length : 0

  // 加密遮罩组件
  const BlurShield = ({ children, className = '' }) => {
    if (!locked) return <div className={className}>{children}</div>
    return (
      <div className={`relative ${className}`}>
        <div className="blur-sm select-none pointer-events-none" aria-hidden="true">{children}</div>
        <button
          type="button"
          onClick={onUnlock}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-inherit bg-black/20 backdrop-blur-[2px] transition hover:bg-black/30"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#f5a623]/60 bg-white/90 text-[#f5a623] shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
          </span>
          <span className="text-[12px] font-semibold text-white drop-shadow-sm">点击解锁查看</span>
        </button>
      </div>
    )
  }

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-[#f5a623]/40 bg-white dark:bg-[#111923]">
      {/* 标题区 — 不加密 */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e3e4db] p-5 dark:border-[#2b3644]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#f5a623]">周建议 · {advice.category?.label}</p>
          <h2 className="mt-1 font-serif text-[24px] leading-tight text-[var(--site-ink)]">{advice.pair}</h2>
        </div>
        <div className="rounded-lg bg-[var(--site-panel)] px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">周期</p>
          <p className="mt-1 font-mono text-[13px] text-[var(--site-ink)]">{advice.week}</p>
          <p className="mt-1 text-[11px] text-[var(--site-muted)]">{sourceSnapshotCount} 个快照 · {advice.createdAt}</p>
        </div>
      </div>

      <BlurShield className="grid gap-6 p-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['方向 / 杠杆', `${position.direction || '—'} · ${position.marginMode || '—'} ${position.leverage || ''}`],
              ['持仓规模', fmtUsdt(position.notionalUsdt)],
              ['开仓均价', fmtPrice(position.entryPrice)],
              ['参考现价', fmtPrice(position.referencePrice)],
              ['当前浮盈', `${position.pnlUsdt >= 0 ? '+' : ''}${fmtUsdt(position.pnlUsdt)}`],
              ['强平价', fmtPrice(position.liquidationPrice)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[var(--site-panel)] p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">{label}</p>
                <p className="mt-1 font-mono text-[16px] font-semibold text-[var(--site-ink)]">{value || '—'}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#f5a623]/35 bg-[#f5a623]/10 p-4 text-[13px] leading-6 text-[#b87800] dark:text-[#f5a623]">
            <p className="font-bold">本周优先级</p>
            <p className="mt-1">{advice.priority}</p>
            {position.priorMaxDrawdownNote ? <p className="mt-2">{position.priorMaxDrawdownNote}</p> : null}
          </div>

          <div className="rounded-lg border border-[#00e5a0]/25 bg-[#00e5a0]/5 p-4 text-[13px] leading-6 text-[var(--site-muted)]">
            <p className="font-bold text-[var(--site-ink)]">方向判断</p>
            <p className="mt-1">{advice.bias}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-[13px] font-bold text-[var(--site-ink)]">执行动作</h3>
            <div className="mt-3 grid gap-2">
              {advice.actionPlan?.map((item) => (
                <div key={item.title} className={`rounded-lg border p-3 ${toneClass(item.tone)}`}>
                  <p className="text-[12px] font-bold">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-5">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-[var(--site-ink)]">关键价位纪律</h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-[#d7d9cf] dark:border-[#2b3644]">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[var(--site-panel-strong)] text-[var(--site-muted)]">
                    <th className="p-2 text-left">价位</th>
                    <th className="p-2 text-left">类型</th>
                    <th className="p-2 text-left">动作</th>
                  </tr>
                </thead>
                <tbody>
                  {advice.priceLevels?.map((level) => (
                    <tr key={`${level.label}-${level.price}`} className="border-t border-[#e3e4db] dark:border-[#2b3644]">
                      <td className="p-2 font-mono text-[var(--site-ink)]">{fmtPrice(level.price)}</td>
                      <td className="p-2">
                        <span className={`rounded border px-2 py-0.5 text-[11px] ${toneClass(level.tone)}`}>{level.label}</span>
                      </td>
                      <td className="p-2 text-[var(--site-muted)]">{level.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {Array.isArray(advice.riskRules) && advice.riskRules.length ? (
            <div>
              <h3 className="text-[13px] font-bold text-[var(--site-ink)]">风险纪律</h3>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--site-muted)]">
                {advice.riskRules.map((rule, index) => <li key={index}>· {rule}</li>)}
              </ul>
            </div>
          ) : null}

          {Array.isArray(advice.fomoProtocol) && advice.fomoProtocol.length ? (
            <div className="rounded-lg border border-[#6c5ce7]/30 bg-[#6c5ce7]/10 p-4">
              <h3 className="text-[13px] font-bold text-[#6c5ce7]">FOMO 处理预案</h3>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--site-muted)]">
                {advice.fomoProtocol.map((rule, index) => <li key={index}>· {rule}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      </BlurShield>

      {/* 底部免责声明 — 不加密 */}
      <div className="border-t border-[#e3e4db] px-5 py-3 text-[11px] leading-5 text-[var(--site-muted)] dark:border-[#2b3644]">
        <span className="text-[#ff4d6a]">失效条件：</span>{advice.invalidation}
        <br />
        {advice.disclaimer}
      </div>
    </section>
  )
}

function WeeklyAdviceCard({ advice, onOpen }) {
  const sourceSnapshotCount = Array.isArray(advice.sourceSnapshotSlugs) ? advice.sourceSnapshotSlugs.length : 0

  return (
    <button
      type="button"
      onClick={() => onOpen(advice)}
      className="group block rounded-xl border border-[#f5a623]/40 bg-[#f5a623]/[0.07] p-5 text-left transition-colors hover:border-[#f5a623] dark:bg-[#1a1620]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#f5a623]">周建议 · {advice.category?.label}</p>
          <h2 className="mt-1 font-serif text-[20px] leading-tight text-[var(--site-ink)]">{advice.pair}</h2>
          <p className="mt-1 text-[11px] text-[var(--site-muted)]">{advice.week}</p>
        </div>
        <span className="shrink-0 rounded border border-[#f5a623]/40 bg-[#f5a623]/10 px-2.5 py-1 text-[10px] font-bold text-[#f5a623]">
          追踪
        </span>
      </div>

      {/* 加密内容区：默认模糊，hover 时微弱透出，点击弹窗解锁 */}
      <div className="relative">
        <div className="blur-sm select-none pointer-events-none transition group-hover:blur-[2px]" aria-hidden="true">
          <p className="text-[13px] font-semibold leading-5 text-[var(--site-ink)] line-clamp-2">{advice.headline}</p>
          <p className="mt-2 text-[12px] leading-5 text-[var(--site-muted)] line-clamp-3">{advice.priority || advice.bias}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5a623]/10 px-3 py-1.5 text-[11px] font-medium text-[#f5a623]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            内容已加密
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f5a623]/25 pt-3 text-[11px] text-[var(--site-muted)]">
        <span>{sourceSnapshotCount} 个快照依据</span>
        <span>·</span>
        <span>{advice.createdAt}</span>
        <span className="ml-auto text-[#f5a623] group-hover:underline">打开弹窗 →</span>
      </div>
    </button>
  )
}

function WeeklyAdviceModal({ advice, onClose }) {
  const [unlocked, setUnlocked] = useState(false)

  if (!advice) return null

  // 每次切换 advice 时重置锁定状态
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${advice.category?.label || ''}周建议`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl bg-[var(--site-bg)] shadow-2xl ring-1 ring-black/10"
        onClick={(event) => event.stopPropagation()}
      >
        {/* 固定顶部栏 — 不随内容滚动 */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#e3e4db] bg-[var(--site-bg)] px-5 py-3.5 dark:border-[#2b3644]">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#f5a623]">周建议详情</p>
            <p className="mt-0.5 truncate text-[13px] text-[var(--site-muted)]">{advice.pair} · {advice.week}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[#d7d9cf] px-3 py-1.5 text-[12px] text-[var(--site-muted)] hover:border-[#ff4d6a] hover:text-[#ff4d6a] dark:border-[#2b3644]"
          >
            关闭
          </button>
        </div>
        {/* 可滚动内容区 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <WeeklyAdvicePanel advice={advice} locked={!unlocked} onUnlock={() => setUnlocked(true)} />
        </div>
      </div>
    </div>
  )
}

export default function SnapshotIndexClient({ summaries, weeklyAdvices = [] }) {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [pairFilter, setPairFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sort, setSort] = useState('datetime-desc') // datetime-desc | datetime-asc | risk-desc | pair-asc
  const [horizontalAnalysis, setHorizontalAnalysis] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('idle')
  const [analysisError, setAnalysisError] = useState('')
  const [selectedWeeklyAdvice, setSelectedWeeklyAdvice] = useState(null)

  const categories = useMemo(() => uniqueCategories(summaries), [summaries])
  const pairs = useMemo(() => uniquePairs(summaries), [summaries])
  const riskLevels = useMemo(() => uniqueRiskLevels(summaries), [summaries])

  const filtered = useMemo(() => {
    let arr = summaries.slice()
    if (categoryFilter !== 'all') arr = arr.filter((s) => s.category?.id === categoryFilter)
    if (pairFilter !== 'all') arr = arr.filter((s) => s.pair === pairFilter)
    if (riskFilter !== 'all') arr = arr.filter((s) => s.analysisSummary.riskLevel === riskFilter)

    arr.sort((a, b) => {
      if (sort === 'datetime-desc') return b.datetime.localeCompare(a.datetime)
      if (sort === 'datetime-asc') return a.datetime.localeCompare(b.datetime)
      if (sort === 'risk-desc') {
        return (RISK_META[b.analysisSummary.riskLevel]?.order ?? 0) - (RISK_META[a.analysisSummary.riskLevel]?.order ?? 0)
      }
      if (sort === 'pair-asc') return a.pair.localeCompare(b.pair)
      return 0
    })
    return arr
  }, [summaries, categoryFilter, pairFilter, riskFilter, sort])

  const filteredWeeklyAdvices = useMemo(() => {
    if (riskFilter !== 'all') return []
    return weeklyAdvices.filter((advice) => {
      if (categoryFilter !== 'all' && advice.category?.id !== categoryFilter) return false
      if (pairFilter !== 'all' && advice.pair !== pairFilter) return false
      return true
    })
  }, [weeklyAdvices, categoryFilter, pairFilter, riskFilter])

  const timelineEntries = useMemo(() => {
    const entries = [
      ...filtered.map((item) => ({
        type: 'snapshot',
        key: `snapshot-${item.slug}`,
        datetime: item.datetime,
        pair: item.pair,
        riskOrder: RISK_META[item.analysisSummary.riskLevel]?.order ?? 0,
        item,
      })),
      ...filteredWeeklyAdvices.map((item) => ({
        type: 'weekly-advice',
        key: `weekly-advice-${item.id}`,
        datetime: item.createdAt,
        pair: item.pair,
        riskOrder: 2.5,
        item,
      })),
    ]

    entries.sort((a, b) => {
      if (sort === 'datetime-desc') return b.datetime.localeCompare(a.datetime)
      if (sort === 'datetime-asc') return a.datetime.localeCompare(b.datetime)
      if (sort === 'risk-desc') return b.riskOrder - a.riskOrder
      if (sort === 'pair-asc') return a.pair.localeCompare(b.pair) || b.datetime.localeCompare(a.datetime)
      return 0
    })

    return entries
  }, [filtered, filteredWeeklyAdvices, sort])

  const analysisCategory = categoryFilter !== 'all'
    ? categoryFilter
    : categories.length === 1
      ? categories[0].id
      : ''

  async function generateHorizontalAnalysis() {
    if (!analysisCategory || analysisStatus === 'loading') return
    setAnalysisStatus('loading')
    setAnalysisError('')
    setHorizontalAnalysis(null)

    try {
      const response = await fetch(`/api/stock-analysis/horizontal-analysis?category=${encodeURIComponent(analysisCategory)}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || '横向分析生成失败。')
      setHorizontalAnalysis(payload)
      setAnalysisStatus('success')
    } catch (error) {
      setAnalysisError(error?.message || '横向分析生成失败。')
      setAnalysisStatus('error')
    }
  }

  const total = summaries.length
  const highRiskCount = summaries.filter((s) => s.analysisSummary.riskLevel === '高风险').length

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-10">

      {/* Header */}
      <header className="pb-8 border-b border-[#d7d9cf] dark:border-[#2b3644] mb-10">
        <div className="inline-block bg-[#00e5a0] text-[#0a0e17] px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
          交易分析快照库
        </div>
        <h1 className="font-serif text-[36px] text-[var(--site-ink)] mb-2 tracking-[0.02em]">
          多标的 · 分钟级 · 多维度交易分析
        </h1>
        <p className="text-[14px] text-[var(--site-muted)] max-w-[720px]">
          每条快照 = 一次完整的多维度交易分析（精确到分钟：资金费率、量价背离、均线乖离、关键点位、风险信号矩阵、综合风险指数）。
          同一标的日内多个时间点也可以并存，便于跟踪分钟级变化。
          新增快照只需在 <code className="px-1.5 py-0.5 rounded bg-[var(--site-panel)] text-[12px]">data.js</code> 中追加一条记录。
        </p>
        <div className="flex gap-6 mt-6 flex-wrap">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">快照总数</p>
            <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">{total}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">高风险</p>
            <p className="text-[18px] font-bold text-[#ff4d6a] mt-1">{highRiskCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">覆盖标的</p>
            <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">{pairs.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">最新快照</p>
            <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">
              {summaries.map((s) => s.datetime).sort().slice(-1)[0]}
            </p>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 rounded-xl border border-[#d7d9cf] dark:border-[#2b3644] bg-white dark:bg-[#111923] p-4">
        <div className="flex items-center gap-2 text-[13px]">
          <label htmlFor="category" className="text-[var(--site-muted)]">币种分类</label>
          <select
            id="category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setHorizontalAnalysis(null)
              setAnalysisStatus('idle')
              setAnalysisError('')
            }}
            className="rounded border border-[#c7c9be] dark:border-[#2b3644] bg-white dark:bg-[#0a0e17] px-2 py-1 text-[13px]"
          >
            <option value="all">全部</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <label htmlFor="pair" className="text-[var(--site-muted)]">标的</label>
          <select
            id="pair"
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="rounded border border-[#c7c9be] dark:border-[#2b3644] bg-white dark:bg-[#0a0e17] px-2 py-1 text-[13px]"
          >
            <option value="all">全部</option>
            {pairs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <label htmlFor="risk" className="text-[var(--site-muted)]">风险等级</label>
          <select
            id="risk"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded border border-[#c7c9be] dark:border-[#2b3644] bg-white dark:bg-[#0a0e17] px-2 py-1 text-[13px]"
          >
            <option value="all">全部</option>
            {riskLevels.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <label htmlFor="sort" className="text-[var(--site-muted)]">排序</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded border border-[#c7c9be] dark:border-[#2b3644] bg-white dark:bg-[#0a0e17] px-2 py-1 text-[13px]"
          >
            <option value="datetime-desc">时间从新到旧</option>
            <option value="datetime-asc">时间从旧到新</option>
            <option value="risk-desc">风险等级从高到低</option>
            <option value="pair-asc">标的字母序</option>
          </select>
        </div>

        <div className="ml-auto text-[12px] text-[var(--site-muted)]">
          匹配快照 <strong className="text-[var(--site-ink)]">{filtered.length}</strong> / {total}
          {filteredWeeklyAdvices.length ? (
            <span> · 周建议 <strong className="text-[#f5a623]">{filteredWeeklyAdvices.length}</strong></span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={generateHorizontalAnalysis}
          disabled={!analysisCategory || analysisStatus === 'loading'}
          className="rounded-lg bg-[#00e5a0] px-4 py-2 text-[12px] font-bold text-[#0a0e17] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
          title={!analysisCategory ? '请先选择一个币种分类' : '调用 DeepSeek 对比最近 5 个快照'}
        >
          {analysisStatus === 'loading' ? 'DeepSeek 分析中…' : '横向分析'}
        </button>
      </div>

      {analysisError ? (
        <div role="alert" className="mb-6 rounded-xl border border-[#ff4d6a]/40 bg-[#ff4d6a]/10 px-4 py-3 text-[13px] text-[#ff4d6a]">
          {analysisError}
        </div>
      ) : null}

      {horizontalAnalysis ? (
        <section className="mb-8 overflow-hidden rounded-xl border border-[#00e5a0]/40 bg-white dark:bg-[#111923]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e3e4db] p-5 dark:border-[#2b3644]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#00a978]">DeepSeek 横向分析</p>
              <h2 className="mt-1 font-serif text-[22px] text-[var(--site-ink)]">{horizontalAnalysis.analysis?.headline}</h2>
              <p className="mt-2 text-[12px] text-[var(--site-muted)]">
                {horizontalAnalysis.category?.label} · 最近 {horizontalAnalysis.snapshotCount} 个快照 · {horizontalAnalysis.range?.from} 至 {horizontalAnalysis.range?.to}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded bg-[#00e5a0]/10 px-2.5 py-1 text-[11px] font-semibold text-[#00a978]">
                {horizontalAnalysis.analysis?.trend}
              </span>
              <span className="rounded bg-[var(--site-panel)] px-2.5 py-1 text-[11px] text-[var(--site-muted)]">
                置信度 {horizontalAnalysis.analysis?.confidence}
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <p className="text-[14px] leading-7 text-[var(--site-ink)]">{horizontalAnalysis.analysis?.summary}</p>
              {Array.isArray(horizontalAnalysis.analysis?.metricTrends) ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {horizontalAnalysis.analysis.metricTrends.map((item, index) => (
                    <div key={`${item.metric}-${index}`} className="rounded-lg bg-[var(--site-panel)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[12px] text-[var(--site-ink)]">{item.metric}</strong>
                        <span className="text-[10px] font-semibold text-[#00a978]">{item.direction}</span>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-5 text-[var(--site-muted)]">{item.analysis}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4 text-[12px]">
              {[
                ['关键变化', horizontalAnalysis.analysis?.keyChanges],
                ['风险与限制', horizontalAnalysis.analysis?.risks],
                ['后续观察', horizontalAnalysis.analysis?.watchPoints],
              ].map(([title, items]) => Array.isArray(items) && items.length ? (
                <div key={title}>
                  <h3 className="font-semibold text-[var(--site-ink)]">{title}</h3>
                  <ul className="mt-2 space-y-1.5 text-[var(--site-muted)]">
                    {items.map((item, index) => <li key={`${title}-${index}`}>· {item}</li>)}
                  </ul>
                </div>
              ) : null)}
            </div>
          </div>
          <p className="border-t border-[#e3e4db] px-5 py-3 text-[10px] text-[var(--site-muted)] dark:border-[#2b3644]">
            {horizontalAnalysis.analysis?.disclaimer || '本分析仅基于有限历史快照，不构成投资建议。'}
          </p>
        </section>
      ) : null}

      {/* Grid */}
      {timelineEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d7d9cf] dark:border-[#2b3644] p-12 text-center text-[14px] text-[var(--site-muted)]">
          当前筛选下没有快照。试着切换标的或风险等级。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {timelineEntries.map((entry) => {
            if (entry.type === 'weekly-advice') {
              return (
                <WeeklyAdviceCard
                  key={entry.key}
                  advice={entry.item}
                  onOpen={setSelectedWeeklyAdvice}
                />
              )
            }

            const s = entry.item
            const changePositive = s.price.changePct >= 0
            const changeColor = changePositive ? 'text-[#00e5a0]' : 'text-[#ff4d6a]'
            const changeSign = changePositive ? '+' : ''
            const riskMeta = RISK_META[s.analysisSummary.riskLevel] || RISK_META['中低风险']
            const tags = deriveActiveTags(s)
            return (
              <Link
                key={s.slug}
                href={`/stock-analysis/${s.slug}`}
                className="group block rounded-xl border border-[#d7d9cf] dark:border-[#2b3644] bg-white dark:bg-[#111923] p-5 hover:border-[#00e5a0] transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--site-muted)]">{s.category?.label} · {s.contractType} · {s.exchange}</p>
                    <h2 className="font-serif text-[22px] text-[var(--site-ink)] mt-1 leading-tight">{s.pair}</h2>
                    <p className="text-[11px] text-[var(--site-muted)] mt-1">{s.timeframe} · {s.date} {s.time}</p>
                  </div>
                  <span
                    className="shrink-0 inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-[0.05em] border"
                    style={{ color: riskMeta.color, borderColor: riskMeta.color + '50', background: riskMeta.tagBg }}
                  >
                    {s.analysisSummary.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">当前价格</p>
                    <p className={`font-mono text-[18px] font-semibold mt-1 ${changeColor}`}>{fmtPrice(s.price.current)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">24H</p>
                    <p className={`font-mono text-[18px] font-semibold mt-1 ${changeColor}`}>{changeSign}{s.price.changePct}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">资金费率</p>
                    <p className={`font-mono text-[14px] mt-1 ${s.riskSignals.highFundingRate ? 'text-[#ff4d6a]' : 'text-[var(--site-ink)]'}`}>
                      {s.funding.rateDisplay}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">综合风险</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--site-panel)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.gaugeValue}%`,
                            background: s.gaugeValue >= 70 ? C.accent2 : s.gaugeValue >= 45 ? C.accent3 : C.accent,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[14px] text-[var(--site-ink)]">{s.gaugeValue}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#e3e4db] dark:border-[#2b3644] pt-3">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)] mb-2">风险信号</p>
                  {tags.length === 0 ? (
                    <p className="text-[12px] text-[var(--site-muted)]">暂无明显风险信号</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{ color: riskMeta.color, background: riskMeta.tagBg }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-3 text-[12px] text-[var(--site-muted)] line-clamp-2 leading-5">
                  {s.analysisSummary.keyConcern}
                </p>

                <p className="mt-3 text-[12px] text-[#00e5a0] group-hover:underline">
                  查看完整分析 →
                </p>
              </Link>
            )
          })}
        </div>
      )}

      <WeeklyAdviceModal advice={selectedWeeklyAdvice} onClose={() => setSelectedWeeklyAdvice(null)} />

      {/* Footer hint */}
      <div className="mt-10 pt-6 border-t border-[#d7d9cf] dark:border-[#2b3644] text-center text-[11px] text-[var(--site-muted)]">
        所有快照数据均来源于公开交易所 API · 本分析仅供参考，不构成投资建议<br />
        新增快照：在 <code className="px-1.5 py-0.5 rounded bg-[var(--site-panel)] text-[12px]">app/(site)/stock-analysis/data.js</code> 中追加一条 <code className="px-1 py-0.5 rounded bg-[var(--site-panel)] text-[12px]">STOCK_ANALYSIS_RECORDS</code> 即可
      </div>
    </main>
  )
}
