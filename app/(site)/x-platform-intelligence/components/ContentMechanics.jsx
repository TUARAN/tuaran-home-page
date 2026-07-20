import { confidenceLabel } from '../presentation.mjs'

const MECHANICS = [
  ['formats', '内容格式'],
  ['discovery-surfaces', '发现入口'],
  ['relationship-propagation', '关系传播'],
  ['content-lifespan', '内容寿命'],
  ['search-value', '搜索价值'],
  ['external-links', '外链行为'],
]

function EvidenceButton({ insight, onOpenEvidence }) {
  return (
    <button
      type="button"
      onClick={() => onOpenEvidence({ kind: 'insight', id: insight.id })}
      data-evidence-kind="insight"
      data-evidence-id={insight.id}
      className="mt-auto w-fit pt-4 text-xs font-semibold text-[#245538] underline decoration-[#aab8ac] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-emerald-300"
    >
      查看依据
    </button>
  )
}

export default function ContentMechanics({ insights, onOpenEvidence }) {
  const records = insights.filter((item) => item.category === 'content' || item.category === 'distribution')
  const byMechanic = new Map(records.map((item) => [item.mechanicId, item]))

  return (
    <section id="content" aria-labelledby="content-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Mechanism before tactics</p>
      <h2 id="content-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">内容与传播机制</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">
        功能事实、历史代码、研究结果和编辑判断分开标注。没有当前量化证据时，保留边界而不补一个统一效果数字。
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MECHANICS.map(([mechanicId, label]) => {
          const insight = byMechanic.get(mechanicId)
          return (
            <article key={mechanicId} className="flex min-h-64 flex-col border border-[#dfe2dc] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-serif text-lg font-semibold text-[#272b25] dark:text-gray-200">{label}</h3>
                {insight ? (
                  <span className="border border-[#cbd1c7] bg-[#f3f5f0] px-2 py-1 font-mono text-[9px] text-[#5e675b] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    {insight.evidenceType}
                  </span>
                ) : null}
              </div>
              {insight ? (
                <>
                  <p className="mt-4 text-sm font-semibold leading-6 text-[#30352e] dark:text-gray-300">{insight.title}</p>
                  <p className="mt-2 text-xs leading-6 text-[#5b6258] dark:text-gray-400">{insight.summary}</p>
                  <p className="mt-3 font-mono text-[9px] text-[#767d72] dark:text-gray-500">
                    {confidenceLabel(insight.confidence)} · 核验 {insight.lastVerifiedAt}
                  </p>
                  <EvidenceButton insight={insight} onOpenEvidence={onOpenEvidence} />
                </>
              ) : (
                <p className="mt-4 text-xs leading-6 text-[#777d73] dark:text-gray-500">当前筛选下没有可追溯结论。</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
