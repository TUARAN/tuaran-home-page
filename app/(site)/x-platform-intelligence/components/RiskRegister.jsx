import { confidenceLabel } from '../presentation.mjs'

const RISK_GROUPS = [
  ['platform-risk', '平台层风险'],
  ['creator-risk', '创作者经营风险'],
]

const SEVERITY = {
  high: { icon: '▲', label: '高风险', className: 'border-rose-700/30 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
  medium: { icon: '◆', label: '中风险', className: 'border-amber-700/30 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
  low: { icon: '●', label: '低风险', className: 'border-sky-700/30 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300' },
}

const STATUS_LABELS = {
  current: '当前状态',
  changed: '状态已变化',
}

function RiskItem({ insight, onOpenEvidence }) {
  const severity = SEVERITY[insight.severity] || SEVERITY.medium
  return (
    <article className="border border-[#dfe2dc] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`border px-2 py-1 font-mono text-[9px] ${severity.className}`}>
          <span aria-hidden="true">{severity.icon} </span>{severity.label}
        </span>
        <span className="border border-[#cbd1c7] px-2 py-1 font-mono text-[9px] text-[#626a5f] dark:border-gray-700 dark:text-gray-400">
          {STATUS_LABELS[insight.status] || insight.status}
        </span>
      </div>
      <h4 className="mt-3 font-serif text-lg font-semibold text-[#272b25] dark:text-gray-200">{insight.title}</h4>
      <p className="mt-2 text-xs leading-6 text-[#5b6258] dark:text-gray-400">{insight.summary}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-[#e4e7e1] pt-3 text-[10px] dark:border-gray-800">
        <div>
          <dt className="text-[#7a8076] dark:text-gray-600">置信度</dt>
          <dd className="mt-1 font-mono text-[#50574d] dark:text-gray-400">{confidenceLabel(insight.confidence)}</dd>
        </div>
        <div>
          <dt className="text-[#7a8076] dark:text-gray-600">证据类型</dt>
          <dd className="mt-1 font-mono text-[#50574d] dark:text-gray-400">{insight.evidenceType}</dd>
        </div>
        <div>
          <dt className="text-[#7a8076] dark:text-gray-600">最后核验</dt>
          <dd className="mt-1 font-mono text-[#50574d] dark:text-gray-400">{insight.lastVerifiedAt}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={() => onOpenEvidence({ kind: 'insight', id: insight.id })}
        data-evidence-kind="insight"
        data-evidence-id={insight.id}
        className="mt-4 text-xs font-semibold text-[#245538] underline decoration-[#aab8ac] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-emerald-300"
      >
        查看风险依据
      </button>
    </article>
  )
}

export default function RiskRegister({ insights, onOpenEvidence }) {
  return (
    <section id="risk" aria-labelledby="risk-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Global risk register</p>
      <h2 id="risk-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">风险与边界</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">
        风险保留全局视角，不随地区、人群或创作者目标筛选缩窄。严重度同时使用图标和文字，颜色只作辅助。
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {RISK_GROUPS.map(([category, label]) => {
          const rows = insights.filter((item) => item.category === category)
          return (
            <div key={category}>
              <h3 className="font-serif text-xl font-semibold text-[#272b25] dark:text-gray-200">{label}</h3>
              <div className="mt-3 grid gap-3">
                {rows.map((insight) => <RiskItem key={insight.id} insight={insight} onOpenEvidence={onOpenEvidence} />)}
                {rows.length === 0 ? <p className="text-xs leading-6 text-[#777d73] dark:text-gray-500">当前快照没有可公开展示的风险记录。</p> : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
