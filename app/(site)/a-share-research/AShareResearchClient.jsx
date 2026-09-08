'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const muted = 'text-[#706b66] dark:text-[#a9afb8]'

function yearMonth(date) {
  return /^\d{4}-\d{2}/.test(date || '') ? date.slice(0, 7) : '其他'
}

const strategySteps = [
  ['选题', '覆盖沪市、深市与北交所，经行情状态核验后，从尚未调研的公司中随机抽取；每天最多新增一家。'],
  ['查证', '联网核对主营业务、最新业绩、控制权与近期公告；关键事实回到正式披露，无法确认的内容明确留空。'],
  ['成稿', '按十段式公司观察模板整理业务、财务、治理、估值和风险，事实与外部研判分开书写。'],
  ['复核', '自动草稿保留 72 小时人工复核窗口；未被退回的到期稿件按顺序发布，每次最多一篇。'],
]

export default function AShareResearchClient({ items, researchMethod }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return items
    return items.filter((item) => (
      `${item.company} ${item.stockCode} ${item.exchange} ${item.summary} ${item.tags.join(' ')}`
        .toLowerCase()
        .includes(keyword)
    ))
  }, [items, query])

  const latest = filtered[0]
  const archive = filtered.slice(1)
  const months = [...new Set(items.map((item) => yearMonth(item.date)))]

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="border-b border-[#ddd8d0] pb-8 dark:border-[#303844]">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#a33b32] dark:text-[#e58a80]">A-SHARE RESEARCH</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">A股调研</h1>
            <p className={`mt-4 max-w-2xl text-base leading-7 ${muted}`}>
              每天观察一家上市公司，依次核对业务、财务、治理、估值与风险。数据采用调研时点口径，不构成投资建议。
            </p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-[#ddd8d0] border-y border-[#ddd8d0] py-4 text-center dark:divide-[#303844] dark:border-[#303844]">
            <div><dt className={`text-xs ${muted}`}>已调研</dt><dd className="mt-1 text-2xl font-semibold">{items.length}</dd></div>
            <div><dt className={`text-xs ${muted}`}>交易所</dt><dd className="mt-1 text-2xl font-semibold">3</dd></div>
            <div><dt className={`text-xs ${muted}`}>归档月</dt><dd className="mt-1 text-2xl font-semibold">{months.length}</dd></div>
          </dl>
        </div>
      </header>

      <section className="mt-7 border-y border-[#d8d2ca] py-6 dark:border-[#303844]" aria-labelledby="research-method-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#a33b32] dark:text-[#e58a80]">RESEARCH METHOD</p>
            <h2 id="research-method-title" className="mt-2 text-2xl font-semibold tracking-tight">当前调研模板与策略</h2>
          </div>
          <p className={`max-w-xl text-sm leading-6 ${muted}`}>这里展示当前自动化实际采用的写作口径与执行流程，历史文章仍保留生成时的模板版本。</p>
        </div>

        <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-[#ddd8d0] bg-[#ddd8d0] dark:border-[#303844] dark:bg-[#303844] lg:grid-cols-[0.9fr_1.1fr]">
          <article className="bg-[#faf8f4] p-5 dark:bg-[#111923] sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#a33b32] px-2.5 py-1 text-xs font-semibold text-white">模板 v{researchMethod.templateVersion}</span>
              <span className={`text-xs ${muted}`}>a-share-company-research</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">十段式公司观察</h3>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              从结论、公司身份和业务结构开始，继续核对财务、治理、估值、催化与风险，最后单列外部研判、未能验证和信息来源。
            </p>
            <div className="mt-5 border-t border-[#e3ded7] pt-4 dark:border-[#303844]">
              <p className="text-xs font-semibold tracking-[0.12em] text-[#8d332c] dark:text-[#e58a80]">当前写作风格 · {researchMethod.styleLabel}</p>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>{researchMethod.styleSummary}</p>
              <ul className={`mt-3 space-y-2 text-sm leading-6 ${muted}`}>
                {researchMethod.principles.map((principle) => (
                  <li key={principle} className="flex gap-2"><span aria-hidden="true" className="text-[#a33b32] dark:text-[#e58a80]">—</span><span>{principle}</span></li>
                ))}
              </ul>
            </div>
          </article>

          <article className="bg-white p-5 dark:bg-[#0d131b] sm:p-6">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#8d332c] dark:text-[#e58a80]">调研策略</p>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {strategySteps.map(([title, description], index) => (
                <li key={title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                  <span className="font-mono text-xs font-semibold text-[#a33b32] dark:text-[#e58a80]">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className={`mt-1 text-sm leading-6 ${muted}`}>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="h-fit border border-[#ddd8d0] bg-white/60 p-4 dark:border-[#303844] dark:bg-[#111923]">
          <label className="block">
            <span className="text-xs font-semibold tracking-[0.14em] text-[#8d332c] dark:text-[#e58a80]">检索公司</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="公司、代码或行业"
              className="mt-3 w-full rounded-lg border border-[#d6d0c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#a33b32] dark:border-[#354153] dark:bg-[#0d131b]"
            />
          </label>
          <div className={`mt-5 border-t border-[#e5e0d9] pt-4 text-sm leading-6 dark:border-[#303844] ${muted}`}>
            <p>{query ? `找到 ${filtered.length} 家公司` : `共 ${items.length} 份公司观察`}</p>
            <p className="mt-2">更新时记录数据口径和资料日期，行情与估值会随市场变化。</p>
          </div>
        </aside>

        <section className="min-w-0">
          {latest ? (
            <>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#a33b32] dark:text-[#e58a80]">{query ? '搜索结果' : '最新调研'}</p>
              <Link href={latest.href} className="group mt-3 block border-y border-[#d8d2ca] py-6 dark:border-[#303844]">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#a33b32] px-2.5 py-1 font-semibold text-white">{latest.stockCode}</span>
                  <span className={muted}>{latest.exchange}</span>
                  <span className={muted}>·</span>
                  <time className={muted}>{latest.dateLabel}</time>
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight transition group-hover:text-[#a33b32] dark:group-hover:text-[#e58a80] sm:text-3xl">{latest.company}</h2>
                <p className={`mt-3 max-w-3xl text-sm leading-7 sm:text-base ${muted}`}>{latest.summary}</p>
                <span className="mt-5 inline-block text-sm font-medium text-[#8d332c] dark:text-[#e58a80]">阅读完整调研 →</span>
              </Link>

              {archive.length ? <div className="mt-9">
                <div className="flex items-end justify-between border-b border-[#d8d2ca] pb-3 dark:border-[#303844]">
                  <h2 className="text-xl font-semibold">调研归档</h2>
                  <span className={`text-xs ${muted}`}>{archive.length} 篇</span>
                </div>
                <ol className="divide-y divide-[#e2ddd6] dark:divide-[#303844]">
                  {archive.map((item) => <li key={item.id}>
                    <Link href={item.href} className="group grid gap-2 py-5 sm:grid-cols-[92px_minmax(0,1fr)_80px] sm:items-start sm:gap-4">
                      <div>
                        <span className="font-mono text-sm font-semibold text-[#8d332c] dark:text-[#e58a80]">{item.stockCode}</span>
                        <span className={`mt-1 block text-xs ${muted}`}>{item.exchange}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold transition group-hover:text-[#a33b32] dark:group-hover:text-[#e58a80]">{item.company}</h3>
                        <p className={`mt-1 line-clamp-2 text-sm leading-6 ${muted}`}>{item.summary}</p>
                        {item.tags.length ? <p className={`mt-2 text-xs ${muted}`}>{item.tags.join(' · ')}</p> : null}
                      </div>
                      <div className={`text-xs sm:text-right ${muted}`}>
                        <time>{item.dateLabel}</time>
                        <span className="mt-1 block">{item.readingMinutes} 分钟</span>
                      </div>
                    </Link>
                  </li>)}
                </ol>
              </div> : null}
            </>
          ) : (
            <div className="border border-dashed border-[#cfc8bf] py-20 text-center text-sm text-[#777] dark:border-[#3b4654] dark:text-[#aeb5c0]">
              没有找到匹配的公司。
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
