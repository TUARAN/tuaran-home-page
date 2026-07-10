'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import KnowledgeHeatmapClient from './KnowledgeHeatmapClient'
import { LLM_HALLUCINATION_RATE_REFERENCE } from '../../../lib/llmHallucinationRate'

const PAGE_COPY = {
  picks: {
    title: '推荐入口',
  },
  all: {
    title: '知识库',
  },
  column: {
    title: '创作库',
  },
  posts: {
    title: '精选文章',
  },
  works: {
    title: '多维页面',
  },
  research: {
    title: '调研库',
  },
  companies: {
    title: '公司调研',
  },
  topics: {
    title: '事项调研',
  },
  people: {
    title: '人物调研',
  },
  resources: {
    title: '资源库',
  },
}

const TAB_KEYS = Object.keys(PAGE_COPY)

function normalizeTabFromParams(params) {
  const fromUrl = params?.get('tab')
  if (TAB_KEYS.includes(fromUrl)) return fromUrl
  if (params?.get('resource_type')) return 'resources'
  if (params?.get('company_type')) return 'companies'
  if (params?.get('topic_type')) return 'topics'
  if (params?.get('people_type')) return 'people'
  return 'all'
}

function formatDateLabel(value) {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return String(value)
  return `${year}.${Number(month)}.${Number(day)}`
}

export default function ArticlesHeaderClient({ items }) {
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(false)
  const [hallucinationRate, setHallucinationRate] = useState(LLM_HALLUCINATION_RATE_REFERENCE)
  const activeTab = normalizeTabFromParams(searchParams)
  const pageCopy = PAGE_COPY[activeTab] || PAGE_COPY.all

  useEffect(() => {
    let cancelled = false
    fetch('/api/llm-hallucination-rate', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.rate) setHallucinationRate(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const checkedAt = formatDateLabel(hallucinationRate.checkedAt)

  return (
    <header className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
            {pageCopy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.8] text-[#5c5e52] dark:text-[#9aa5b6]">
            我们都不喜欢被营销 FOMO 情绪/焦虑情绪推着走，多给几分钟时间，认真找来源、查事实，世界这么大与我何干？
            调研把 AI 当作扩大检索面、整理材料和压缩信息的助手，不让它替事实背书：约六成内容由 AI 协助处理，三成落在可追溯引用上，一成才是我的观点。工作流要求它以客观事实为起点、说明缘由；具体结论仍应回到来源核对。
            LLM {checkedAt} 幻觉率参考：
            <a
              href={hallucinationRate.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mx-1 font-medium text-[#4f5f3a] underline decoration-dotted underline-offset-4 hover:text-[#222] dark:text-[#c1c6a8] dark:hover:text-white"
              title={`${hallucinationRate.model || 'LLM'} · ${hallucinationRate.benchmark || 'benchmark'} · ${hallucinationRate.metric || 'hallucination rate'}`}
            >
              {hallucinationRate.rate}
            </a>
            （{hallucinationRate.model}，{hallucinationRate.benchmark}）
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 align-baseline text-[12.5px] font-medium text-amber-800 transition-colors hover:bg-amber-200 hover:text-amber-950 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
            >
              <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                className={[
                  'h-3 w-3 shrink-0 self-center transition-transform',
                  expanded ? 'rotate-180' : '',
                ].join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4.5 6 7.5 9 4.5" />
              </svg>
              {expanded ? '收起热力图' : '展开热力图'}
            </button>
          </p>
        </div>
      </div>
      <div className="mt-2">
        <KnowledgeHeatmapClient
          items={items}
          expanded={expanded}
          onToggle={setExpanded}
          hideOwnToggle
        />
      </div>
    </header>
  )
}
