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
  BookPara,
  BookPoints,
  BookProse,
  BookSection,
  BookShell,
  BookSpread,
  BookTable,
  BookToc,
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

const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function Overview({ onSelect }) {
  const allItems = RESEARCH_METHOD_NAV.flatMap((group) => group.items)

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

      <BookSection num="第一节" title="三步分工">
        <BookPoints
          ordered
          items={[
            '摊开材料：AI 找齐公开来源，按模板排成表。',
            '标出缺口：哪些结论缺证据，明确写「写不上」。',
            '落下判断：取舍、结论、是否跟进，由人决定。',
          ]}
        />
      </BookSection>

      <BookSection num="第二节" title="全书篇目">
        <BookPara>全书分两卷。卷一讲写法，卷二按对象分章。选中一行即可展开对应章节。</BookPara>
        {RESEARCH_METHOD_NAV.map((group, groupIndex) => (
          <div key={group.id}>
            <BookPara><strong>卷{'一二'[groupIndex] || groupIndex + 1} · {group.label}</strong>　{PART_PREFACE[group.id]}</BookPara>
            <BookTable
              label={`表${CN_NUM[groupIndex] || groupIndex + 1}`}
              title={`卷${'一二'[groupIndex] || groupIndex + 1} · ${group.label}`}
              head={['章', '篇名', '内容']}
              rows={group.items.map((item) => [
                CN_NUM[METHOD_INDEX.get(item.id)] || String(METHOD_INDEX.get(item.id) + 1),
                item.title,
                item.summary,
              ])}
              onSelect={(row) => onSelect(group.items[row].id)}
            />
          </div>
        ))}
      </BookSection>
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
        <BookSection num="第一节" title="出处与版本">
          <BookTable
            label="表一"
            title="本法的来源与去向"
            head={['项', '内容']}
            rows={[
              ['适用风格', method.styleId],
              ['版本', method.version === '现行风格' ? '跟随现行风格' : `v${method.version}`],
              ['更新', method.updated || '—'],
              ['正本', method.sourcePath],
              ['成稿位置', method.outputPath],
            ]}
          />
          {method.workbenchHref ? (
            <div className="mt-3">
              <AdminButton href={method.workbenchHref} size="sm" variant="primary">{method.workbenchLabel}</AdminButton>
            </div>
          ) : null}
        </BookSection>

        <BookSection num="第二节" title="现行步骤">
          <BookPoints ordered items={method.steps} />
        </BookSection>

        {method.platforms?.length ? (
          <BookSection num="第三节" title="要打开的平台">
            <BookPoints items={method.platforms} />
          </BookSection>
        ) : null}

        {method.sections?.length ? (
          <BookSection num={method.platforms?.length ? '第四节' : '第三节'} title="成稿章节">
            <BookPoints ordered items={method.sections} />
          </BookSection>
        ) : null}

        {method.prompt ? (
          <BookSection
            num={method.platforms?.length && method.sections?.length ? '第五节' : method.platforms?.length || method.sections?.length ? '第四节' : '第三节'}
            title="提示词全文"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="m-0 font-serif text-[12px] tracking-[0.08em] text-[#8a8577] dark:text-[#8b8577]">可整段复制，替换其中的占位项。</p>
              <button
                type="button"
                onClick={copyPrompt}
                className="rounded border border-[#b8ae94] px-2.5 py-1 text-[11px] text-[#514c41] transition hover:border-[#977637] dark:border-[#55584f] dark:text-[#b9b3a4]"
              >
                {copied ? '已复制' : '复制提示词'}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-[#b8ae94] bg-[#faf8f0] p-4 font-mono text-[12px] leading-6 text-[#2c2a23] dark:border-[#55584f] dark:bg-[#121417] dark:text-gray-200">
              {method.prompt}
            </pre>
          </BookSection>
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
