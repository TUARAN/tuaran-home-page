'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconBolt,
  IconChevronDown,
  IconCircleCheck,
  IconExternalLink,
  IconFilter,
  IconInfoCircle,
  IconRadar,
  IconReceipt2,
  IconRoute,
  IconShieldCheck,
  IconSortDescending,
} from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import { BUYING_CHECKLIST, CHECKED_AT, PROVIDERS, STATUS_META } from './data'
import styles from './network-access-guide.module.css'

const PAGE_URL = 'https://2aran.com/network-access-guide'

const SORTS = [
  { id: 'confidence', label: '按可核验度' },
  { id: 'transparency', label: '按透明度' },
  { id: 'price', label: '按入门价格' },
]

const STATUS_CLASS = {
  offline: 'border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  unclear: 'border-slate-400/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
  verify: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  watch: 'border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

function ScoreBar({ value, tone = 'cyan', label }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[#65706c] dark:text-[#93a09c]">
        <span>{label}</span>
        <span className="font-mono font-bold text-[#18211e] dark:text-white">{value}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#dfe3dc] dark:bg-white/10">
        <div className={styles[`bar_${tone}`]} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function ProviderCard({ provider, index }) {
  return (
    <article className={`${styles.providerCard} ${styles[`tone_${provider.tone}`]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={styles.providerMark} aria-hidden="true">{provider.mark}</span>
          <div>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#78827d] dark:text-[#84918e]">
              0{index + 1} · {provider.latin}
            </p>
            <h3 className="m-0 mt-1 text-xl font-black tracking-tight text-[#121a17] dark:text-white">{provider.name}</h3>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[provider.status]}`}>
          {provider.statusLabel}
        </span>
      </div>

      <p className="mt-5 min-h-[72px] text-sm leading-7 text-[#4f5b56] dark:text-[#aab5b1]">{provider.highlight}</p>

      <div className="my-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#dfe2db] bg-[#dfe2db] dark:border-white/10 dark:bg-white/10">
        {[
          ['入门价格', provider.priceLabel],
          ['公开流量', provider.traffic],
          ['协议', provider.protocol],
          ['建议', provider.verdict],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#f7f8f4] p-3 dark:bg-[#111916]">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-[#89908c]">{label}</p>
            <p className="m-0 mt-1 text-xs font-bold leading-5 text-[#25302c] dark:text-[#e5ece9]">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <ScoreBar value={provider.confidence} tone={provider.tone} label="信息可核验度" />
        <ScoreBar value={provider.transparency} tone={provider.tone} label="公开透明度" />
      </div>

      <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-6 text-[#69542e] dark:text-[#d9c38f]">
        <div className="flex gap-2">
          <IconAlertTriangle className="mt-1 shrink-0" size={15} aria-hidden="true" />
          <span>{provider.caution}</span>
        </div>
      </div>

      <details className="group mt-4 border-t border-[#dfe2db] pt-4 dark:border-white/10">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-[#315e56] dark:text-[#8dd6c8]">
          查看 {provider.sources.length} 条来源与更多参数
          <IconChevronDown className="transition group-open:rotate-180" size={16} aria-hidden="true" />
        </summary>
        <div className="mt-4 space-y-3 text-xs leading-6">
          <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-2 text-[#5c6762] dark:text-[#a5b0ac]">
            <dt>公开带宽</dt><dd>{provider.bandwidth}</dd>
            <dt>节点地区</dt><dd>{provider.regions.length ? provider.regions.join(' · ') : '未核验'}</dd>
            <dt>客户端</dt><dd>{provider.clients}</dd>
            <dt>支付</dt><dd>{provider.payment}</dd>
            <dt>试用</dt><dd>{provider.trial}</dd>
          </dl>
          <div className="space-y-2 border-t border-[#e2e5df] pt-3 dark:border-white/10">
            {provider.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="group/source block rounded-lg p-2 text-[#44514c] no-underline hover:bg-black/[0.04] dark:text-[#aeb9b5] dark:hover:bg-white/[0.05]">
                <span className="flex items-center justify-between gap-3 font-bold text-[#1f5148] dark:text-[#83cdbf]">
                  {source.label}
                  <IconExternalLink size={14} aria-hidden="true" />
                </span>
                <span className="mt-0.5 block text-[11px] text-[#7b8580]">{source.type} · {source.note}</span>
              </a>
            ))}
          </div>
        </div>
      </details>
    </article>
  )
}

function ComparisonTable() {
  const rows = [
    ['当前判断', (p) => p.verdict],
    ['入门价格', (p) => p.priceLabel],
    ['流量', (p) => p.traffic],
    ['带宽', (p) => p.bandwidth],
    ['协议', (p) => p.protocol],
    ['节点地区', (p) => p.regions.length ? `${p.regions.length} 地区` : '未核验'],
    ['试用', (p) => p.trial],
    ['可核验度', (p) => `${p.confidence}/100`],
  ]

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#d8ddd5] bg-white/45 dark:border-white/10 dark:bg-white/[0.025]">
      <table className="w-full min-w-[920px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#d8ddd5] dark:border-white/10">
            <th className="sticky left-0 z-10 bg-[#f1f3ed] px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-[#74807a] dark:bg-[#101714]">维度</th>
            {PROVIDERS.map((provider) => (
              <th key={provider.id} className="px-4 py-4 text-sm font-black text-[#17201d] dark:text-white">{provider.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, getter]) => (
            <tr key={label} className="border-b border-[#e0e4dd] last:border-0 dark:border-white/[0.07]">
              <th className="sticky left-0 z-10 bg-[#f7f8f4] px-4 py-3 font-bold text-[#65706b] dark:bg-[#111916] dark:text-[#94a19c]">{label}</th>
              {PROVIDERS.map((provider) => (
                <td key={provider.id} className="px-4 py-3 leading-5 text-[#3f4b46] dark:text-[#c2cbc7]">{getter(provider)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function NetworkAccessGuideClient() {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('confidence')

  const visibleProviders = useMemo(() => {
    const ids = STATUS_META[filter]?.ids
    const list = ids ? PROVIDERS.filter((provider) => ids.includes(provider.id)) : [...PROVIDERS]
    return list.sort((a, b) => {
      if (sort === 'price') return (a.price ?? 999) - (b.price ?? 999)
      return b[sort] - a[sort]
    })
  }, [filter, sort])

  return (
    <main className={`${styles.page} min-h-screen`}>
      <div className={styles.ambient} aria-hidden="true" />
      <PageContainer width="wide" className="relative z-[1] py-7 md:py-10">
        <header className="relative overflow-hidden rounded-[28px] border border-[#d3dbd2] bg-[#eef2e9]/90 p-5 shadow-[0_24px_80px_rgba(33,60,51,0.08)] dark:border-white/10 dark:bg-[#0d1512]/90 md:p-10 lg:p-14">
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className="relative z-[1] grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:items-end">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <Link href="/rich-pages" className="rounded-full border border-[#bdc9be] bg-white/55 px-3 py-1.5 text-[#496058] no-underline hover:border-[#6a8b7f] dark:border-white/10 dark:bg-white/5 dark:text-[#a5b7b0]">
                  多维页面
                </Link>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-800 dark:text-emerald-300">
                  公开资料核验版
                </span>
                <span className="font-mono text-[#77837d]">CHECKED {CHECKED_AT}</span>
              </div>
              <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#1c7467] dark:text-[#64c7b6]">Five-provider field guide</p>
              <h1 className="m-0 mt-4 max-w-5xl text-[42px] font-black leading-[0.98] tracking-[-0.055em] text-[#0e1814] dark:text-white sm:text-[58px] lg:text-[74px]">
                5 个“梯子”，<br />先看证据，再看价格。
              </h1>
              <p className="m-0 mt-6 max-w-3xl text-[15px] leading-8 text-[#4e6059] dark:text-[#aab9b3] md:text-base">
                红海 Pro、平行网、脉动云、火烧云、鱼云公开信息横向核验。这里不做虚构测速，也不替任何服务背书；重点是分清当前状态、信息来源和购买风险。
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#providers" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#123f37] px-5 text-sm font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[#0b302a] dark:bg-[#75d0bf] dark:text-[#07130f]">
                  查看五家档案 <IconArrowUpRight size={17} aria-hidden="true" />
                </a>
                <SharePageButton title="5 个网络加速服务公开信息核验" text="红海 Pro、平行网、脉动云、火烧云、鱼云横向研究。" url={PAGE_URL} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {[
                ['5', '目标服务', IconRadar],
                ['10', '公开来源', IconReceipt2],
                ['1', '明确不可用', IconAlertTriangle],
                ['0', '无条件推荐', IconShieldCheck],
              ].map(([value, label, Icon]) => (
                <div key={label} className="rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                  <Icon size={18} className="text-[#2e7e70] dark:text-[#6bcbbb]" aria-hidden="true" />
                  <strong className="mt-5 block font-mono text-3xl font-black text-[#13201b] dark:text-white">{value}</strong>
                  <span className="mt-1 block text-xs text-[#68766f] dark:text-[#94a39d]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-3 md:py-10">
          {[
            ['01', '先排除确定风险', '红海 Pro 官网当前明确提示节点不可用；这条事实优先级高于低价和带宽宣称。', IconAlertTriangle],
            ['02', '再看信息透明度', '平行网公开信息不足，火烧云又有大量同名结果；身份确认本身就是购买门槛。', IconInfoCircle],
            ['03', '最后做本地实测', '线路表现高度依赖地区、运营商和时段。公开参数不能替代你自己的晚高峰月付测试。', IconRoute],
          ].map(([index, title, copy, Icon]) => (
            <article key={index} className="rounded-2xl border border-[#d8ddd5] bg-white/45 p-5 dark:border-white/10 dark:bg-white/[0.025]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-bold text-[#2a796b] dark:text-[#65c7b6]">{index}</span>
                <Icon size={19} className="text-[#7d8a84]" aria-hidden="true" />
              </div>
              <h2 className="m-0 mt-8 text-lg font-black text-[#15201c] dark:text-white">{title}</h2>
              <p className="m-0 mt-2 text-sm leading-7 text-[#5d6963] dark:text-[#9eaaa5]">{copy}</p>
            </article>
          ))}
        </section>

        <section id="providers" className="scroll-mt-24 border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12">
          <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#25786a] dark:text-[#63c8b6]">Provider dossiers</p>
              <h2 className="m-0 mt-2 text-3xl font-black tracking-tight text-[#111b17] dark:text-white md:text-4xl">五家公开档案</h2>
              <p className="m-0 mt-3 max-w-2xl text-sm leading-7 text-[#626e68] dark:text-[#9ba8a2]">分数衡量“资料是否能被公开来源交叉核对”，不是线路速度评分。</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-[#d4dbd3] bg-white/55 p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                <IconFilter className="ml-2 text-[#77847e]" size={15} aria-hidden="true" />
                {Object.entries(STATUS_META).map(([id, meta]) => (
                  <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${filter === id ? 'bg-[#153f38] text-white dark:bg-[#72cdbc] dark:text-[#07130f]' : 'text-[#66736d] hover:bg-black/[0.04] dark:text-[#9eaaa5] dark:hover:bg-white/5'}`}>
                    {meta.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-[#d4dbd3] bg-white/55 px-3 dark:border-white/10 dark:bg-white/[0.03]">
                <IconSortDescending size={16} className="text-[#77847e]" aria-hidden="true" />
                <span className="sr-only">排序方式</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 bg-transparent text-xs font-bold text-[#34443e] outline-none dark:text-[#c6d0cc]">
                  {SORTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProviders.map((provider, index) => <ProviderCard key={provider.id} provider={provider} index={index} />)}
          </div>
        </section>

        <section className="border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12">
          <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#25786a] dark:text-[#63c8b6]">Comparison matrix</p>
              <h2 className="m-0 mt-2 text-3xl font-black tracking-tight text-[#111b17] dark:text-white">横向参数矩阵</h2>
            </div>
            <p className="m-0 text-sm leading-7 text-[#64706a] dark:text-[#9ba8a2] lg:text-right">“未核验”不是负面评价，而是提醒：公开材料不足以支撑购买判断。</p>
          </div>
          <ComparisonTable />
        </section>

        <section className="grid gap-5 border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl bg-[#143f37] p-6 text-[#f7fbf9] md:p-8">
            <IconBolt size={24} aria-hidden="true" />
            <p className="m-0 mt-12 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b8d5ce]">Bottom line</p>
            <h2 className="m-0 mt-3 text-3xl font-black leading-tight tracking-tight">没有“闭眼买”，只有不同程度的继续核验。</h2>
            <p className="m-0 mt-5 text-sm leading-7 text-[#d3e3df]">
              当前最明确的动作是：红海 Pro 暂缓；平行网先索要资料；脉动云、火烧云、鱼云如需尝试，只做小额月付，并在你的网络环境里实测。
            </p>
          </div>

          <div className="rounded-3xl border border-[#d4dad2] bg-white/45 p-6 dark:border-white/10 dark:bg-white/[0.025] md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <IconCircleCheck size={22} className="text-[#287d6e] dark:text-[#6acbbb]" aria-hidden="true" />
              <h2 className="m-0 text-2xl font-black text-[#14201b] dark:text-white">购买前 6 项检查</h2>
            </div>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {BUYING_CHECKLIST.map(([title, copy], index) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dcebe5] font-mono text-[10px] font-black text-[#216b5e] dark:bg-[#173c34] dark:text-[#79cfbf]">{index + 1}</span>
                  <div>
                    <h3 className="m-0 text-sm font-black text-[#26332e] dark:text-[#edf3f0]">{title}</h3>
                    <p className="m-0 mt-1 text-xs leading-6 text-[#69756f] dark:text-[#9ca9a3]">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#25786a] dark:text-[#63c8b6]">Research ledger</p>
              <h2 className="m-0 mt-2 text-3xl font-black tracking-tight text-[#111b17] dark:text-white">来源账本</h2>
              <p className="m-0 mt-4 text-sm leading-7 text-[#64706a] dark:text-[#9ba8a2]">优先采用官方发布页；官网未披露的参数才引用第三方，并在字段中显式标记。信息会变化，购买前请回到原始页面复核。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROVIDERS.flatMap((provider) => provider.sources.map((source) => ({ ...source, provider: provider.name }))).map((source) => (
                <a key={`${source.provider}-${source.url}`} href={source.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-4 rounded-xl border border-[#d8ddd5] bg-white/40 p-4 text-[#27332e] no-underline transition hover:-translate-y-0.5 hover:border-[#7da197] dark:border-white/10 dark:bg-white/[0.025] dark:text-[#dbe5e1] dark:hover:border-[#65b8a9]">
                  <span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7b8781]">{source.provider} · {source.type}</span>
                    <span className="mt-1 block text-sm font-black">{source.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#68746e] dark:text-[#98a49f]">{source.note}</span>
                  </span>
                  <IconExternalLink className="mt-1 shrink-0 text-[#6c7b75] group-hover:text-[#216e61]" size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-[#ced6ce] py-8 text-xs leading-6 text-[#6d7973] dark:border-white/10 dark:text-[#929f99] md:flex-row md:items-center md:justify-between">
          <p className="m-0 max-w-3xl"><strong className="text-[#3d4b45] dark:text-[#c8d2ce]">编辑说明：</strong>本页是公开资料研究，不构成购买、隐私或法律建议。评分只反映信息可核验程度，不代表实时速度、安全性或长期可用性。</p>
          <span className="shrink-0 font-mono">LAST CHECK · {CHECKED_AT}</span>
        </footer>
      </PageContainer>
    </main>
  )
}
