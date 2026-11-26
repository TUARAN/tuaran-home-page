'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconCalculator,
  IconChevronDown,
  IconCircleCheck,
  IconExternalLink,
  IconFilter,
  IconRadar,
  IconReceipt2,
  IconScale,
  IconSearch,
  IconShieldCheck,
} from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import {
  CHECKED_AT,
  COLLAPSED_CATEGORIES,
  MARKET_RATE,
  OFFICIAL_ANCHORS,
  PLATFORM_CATEGORIES,
  PRICING_PRESETS,
  RELAY_PLATFORMS,
  RISK_META,
  SAFETY_RULES,
  SCENARIO_PLAYBOOK,
  SOURCES,
  TOP_CHECKS,
  VERIFY_MOVES,
  riskLevel,
} from './data'

const PAGE_URL = 'https://2aran.com/claude-relay-market'

const CAT_TAG_CLS = {
  official: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  gateway: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  direct: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  pool: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  reverse: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  monthly: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  free: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300',
  rental: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
  tool: 'border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-300',
  dead: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400',
}

const MAIN_FILTERS = ['all', 'official', 'gateway', 'direct', 'pool', 'reverse', 'monthly', 'rental', 'tool']

function PlatformTable({ rows, emptyLabel }) {
  if (!rows.length) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">{emptyLabel}</p>
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#d8ddd5] bg-white/50 dark:border-white/10 dark:bg-white/[0.025]">
      <table className="w-full min-w-[880px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#d8ddd5] dark:border-white/10">
            {['平台', '分类', '渠道 · 计费', '价格要点', '相对官方', '风险', '状态'].map((label) => (
              <th key={label} className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-[#74807a] dark:text-[#8b978f]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cat = PLATFORM_CATEGORIES[row.cat]
            const risk = RISK_META[riskLevel(row.risk)]
            return (
              <tr key={row.id} className="border-b border-[#e4e8e1] align-top last:border-0 hover:bg-black/[0.02] dark:border-white/[0.06] dark:hover:bg-white/[0.02]">
                <td className="px-3 py-3">
                  <span className="block text-sm font-black text-[#15201c] dark:text-white">{row.name}</span>
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-[#216e61] no-underline hover:underline dark:text-[#6bcbbb]">
                      {row.url.replace(/^https?:\/\//, '')}
                      <IconExternalLink size={11} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="mt-1 block font-mono text-[11px] text-[#8a948e] dark:text-[#7c8781]">域名未核实</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${CAT_TAG_CLS[row.cat]}`}>{cat.short}</span>
                </td>
                <td className="px-3 py-3 leading-5 text-[#4f5b56] dark:text-[#aab5b1]">
                  {row.channel}
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[#8a948e] dark:text-[#7c8781]">{row.billing}</span>
                </td>
                <td className="max-w-[340px] px-3 py-3 leading-5 text-[#3f4b46] dark:text-[#c2cbc7]">{row.price}</td>
                <td className="whitespace-nowrap px-3 py-3 font-bold text-[#26332e] dark:text-[#dbe5e1]">{row.discount}</td>
                <td className="px-3 py-3">
                  <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${risk.cls}`}>{risk.label}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-[11px] text-[#69756f] dark:text-[#9ca9a3]">{row.status}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PriceCalculator() {
  const [presetId, setPresetId] = useState('opus')
  const [multiplier, setMultiplier] = useState('1.9')
  const [rate, setRate] = useState('7.2')

  const preset = PRICING_PRESETS.find((item) => item.id === presetId)
  const mult = Number(multiplier) > 0 ? Number(multiplier) : 0
  const fx = Number(rate) > 0 ? Number(rate) : 0
  const inputCny = preset.input * mult * fx
  const outputCny = preset.output * mult * fx
  const officialCny = preset.input * MARKET_RATE
  const ratio = officialCny > 0 ? (inputCny / officialCny) : 0

  const verdict = ratio === 0 ? '' : ratio > 1.05 ? '比官方贵' : ratio < 0.5 ? '低于官方 5 折：先验真伪' : '低于官方价：确认货源与缓存支持'

  return (
    <div className="rounded-3xl border border-[#d4dad2] bg-white/55 p-6 dark:border-white/10 dark:bg-white/[0.03] md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <IconCalculator size={22} className="text-[#287d6e] dark:text-[#6acbbb]" aria-hidden="true" />
        <h2 className="m-0 text-2xl font-black text-[#14201b] dark:text-white">比价换算器：把宣传口径换算成同一个数字</h2>
      </div>
      <p className="m-0 mb-6 max-w-3xl text-sm leading-7 text-[#5d6963] dark:text-[#9eaaa5]">
        实际成本 = 官方美元单价 × 内部倍率 × 充值汇率。充值到账金额和消耗速率是两套独立数字，只看「低汇率」或「3 折起」都会算错。
      </p>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#68766f] dark:text-[#94a39d]">模型锚点（$/M）</span>
          <select value={presetId} onChange={(event) => setPresetId(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#d4dbd3] bg-white px-3 text-sm font-bold text-[#26332e] outline-none dark:border-white/10 dark:bg-[#111916] dark:text-[#dbe5e1]">
            {PRICING_PRESETS.map((item) => (
              <option key={item.id} value={item.id}>{item.label} · ${item.input}/${item.output}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#68766f] dark:text-[#94a39d]">内部倍率</span>
          <input type="number" min="0" step="0.1" value={multiplier} onChange={(event) => setMultiplier(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#d4dbd3] bg-white px-3 text-sm font-bold text-[#26332e] outline-none dark:border-white/10 dark:bg-[#111916] dark:text-[#dbe5e1]" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#68766f] dark:text-[#94a39d]">充值汇率（¥/$）</span>
          <input type="number" min="0" step="0.1" value={rate} onChange={(event) => setRate(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#d4dbd3] bg-white px-3 text-sm font-bold text-[#26332e] outline-none dark:border-white/10 dark:bg-[#111916] dark:text-[#dbe5e1]" />
        </label>
        <div className="rounded-xl bg-[#143f37] p-4 text-white dark:bg-[#0f2b25]">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider opacity-70">实际成本（¥/百万 token）</p>
          <p className="m-0 mt-2 font-mono text-lg font-black leading-tight">入 ¥{inputCny.toFixed(2)} / 出 ¥{outputCny.toFixed(2)}</p>
          <p className="m-0 mt-1 text-[11px] opacity-80">为官方 CNY 口径的 {ratio > 0 ? ratio.toFixed(2) : '—'} 倍 · {verdict}</p>
        </div>
      </div>
    </div>
  )
}

export default function ClaudeRelayMarketClient() {
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const map = { all: RELAY_PLATFORMS.length }
    for (const row of RELAY_PLATFORMS) map[row.cat] = (map[row.cat] || 0) + 1
    return map
  }, [])

  const mainRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return RELAY_PLATFORMS.filter((row) => {
      if (COLLAPSED_CATEGORIES.includes(row.cat)) return false
      if (activeCat !== 'all' && row.cat !== activeCat) return false
      if (!q) return true
      return `${row.name} ${row.url} ${row.channel} ${row.price}`.toLowerCase().includes(q)
    })
  }, [activeCat, query])

  const collapsedRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return COLLAPSED_CATEGORIES.map((cat) => ({
      cat,
      rows: RELAY_PLATFORMS.filter((row) => row.cat === cat && (!q || `${row.name} ${row.url} ${row.channel} ${row.price}`.toLowerCase().includes(q))),
    }))
  }, [query])

  return (
    <main className="min-h-screen bg-[#f3f6f1] dark:bg-[#0b100d]">
      <PageContainer width="wide" className="relative z-[1] py-7 md:py-10">
        <header className="relative overflow-hidden rounded-[28px] border border-[#d3dbd2] bg-[#eef2e9]/90 p-5 shadow-[0_24px_80px_rgba(33,60,51,0.08)] dark:border-white/10 dark:bg-[#0d1512]/90 md:p-10 lg:p-14">
          <div className="relative z-[1] grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:items-end">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <Link href="/rich-pages" className="rounded-full border border-[#bdc9be] bg-white/55 px-3 py-1.5 text-[#496058] no-underline hover:border-[#6a8b7f] dark:border-white/10 dark:bg-white/5 dark:text-[#a5b7b0]">
                  互动专题
                </Link>
                <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-indigo-800 dark:text-indigo-300">
                  公开信息汇总版
                </span>
                <span className="font-mono text-[#77837d]">SNAPSHOT {CHECKED_AT}</span>
              </div>
              <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#1c7467] dark:text-[#64c7b6]">Claude relay market map</p>
              <h1 className="m-0 mt-4 max-w-5xl text-[42px] font-black leading-[0.98] tracking-[-0.055em] text-[#0e1814] dark:text-white sm:text-[58px] lg:text-[72px]">
                同一个 Claude，<br />报价能差 20 倍。
              </h1>
              <p className="m-0 mt-6 max-w-3xl text-[15px] leading-8 text-[#4e6059] dark:text-[#aab9b3] md:text-base">
                {RELAY_PLATFORMS.length} 家渠道放在同一张表里：官方与云、合规聚合、官转直连、号池低价、逆向高危、包月制、免费公益站、合租镜像和检测工具。价格只反映计费口径，货源与保障才是真正的差异。
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#directory" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#123f37] px-5 text-sm font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[#0b302a] dark:bg-[#75d0bf] dark:text-[#07130f]">
                  打开全量清单 <IconArrowUpRight size={17} aria-hidden="true" />
                </a>
                <a href="#calculator" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#bdc9be] bg-white/55 px-5 text-sm font-bold text-[#315e56] no-underline transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-[#a5b7b0]">
                  先算一笔账 <IconCalculator size={16} aria-hidden="true" />
                </a>
                <SharePageButton title="Claude 中转市场全景" text="119 家 Claude 中转渠道分类、比价与选型。" url={PAGE_URL} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {[
                [String(RELAY_PLATFORMS.length), '收录渠道', IconRadar],
                [String(Object.keys(PLATFORM_CATEGORIES).length), '货源分类', IconFilter],
                ['45.83%', '抽检端点货不对板', IconAlertTriangle],
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
            ['01', '货源决定价格', '官方直连、官 key 透传、云厂商、明示聚合、key 池、订阅逆向、套壳假模型：报价差 20 倍的根源在货源分层。低于官方 5 折的报价，先验真伪再谈便宜。', IconScale],
            ['02', '比价只用一个口径', '换算后的 ¥/百万 token。充值汇率、内部倍率、缓存计价三层叠加；「¥0.5/$ 低汇率 + 3x 隐藏倍率」的组合会让实际成本反超两倍。', IconCalculator],
            ['03', '资金安全排在价格前面', '跑路与删号案例密集：按月小额充值、生产与涉密流量不走中转、免费站不进常用账号。省下的单价，可能会以断供和数据风险还回去。', IconShieldCheck],
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

        <section className="border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#25786a] dark:text-[#63c8b6]">Official anchors</p>
          <h2 className="m-0 mt-2 text-3xl font-black tracking-tight text-[#111b17] dark:text-white md:text-4xl">官方价格锚点</h2>
          <p className="m-0 mb-7 mt-3 max-w-2xl text-sm leading-7 text-[#626e68] dark:text-[#9ba8a2]">所有折扣都从这条基准线折算；批量与缓存计价见官方定价页。</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OFFICIAL_ANCHORS.map((anchor) => (
              <div key={anchor.name} className="rounded-2xl border border-[#d8ddd5] bg-white/50 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="m-0 text-sm font-black text-[#17201d] dark:text-white">{anchor.name}</h3>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{anchor.billing}</span>
                </div>
                <p className="m-0 mt-3 text-xs font-bold leading-5 text-[#26332e] dark:text-[#dbe5e1]">{anchor.price}</p>
                <p className="m-0 mt-1 text-[11px] leading-5 text-[#69756f] dark:text-[#9ca9a3]">{anchor.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="calculator" className="scroll-mt-24 border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12">
          <PriceCalculator />
        </section>

        <section id="directory" className="scroll-mt-24 border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12">
          <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#25786a] dark:text-[#63c8b6]">Full directory</p>
              <h2 className="m-0 mt-2 text-3xl font-black tracking-tight text-[#111b17] dark:text-white md:text-4xl">全量清单</h2>
              <p className="m-0 mt-3 max-w-2xl text-sm leading-7 text-[#626e68] dark:text-[#9ba8a2]">「相对官方」为站方或比价站披露口径的折算（1x = 官方价 = 10 折）。免费公益站与已跑路样本收在下方折叠区。</p>
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#d4dbd3] bg-white/55 px-3 dark:border-white/10 dark:bg-white/[0.03] xl:w-72">
              <IconSearch size={16} className="text-[#77847e]" aria-hidden="true" />
              <span className="sr-only">搜索平台、域名或价格</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索平台、域名或价格…" className="w-full bg-transparent text-xs font-bold text-[#34443e] outline-none dark:text-[#c6d0cc]" />
            </label>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {MAIN_FILTERS.map((id) => {
              const label = id === 'all' ? `全部 ${counts.all}` : `${PLATFORM_CATEGORIES[id].label} ${counts[id] || 0}`
              return (
                <button key={id} type="button" onClick={() => setActiveCat(id)} className={`rounded-full px-3.5 py-2 text-[11px] font-bold transition ${activeCat === id ? 'bg-[#153f38] text-white dark:bg-[#72cdbc] dark:text-[#07130f]' : 'border border-[#d4dbd3] bg-white/55 text-[#66736d] hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#9eaaa5] dark:hover:bg-white/5'}`}>
                  {label}
                </button>
              )
            })}
          </div>

          <PlatformTable rows={mainRows} emptyLabel="没有匹配的渠道；换个关键词或分类再试。" />
          <p className="m-0 mt-3 text-right text-xs text-[#69756f] dark:text-[#9ca9a3]">显示 {mainRows.length} 家（折叠区另计）</p>

          <div className="mt-8 space-y-4">
            {collapsedRows.map(({ cat, rows }) => (
              <details key={cat} className="group rounded-2xl border border-[#d8ddd5] bg-white/40 dark:border-white/10 dark:bg-white/[0.02]" open={query.trim() !== ''}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-black text-[#15201c] dark:text-white">
                  <span className="flex items-center gap-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${CAT_TAG_CLS[cat]}`}>{PLATFORM_CATEGORIES[cat].label}</span>
                    <span className="font-mono text-xs text-[#69756f] dark:text-[#9ca9a3]">{rows.length} 家</span>
                  </span>
                  <IconChevronDown className="transition group-open:rotate-180" size={16} aria-hidden="true" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="m-0 mb-3 px-1 text-xs leading-6 text-[#5d6963] dark:text-[#9eaaa5]">{PLATFORM_CATEGORIES[cat].desc}</p>
                  <PlatformTable rows={rows} emptyLabel="没有匹配的站点。" />
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-5 border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl bg-[#143f37] p-6 text-white md:p-8 dark:bg-[#71cdbc] dark:text-[#07130f]">
            <IconCircleCheck size={24} aria-hidden="true" />
            <p className="m-0 mt-12 font-mono text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">Pick by scenario</p>
            <h2 className="m-0 mt-3 text-3xl font-black leading-tight tracking-tight">按场景选档，按价格排序会选错。</h2>
            <p className="m-0 mt-5 text-sm leading-7 opacity-80">
              重度个人 Claude Code 的等效成本可以压到官方直连的 10–20%：官转直连 + Prompt Cache（降 50–60%）+ effortLevel=medium（降 20–30%）+ /compact 管理（降 30–50%）。缓存命中稳定性比倍率更值得比较。
            </p>
          </div>

          <div className="space-y-3">
            {SCENARIO_PLAYBOOK.map(([scene, copy], index) => (
              <div key={scene} className="flex gap-4 rounded-2xl border border-[#d8ddd5] bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dcebe5] font-mono text-[11px] font-black text-[#216b5e] dark:bg-[#173c34] dark:text-[#79cfbf]">{index + 1}</span>
                <div>
                  <h3 className="m-0 text-sm font-black text-[#26332e] dark:text-[#edf3f0]">{scene}</h3>
                  <p className="m-0 mt-1 text-xs leading-6 text-[#69756f] dark:text-[#9ca9a3]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 border-t border-[#ced6ce] py-8 dark:border-white/10 md:py-12 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#d4dad2] bg-white/45 p-6 dark:border-white/10 dark:bg-white/[0.025] md:p-8">
            <h2 className="m-0 text-xl font-black text-[#14201b] dark:text-white">充值前 5 项核查</h2>
            <div className="mt-5 space-y-4">
              {TOP_CHECKS.map(([title, copy], index) => (
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

          <div className="rounded-3xl border border-[#d4dad2] bg-white/45 p-6 dark:border-white/10 dark:bg-white/[0.025] md:p-8">
            <h2 className="m-0 text-xl font-black text-[#14201b] dark:text-white">验真四招：识别套壳与降智</h2>
            <div className="mt-5 space-y-4">
              {VERIFY_MOVES.map(([title, copy]) => (
                <div key={title} className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                  <h3 className="m-0 text-sm font-black text-[#26332e] dark:text-[#edf3f0]">{title}</h3>
                  <p className="m-0 mt-1 text-xs leading-6 text-[#69542e] dark:text-[#d9c38f]">{copy}</p>
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
              <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
                <h3 className="m-0 flex items-center gap-2 text-sm font-black text-[#26332e] dark:text-[#edf3f0]">
                  <IconAlertTriangle size={16} className="text-rose-600 dark:text-rose-300" aria-hidden="true" />
                  资金与数据安全红线
                </h3>
                <ul className="mt-2 space-y-1.5 pl-1 text-xs leading-6 text-[#69542e] dark:text-[#d9c38f]">
                  {SAFETY_RULES.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOURCES.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-4 rounded-xl border border-[#d8ddd5] bg-white/40 p-4 text-[#27332e] no-underline transition hover:-translate-y-0.5 hover:border-[#7da197] dark:border-white/10 dark:bg-white/[0.025] dark:text-[#dbe5e1] dark:hover:border-[#65b8a9]">
                  <span>
                    <span className="block text-sm font-black">{source.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#68746e] dark:text-[#98a49f]">{source.note}</span>
                  </span>
                  <IconExternalLink className="mt-1 shrink-0 text-[#6c7b75] group-hover:text-[#216e61]" size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-[#ced6ce] py-8 text-xs leading-6 text-[#6d7973] dark:border-white/10 dark:text-[#929f99] md:flex-row md:items-center md:justify-between">
          <p className="m-0 max-w-3xl"><strong className="text-[#3d4b45] dark:text-[#c8d2ce]">编辑说明：</strong>本页是公开信息汇总，不构成购买建议，也不代表对任何站点的背书。倍率、赠额与存活状态变动极快，充值前以各站实时页面为准，并用清单内的检测工具验真。号池与逆向类渠道普遍违反上游服务条款，风险自担。</p>
          <span className="shrink-0 font-mono">SNAPSHOT · {CHECKED_AT}</span>
        </footer>
      </PageContainer>
    </main>
  )
}
