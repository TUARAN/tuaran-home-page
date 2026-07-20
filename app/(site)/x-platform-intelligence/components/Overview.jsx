import { confidenceLabel, formatMetricValue, formatPeriod, geographyLabel } from '../presentation.mjs'

const METRIC_LABELS = {
  mau: 'MAU',
  dau: 'DAU',
  'ad-reach': '广告可触达人数（不是 MAU）',
  'monthly-visitors': '月访问者',
  'daily-minutes': '日均使用时长',
  'post-volume': '发布量',
  'registered-members': '注册会员数',
  'device-count': '设备数',
}

const CONFIDENCE_STYLES = {
  high: 'border-emerald-700/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  reference: 'border-sky-700/30 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  disputed: 'border-amber-700/30 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
}

function EvidenceButton({ children, evidenceRef, onOpenEvidence, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => onOpenEvidence(evidenceRef)}
      data-evidence-kind={evidenceRef.kind}
      data-evidence-id={evidenceRef.id}
      className={`text-left underline decoration-[#aeb5a8] underline-offset-4 transition-colors hover:text-[#194d2d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f6f44] dark:hover:text-emerald-300 ${className}`}
    >
      {children}
    </button>
  )
}

export default function Overview({ overview, onOpenEvidence }) {
  const insights = overview.insights.slice(0, 5)

  return (
    <section
      id="overview"
      aria-labelledby="overview-title"
      className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[#e2e4df] pb-5 dark:border-gray-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Evidence snapshot</p>
          <h2 id="overview-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">总览</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">{overview.snapshot?.summary}</p>
        </div>
        <p className="shrink-0 font-mono text-[10px] leading-5 text-[#666d62] dark:text-gray-500">
          {overview.snapshot?.label || '快照未知'}<br />核验于 {overview.snapshot?.verifiedAt || '—'}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {overview.headlineMetrics.map((row) => (
          <article key={row.id} className="flex min-h-44 flex-col border border-[#dfe2dc] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#73796f] dark:text-gray-500">{row.platformName}</p>
                <p className="mt-1 text-xs font-semibold text-[#4d534a] dark:text-gray-400">{METRIC_LABELS[row.metricId] || row.metricId}</p>
              </div>
              <span className={`whitespace-nowrap border px-2 py-1 font-mono text-[9px] ${CONFIDENCE_STYLES[row.confidence] || ''}`}>
                {confidenceLabel(row.confidence)}
              </span>
            </div>
            <EvidenceButton
              evidenceRef={{ kind: 'observation', id: row.id }}
              onOpenEvidence={onOpenEvidence}
              className="mt-5 font-serif text-2xl font-semibold tabular-nums text-[#171a16] dark:text-gray-100"
            >
              {formatMetricValue(row)}
            </EvidenceButton>
            <p className="mt-auto pt-4 font-mono text-[9px] leading-5 text-[#73796f] dark:text-gray-500">
              {geographyLabel(row.geography)} · {formatPeriod(row.periodStart, row.periodEnd)}
            </p>
            {row.editorNote ? <p className="mt-2 text-[11px] leading-5 text-[#62685e] dark:text-gray-500">{row.editorNote}</p> : null}
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#252923] dark:text-gray-200">本期洞见</h3>
          <div className="mt-3 grid gap-2">
            {insights.map((insight) => (
              <EvidenceButton
                key={insight.id}
                evidenceRef={{ kind: 'insight', id: insight.id }}
                onOpenEvidence={onOpenEvidence}
                className="border border-[#dfe2dc] bg-white p-4 no-underline dark:border-gray-800 dark:bg-gray-950"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[#252923] dark:text-gray-200">{insight.title}</span>
                  <span className="font-mono text-[9px] text-[#747b70] dark:text-gray-500">{confidenceLabel(insight.confidence)}</span>
                </span>
                <span className="mt-2 block text-xs leading-6 text-[#5b6157] dark:text-gray-400">{insight.summary}</span>
              </EvidenceButton>
            ))}
            {insights.length === 0 ? <p className="text-sm text-[#72786e] dark:text-gray-500">当前筛选下没有可公开展示的洞见。</p> : null}
          </div>
        </div>

        <aside className="border-l-2 border-[#c9cec5] pl-4 dark:border-gray-700" aria-labelledby="quarter-notes-title">
          <h3 id="quarter-notes-title" className="font-serif text-lg font-semibold text-[#252923] dark:text-gray-200">季度变化与口径</h3>
          <div className="mt-3 grid gap-3">
            {overview.changeNotes.map((item) => (
              <EvidenceButton
                key={item.observationId}
                evidenceRef={{ kind: 'observation', id: item.observationId }}
                onOpenEvidence={onOpenEvidence}
                className="text-xs leading-6 text-[#555c52] dark:text-gray-400"
              >
                {item.note}
              </EvidenceButton>
            ))}
            {overview.changeNotes.length === 0 ? <p className="text-xs leading-6 text-[#6b7168] dark:text-gray-500">当前筛选未出现需要并列的规模冲突。</p> : null}
          </div>
          <p className="mt-5 border-t border-[#e0e3dd] pt-4 text-[11px] leading-5 text-[#70766c] dark:border-gray-800 dark:text-gray-500">
            透明度说明：页面只展示可追溯的观察值；定义冲突保持并列，证据缺口保持为缺口。
          </p>
        </aside>
      </div>
    </section>
  )
}
