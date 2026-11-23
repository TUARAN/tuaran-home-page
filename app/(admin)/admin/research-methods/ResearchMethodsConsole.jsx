'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  getResearchMethod,
  listResearchMethodItems,
  RESEARCH_METHOD_NAV,
} from '../../../../lib/research/researchMethodCatalog'
import { AdminButton, AdminPage } from '../../components/ui'
import {
  BookCover,
  BookProse,
  BookShell,
  BookSpread,
  BookToc,
  ChapterCards,
  PaperPage,
  PrefaceLead,
  PullQuote,
  BOOK,
  chapterLabel,
  folioFor,
} from '../../components/ResearchBook'
import ResearchStyleClient from '../research-style/ResearchStyleClient'

const METHOD_IDS = new Set(listResearchMethodItems().map((item) => item.id))
const METHOD_INDEX = new Map(listResearchMethodItems().map((item, index) => [item.id, index]))

const PART_PREFACE = {
  writing: '先把判断的边界说清楚：通用禁语与写作风格。AI 可以照着清单核对，取舍仍由人做。',
  subjects: '再按观察对象分章：人物、公司、上市公司、加密资产。模板只规定材料和顺序，判断留在结尾。',
}

function useMethodSelection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('method')
  const method = METHOD_IDS.has(raw) ? raw : ''

  function setMethod(next) {
    const params = new URLSearchParams(searchParams.toString())
    if (!next) params.delete('method')
    else params.set('method', next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return [method, setMethod]
}

function methodMeta(method) {
  const index = METHOD_INDEX.get(method.id) ?? 0
  return {
    index,
    chapter: chapterLabel(index, method.title),
    folio: folioFor(index),
  }
}

function Overview({ onSelect }) {
  return (
    <PaperPage
      chapter="序 · 全书概览"
      title="翻开这本书"
      summary="一份给站长查阅的调研手册。它说明每类对象该摊开哪些材料，以及人在哪一步接手判断。"
      folio="00"
    >
      <PullQuote cite="题记">{BOOK.line}</PullQuote>
      <PrefaceLead>
        AI 擅长把公开材料找齐、排成表、按模板起草。它能缩短翻材料的时间，却不能替人决定哪些事实足以支撑结论。
        这里收录的写法和对象方法，都按这条分工编排：机器负责摊开事实，人负责判断与取舍。
      </PrefaceLead>
      <ol className="mb-6 grid gap-2 sm:grid-cols-3">
        {[
          ['01', '摊开材料', 'AI 找齐公开来源，按模板排成表。'],
          ['02', '标出缺口', '哪些结论缺证据，明确写「写不上」。'],
          ['03', '落下判断', '取舍、结论、是否跟进，由人定。'],
        ].map(([num, title, desc]) => (
          <li
            key={num}
            className="rounded-lg border border-[#e6e1d2] bg-[#faf8f0] px-3 py-2.5 dark:border-[#33363a] dark:bg-[#121417]"
          >
            <p className="m-0 mb-1 font-mono text-[10px] tracking-[0.16em] text-[#977637] dark:text-[#d6b46b]">{num}</p>
            <p className="m-0 font-serif text-[13px] font-semibold text-[#22201a] dark:text-[#eae5d7]">{title}</p>
            <p className="m-0 mt-1 text-[12px] leading-6 text-[#7b776b] dark:text-[#9c9688]">{desc}</p>
          </li>
        ))}
      </ol>
      <div className="space-y-6">
        {RESEARCH_METHOD_NAV.map((group) => (
          <section key={group.id}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="m-0 font-serif text-[15px] font-semibold text-[#22201a] dark:text-[#eae5d7]">
                {group.label}
              </h3>
              <p className="m-0 max-w-[34em] text-[12px] leading-6 text-[#7b776b] dark:text-[#9c9688]">
                {PART_PREFACE[group.id]}
              </p>
            </div>
            <ChapterCards
              items={group.items}
              startIndex={METHOD_INDEX.get(group.items[0].id) ?? 0}
              onSelect={onSelect}
            />
          </section>
        ))}
      </div>
    </PaperPage>
  )
}

function MethodDetail({ method }) {
  const [copied, setCopied] = useState(false)
  const { chapter, folio } = methodMeta(method)

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(method.prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <PaperPage chapter={chapter} title={method.title} summary={method.summary} folio={folio}>
      <BookProse>
        <p className="m-0 mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#977637] dark:text-[#d6b46b]">
          {method.styleId} · {method.version === '现行风格' ? '跟随现行风格' : `v${method.version}`}
          {method.updated ? ` · ${method.updated}` : ''}
        </p>

        <dl className="mb-5 grid gap-3 text-[12.5px] leading-6 sm:grid-cols-2">
          <div className="rounded-lg border border-[#e6e1d2] bg-[#faf8f0] px-3 py-2 dark:border-[#33363a] dark:bg-[#121417]">
            <dt className="text-[#8a8577] dark:text-[#8b8577]">正本</dt>
            <dd className="font-mono text-[#22201a] dark:text-gray-200">{method.sourcePath}</dd>
          </div>
          <div className="rounded-lg border border-[#e6e1d2] bg-[#faf8f0] px-3 py-2 dark:border-[#33363a] dark:bg-[#121417]">
            <dt className="text-[#8a8577] dark:text-[#8b8577]">成稿位置</dt>
            <dd className="font-mono text-[#22201a] dark:text-gray-200">{method.outputPath}</dd>
          </div>
        </dl>

        {method.workbenchHref ? (
          <div className="mb-6">
            <AdminButton href={method.workbenchHref} size="sm" variant="primary">{method.workbenchLabel}</AdminButton>
          </div>
        ) : null}

        <section className="mb-6">
          <h3>现行步骤</h3>
          <ol className="space-y-2">
            {method.steps.map((step, index) => (
              <li key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border border-[#e6e1d2] px-3 py-2.5 dark:border-[#33363a]">
                <span className="font-mono text-[12px] text-[#8a8577]">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-[13.5px] leading-6 text-[#3a382f] dark:text-gray-200">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {method.platforms?.length ? (
          <section className="mb-6">
            <h3>要打开的平台</h3>
            <ul className="flex flex-wrap gap-2">
              {method.platforms.map((platform) => (
                <li key={platform} className="rounded-full border border-[#ded9c9] bg-[#faf8f0] px-3 py-1 text-[12px] text-[#4a463d] dark:border-[#33363a] dark:bg-[#121417] dark:text-gray-300">
                  {platform}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {method.sections?.length ? (
          <section className="mb-6">
            <h3>成稿章节</h3>
            <ol className="grid gap-2 sm:grid-cols-2">
              {method.sections.map((section, index) => (
                <li key={section} className="rounded-lg border border-[#e6e1d2] px-3 py-2 text-[13px] text-[#3a382f] dark:border-[#33363a] dark:text-gray-200">
                  <span className="mr-2 font-mono text-[11px] text-[#8a8577]">{String(index + 1).padStart(2, '0')}</span>
                  {section}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {method.prompt ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="m-0 font-serif text-[12px] font-semibold tracking-[0.16em] text-[#977637] dark:text-[#d6b46b]">只有姓名时的提示词</p>
              <button
                type="button"
                onClick={copyPrompt}
                className="rounded-full border border-[#ded9c9] px-3 py-1 text-[12px] text-[#3a382f] hover:border-[#977637] dark:border-[#33363a] dark:text-gray-200"
              >
                {copied ? '已复制' : '复制提示词'}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-[#e6e1d2] bg-[#faf8f0] p-4 font-mono text-[12px] leading-6 text-[#2c2a23] dark:border-[#33363a] dark:bg-[#121417] dark:text-gray-200">
              {method.prompt}
            </pre>
          </section>
        ) : null}
      </BookProse>
    </PaperPage>
  )
}

export default function ResearchMethodsConsole() {
  const [method, setMethod] = useMethodSelection()
  const selected = method ? getResearchMethod(method) : null

  return (
    <AdminPage
      title="调研方法"
      description="写作规范、调研风格和各类对象的现行方法都在这里。这些页面只给站长查阅，不作为前台调研文章发布。"
      stickyHeader
    >
      <BookShell>
        <BookCover />
        <BookSpread>
          <BookToc
            groups={RESEARCH_METHOD_NAV}
            method={method}
            onSelect={setMethod}
            onOverview={() => setMethod('')}
          />
          <div className="min-w-0">
            {!selected ? <Overview onSelect={setMethod} /> : null}
            {selected?.kind === 'embed' ? <ResearchStyleClient embedded view={selected.view} book /> : null}
            {selected?.kind === 'method' ? <MethodDetail method={selected} /> : null}
          </div>
        </BookSpread>
      </BookShell>
    </AdminPage>
  )
}
