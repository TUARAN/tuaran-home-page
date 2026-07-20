import { confidenceLabel, formatMetricValue, geographyLabel, segmentLabel } from '../presentation.mjs'

const PROFILE_SECTIONS = [
  { id: 'age', label: '年龄', metricIds: ['age-use-rate', 'age-share'] },
  { id: 'gender', label: '性别', metricIds: ['gender-use-rate', 'gender-share'] },
  { id: 'income', label: '收入', metricIds: ['income-use-rate'] },
  { id: 'education', label: '教育', metricIds: ['education-use-rate'] },
  { id: 'news', label: '新闻使用', metricIds: ['news-use-rate'] },
]

const GAP_LABELS = {
  'occupation-industry': '职业 / 行业',
  'city-tier': '城市层级 / 城乡',
  'political-orientation': '政治倾向',
  'general-use-motivation': '一般使用动机',
}

function rowSegmentLabel(row) {
  const meaningful = [...row.segments].reverse().find((segment) => segment !== 'adults-18-plus')
  return segmentLabel(meaningful || row.segments.at(-1) || 'all')
}

export default function AudienceProfile({ groups, coverageGaps, onOpenEvidence }) {
  return (
    <section id="audience" aria-labelledby="audience-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Geography-bound survey profiles</p>
      <h2 id="audience-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">用户画像</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">画像按地域和方法分组。美国成年人调查只代表美国受访人群；广告受众构成不等于全平台活跃用户构成。</p>

      <div className="mt-5 grid gap-4">
        {PROFILE_SECTIONS.map((section) => {
          const sectionGroups = groups.filter((group) => section.metricIds.includes(group.metricId))
          return (
            <article key={section.id} className="border border-[#dfe2dc] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <h3 className="font-serif text-lg font-semibold text-[#272b25] dark:text-gray-200">{section.label}</h3>
              {sectionGroups.length === 0 ? <p className="mt-3 text-xs leading-6 text-[#777d73] dark:text-gray-500">当前筛选下没有可追溯的{section.label}画像。</p> : null}

              <div className="mt-3 grid gap-5">
                {sectionGroups.map((group) => (
                  <div key={group.key} className="border-t border-[#e5e8e2] pt-4 first:border-t-0 first:pt-0 dark:border-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#383e36] dark:text-gray-300">{geographyLabel(group.geography)} · {group.platformId.toUpperCase()}</p>
                      <span className="font-mono text-[9px] text-[#747b70] dark:text-gray-500">{group.segmentLabel === 'all' ? '全体' : segmentLabel(group.segmentLabel)}</span>
                    </div>

                    <div className="mt-3 grid gap-3">
                      {group.rows.map((row) => (
                        <div key={row.id} className="grid gap-1 sm:grid-cols-[minmax(140px,0.55fr)_minmax(180px,1fr)_auto] sm:items-center sm:gap-3">
                          <span className="text-xs text-[#50574d] dark:text-gray-400">{rowSegmentLabel(row)}</span>
                          <div className="h-2 overflow-hidden bg-[#e6e9e3] dark:bg-gray-800" aria-hidden="true">
                            <span className="block h-full bg-[#3d7550] dark:bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, Number(row.value) || 0))}%` }} />
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenEvidence({ kind: 'observation', id: row.id })}
                            data-evidence-kind="observation"
                            data-evidence-id={row.id}
                            className="w-fit font-mono text-xs font-semibold tabular-nums text-[#1e4f30] underline decoration-[#aab8ac] underline-offset-4 dark:text-emerald-300"
                          >
                            {formatMetricValue(row)}
                          </button>
                          <span className="sm:col-start-2 text-[9px] text-[#7a8076] dark:text-gray-600">{confidenceLabel(row.confidence)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 border-l-2 border-[#c7cec4] pl-3 text-[11px] leading-5 text-[#656c62] dark:border-gray-700 dark:text-gray-500">
                      <p>
                        {group.sources.map((source) => source.sampleSize ? `样本 ${source.sampleSize.toLocaleString('en-US')} 人。` : '').filter(Boolean).join(' ')}
                        {group.methodology}
                      </p>
                      <p className="mt-1">
                        来源：{' '}
                        {group.sources.map((source, index) => (
                          <span key={source.id}>
                            {index > 0 ? '、' : ''}
                            {source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-[#b8beb5] underline-offset-4">{source.title}</a> : source.title}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-5 border-t border-[#e0e3dd] pt-5 dark:border-gray-800">
        <h3 className="font-serif text-lg font-semibold text-[#272b25] dark:text-gray-200">已核验但仍缺失的画像维度</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {coverageGaps.map((gap) => (
            <article key={gap.id} className="border border-dashed border-[#c9cec5] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-semibold text-[#343a32] dark:text-gray-300">{GAP_LABELS[gap.profileDimensionId] || gap.profileDimensionId} · {gap.platformId.toUpperCase()}</p>
              <p className="mt-2 text-xs leading-6 text-[#5d645a] dark:text-gray-400">{gap.reason}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#71776d] dark:text-gray-500">影响：{gap.impact}</p>
              <a href={gap.attemptedSourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] underline decoration-[#b8beb5] underline-offset-4">查看已核验来源</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
