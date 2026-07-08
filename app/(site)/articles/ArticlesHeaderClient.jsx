'use client'

import { useEffect, useState } from 'react'
import KnowledgeHeatmapClient from './KnowledgeHeatmapClient'
import { LLM_HALLUCINATION_RATE_REFERENCE } from '../../../lib/llmHallucinationRate'

function formatDateLabel(value) {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return String(value)
  return `${year}.${Number(month)}.${Number(day)}`
}

export default function ArticlesHeaderClient({ items }) {
  const [expanded, setExpanded] = useState(false)
  const [hallucinationRate, setHallucinationRate] = useState(LLM_HALLUCINATION_RATE_REFERENCE)

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
            创作 / 调研 / 资源
          </h1>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.8] text-[#5c5e52] dark:text-[#9aa5b6]">
            我们都不喜欢被营销 FOMO 情绪/焦虑情绪推着走，所以多给几分钟时间，认真找来源、查事实。
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
