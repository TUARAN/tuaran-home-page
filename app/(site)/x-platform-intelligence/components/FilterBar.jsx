import { DEFAULT_FILTERS } from '../filters.mjs'
import { geographyLabel, segmentLabel } from '../presentation.mjs'

const GOAL_LABELS = {
  'technology-creator': '中文科技创作者',
  news: '新闻与时事',
  community: '社区经营',
  consumer: '消费触达',
  'broad-reach': '广泛触达',
  'visual-creator': '视觉创作',
  'video-creator': '视频创作',
  research: '研究与洞察',
  professional: '职业关系',
  b2b: 'B2B',
  'public-conversation': '公共讨论',
  knowledge: '知识内容',
  search: '搜索价值',
  lifestyle: '生活方式',
  commerce: '商业转化',
  'owned-audience': '自有受众',
  china: '中国受众',
}

const CONFIDENCE_OPTIONS = [
  ['high', '高可信'],
  ['reference', '参考'],
  ['disputed', '有争议'],
]

export default function FilterBar({ repository, filters, onChange }) {
  const geographies = ['global', ...new Set(repository.observations.map((item) => item.geography).filter((id) => id !== 'global'))]
  const segments = ['all', ...new Set(repository.observations.flatMap((item) => item.segments).filter((id) => id !== 'all'))]
  const goals = [DEFAULT_FILTERS.goal, ...new Set(repository.insights.flatMap((item) => item.audienceGoal).filter((id) => id !== DEFAULT_FILTERS.goal))]

  function setValue(key, value) {
    onChange({ ...filters, [key]: value })
  }

  function toggleValue(key, value) {
    const selected = filters[key].includes(value)
    setValue(key, selected ? filters[key].filter((item) => item !== value) : [...filters[key], value])
  }

  return (
    <section aria-labelledby="filter-bar-title" className="mt-6 border border-[#d9dcd7] bg-[#f5f7f1] p-4 dark:border-gray-800 dark:bg-gray-950/60 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="filter-bar-title" className="font-serif text-lg font-semibold text-[#20231e] dark:text-gray-200">筛选情报</h2>
          <p className="mt-1 text-[11px] leading-5 text-[#666c61] dark:text-gray-500">
            风险不响应地区、人群和目标；矩阵不响应地区、人群、目标和可信度；账本响应全部全局筛选，本地检索不影响导出
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="border border-[#b7bdb0] bg-white px-3 py-1.5 text-xs font-medium text-[#444a40] transition hover:border-[#656c60] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          清除筛选
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectControl label="数据快照" value={filters.snapshotId} onChange={(value) => setValue('snapshotId', value)}>
          {repository.snapshots.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </SelectControl>
        <SelectControl label="地区" value={filters.geography} onChange={(value) => setValue('geography', value)}>
          {geographies.map((id) => <option key={id} value={id}>{geographyLabel(id)}</option>)}
        </SelectControl>
        <SelectControl label="人群" value={filters.segment} onChange={(value) => setValue('segment', value)}>
          {segments.map((id) => <option key={id} value={id}>{segmentLabel(id)}</option>)}
        </SelectControl>
        <SelectControl label="目标" value={filters.goal} onChange={(value) => setValue('goal', value)}>
          {goals.map((id) => <option key={id} value={id}>{GOAL_LABELS[id] || id}</option>)}
        </SelectControl>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <CheckboxGroup label="对比平台" selectedCount={filters.platformIds.length}>
          {repository.platforms.map((platform) => (
            <CheckboxOption key={platform.id} label={platform.name} checked={filters.platformIds.includes(platform.id)} onChange={() => toggleValue('platformIds', platform.id)} />
          ))}
        </CheckboxGroup>
        <CheckboxGroup label="可信度" selectedCount={filters.confidences.length}>
          {CONFIDENCE_OPTIONS.map(([id, label]) => (
            <CheckboxOption key={id} label={label} checked={filters.confidences.includes(id)} onChange={() => toggleValue('confidences', id)} />
          ))}
        </CheckboxGroup>
      </div>
    </section>
  )
}

function SelectControl({ label, value, onChange, children }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-medium text-[#555b51] dark:text-gray-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 w-full border border-[#bcc2b6] bg-white px-3 text-sm text-[#272b25] outline-none focus:border-[#5c6c58] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      >
        {children}
      </select>
    </label>
  )
}

function CheckboxGroup({ label, selectedCount, children }) {
  return (
    <details className="border border-[#c9cec4] bg-white dark:border-gray-800 dark:bg-gray-900">
      <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[#4c5248] dark:text-gray-300">
        {label} · 已选 {selectedCount}
      </summary>
      <fieldset className="border-t border-[#e0e3dc] dark:border-gray-800">
        <legend className="sr-only">{label}</legend>
        <div className="grid max-h-52 gap-2 overflow-auto p-3 sm:grid-cols-2">
          {children}
        </div>
      </fieldset>
    </details>
  )
}

function CheckboxOption({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-[#50564c] dark:text-gray-400">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#3f5540]" />
      <span>{label}</span>
    </label>
  )
}
