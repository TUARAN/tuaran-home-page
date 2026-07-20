import { confidenceLabel } from '../presentation.mjs'

const VERDICTS = [
  ['fit', '适合 X'],
  ['complement', '适合作为组合渠道'],
  ['avoid-only', '不适合只做 X'],
]

const MONETIZATION_AREAS = [
  ['eligibility', '参与门槛'],
  ['payout-geography', '支付地区'],
  ['subscriptions', '订阅'],
  ['revenue-stability', '分成稳定性'],
  ['external-conversion', '外部转化'],
]

function EvidenceButton({ insight, onOpenEvidence }) {
  return (
    <button
      type="button"
      onClick={() => onOpenEvidence({ kind: 'insight', id: insight.id })}
      data-evidence-kind="insight"
      data-evidence-id={insight.id}
      className="mt-3 w-fit text-xs font-semibold text-[#245538] underline decoration-[#aab8ac] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-emerald-300"
    >
      查看依据
    </button>
  )
}

export default function CreatorPlaybook({ insights, onOpenEvidence }) {
  const verdicts = insights.filter((item) => item.category === 'creator-fit')
  const monetization = insights.filter((item) => item.category === 'monetization')
  const verdictById = new Map(verdicts.map((item) => [item.verdict, item]))
  const monetizationByArea = new Map(monetization.map((item) => [item.playbookArea, item]))

  return (
    <section id="creator" aria-labelledby="creator-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Creator decision guide</p>
      <h2 id="creator-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">创作者经营</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">
        先判断 X 在渠道组合里的职责，再核对变现资格与支付条件。所有建议都可展开查看事实依据和编辑推断边界。
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {VERDICTS.map(([verdict, label]) => {
          const insight = verdictById.get(verdict)
          return (
            <article key={verdict} className="border border-[#dfe2dc] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#687064] dark:text-gray-500">{label}</p>
              {insight ? (
                <>
                  <h3 className="mt-3 font-serif text-lg font-semibold leading-7 text-[#272b25] dark:text-gray-200">{insight.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[#5b6258] dark:text-gray-400">{insight.summary}</p>
                  <p className="mt-3 font-mono text-[9px] text-[#767d72] dark:text-gray-500">{insight.evidenceType} · {confidenceLabel(insight.confidence)}</p>
                  <EvidenceButton insight={insight} onOpenEvidence={onOpenEvidence} />
                </>
              ) : <p className="mt-3 text-xs leading-6 text-[#777d73] dark:text-gray-500">当前筛选下没有这一判断的可追溯证据。</p>}
            </article>
          )
        })}
      </div>

      <div className="mt-6 border-t border-[#dfe2dc] pt-5 dark:border-gray-800">
        <h3 className="font-serif text-xl font-semibold text-[#272b25] dark:text-gray-200">商业化与转化核对表</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {MONETIZATION_AREAS.map(([area, label]) => {
            const insight = monetizationByArea.get(area)
            return (
              <article key={area} className="flex flex-col border-l-2 border-[#b8c5b8] bg-white px-4 py-3 dark:border-emerald-900 dark:bg-gray-950">
                <h4 className="text-xs font-semibold text-[#353b33] dark:text-gray-300">{label}</h4>
                {insight ? (
                  <>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#4b5248] dark:text-gray-400">{insight.title}</p>
                    <p className="mt-2 text-[11px] leading-5 text-[#656c62] dark:text-gray-500">{insight.summary}</p>
                    <p className="mt-3 font-mono text-[9px] text-[#767d72] dark:text-gray-500">{insight.evidenceType} · {confidenceLabel(insight.confidence)}</p>
                    <EvidenceButton insight={insight} onOpenEvidence={onOpenEvidence} />
                  </>
                ) : <p className="mt-2 text-[11px] leading-5 text-[#777d73] dark:text-gray-500">当前筛选无记录。</p>}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
