'use client'

import { useMemo, useState } from 'react'
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconFilter,
  IconInfoCircle,
  IconSearch,
  IconScale,
  IconX,
} from '@tabler/icons-react'

import SharePageButton from '../components/SharePageButton'
import {
  CATEGORY_META,
  MECHANISMS,
  SCORE_META,
  TAKEAWAYS,
  TIMELINE,
  TYPE_META,
} from './data'

const PAGE_URL = 'https://2aran.com/global-ai-governance'
const MAX_COMPARE = 4

function ScoreDots({ value, color = '#315d8a', compact = false }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={compact ? 'h-1.5 w-1.5 rounded-full' : 'h-2 w-2 rounded-full'}
          style={{ backgroundColor: n <= value ? color : '#d7d5cc' }}
        />
      ))}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span className="rounded-full border border-[#d7d3c7] bg-[#f7f5ef] px-2 py-0.5 text-[10px] text-[#5c5b55] dark:border-[#41454d] dark:bg-[#1c2027] dark:text-gray-400">
      {TYPE_META[type]}
    </span>
  )
}

function MechanismCard({ item, open, selected, onToggle, onCompare }) {
  const category = CATEGORY_META[item.category]

  return (
    <article
      id={item.id}
      className={`group border bg-[#fffdf8] transition dark:bg-[#14181e] ${
        selected
          ? 'border-[#c85a42] shadow-[4px_4px_0_#c85a42] dark:border-[#d77a64] dark:shadow-[4px_4px_0_#7e3f31]'
          : 'border-[#d8d4c8] hover:border-[#9d9a90] dark:border-[#353a43] dark:hover:border-[#646b77]'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: category.color }}
              >
                {category.label}
              </span>
              <TypeBadge type={item.type} />
            </div>
            <h3 className="mt-2 font-serif text-[20px] font-semibold leading-tight text-[#17243b] dark:text-[#edf1f6]">
              {item.name}
            </h3>
            <p className="mt-1 text-[13px] font-medium leading-5 text-[#363b45] dark:text-gray-300">
              {item.zh}
            </p>
          </div>
          <span className="shrink-0 border-l border-[#dedacf] pl-3 text-right font-mono text-[11px] text-[#7b766b] dark:border-[#3b4048] dark:text-gray-500">
            {item.year}
            <br />
            <span className="text-[9px] uppercase tracking-[0.14em]">{item.maturity}</span>
          </span>
        </div>

        <p className="mt-4 text-[13px] leading-6 text-[#55564f] dark:text-gray-400">{item.mandate}</p>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[#e5e1d7] py-3 dark:border-[#30353e]">
          {SCORE_META.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#77766e] dark:text-gray-500">{metric.label}</span>
              <ScoreDots value={item.scores[metric.id]} color={category.color} compact />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggle(item.id)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3b526f] underline decoration-[#aab8c8] underline-offset-4 hover:text-[#c6533b] dark:text-[#b4c5d8]"
          >
            {open ? '收起档案' : '展开完整档案'}
            {open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => onCompare(item.id)}
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium transition ${
              selected
                ? 'border-[#c85a42] bg-[#c85a42] text-white'
                : 'border-[#b9b5aa] text-[#55564f] hover:border-[#315d8a] hover:text-[#315d8a] dark:border-[#505660] dark:text-gray-400'
            }`}
          >
            {selected ? <IconCheck size={13} /> : <IconScale size={13} />}
            {selected ? '已加入' : '加入对比'}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[#d8d4c8] bg-[#f6f2e9] px-4 py-5 dark:border-[#353a43] dark:bg-[#10141a] sm:px-5">
          <dl className="grid gap-4 text-[12px] leading-5 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8a654e] dark:text-[#c59b80]">组织底座</dt>
              <dd className="mt-1 text-[#4a4b46] dark:text-gray-300">{item.base}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8a654e] dark:text-[#c59b80]">牵头与参与</dt>
              <dd className="mt-1 text-[#4a4b46] dark:text-gray-300">{item.lead}。{item.members}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8a654e] dark:text-[#c59b80]">为什么重要</dt>
              <dd className="mt-1 text-[#4a4b46] dark:text-gray-300">{item.why}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8a654e] dark:text-[#c59b80]">现实边界</dt>
              <dd className="mt-1 text-[#4a4b46] dark:text-gray-300">{item.limits}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.outputs.map((output) => (
              <span key={output} className="border border-[#d3c9b9] bg-[#fffaf0] px-2 py-1 text-[10px] text-[#675f55] dark:border-[#49443b] dark:bg-[#1a1815] dark:text-[#c8bfb2]">
                {output}
              </span>
            ))}
          </div>

          {item.correction ? (
            <div className="mt-4 flex gap-2 border-l-2 border-[#c85a42] bg-[#fff9f1] px-3 py-2.5 text-[11px] leading-5 text-[#68473f] dark:bg-[#231a17] dark:text-[#d9aea4]">
              <IconInfoCircle size={15} className="mt-0.5 shrink-0" />
              <span>{item.correction}</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            <a href={item.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#315d8a] hover:text-[#c85a42] dark:text-[#9bb7d2]">
              {item.source.label}<IconArrowUpRight size={13} />
            </a>
            {item.source2 ? (
              <a href={item.source2.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#315d8a] hover:text-[#c85a42] dark:text-[#9bb7d2]">
                {item.source2.label}<IconArrowUpRight size={13} />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}

function CompareTable({ items, onRemove, onClear }) {
  if (!items.length) return null

  const rows = [
    ['机制类型', (item) => TYPE_META[item.type]],
    ['制度底座', (item) => item.base],
    ['覆盖范围', (item) => item.scope],
    ['当前状态', (item) => item.status],
    ...SCORE_META.map((metric) => [metric.label, (item) => <ScoreDots value={item.scores[metric.id]} color={CATEGORY_META[item.category].color} />]),
    ['核心产出', (item) => item.outputs.join(' · ')],
    ['主要边界', (item) => item.limits],
  ]

  return (
    <section className="mt-12 border-t-4 border-[#17243b] pt-6 dark:border-[#dfe7f1]" id="compare">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c6533b]">Side-by-side</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#17243b] dark:text-gray-100">横向对比台</h2>
          <p className="mt-2 text-xs text-[#66665f] dark:text-gray-400">最多选择 {MAX_COMPARE} 个机制。分值为编辑性判断，用于观察相对位置，不是官方评级。</p>
        </div>
        <button type="button" onClick={onClear} className="text-[11px] text-[#77766e] underline underline-offset-4 hover:text-[#c6533b] dark:text-gray-500">清空</button>
      </div>

      <div className="mt-5 overflow-x-auto border border-[#d8d4c8] dark:border-[#353a43]">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
          <thead>
            <tr className="bg-[#17243b] text-white dark:bg-[#e4e9ef] dark:text-[#151b24]">
              <th className="w-28 p-3 font-mono text-[9px] uppercase tracking-[0.14em]">维度</th>
              {items.map((item) => (
                <th key={item.id} className="border-l border-white/20 p-3 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-[16px] font-semibold">{item.name}</p>
                      <p className="mt-1 text-[10px] font-normal opacity-75">{item.zh}</p>
                    </div>
                    <button type="button" onClick={() => onRemove(item.id)} aria-label={`移除 ${item.name}`} className="opacity-60 hover:opacity-100"><IconX size={14} /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, render], index) => (
              <tr key={label} className={index % 2 ? 'bg-[#f6f3eb] dark:bg-[#181d24]' : 'bg-[#fffdf8] dark:bg-[#11151b]'}>
                <th className="border-t border-[#dedacf] p-3 text-[10px] font-medium text-[#77766e] dark:border-[#343943] dark:text-gray-500">{label}</th>
                {items.map((item) => (
                  <td key={item.id} className="border-l border-t border-[#dedacf] p-3 align-top text-[11px] leading-5 text-[#474944] dark:border-[#343943] dark:text-gray-300">{render(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function GlobalAiGovernanceClient() {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('category')
  const [openIds, setOpenIds] = useState(['waico'])
  const [compareIds, setCompareIds] = useState([])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const categoryOrder = { west: 1, un: 2, south: 3, regional: 4 }
    const result = MECHANISMS.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (!needle) return true
      return `${item.name} ${item.zh} ${item.mandate} ${item.lead} ${item.outputs.join(' ')}`.toLowerCase().includes(needle)
    })
    return [...result].sort((a, b) => {
      if (sort === 'year') return b.year - a.year
      if (sort === 'authority') return b.scores.authority - a.scores.authority
      if (sort === 'execution') return b.scores.execution - a.scores.execution
      return categoryOrder[a.category] - categoryOrder[b.category] || a.year - b.year
    })
  }, [category, query, sort])

  const compareItems = compareIds.map((id) => MECHANISMS.find((item) => item.id === id)).filter(Boolean)

  function toggleOpen(id) {
    setOpenIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  function toggleCompare(id) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id)
      if (current.length >= MAX_COMPARE) return current
      return [...current, id]
    })
  }

  return (
    <main className="bg-[#f2efe7] text-[#292b2f] dark:bg-[#0d1117] dark:text-gray-200">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12">
        <header className="relative overflow-hidden border border-[#cfcabe] bg-[#fffdf8] p-5 dark:border-[#343943] dark:bg-[#12171e] sm:p-8">
          <div aria-hidden="true" className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-[#ded9cd] bg-[linear-gradient(90deg,transparent_23px,#e8e3d8_24px),linear-gradient(#f1ede4_23px,#ded9cd_24px)] bg-[size:24px_24px] opacity-45 dark:border-[#303640] dark:opacity-10 lg:block" />
          <div className="relative max-w-[770px]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-[#c6533b] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white">Global AI Governance Atlas</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#74736d] dark:text-gray-500">核验至 2026.07.17</span>
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-[#17243b] dark:text-[#eef2f7] sm:text-[50px]">
              全球 AI 治理平台<br className="hidden sm:block" />与机制全景图
            </h1>
            <p className="mt-5 max-w-2xl text-[14px] leading-7 text-[#55564f] dark:text-gray-400 sm:text-[15px]">
              不是一份“组织名单”，而是一张制度地图：谁在定义原则，谁在制定标准，谁掌握项目与资金，谁为全球南方争取能力与代表性。
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#atlas" className="inline-flex items-center gap-2 bg-[#17243b] px-4 py-2 text-xs font-medium text-white hover:bg-[#c6533b] dark:bg-[#e4e9ef] dark:text-[#17243b]">进入机制图谱 <IconChevronDown size={14} /></a>
              <SharePageButton title="全球 AI 治理平台与机制全景图" text="14 个国际 AI 组织、进程、战略与研究网络的多维对比。" url={PAGE_URL} size="md" />
            </div>
          </div>
        </header>

        <section className="mt-5 grid border border-[#cfcabe] bg-[#fffdf8] dark:border-[#343943] dark:bg-[#12171e] sm:grid-cols-4">
          {Object.entries(CATEGORY_META).map(([id, meta], index) => {
            const count = MECHANISMS.filter((item) => item.category === id).length
            return (
              <button key={id} type="button" onClick={() => setCategory(category === id ? 'all' : id)} className={`p-4 text-left transition hover:bg-[#f5f1e8] dark:hover:bg-[#181e26] ${index ? 'border-t border-[#ded9cd] dark:border-[#303640] sm:border-l sm:border-t-0' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[22px] font-semibold" style={{ color: meta.color }}>{String(count).padStart(2, '0')}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                </div>
                <p className="mt-2 font-serif text-[15px] font-semibold text-[#28344a] dark:text-gray-200">{meta.label}</p>
                <p className="mt-1 text-[10px] text-[#77766e] dark:text-gray-500">{meta.short}</p>
              </button>
            )
          })}
        </section>

        <section className="mt-12" aria-labelledby="reading-title">
          <div className="flex items-baseline gap-3 border-b-2 border-[#17243b] pb-3 dark:border-[#dfe7f1]">
            <span className="font-mono text-[10px] text-[#c6533b]">00</span>
            <h2 id="reading-title" className="font-serif text-2xl font-semibold text-[#17243b] dark:text-gray-100">先读三条结论</h2>
          </div>
          <div className="grid gap-px bg-[#d3cec2] dark:bg-[#343943] md:grid-cols-3">
            {TAKEAWAYS.map((item) => (
              <article key={item.no} className="bg-[#fffdf8] p-5 dark:bg-[#12171e]">
                <span className="font-mono text-[10px] text-[#c6533b]">{item.no}</span>
                <h3 className="mt-4 font-serif text-[18px] font-semibold leading-7 text-[#22304a] dark:text-gray-200">{item.title}</h3>
                <p className="mt-3 text-[12px] leading-6 text-[#62635d] dark:text-gray-400">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="atlas" className="mt-12 scroll-mt-24">
          <div className="flex flex-col gap-4 border-b-2 border-[#17243b] pb-4 dark:border-[#dfe7f1] lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c6533b]">01 · Institutional Atlas</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#17243b] dark:text-gray-100">机制档案库</h2>
              <p className="mt-2 text-xs text-[#6b6b65] dark:text-gray-500">常设组织、政治进程、战略文件与研究网络分开标注；点击卡片展开背景、产出与边界。</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 border border-[#bdb9ae] bg-[#fffdf8] px-3 dark:border-[#454b56] dark:bg-[#11161d]">
                <IconSearch size={14} className="text-[#77766e]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索组织、议题、产出" className="w-full bg-transparent text-[11px] text-[#333] outline-none placeholder:text-[#99968d] dark:text-gray-200 sm:w-48" />
                {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><IconX size={13} /></button> : null}
              </label>
              <label className="flex h-9 items-center gap-2 border border-[#bdb9ae] bg-[#fffdf8] px-3 dark:border-[#454b56] dark:bg-[#11161d]">
                <IconFilter size={14} className="text-[#77766e]" />
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-[11px] text-[#55564f] outline-none dark:text-gray-300">
                  <option value="category">按阵营 / 类型</option>
                  <option value="year">按成立时间</option>
                  <option value="authority">按制度权威</option>
                  <option value="execution">按执行抓手</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setCategory('all')} className={`border px-3 py-1.5 text-[10px] ${category === 'all' ? 'border-[#17243b] bg-[#17243b] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#17243b]' : 'border-[#c8c3b7] bg-[#fffdf8] text-[#66665f] dark:border-[#3d434d] dark:bg-[#12171e] dark:text-gray-400'}`}>全部 · {MECHANISMS.length}</button>
            {Object.entries(CATEGORY_META).map(([id, meta]) => (
              <button key={id} type="button" onClick={() => setCategory(id)} className={`border px-3 py-1.5 text-[10px] transition ${category === id ? 'text-white' : 'border-[#c8c3b7] bg-[#fffdf8] text-[#66665f] dark:border-[#3d434d] dark:bg-[#12171e] dark:text-gray-400'}`} style={category === id ? { backgroundColor: meta.color, borderColor: meta.color } : undefined}>{meta.label}</button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <MechanismCard key={item.id} item={item} open={openIds.includes(item.id)} selected={compareIds.includes(item.id)} onToggle={toggleOpen} onCompare={toggleCompare} />
            ))}
          </div>
          {!visible.length ? <div className="border border-dashed border-[#bdb9ae] p-10 text-center text-sm text-[#77766e] dark:border-[#454b56] dark:text-gray-500">没有匹配的机制。试试“标准”“安全”或“能力建设”。</div> : null}
        </section>

        {compareIds.length ? (
          <div className="sticky bottom-4 z-20 mx-auto mt-5 flex max-w-xl items-center justify-between gap-4 border border-[#17243b] bg-[#fffdf8] px-4 py-3 shadow-[5px_5px_0_#17243b] dark:border-gray-200 dark:bg-[#171c23] dark:shadow-[5px_5px_0_#dfe7f1]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#17243b] dark:text-gray-100">已选 {compareIds.length} / {MAX_COMPARE}</p>
              <p className="truncate text-[9px] text-[#77766e] dark:text-gray-500">{compareItems.map((item) => item.name).join(' · ')}</p>
            </div>
            <a href="#compare" className="shrink-0 bg-[#c6533b] px-3 py-1.5 text-[10px] font-medium text-white">查看横向对比</a>
          </div>
        ) : null}

        <CompareTable items={compareItems} onRemove={toggleCompare} onClear={() => setCompareIds([])} />

        <section className="mt-12 border-t-2 border-[#17243b] pt-6 dark:border-[#dfe7f1]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_2.2fr]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c6533b]">02 · Evolution</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#17243b] dark:text-gray-100">制度演进时间轴</h2>
              <p className="mt-3 text-xs leading-6 text-[#66665f] dark:text-gray-500">早期重“原则与倡议”，生成式 AI 之后重心迅速转向前沿安全、报告机制、标准互操作和全球南方能力。</p>
            </div>
            <ol className="grid gap-px bg-[#d3cec2] dark:bg-[#343943] sm:grid-cols-2 lg:grid-cols-4">
              {TIMELINE.map((item, index) => (
                <li key={`${item.year}-${index}`} className="min-h-28 bg-[#fffdf8] p-4 dark:bg-[#12171e]">
                  <span className="font-mono text-[19px] font-semibold text-[#315d8a] dark:text-[#9bb7d2]">{item.year}</span>
                  <p className="mt-3 text-[11px] leading-5 text-[#55564f] dark:text-gray-400">{item.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-12 grid gap-5 border border-[#cfcabe] bg-[#fffdf8] p-5 dark:border-[#343943] dark:bg-[#12171e] lg:grid-cols-[1fr_1.35fr] sm:p-7">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c6533b]">03 · How to read</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#17243b] dark:text-gray-100">不要只问“它是不是官方组织”</h2>
            <p className="mt-4 text-[13px] leading-7 text-[#5d5e58] dark:text-gray-400">判断一个机制的真实影响力，要顺着四个问题往下走：谁授权、谁出钱、产出通过什么接口落地、谁能持续追踪。一次峰会可能比常设秘书处更有政治声量，一套自愿标准也可能通过采购和供应链变成事实约束。</p>
          </div>
          <div className="grid gap-px bg-[#d8d4c8] dark:bg-[#343943] sm:grid-cols-2">
            {SCORE_META.map((metric, index) => (
              <div key={metric.id} className="bg-[#f7f4ec] p-4 dark:bg-[#181d24]">
                <span className="font-mono text-[10px] text-[#c6533b]">0{index + 1}</span>
                <p className="mt-2 text-[13px] font-semibold text-[#2f3c54] dark:text-gray-200">{metric.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#73736c] dark:text-gray-500">{metric.note}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-[#c9c4b8] pt-5 text-[10px] leading-5 text-[#77766e] dark:border-[#343943] dark:text-gray-500">
          <p>编辑说明：本页将“组织、平台、政策进程、战略文件、工作组、研究中心”统一纳入观察，但不混同其法律性质。1—5 分为相对、编辑性评分；成员与状态以链接中的官方来源为准。</p>
          <p className="mt-2">更新日期：2026-07-17 · WAICO 等新机制仍处快速变化期，页面将随章程、成员名录和项目机制公开继续修订。</p>
        </footer>
      </div>
    </main>
  )
}
