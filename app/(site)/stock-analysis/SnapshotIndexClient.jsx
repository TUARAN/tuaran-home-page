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

export default function SnapshotIndexClient({ summaries }) {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [pairFilter, setPairFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sort, setSort] = useState('datetime-desc') // datetime-desc | datetime-asc | risk-desc | pair-asc
  const [horizontalAnalysis, setHorizontalAnalysis] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('idle')
  const [analysisError, setAnalysisError] = useState('')

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
          匹配 <strong className="text-[var(--site-ink)]">{filtered.length}</strong> / {total}
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
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d7d9cf] dark:border-[#2b3644] p-12 text-center text-[14px] text-[var(--site-muted)]">
          当前筛选下没有快照。试着切换标的或风险等级。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
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

      {/* Footer hint */}
      <div className="mt-10 pt-6 border-t border-[#d7d9cf] dark:border-[#2b3644] text-center text-[11px] text-[var(--site-muted)]">
        所有快照数据均来源于公开交易所 API · 本分析仅供参考，不构成投资建议<br />
        新增快照：在 <code className="px-1.5 py-0.5 rounded bg-[var(--site-panel)] text-[12px]">app/(site)/stock-analysis/data.js</code> 中追加一条 <code className="px-1 py-0.5 rounded bg-[var(--site-panel)] text-[12px]">STOCK_ANALYSIS_RECORDS</code> 即可
      </div>
    </main>
  )
}
