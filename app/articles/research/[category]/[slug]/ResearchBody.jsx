'use client'

import { useEffect, useState } from 'react'

import DownloadPptButton from './DownloadPptButton'

const QUERY_KEY = 'v'

export default function ResearchBody({ variants, title, subtitle, fileBaseName, images }) {
  const list = Array.isArray(variants) && variants.length > 0 ? variants : []
  const [activeId, setActiveId] = useState(list[0]?.id)
  const active = list.find((v) => v.id === activeId) || list[0]

  // 进入时若 URL 带 ?v=xxx 且匹配某个变体，则切到那个变体
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = (params.get(QUERY_KEY) || '').toLowerCase()
    if (fromUrl && list.some((v) => v.id === fromUrl) && fromUrl !== activeId) {
      setActiveId(fromUrl)
    }
    // 仅在挂载时读一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectVariant(id) {
    setActiveId(id)
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    // 默认变体（第一个）不写 query，保持链接干净
    if (id === list[0]?.id) {
      url.searchParams.delete(QUERY_KEY)
    } else {
      url.searchParams.set(QUERY_KEY, id)
    }
    const next = url.pathname + (url.search || '') + (url.hash || '')
    window.history.replaceState(null, '', next)
  }

  if (!active) return null

  const pptFileName = `${fileBaseName || title || 'research'}${active.id && list.length > 1 ? `-${active.id}` : ''}`

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[#666] dark:text-gray-400">
        {list.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
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
                    onClick={() => selectVariant(v.id)}
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
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <DownloadPptButton
            title={title || ''}
            subtitle={subtitle || ''}
            markdown={active.content || ''}
            images={images || []}
            fileName={pptFileName}
          />
        </div>
      </div>

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
