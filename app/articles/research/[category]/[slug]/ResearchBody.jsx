'use client'

import { useState } from 'react'

export default function ResearchBody({ variants }) {
  const list = Array.isArray(variants) && variants.length > 0 ? variants : []
  const [activeId, setActiveId] = useState(list[0]?.id)
  const active = list.find((v) => v.id === activeId) || list[0]

  if (!active) return null

  return (
    <>
      {list.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#666] dark:text-gray-400">
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#999] dark:text-gray-500">
            version
          </span>
          <div className="inline-flex overflow-hidden rounded-full border border-[#ddd8cb] bg-white/70 dark:border-[#2d3440] dark:bg-[#121821]">
            {list.map((v) => {
              const isActive = v.id === active.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveId(v.id)}
                  className={[
                    'px-3 py-1 text-[12px] transition',
                    isActive
                      ? 'bg-[#b7791f] text-white dark:bg-[#e2bd75] dark:text-[#1a1a1a]'
                      : 'text-[#5f5a4d] hover:bg-[#fbf3e3] dark:text-gray-300 dark:hover:bg-[#1a2230]',
                  ].join(' ')}
                  aria-pressed={isActive}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 md:flex-row">
        {active.toc?.length > 1 ? (
          <aside className="hidden md:block md:w-52 shrink-0">
            <nav className="toc-scroll-panel">
              <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
                目录
              </div>
              <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
                {active.toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}

        <main className="flex-1 min-w-0">
          <article
            key={active.id}
            className="prose-tuaran"
            dangerouslySetInnerHTML={{ __html: active.html }}
          />
        </main>
      </div>
    </>
  )
}
