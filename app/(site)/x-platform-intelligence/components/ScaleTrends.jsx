import { confidenceLabel, formatMetricValue, formatPeriod, geographyLabel } from '../presentation.mjs'

const SCALE_LABELS = new Map([
  ['mau', 'MAU'],
  ['dau', 'DAU'],
  ['ad-reach', '广告可触达人数（不是 MAU）'],
  ['monthly-visitors', '月访问者'],
  ['daily-minutes', '日均使用时长'],
  ['post-volume', '发布量'],
])

function EvidenceValue({ row, onOpenEvidence }) {
  return (
    <button
      type="button"
      onClick={() => onOpenEvidence({ kind: 'observation', id: row.id })}
      data-evidence-kind="observation"
      data-evidence-id={row.id}
      className="font-semibold tabular-nums text-[#1e4f30] underline decoration-[#aab8ac] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-emerald-300"
    >
      {formatMetricValue(row)}
    </button>
  )
}

function MiniSeries({ series }) {
  const values = series.rows.map((row) => row.value)
  const max = Math.max(...values, 1)
  const points = series.rows.map((row, index) => {
    const x = series.rows.length === 1 ? 92 : 24 + (index * 136) / (series.rows.length - 1)
    const y = 62 - (row.value / max) * 40
    return `${x},${y}`
  }).join(' ')
  const first = series.rows[0]

  return (
    <div>
      <p className="font-mono text-[9px] text-[#73796f] dark:text-gray-500">
        {first.platformName || first.platformId} · {geographyLabel(first.geography)} · {first.methodology}
      </p>
      <svg viewBox="0 0 184 84" role="img" aria-label={`${first.platformName || first.platformId} 可比较序列趋势：横轴为统计期，纵轴为指标数值`} className="h-24 w-full max-w-xs">
        <title>{`${first.platformName || first.platformId} 可比较序列趋势`}</title>
        <line x1="22" y1="64" x2="166" y2="64" stroke="currentColor" opacity="0.35" />
        <line x1="22" y1="12" x2="22" y2="64" stroke="currentColor" opacity="0.35" />
        <polyline points={points} fill="none" stroke="#2f6f44" strokeWidth="2" />
        {points.split(' ').map((point, index) => {
          const [cx, cy] = point.split(',')
          return <circle key={series.rows[index].id} cx={cx} cy={cy} r="3" fill="#2f6f44" />
        })}
        <text x="91" y="80" textAnchor="middle" fontSize="8" fill="currentColor">统计期</text>
        <text x="8" y="40" textAnchor="middle" fontSize="8" fill="currentColor" transform="rotate(-90 8 40)">指标数值</text>
      </svg>
    </div>
  )
}

function ObservationCards({ rows, onOpenEvidence }) {
  if (rows.length === 0) return null
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.id} className="border-l-2 border-[#bbc7bb] pl-3">
          <EvidenceValue row={row} onOpenEvidence={onOpenEvidence} />
          <p className="mt-1 font-mono text-[9px] leading-5 text-[#73796f] dark:text-gray-500">{geographyLabel(row.geography)} · {formatPeriod(row.periodStart, row.periodEnd)} · {confidenceLabel(row.confidence)}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#62685e] dark:text-gray-500">{row.editorNote || row.methodology}</p>
        </div>
      ))}
    </div>
  )
}

function ConflictTable({ conflictGroup, label, platformName, onOpenEvidence }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <caption className="sr-only">{platformName} {label} 的 {conflictGroup.id} 来源逐行口径冲突表</caption>
        <thead>
          <tr className="border-b border-[#d8dcd5] text-[#666d62] dark:border-gray-800 dark:text-gray-500">
            <th scope="col" className="px-2 py-2 font-medium">平台</th>
            <th scope="col" className="px-2 py-2 font-medium">来源</th>
            <th scope="col" className="px-2 py-2 font-medium">数值</th>
            <th scope="col" className="px-2 py-2 font-medium">范围与周期</th>
            <th scope="col" className="px-2 py-2 font-medium">置信</th>
            <th scope="col" className="px-2 py-2 font-medium">定义</th>
          </tr>
        </thead>
        <tbody>
          {conflictGroup.rows.map((row) => (
            <tr key={row.id} className="border-b border-[#eceee9] align-top last:border-0 dark:border-gray-900">
              <th scope="row" className="px-2 py-3 font-semibold text-[#3f463d] dark:text-gray-300">{platformName}</th>
              <td className="px-2 py-3 font-mono text-[10px] text-[#555c52] dark:text-gray-400">{row.sourceId}</td>
              <td className="px-2 py-3"><EvidenceValue row={row} onOpenEvidence={onOpenEvidence} /></td>
              <td className="px-2 py-3 text-[#5b6258] dark:text-gray-400">{geographyLabel(row.geography)}<br />{formatPeriod(row.periodStart, row.periodEnd)}</td>
              <td className="px-2 py-3 text-[#5b6258] dark:text-gray-400">{confidenceLabel(row.confidence)}</td>
              <td className="max-w-sm px-2 py-3 leading-5 text-[#5b6258] dark:text-gray-400">{row.editorNote || row.methodology}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ScaleTrends({ scale, onOpenEvidence }) {
  const groups = [...scale.groups]
    .filter((group) => SCALE_LABELS.has(group.metricId))
    .sort((left, right) => (
      [...SCALE_LABELS.keys()].indexOf(left.metricId) - [...SCALE_LABELS.keys()].indexOf(right.metricId)
      || left.platformName.localeCompare(right.platformName)
    ))

  return (
    <section id="scale" aria-labelledby="scale-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Definition-aware scale</p>
      <h2 id="scale-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">活跃规模与趋势</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">每个平台独立呈现；只在平台、指标、地域和方法一致时连接不同时期。冲突仅限同一平台的同一冲突组。</p>

      <div className="mt-5 grid min-w-0 gap-4 [&>*]:min-w-0">
        {groups.map((group) => {
          const definitionCount = new Set(group.rows.map((row) => [row.unit, row.geography, row.comparability, row.methodology].join('\u0000'))).size
          const incompatible = group.conflict || definitionCount > 1
          const series = scale.comparableSeries.filter((item) => item.rows[0]?.platformId === group.platformId && item.rows[0]?.metricId === group.metricId)
          const label = SCALE_LABELS.get(group.metricId)

          return (
            <article key={`${group.platformId}:${group.metricId}`} className="min-w-0 border border-[#dfe2dc] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#73796f] dark:text-gray-500">{group.platformName}</p>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-[#272b25] dark:text-gray-200">{label}</h3>
                </div>
                {incompatible ? <span className="border border-amber-700/30 bg-amber-50 px-2 py-1 font-mono text-[9px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">不可直接比较</span> : null}
              </div>

              {group.conflictGroups.map((conflictGroup) => (
                <ConflictTable key={conflictGroup.id} conflictGroup={conflictGroup} label={label} platformName={group.platformName} onOpenEvidence={onOpenEvidence} />
              ))}

              {group.ordinaryRows.length > 0 ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)]">
                  <ObservationCards rows={group.ordinaryRows} onOpenEvidence={onOpenEvidence} />
                  <div className="grid content-start gap-2 text-[#525a50] dark:text-gray-400">
                    {series.map((item) => <MiniSeries key={item.key} series={item} />)}
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
        {groups.length === 0 ? <p className="text-xs leading-6 text-[#777d73] dark:text-gray-500">当前筛选下无可追溯规模观察值。</p> : null}
      </div>
    </section>
  )
}
