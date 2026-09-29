'use client'

import { useMemo, useState } from 'react'
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBuildingFactory2,
  IconChevronDown,
  IconDatabaseSearch,
  IconHierarchy3,
  IconInfoCircle,
  IconSearch,
  IconScale,
} from '@tabler/icons-react'

import SharePageButton from '../components/SharePageButton'
import {
  CHINA_SECTORS,
  CLASSIFICATION_SYSTEMS,
  DEFINITION_CARDS,
  SOURCE_LINKS,
  findChinaSectors,
  getPrimaryActivity,
} from './data'

const PAGE_URL = 'https://2aran.com/industry-classification'
const BANDS = ['全部', '第一产业', '第二产业', '第三产业']
const METRICS = {
  valueAdded: { label: '增加值', unit: '万元', note: '国家统计标准的首选判定指标' },
  revenue: { label: '营业收入', unit: '万元', note: '无法取得增加值时的常用替代指标' },
  people: { label: '从业人数', unit: '人', note: '增加值和收入均不可得时可参考' },
}

function SystemComparison() {
  const [activeId, setActiveId] = useState('china')
  const active = CLASSIFICATION_SYSTEMS.find((system) => system.id === activeId) || CLASSIFICATION_SYSTEMS[0]
  const maxCount = Math.max(...active.levels.map((level) => level.count))

  return (
    <section id="systems" className="scroll-mt-24 border-t border-[#d9d4c9] py-14 dark:border-[#30353d] sm:py-20">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#9a4a3d] dark:text-[#dc8b78]">01 / Standards</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-[#17243b] dark:text-white sm:text-4xl">同一个经济世界，五套行业坐标</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#65645f] dark:text-gray-400">点击切换标准。数字表示每个层级包含的分类项，不应把各层数字相加。</p>
        </div>
        <span className="font-mono text-xs text-[#88847b] dark:text-gray-500">资料核对至 2026-09-29</span>
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-5" role="tablist" aria-label="行业分类标准">
        {CLASSIFICATION_SYSTEMS.map((system) => (
          <button
            key={system.id}
            type="button"
            role="tab"
            aria-selected={activeId === system.id}
            onClick={() => setActiveId(system.id)}
            className={`border px-4 py-3 text-left transition ${activeId === system.id ? 'border-transparent text-white shadow-[3px_3px_0_rgba(20,27,38,.18)]' : 'border-[#d7d2c7] bg-[#fffdf8] text-[#5d5c56] hover:border-[#9c978b] dark:border-[#373c45] dark:bg-[#15191f] dark:text-gray-400'}`}
            style={activeId === system.id ? { backgroundColor: system.color } : undefined}
          >
            <span className="block text-xs font-semibold">{system.shortName}</span>
            <span className={`mt-1 block font-mono text-[9px] ${activeId === system.id ? 'text-white/70' : 'text-[#989389] dark:text-gray-600'}`}>{system.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid border border-[#d7d2c7] bg-[#fffdf8] dark:border-[#363b44] dark:bg-[#14181e] lg:grid-cols-[0.9fr_1.4fr]">
        <div className="border-b border-[#dfdad0] p-6 dark:border-[#343942] lg:border-b-0 lg:border-r sm:p-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: active.color }}>
            <IconHierarchy3 size={16} /> {active.shortName}
          </div>
          <h3 className="mt-4 font-serif text-2xl font-semibold text-[#19263b] dark:text-white">{active.name}</h3>
          <p className="mt-1 text-xs text-[#89847a] dark:text-gray-500">{active.version}</p>
          <dl className="mt-7 space-y-5 text-sm leading-6">
            <div><dt className="font-medium text-[#292f38] dark:text-gray-200">用来做什么</dt><dd className="mt-1 text-[#66655f] dark:text-gray-400">{active.purpose}</dd></div>
            <div><dt className="font-medium text-[#292f38] dark:text-gray-200">怎么划分</dt><dd className="mt-1 text-[#66655f] dark:text-gray-400">{active.principle}</dd></div>
          </dl>
          <a href={active.source} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4" style={{ color: active.color }}>
            {active.sourceLabel}<IconArrowUpRight size={14} />
          </a>
        </div>

        <div className="p-6 sm:p-8">
          <div className="space-y-5">
            {active.levels.map((level, index) => (
              <div key={level.name}>
                <div className="mb-2 flex items-end justify-between gap-4">
                  <div><span className="text-sm font-semibold text-[#252d3a] dark:text-gray-200">{level.name}</span><span className="ml-2 font-mono text-[9px] text-[#99948a]">{level.code}</span></div>
                  <strong className="font-mono text-lg text-[#18253a] dark:text-white">{level.count.toLocaleString('zh-CN')}</strong>
                </div>
                <div className="h-3 overflow-hidden bg-[#ede9df] dark:bg-[#242a32]">
                  <div className="h-full transition-all duration-500" style={{ width: `${Math.max(7, (level.count / maxCount) * 100)}%`, backgroundColor: active.color, opacity: 1 - index * 0.1 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex gap-3 border-l-2 bg-[#f6f2e9] px-4 py-3 text-xs leading-6 text-[#656159] dark:bg-[#10141a] dark:text-gray-400" style={{ borderColor: active.color }}>
            <IconInfoCircle size={17} className="mt-1 shrink-0" />
            <p>{active.note}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChinaExplorer() {
  const [query, setQuery] = useState('')
  const [band, setBand] = useState('全部')
  const [expandedCode, setExpandedCode] = useState('I')
  const results = useMemo(() => findChinaSectors(query, band), [query, band])

  return (
    <section id="china" className="scroll-mt-24 border-t border-[#d9d4c9] py-14 dark:border-[#30353d] sm:py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#9a4a3d] dark:text-[#dc8b78]">02 / China Explorer</p>
      <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#17243b] dark:text-white sm:text-4xl">中国20个行业门类</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#65645f] dark:text-gray-400">搜索业务、产品或场景，先定位可能相关的门类。正式归类仍需继续查到大类、中类、小类及对应注释。</p>
        </div>
        <div className="relative w-full lg:w-80">
          <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8a80]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试：软件、物流、医院、咖啡馆" className="w-full border border-[#cfc9bd] bg-[#fffdf8] py-2.5 pl-10 pr-3 text-sm text-[#252d39] outline-none transition placeholder:text-[#a8a399] focus:border-[#9a4a3d] dark:border-[#3a4049] dark:bg-[#14181e] dark:text-gray-200" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {BANDS.map((item) => (
          <button key={item} type="button" onClick={() => setBand(item)} className={`border px-3 py-1.5 text-xs transition ${band === item ? 'border-[#b64b3d] bg-[#b64b3d] text-white' : 'border-[#d4cec2] text-[#66635d] hover:border-[#a49e92] dark:border-[#3b414a] dark:text-gray-400'}`}>{item}</button>
        ))}
        <span className="ml-auto self-center font-mono text-[10px] text-[#989389]">{results.length} / {CHINA_SECTORS.length}</span>
      </div>

      {results.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {results.map((sector) => {
            const open = expandedCode === sector.code
            return (
              <article key={sector.code} className={`border bg-[#fffdf8] transition dark:bg-[#14181e] ${open ? 'border-[#b64b3d] shadow-[3px_3px_0_#b64b3d]' : 'border-[#d8d3c8] hover:border-[#a7a195] dark:border-[#363b44]'}`}>
                <button type="button" onClick={() => setExpandedCode(open ? '' : sector.code)} className="flex w-full items-start gap-4 p-4 text-left sm:p-5" aria-expanded={open}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#c4beb1] font-serif text-xl font-bold text-[#9a4a3d] dark:border-[#4b515b] dark:text-[#dc8b78]">{sector.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg font-semibold text-[#1d293c] dark:text-gray-100">{sector.name}</span>
                    <span className="mt-1 block text-xs text-[#7a766e] dark:text-gray-500">{sector.bandLabel || sector.band}</span>
                  </span>
                  <IconChevronDown size={18} className={`mt-1 shrink-0 text-[#918c82] transition ${open ? 'rotate-180' : ''}`} />
                </button>
                {open ? (
                  <div className="border-t border-[#e1dcd2] bg-[#f8f4eb] px-4 py-4 dark:border-[#343a43] dark:bg-[#10141a] sm:px-5">
                    <p className="text-sm leading-6 text-[#565752] dark:text-gray-300">{sector.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">{sector.examples.map((example) => <span key={example} className="border border-[#d6cdbc] bg-[#fffaf0] px-2 py-1 text-[10px] text-[#6d6257] dark:border-[#49443b] dark:bg-[#1d1a16] dark:text-[#c9bcae]">{example}</span>)}</div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-5 border border-dashed border-[#cfc9bd] py-12 text-center dark:border-[#3a4049]">
          <IconDatabaseSearch size={28} className="mx-auto text-[#aaa399]" />
          <p className="mt-3 text-sm text-[#716d65] dark:text-gray-400">没有在20个门类的摘要和示例中找到“{query}”</p>
          <button type="button" onClick={() => { setQuery(''); setBand('全部') }} className="mt-3 text-xs text-[#9a4a3d] underline underline-offset-4">清除筛选</button>
        </div>
      )}
    </section>
  )
}

function ActivityClassifier() {
  const [metric, setMetric] = useState('valueAdded')
  const [activities, setActivities] = useState([
    { id: 'a1', name: '软件开发', value: 620 },
    { id: 'a2', name: '硬件销售', value: 260 },
    { id: 'a3', name: '技术咨询', value: 120 },
  ])
  const result = useMemo(() => getPrimaryActivity(activities), [activities])
  const metricMeta = METRICS[metric]

  function updateActivity(id, field, value) {
    setActivities((current) => current.map((activity) => activity.id === id ? { ...activity, [field]: value } : activity))
  }

  return (
    <section id="classifier" className="scroll-mt-24 border-t border-[#d9d4c9] py-14 dark:border-[#30353d] sm:py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#9a4a3d] dark:text-[#dc8b78]">03 / Principal Activity</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-[#17243b] dark:text-white sm:text-4xl">主要活动判定器</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#65645f] dark:text-gray-400">输入同一单位的几项对外经济活动，比较哪一项占比最大。结果用于理解判定逻辑，不会自动匹配四位行业代码。</p>

      <div className="mt-8 grid border border-[#d7d2c7] bg-[#fffdf8] dark:border-[#363b44] dark:bg-[#14181e] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-[#ded9ce] p-5 dark:border-[#343942] lg:border-b-0 lg:border-r sm:p-7">
          <div className="flex flex-wrap gap-2">
            {Object.entries(METRICS).map(([id, item]) => (
              <button key={id} type="button" onClick={() => setMetric(id)} className={`border px-3 py-2 text-xs transition ${metric === id ? 'border-[#315d8a] bg-[#315d8a] text-white' : 'border-[#d5cfc3] text-[#625f58] dark:border-[#3d434c] dark:text-gray-400'}`}>{item.label}</button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#8b867d] dark:text-gray-500">{metricMeta.note}</p>

          <div className="mt-6 space-y-3">
            {activities.map((activity, index) => (
              <div key={activity.id} className="grid grid-cols-[24px_1fr_112px] items-center gap-2">
                <span className="font-mono text-[10px] text-[#9c978d]">{String(index + 1).padStart(2, '0')}</span>
                <input aria-label={`活动 ${index + 1} 名称`} value={activity.name} onChange={(event) => updateActivity(activity.id, 'name', event.target.value)} className="min-w-0 border border-[#d6d0c4] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#315d8a] dark:border-[#3d434c] dark:bg-[#10141a] dark:text-gray-200" />
                <label className="relative"><input aria-label={`${activity.name || `活动 ${index + 1}`}数值`} type="number" min="0" value={activity.value} onChange={(event) => updateActivity(activity.id, 'value', event.target.value)} className="w-full border border-[#d6d0c4] bg-white py-2.5 pl-3 pr-9 text-right font-mono text-sm outline-none focus:border-[#315d8a] dark:border-[#3d434c] dark:bg-[#10141a] dark:text-gray-200" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#aaa49a]">{metricMeta.unit}</span></label>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2 text-xs leading-5 text-[#77736b] dark:text-gray-500"><IconInfoCircle size={15} className="mt-0.5 shrink-0" /><p>正式统计通常还要先确认“单位”是企业法人、产业活动单位还是门店/工厂，并核对行业注释中的包括与不包括事项。</p></div>
        </div>

        <div className="p-5 sm:p-7">
          {result.primary ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#315d8a] dark:text-[#9ab6d1]">判定结果</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#315d8a] text-white"><IconScale size={25} /></span>
                <div><p className="text-xs text-[#7f7a71] dark:text-gray-500">主要活动候选</p><h3 className="mt-1 font-serif text-2xl font-semibold text-[#18263b] dark:text-white">{result.primary.name}</h3></div>
              </div>
              <div className="mt-7 space-y-4">
                {result.ranked.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="mb-1.5 flex justify-between gap-3 text-xs"><span className={index === 0 ? 'font-semibold text-[#315d8a] dark:text-[#9ab6d1]' : 'text-[#65645f] dark:text-gray-400'}>{activity.name}</span><span className="font-mono text-[#625f58] dark:text-gray-400">{(activity.share * 100).toFixed(1)}%</span></div>
                    <div className="h-2 bg-[#ece7dc] dark:bg-[#252b33]"><div className="h-full" style={{ width: `${activity.share * 100}%`, backgroundColor: index === 0 ? '#315d8a' : '#aeb7bd' }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-7 border-l-2 border-[#315d8a] bg-[#f1f4f5] px-4 py-3 text-xs leading-6 text-[#565e65] dark:bg-[#10161b] dark:text-gray-400">“{result.primary.name}”占所填{metricMeta.label}的 {(result.ranked[0].share * 100).toFixed(1)}%，按主要活动原则优先据此查找对应行业代码。</p>
            </>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><IconBuildingFactory2 size={32} className="text-[#aaa49a]" /><p className="mt-3 text-sm text-[#77736b] dark:text-gray-400">填写活动名称和大于0的数值后显示结果</p></div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function IndustryClassificationClient() {
  return (
    <main className="min-h-screen bg-[#f3efe6] text-[#252b33] dark:bg-[#0d1116] dark:text-gray-200">
      <header className="relative overflow-hidden border-b border-[#d7d1c5] dark:border-[#30353d]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_31px,#dfd9ce_32px),linear-gradient(#ebe6db_31px,#dfd9ce_32px)] bg-[size:32px_32px] opacity-40 dark:opacity-[0.06]" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#9a4a3d] dark:text-[#dc8b78]">Industry Classification Atlas · 2026</p>
            <SharePageButton title="行业到底怎么分类？" text="中国20个门类、1382个小类，以及联合国、欧盟、北美和GICS五套标准的交互地图。" url={PAGE_URL} exactUrl shorten={false} />
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="font-serif text-[clamp(2.8rem,7vw,6.2rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#17243b] dark:text-[#f2f5f8]">行业<br /><span className="text-[#b64b3d] dark:text-[#dc806c]">到底怎么分</span></h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#5f605c] dark:text-gray-400 sm:text-lg">中国有20个行业门类，也有1382个行业小类。数字随标准、层级和用途变化。这里把统计口径、国际体系与企业归类方法放到同一张可操作的地图里。</p>
            </div>
            <div className="grid grid-cols-2 border border-[#cfc8bb] bg-[#fffdf8]/90 dark:border-[#3b414a] dark:bg-[#14181e]/90">
              {[['20', '中国门类'], ['1,382', '中国小类'], ['22', '联合国 Section'], ['1,012', '美国六位行业']].map(([value, label], index) => (
                <div key={label} className={`p-5 ${index % 2 === 0 ? 'border-r border-[#ddd7cc] dark:border-[#343a43]' : ''} ${index < 2 ? 'border-b border-[#ddd7cc] dark:border-[#343a43]' : ''}`}><strong className="block font-mono text-2xl text-[#17243b] dark:text-white sm:text-3xl">{value}</strong><span className="mt-1 block text-[11px] text-[#77736b] dark:text-gray-500">{label}</span></div>
              ))}
            </div>
          </div>
          <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#d2ccbf] pt-5 text-xs dark:border-[#333942]" aria-label="页面目录">
            {[['五套标准', '#systems'], ['中国20门类', '#china'], ['主要活动判定', '#classifier'], ['定义与来源', '#definitions']].map(([label, href]) => <a key={href} href={href} className="inline-flex items-center gap-1 text-[#62615b] hover:text-[#b64b3d] dark:text-gray-400 dark:hover:text-[#dc806c]">{label}<IconArrowRight size={13} /></a>)}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SystemComparison />
        <ChinaExplorer />
        <ActivityClassifier />

        <section id="definitions" className="scroll-mt-24 border-t border-[#d9d4c9] py-14 dark:border-[#30353d] sm:py-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#9a4a3d] dark:text-[#dc8b78]">04 / Definitions</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-[#17243b] dark:text-white sm:text-4xl">四个容易混淆的定义</h2>
          <div className="mt-8 grid gap-px border border-[#d8d2c7] bg-[#d8d2c7] dark:border-[#373d46] dark:bg-[#373d46] sm:grid-cols-2 lg:grid-cols-4">
            {DEFINITION_CARDS.map((item, index) => (
              <article key={item.title} className="bg-[#fffdf8] p-5 dark:bg-[#14181e] sm:p-6"><span className="font-mono text-[10px] text-[#a49d91]">0{index + 1}</span><h3 className="mt-5 font-serif text-xl font-semibold text-[#1b283c] dark:text-white">{item.title}</h3><p className="mt-3 text-xs leading-6 text-[#66645e] dark:text-gray-400">{item.text}</p></article>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-[#17243b] dark:text-white">怎么理解“有多少行业”</h3>
              <p className="mt-4 text-sm leading-7 text-[#62635f] dark:text-gray-400">先说标准，再说层级。中国统计口径可以回答“20个门类”或“1382个小类”；资本市场可以回答“GICS有11个Sector、163个Sub-Industry”。这些数字都成立，但用途不同。</p>
              <p className="mt-3 text-sm leading-7 text-[#62635f] dark:text-gray-400">产品、职业、所有制、企业规模是另外几套分类维度。一个人从事程序开发，不代表其所在公司的行业一定是软件业；判断仍要回到统计单位的主要经济活动。</p>
            </div>
            <div className="border border-[#d7d1c5] bg-[#fffdf8] p-5 dark:border-[#373d46] dark:bg-[#14181e] sm:p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#273144] dark:text-gray-200"><IconDatabaseSearch size={17} />原始资料</h3>
              <div className="mt-4 divide-y divide-[#e5dfd5] dark:divide-[#30363f]">
                {SOURCE_LINKS.map(([title, url, org]) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 py-3 text-xs"><span><strong className="block font-medium text-[#3a414c] group-hover:text-[#b64b3d] dark:text-gray-300">{title}</strong><span className="mt-1 block text-[10px] text-[#979187]">{org}</span></span><IconArrowUpRight size={15} className="shrink-0 text-[#aaa399] group-hover:text-[#b64b3d]" /></a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
