'use client'

import { useMemo, useState } from 'react'

import { extractFinancialView } from '../../../../lib/longCompass'
import { extractLoanSnapshots } from '../../../../lib/longCompass/loans'
import WealthView from './WealthView'

const panel = 'rounded-lg border border-[#dee0db] bg-white/75 dark:border-gray-800 dark:bg-[#121821]/75'
const muted = 'text-[11px] leading-5 text-[#767869] dark:text-[#8e9ab0]'
const sections = [
  ['balance-sheet', '资产负债表'],
  ['household', '家庭账户'],
  ['personal', '个人账户'],
  ['debt', '负债管理'],
]

function formatAmount(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '待补录'
  const amount = Number(value)
  const sign = amount < 0 ? '-' : ''
  const absolute = Math.abs(amount)
  if (absolute >= 10000) {
    return `${sign}${(absolute / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 万`
  }
  return `${sign}${absolute.toLocaleString('zh-CN')} 元`
}

function latestPoint(points) {
  return points.length ? points[points.length - 1] : null
}

export default function FinanceView({ records }) {
  const data = useMemo(() => extractFinancialView(records), [records])
  const loanSnapshots = useMemo(() => extractLoanSnapshots(records), [records])
  const [activeSection, setActiveSection] = useState('balance-sheet')
  const latestLoan = loanSnapshots[0] || null

  if (!data.series.length && !data.liquidity.length && !data.householdFlows.length && !latestLoan) {
    return (
      <section className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-7 text-sm leading-7 text-[#717367] dark:border-gray-700 dark:text-gray-400">
        还没有识别到可汇总的数据。财务总览只读取带明确表头的 Markdown 表格；缺失账户会保留为待补录，不会从叙述中猜金额。
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="border-b border-[#dee0db] pb-4 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">Financial overview</p>
        <h2 className="mt-2 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">财务总览</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62645a] dark:text-gray-400">
          用资产负债表统一查看家庭账户、个人账户和负债。金额来自不同日期的历史快照时会明确标注，缺失项只占位、不进入合计。
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="财务总览分类">
          {sections.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeSection === id}
              onClick={() => setActiveSection(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeSection === id
                ? 'bg-[#2f3027] text-white dark:bg-gray-200 dark:text-[#111]'
                : 'border border-[#dee0db] text-[#58594d] hover:bg-white dark:border-[#2d3440] dark:text-gray-300 dark:hover:bg-[#121821]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {activeSection === 'balance-sheet' ? <BalanceSheet data={data} loan={latestLoan} /> : null}
      {activeSection === 'household' ? <HouseholdOverview data={data} /> : null}
      {activeSection === 'personal' ? <PersonalOverview data={data} /> : null}
      {activeSection === 'debt' ? <WealthView records={records} /> : null}
    </section>
  )
}

function BalanceSheet({ data, loan }) {
  const household = latestPoint(data.householdAssets)
  const personalTotal = data.liquidity.reduce((sum, item) => sum + item.value, 0)
  const assets = (household?.value || 0) + personalTotal
  const liabilities = loan?.remainingCents === null || loan?.remainingCents === undefined ? null : loan.remainingCents / 100
  const netAssets = liabilities === null ? null : assets - liabilities
  const debtRatio = liabilities !== null && assets > 0 ? liabilities / assets * 100 : null
  const assetRows = [
    { group: '家庭账户', item: '家庭账户资产', value: household?.value, date: household?.label, status: household ? '历史估算' : '待补录', source: household?.sourceTitle },
    ...data.liquidity.map((item) => ({ group: '个人账户', item: item.label, value: item.value, date: item.detail, status: '历史估算', source: item.sourceTitle })),
    { group: '个人账户', item: '其他银行 / 支付账户', value: null, status: '待补录' },
    { group: '个人账户', item: '投资资产', value: null, status: '待补录' },
    { group: '公司账户', item: '矩联科技对公账户', value: null, status: '待补录' },
  ]
  const liabilityRows = [
    { group: '贷款', item: loan ? `${loan.activeCount} 笔有余额贷款` : '贷款余额', value: liabilities, date: loan?.date, status: loan ? '当前截图' : '待补录', source: loan?.title },
    { group: '流动负债', item: '信用卡应付', value: null, status: '待补录' },
    { group: '其他负债', item: '其他应付款', value: null, status: '待补录' },
  ]

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryMetric label="已识别资产" value={assets} note="家庭与个人历史记录拼接" />
      <SummaryMetric label="当前贷款本金" value={liabilities} note={loan ? `截图日期 ${loan.date}` : '等待贷款快照'} accent />
      <SummaryMetric label="临时净资产" value={netAssets} note="缺失项未计入，暂不可用于正式报表" />
      <SummaryMetric label="贷款 / 已识别资产" value={debtRatio === null ? null : `${debtRatio.toFixed(1)}%`} note="仅作覆盖率提示，不是审计口径" />
    </div>
    <aside className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      这是临时资产负债表：家庭账户最近节点、个人资产节点与贷款截图日期并不一致，且部分金额带“约、低于、至少”口径。待补录项不会按 0 元处理，也不会进入资产、负债或净资产合计。
    </aside>
    <BalanceTable title="资产" rows={assetRows} total={assets} />
    <BalanceTable title="负债" rows={liabilityRows} total={liabilities} />
    <section className={`${panel} p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div><h3 className="font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">所有者权益 / 净资产</h3><p className={`mt-1 ${muted}`}>已识别资产 − 已识别负债</p></div>
        <p className="font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">{formatAmount(netAssets)}</p>
      </div>
    </section>
  </div>
}

function BalanceTable({ title, rows, total }) {
  return <section>
    <div className="mb-3 flex items-baseline justify-between gap-3"><h3 className="font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">{title}</h3><span className="text-sm font-medium">已识别合计 {formatAmount(total)}</span></div>
    <div className={`${panel} overflow-x-auto`}>
      <table className="w-full min-w-[760px] text-left text-xs leading-6">
        <thead className="border-b border-[#dee0db] dark:border-gray-700"><tr>{['分类', '账户 / 项目', '金额', '数据日期 / 说明', '数据状态', '来源'].map((label) => <th key={label} scope="col" className="px-3 py-2 font-medium">{label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${row.group}-${row.item}-${index}`} className="border-b border-[#e5e6e0] last:border-0 dark:border-gray-800">
          <td className="px-3 py-3">{row.group}</td><th scope="row" className="px-3 py-3 font-medium">{row.item}</th><td className="px-3 py-3 font-mono">{formatAmount(row.value)}</td><td className="px-3 py-3 text-[#717367] dark:text-gray-400">{row.date || '—'}</td><td className="px-3 py-3"><DataStatus value={row.status} /></td><td className="px-3 py-3 text-[#717367] dark:text-gray-400">{row.source || '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>
}

function DataStatus({ value }) {
  const style = value === '当前截图' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : value === '待补录' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
  return <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] ${style}`}>{value}</span>
}

function HouseholdOverview({ data }) {
  const latest = latestPoint(data.householdAssets)
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2"><Metric label="家庭账户资产 · 最近节点" point={latest} /><SummaryMetric label="已识别资金来源项目" value={`${data.householdFlows.length} 项`} note="来自资金来源明细表" /></div>
    {data.householdAssets.length ? <TrendChart series={{ label: '家庭账户资产', points: data.householdAssets }} /> : <Empty>暂无家庭账户资产时间线。</Empty>}
    <AmountList title="家庭账户资金来源" empty="暂无带「类型｜估算」表格的资金来源数据。" items={data.householdFlows} showBars />
  </div>
}

function PersonalOverview({ data }) {
  const total = data.liquidity.reduce((sum, item) => sum + item.value, 0)
  const bonus = latestPoint(data.bonus)
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-3"><SummaryMetric label="已识别个人资产" value={total} note="含约数、上限与低流动性项目" /><Metric label="年终奖 · 最近节点" point={bonus} /><SummaryMetric label="待补录账户" value="3 类" note="其他银行 / 投资 / 公司账户" /></div>
    <AmountList title="个人账户与流动性" empty="暂无带「资产｜金额」表格的个人账户数据。" items={data.liquidity} showBars />
    {data.bonus.length ? <TrendChart series={{ label: '年终奖', points: data.bonus }} /> : null}
    <PlaceholderList />
  </div>
}

function PlaceholderList() {
  return <section><h3 className="font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">待补录账户</h3><ul className={`mt-3 divide-y divide-[#e5e6e0] ${panel} dark:divide-gray-800`}>{['其他银行 / 支付账户', '投资资产', '矩联科技对公账户'].map((label) => <li key={label} className="flex items-center justify-between gap-3 px-3 py-3 text-sm"><span>{label}</span><DataStatus value="待补录" /></li>)}</ul></section>
}

function Empty({ children }) {
  return <p className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-6 text-sm text-[#717367] dark:border-gray-700 dark:text-gray-400">{children}</p>
}

function SummaryMetric({ label, value, note, accent = false }) {
  const rendered = typeof value === 'number' || value === null || value === undefined ? formatAmount(value) : value
  return <div className={`${panel} px-4 py-3`}><p className={muted}>{label}</p><p className={`mt-1 font-serif text-xl font-semibold ${accent ? 'text-[#b76031] dark:text-[#e0a279]' : 'text-[#15140f] dark:text-gray-100'}`}>{rendered}</p><p className={`mt-1 ${muted}`}>{note}</p></div>
}

function Metric({ label, point }) {
  return <div className={`${panel} px-4 py-3`}><p className={muted}>{label}</p><p className="mt-1 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">{point ? formatAmount(point.value) : '待补录'}</p><p className={`mt-1 ${muted}`}>{point?.label || '未识别到节点'}</p></div>
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

  return <section><h3 className="mb-3 font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">{series.label}时间线</h3><div className={`${panel} p-3`}>
    <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full" role="img" aria-label={`${series.label} 时间趋势`}>
      {ticks.map((tick) => <g key={tick}><line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="currentColor" opacity="0.14" /><text x={padding.left - 10} y={yFor(tick) + 4} textAnchor="end" className="fill-[#767869] text-[10px] dark:fill-[#8e9ab0]">{formatAmount(tick)}</text></g>)}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8b5a1f] dark:text-[#d7a85c]" />
      {points.map((point, index) => <g key={`${point.label}-${index}`}><circle cx={xFor(index)} cy={yFor(point.value)} r="4" className="fill-[#8b5a1f] dark:fill-[#d7a85c]" /><text x={xFor(index)} y={height - 20} textAnchor="middle" className="fill-[#767869] text-[10px] dark:fill-[#8e9ab0]">{point.label.replace(/（.*$/, '')}</text><title>{`${point.label} · ${formatAmount(point.value)}\n${point.note}\n来源：${point.sourceTitle}`}</title></g>)}
    </svg></div>
    <p className={`mt-2 ${muted}`}>{change === null ? '纵轴单位会随所选序列变化。' : `最近节点较上一节点${change >= 0 ? '增加' : '减少'} ${formatAmount(Math.abs(change))}。`}</p>
    <div className="mt-3 grid gap-x-5 gap-y-2 border-t border-[#e5e6e0] pt-3 text-xs dark:border-gray-800 sm:grid-cols-2">{points.map((point, index) => <div key={`${point.label}-${index}`} className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate text-[#62645a] dark:text-gray-400" title={`${point.label} · ${point.note}`}>{point.label}</span><span className="shrink-0 font-medium text-[#15140f] dark:text-gray-100">{formatAmount(point.value)}</span></div>)}</div>
  </div></section>
}

function AmountList({ title, empty, items, showBars = false }) {
  const maxValue = Math.max(...items.map((item) => Math.abs(item.value)), 1)
  return <section><h3 className="font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm leading-6 text-[#717367] dark:text-gray-400">{empty}</p> : <ul className={`mt-3 divide-y divide-[#e5e6e0] ${panel} dark:divide-gray-800`}>{items.map((item, index) => <li key={`${item.label}-${index}`} className="px-3 py-3">
    <div className="flex items-baseline justify-between gap-3"><span className="text-sm font-medium text-[#35362f] dark:text-gray-200">{item.label}</span><span className={item.value < 0 ? 'text-sm font-medium text-rose-700 dark:text-rose-300' : 'text-sm font-medium text-[#15140f] dark:text-gray-100'}>{formatAmount(item.value)}</span></div>
    {showBars ? <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7e8e0] dark:bg-[#25303c]"><div className={item.value < 0 ? 'h-full bg-rose-500' : 'h-full bg-[#8b5a1f] dark:bg-[#d7a85c]'} style={{ width: `${Math.max(4, Math.abs(item.value) / maxValue * 100)}%` }} /></div> : null}
    <p className={`mt-1 ${muted}`}>{item.detail}</p>
  </li>)}</ul>}</section>
}
