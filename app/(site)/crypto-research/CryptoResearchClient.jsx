'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const muted = 'text-[#66706c] dark:text-[#a9b5b0]'

const strategySteps = [
  ['选题', '每日刷新 CoinGecko 美元市值前 250 名，从尚未完成的资产中优先选择市值排名最高者。'],
  ['查证', '联网核对官方文档、代码仓库、治理、安全事件、代币经济与监管材料；市场数字只采用生成时的 CoinGecko 快照。'],
  ['成稿', '按十段式资产观察模板梳理背景、技术、用途、供给、市场、治理、安全、监管与风险，不给出买卖或价格预测。'],
  ['复核', '自动草稿保留 72 小时人工复核窗口；未被退回的到期稿件按顺序发布，每次最多一篇。'],
]

export default function CryptoResearchClient({ items, researchMethod }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return keyword ? items.filter((item) => `${item.name} ${item.symbol} ${item.summary} ${item.tags.join(' ')}`.toLowerCase().includes(keyword)) : items
  }, [items, query])
  const latest = filtered[0]
  const archive = filtered.slice(1)
  const months = new Set(items.map((item) => item.date?.slice(0, 7)).filter(Boolean)).size

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <header className="border-b border-[#d8ddd9] pb-8 dark:border-[#303b3a]">
      <p className="text-xs font-semibold tracking-[0.22em] text-[#16745b] dark:text-[#65c8a9]">CRYPTO ASSET RESEARCH</p>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
        <div><h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">加密调研</h1><p className={`mt-4 max-w-2xl text-base leading-7 ${muted}`}>每天按市值观察一个加密资产，依次核对背景、发展、技术、用途、代币经济、治理、安全与监管。数据采用调研时点口径，不构成投资建议。</p></div>
        <dl className="grid grid-cols-3 divide-x divide-[#d8ddd9] border-y border-[#d8ddd9] py-4 text-center dark:divide-[#303b3a] dark:border-[#303b3a]">
          <div><dt className={`text-xs ${muted}`}>已调研</dt><dd className="mt-1 text-2xl font-semibold">{items.length}</dd></div><div><dt className={`text-xs ${muted}`}>更新</dt><dd className="mt-1 text-lg font-semibold">每日</dd></div><div><dt className={`text-xs ${muted}`}>归档月</dt><dd className="mt-1 text-2xl font-semibold">{months}</dd></div>
        </dl>
      </div>
    </header>
    <details className="group mt-7 border-y border-[#d8ddd9] py-5 dark:border-[#303b3a]" aria-labelledby="research-method-title">
      <summary className="flex cursor-pointer list-none flex-wrap items-end justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#16745b] dark:text-[#65c8a9]">RESEARCH METHOD</p>
          <h2 id="research-method-title" className="mt-2 text-2xl font-semibold tracking-tight">当前调研模板与策略</h2>
        </div>
        <span className={`flex items-center gap-2 text-sm ${muted}`}>
          <span className="group-open:hidden">查看模板</span>
          <span className="hidden group-open:inline">收起</span>
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
        </span>
      </summary>
      <p className={`mt-3 max-w-xl text-sm leading-6 ${muted}`}>这里展示当前自动化实际采用的写作口径与执行流程，历史文章仍保留生成时的模板版本和市场数据截点。</p>

      <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-[#d8ddd9] bg-[#d8ddd9] dark:border-[#303b3a] dark:bg-[#303b3a] lg:grid-cols-[0.9fr_1.1fr]">
        <article className="bg-[#f7faf8] p-5 dark:bg-[#111923] sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#16745b] px-2.5 py-1 text-xs font-semibold text-white">模板 v{researchMethod.templateVersion}</span>
            <span className={`text-xs ${muted}`}>crypto-asset-research</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold">十段式资产观察</h3>
          <p className={`mt-2 text-sm leading-6 ${muted}`}>
            从结论与发展时间线开始，继续核对技术、用途、代币经济、市场、治理、安全和监管，最后集中整理风险、外部研判、来源与未能验证事项。
          </p>
          <p className="mt-3 text-xs leading-5">
            <span className="font-semibold text-[#16745b] dark:text-[#65c8a9]">当前写作风格 · {researchMethod.styleLabel}</span>
            <span className={muted}> · {researchMethod.styleSummary}</span>
          </p>
        </article>

        <article className="bg-white p-5 dark:bg-[#0d131b] sm:p-6">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#16745b] dark:text-[#65c8a9]">调研策略</p>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2">
            {strategySteps.map(([title, description], index) => (
              <li key={title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                <span className="font-mono text-xs font-semibold text-[#16745b] dark:text-[#65c8a9]">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className={`mt-1 text-sm leading-6 ${muted}`}>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </details>
    <div className="mt-7 grid gap-6 lg:grid-cols-[252px_minmax(0,1fr)]">
      <aside className="h-fit border border-[#d8ddd9] bg-white/60 p-4 dark:border-[#303b3a] dark:bg-[#111923]">
        <label><span className="text-xs font-semibold tracking-[0.14em] text-[#16745b] dark:text-[#65c8a9]">检索币种</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名称、符号或主题" className="mt-3 w-full rounded-lg border border-[#cfd8d3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#16745b] dark:border-[#354153] dark:bg-[#0d131b]" /></label>
        <div className={`mt-5 border-t border-[#e0e6e2] pt-4 text-sm leading-6 dark:border-[#303b3a] ${muted}`}><p>{query ? `找到 ${filtered.length} 个资产` : `共 ${items.length} 份资产观察`}</p><p className="mt-2">市值排名与行情会变化，每篇保留生成时的数据截点。</p></div>
      </aside>
      <section className="min-w-0">{latest ? <>
        <p className="text-xs font-semibold tracking-[0.16em] text-[#16745b] dark:text-[#65c8a9]">{query ? '搜索结果' : '最新调研'}</p>
        <Link href={latest.href} className="group mt-3 block border-y border-[#d8ddd9] py-6 dark:border-[#303b3a]"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[#16745b] px-2.5 py-1 font-semibold text-white">{latest.symbol}</span>{latest.rank ? <span className={muted}>市值 #{latest.rank}</span> : null}<span className={muted}>·</span><time className={muted}>{latest.dateLabel}</time></div><h2 className="mt-4 text-2xl font-semibold tracking-tight transition group-hover:text-[#16745b] dark:group-hover:text-[#65c8a9] sm:text-3xl">{latest.name}</h2><p className={`mt-3 max-w-3xl text-sm leading-7 sm:text-base ${muted}`}>{latest.summary}</p><span className="mt-5 inline-block text-sm font-medium text-[#16745b] dark:text-[#65c8a9]">阅读完整调研 →</span></Link>
        {archive.length ? <div className="mt-9"><div className="flex items-end justify-between border-b border-[#d8ddd9] pb-3 dark:border-[#303b3a]"><h2 className="text-xl font-semibold">调研归档</h2><span className={`text-xs ${muted}`}>{archive.length} 篇</span></div><ol className="divide-y divide-[#e0e6e2] dark:divide-[#303b3a]">{archive.map((item) => <li key={item.id}><Link href={item.href} className="group grid gap-2 py-5 sm:grid-cols-[92px_minmax(0,1fr)_80px] sm:gap-4"><div><span className="font-mono text-sm font-semibold text-[#16745b] dark:text-[#65c8a9]">{item.symbol}</span>{item.rank ? <span className={`mt-1 block text-xs ${muted}`}>市值 #{item.rank}</span> : null}</div><div><h3 className="font-semibold group-hover:text-[#16745b] dark:group-hover:text-[#65c8a9]">{item.name}</h3><p className={`mt-1 line-clamp-2 text-sm leading-6 ${muted}`}>{item.summary}</p></div><div className={`text-xs sm:text-right ${muted}`}><time>{item.dateLabel}</time><span className="mt-1 block">{item.readingMinutes} 分钟</span></div></Link></li>)}</ol></div> : null}
      </> : <div className="border border-dashed border-[#cfd8d3] py-20 text-center text-sm text-[#777] dark:border-[#3b4654]">没有找到匹配的加密资产。</div>}</section>
    </div>
  </main>
}
