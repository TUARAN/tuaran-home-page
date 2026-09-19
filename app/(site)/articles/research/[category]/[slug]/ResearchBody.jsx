'use client'

import { useEffect, useState } from 'react'

import ZoomableResearchMedia from '../../../../components/ZoomableResearchMedia'
import ArticleToc from '../../../../components/ArticleToc'
import ReadAloudButton from '../../../../components/ReadAloudButton'

const QUERY_KEY = 'v'
const VARIANT_EVENT = 'research:variant'

function dispatchVariant(id) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(VARIANT_EVENT, { detail: { id } }))
}

export default function ResearchBody({ variants }) {
  const list = Array.isArray(variants) && variants.length > 0 ? variants : []
  const [activeId, setActiveId] = useState(list[0]?.id)
  const active = list.find((v) => v.id === activeId) || list[0]

  // 挂载时：若 URL 带 ?v=xxx 且匹配某个变体，则切到那个变体；
  // 无论是否切换，都广播一次当前 active id，让头部的 PPT 按钮等订阅者同步状态。
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = (params.get(QUERY_KEY) || '').toLowerCase()
    const next = fromUrl && list.some((v) => v.id === fromUrl) ? fromUrl : list[0]?.id
    if (next && next !== activeId) setActiveId(next)
    if (next) dispatchVariant(next)
    // 仅在挂载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectVariant(id) {
    setActiveId(id)
    dispatchVariant(id)
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

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <ArticleToc items={active.toc} />

      <div className="flex-1 min-w-0">
        {list.length > 1 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#666] dark:text-gray-400">
            <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#999] dark:text-gray-500">
              version
            </span>
            <div className="inline-flex overflow-hidden rounded-full border border-[#d1d3cb] bg-white/70 dark:border-[#2d3440] dark:bg-[#121821]">
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
                        ? 'bg-[#b7791f] text-white dark:bg-[#9ba475] dark:text-[#1a1a1a]'
                        : 'text-[#53554d] hover:bg-[#ebede3] dark:text-gray-300 dark:hover:bg-[#1a2230]',
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
        <ReadAloudButton markdown={active.content} portal />
        <ZoomableResearchMedia contentKey={active.id} html={active.html} />
      </div>
    </div>
  )
}
