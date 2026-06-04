'use client'

import { useState } from 'react'
import KnowledgeHeatmapClient from './KnowledgeHeatmapClient'

export default function ArticlesHeaderClient({ items }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <header className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
            专栏 & 调研 & 资料
          </h1>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.8] text-[#6e6452] dark:text-[#9aa5b6]">
            专栏：精选文章 / 工程作品；调研：专题 / 公司 / 事项；资料：站内资料 + 资源收藏。
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="ml-2 inline-flex items-baseline gap-1 align-baseline text-[12.5px] text-[#716958] transition-colors hover:text-[#222] dark:text-gray-400 dark:hover:text-gray-100"
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
