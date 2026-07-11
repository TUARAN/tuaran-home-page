'use client'

import { useMemo, useState } from 'react'

import { extractFinancialView } from '../../../../lib/longCompass'

function formatAmount(value) {
  const amount = Number(value || 0)
  const sign = amount < 0 ? '-' : ''
  const absolute = Math.abs(amount)
  if (absolute >= 10000) {
    const wan = absolute / 10000
    return `${sign}${wan.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 万`
  }
  return `${sign}${absolute.toLocaleString('zh-CN')} 元`
}

function latestPoint(points) {
  return points.length ? points[points.length - 1] : null
}

export default function FinanceView({ records }) {
  const data = useMemo(() => extractFinancialView(records), [records])
  const [activeSeriesId, setActiveSeriesId] = useState(data.series[0]?.id || '')
  const activeSeries = data.series.find((series) => series.id === activeSeriesId) || data.series[0]
  const latestAssets = latestPoint(data.householdAssets)
  const latestDebt = latestPoint(data.debt)
  const latestBonus = latestPoint(data.bonus)

  if (!data.series.length && !data.liquidity.length && !data.householdFlows.length) {
    return (
      <section className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-7 text-sm leading-7 text-[#717367] dark:border-gray-700 dark:text-gray-400">
        还没有识别到可视化数据。财务视图只读取带明确表头的 Markdown 表格，例如「时点｜估算资产」或「年份｜年终金额」。
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="border-b border-[#dee0db] pb-4 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
          Parsed from unlocked records
        </p>
        <h2 className="mt-2 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">财务视图</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62645a] dark:text-gray-400">
          从原始 Markdown 表格提取时间节点与金额，用于观察趋势和结构；这是阅读辅助，不替代记账或财产确认。
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="家庭账户资产 · 最近节点" point={latestAssets} />
        <Metric label="债务总额 · 最近节点" point={latestDebt} />
        <Metric label="年终奖 · 最近节点" point={latestBonus} />
      </div>

      {activeSeries ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">时间线</h3>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="财务时间线类型">
              {data.series.map((series) => (
                <button
                  key={series.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSeries.id === series.id}
                  onClick={() => setActiveSeriesId(series.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeSeries.id === series.id
                      ? 'bg-[#2f3027] text-white dark:bg-gray-200 dark:text-[#111]'
                      : 'border border-[#dee0db] text-[#58594d] hover:bg-white dark:border-[#2d3440] dark:text-gray-300 dark:hover:bg-[#121821]'
                  }`}
                >
                  {series.label} · {series.points.length}
                </button>
              ))}
            </div>
          </div>
          <TrendChart series={activeSeries} />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AmountList
          title="流动性拆分"
          empty="暂无带「资产｜金额」表格的流动性数据。"
          items={data.liquidity}
        />
        <AmountList
          title="家庭账户资金来源"
          empty="暂无带「类型｜估算」表格的资金来源数据。"
          items={data.householdFlows}
          showBars
        />
      </div>
    </section>
  )
}

function Metric({ label, point }) {
  return (
    <div className="rounded-lg border border-[#dee0db] bg-white/75 px-4 py-3 dark:border-gray-800 dark:bg-[#121821]/75">
      <p className="text-[11px] text-[#767869] dark:text-[#8e9ab0]">{label}</p>
      <p className="mt-1 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">
        {point ? formatAmount(point.value) : '—'}
      </p>
      <p className="mt-1 text-[11px] text-[#858876] dark:text-[#8e9ab0]">{point?.label || '未识别到节点'}</p>
    </div>
  )
}

function TrendChart({ series }) {
  const points = series.points
  const latest = latestPoint(points)
  const previous = points.length > 1 ? points[points.length - 2] : null
  const change = latest && previous ? latest.value - previous.value : null
  const width = 720
  const height = 260
  const padding = { top: 28, right: 24, bottom: 48, left: 66 }
  const values = points.map((point) => point.value)
  const minValue = Math.min(0, ...values)
  const maxValue = Math.max(...values, 1)
  const spread = Math.max(maxValue - minValue, Math.abs(maxValue) * 0.2, 1)
  const yMin = minValue < 0 ? minValue - spread * 0.1 : 0
  const yMax = maxValue + spread * 0.1
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const xFor = (index) => padding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
  const yFor = (value) => padding.top + ((yMax - value) / (yMax - yMin)) * plotHeight
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.value)}`).join(' ')
  const ticks = [yMax, yMin + (yMax - yMin) / 2, yMin]

  return (
    <div className="rounded-lg border border-[#dee0db] bg-white/75 p-3 dark:border-gray-800 dark:bg-[#121821]/75">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full" role="img" aria-label={`${series.label} 时间趋势`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="currentColor" opacity="0.14" />
              <text x={padding.left - 10} y={yFor(tick) + 4} textAnchor="end" className="fill-[#767869] text-[10px] dark:fill-[#8e9ab0]">
                {formatAmount(tick)}
              </text>
            </g>
          ))}
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8b5a1f] dark:text-[#d7a85c]" />
          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              <circle cx={xFor(index)} cy={yFor(point.value)} r="4" className="fill-[#8b5a1f] dark:fill-[#d7a85c]" />
              <text x={xFor(index)} y={height - 20} textAnchor="middle" className="fill-[#767869] text-[10px] dark:fill-[#8e9ab0]">
                {point.label.replace(/（.*$/, '')}
              </text>
              <title>{`${point.label} · ${formatAmount(point.value)}\n${point.note}\n来源：${point.sourceTitle}`}</title>
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-[#767869] dark:text-[#8e9ab0]">
        {change === null
          ? '纵轴单位会随所选序列变化。'
          : `最近节点较上一节点${change >= 0 ? '增加' : '减少'} ${formatAmount(Math.abs(change))}。`}
      </p>
      <div className="mt-3 grid gap-x-5 gap-y-2 border-t border-[#e5e6e0] pt-3 text-xs dark:border-gray-800 sm:grid-cols-2">
        {points.map((point, index) => (
          <div key={`${point.label}-${index}`} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[#62645a] dark:text-gray-400" title={`${point.label} · ${point.note}`}>
              {point.label}
            </span>
            <span className="shrink-0 font-medium text-[#15140f] dark:text-gray-100">{formatAmount(point.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AmountList({ title, empty, items, showBars = false }) {
  const maxValue = Math.max(...items.map((item) => Math.abs(item.value)), 1)
  return (
    <section>
      <h3 className="font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-[#717367] dark:text-gray-400">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#e5e6e0] rounded-lg border border-[#dee0db] bg-white/75 dark:divide-gray-800 dark:border-gray-800 dark:bg-[#121821]/75">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="px-3 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-[#35362f] dark:text-gray-200">{item.label}</span>
                <span className={item.value < 0 ? 'text-sm font-medium text-rose-700 dark:text-rose-300' : 'text-sm font-medium text-[#15140f] dark:text-gray-100'}>
                  {formatAmount(item.value)}
                </span>
              </div>
              {showBars ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7e8e0] dark:bg-[#25303c]">
                  <div
                    className={item.value < 0 ? 'h-full bg-rose-500' : 'h-full bg-[#8b5a1f] dark:bg-[#d7a85c]'}
                    style={{ width: `${Math.max(4, (Math.abs(item.value) / maxValue) * 100)}%` }}
                  />
                </div>
              ) : null}
              <p className="mt-1 text-[11px] leading-5 text-[#767869] dark:text-[#8e9ab0]">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
