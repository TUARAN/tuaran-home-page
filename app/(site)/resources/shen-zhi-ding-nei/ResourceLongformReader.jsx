'use client'

function TocList({ items, className = '' }) {
  if (!items?.length) return null
  return (
    <ul className={['text-sm text-[#666] space-y-1.5 dark:text-gray-300', className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <li
          key={item.id}
          className={item.depth === 3 ? 'pl-3 border-l border-[#e8e8e2] dark:border-[#2a2d24]' : ''}
        >
          <a
            href={`#${item.id}`}
            className={[
              'block leading-snug opacity-90 hover:opacity-100 underline underline-offset-4',
              item.kind === 'volume'
                ? 'font-semibold text-[#333] dark:text-gray-100'
                : item.kind === 'preface'
                  ? 'font-medium text-[#444] dark:text-gray-200'
                  : 'text-[#555] dark:text-gray-300',
            ].join(' ')}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function ResourceLongformReader({ toc, html }) {
  const safeToc = toc || []
  const hasToc = safeToc.length > 0
  const volumeItems = safeToc.filter((item) => item.kind === 'volume' || item.kind === 'preface')
  const sectionItems = safeToc.filter((item) => item.kind === 'section')

  const groupedToc = []
  let current = null
  for (const item of safeToc) {
    if (item.depth === 2) {
      current = { heading: item, sections: [] }
      groupedToc.push(current)
      continue
    }
    if (item.depth === 3 && current) {
      current.sections.push(item)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {hasToc ? (
        <details className="rounded-xl border border-[#e8e8e2] bg-[#f8f8f4] p-4 md:hidden dark:border-[#2a2d24] dark:bg-[#141612]">
          <summary className="cursor-pointer text-sm font-semibold text-[#333] dark:text-gray-200">文章目录</summary>
          <div className="toc-scroll-panel mt-4 max-h-[60vh]">
            {groupedToc.map((group) => (
              <div key={group.heading.id} className="mb-4 last:mb-0">
                <a
                  href={`#${group.heading.id}`}
                  className="text-sm font-semibold text-[#333] underline underline-offset-4 dark:text-gray-100"
                >
                  {group.heading.text}
                </a>
                {group.sections.length ? (
                  <TocList items={group.sections} className="mt-2 space-y-1" />
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {hasToc ? (
          <aside className="hidden shrink-0 lg:sticky lg:top-24 lg:block lg:w-56 xl:w-60">
            <nav className="toc-scroll-panel rounded-xl border border-[#eee] bg-[#fafaf8] p-4 dark:border-gray-800 dark:bg-[#121410]">
              <div className="border-b border-[#eee] pb-2 mb-3 text-sm font-bold text-[#333] dark:border-gray-800 dark:text-gray-200">
                文章目录
              </div>
              <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain pr-1">
                {groupedToc.map((group) => (
                  <div key={group.heading.id} className="mb-4 last:mb-0">
                    <a
                      href={`#${group.heading.id}`}
                      className={[
                        'block text-sm underline underline-offset-4',
                        group.heading.kind === 'volume'
                          ? 'font-semibold text-[#333] dark:text-gray-100'
                          : 'font-medium text-[#444] dark:text-gray-200',
                      ].join(' ')}
                    >
                      {group.heading.text}
                    </a>
                    {group.sections.length ? (
                      <TocList items={group.sections} className="mt-2 space-y-1" />
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-[#eee] pt-3 text-[11px] leading-relaxed text-[#999] dark:border-gray-800 dark:text-gray-500">
                共 {volumeItems.length} 个主章、{sectionItems.length} 个小节
              </p>
            </nav>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <article className="prose-tuaran prose-resource-longform" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  )
}
