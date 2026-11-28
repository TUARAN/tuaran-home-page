'use client'

import { useEffect, useState } from 'react'

import ArticleBoundaryFootnotes from '../../../components/ArticleBoundaryFootnotes'

const VARIANT_EVENT = 'research:variant'

/** 跟随 ResearchBody 当前变体，在页脚展示边界说明。 */
export default function ResearchBoundaryFootnotes({ variants }) {
  const list = Array.isArray(variants) ? variants : []
  const [activeId, setActiveId] = useState(list[0]?.id)

  useEffect(() => {
    if (typeof window === 'undefined') return
    function onVariant(event) {
      const next = event?.detail?.id
      if (next) setActiveId(next)
    }
    window.addEventListener(VARIANT_EVENT, onVariant)
    const params = new URLSearchParams(window.location.search)
    const fromUrl = (params.get('v') || '').toLowerCase()
    const initial = fromUrl && list.some((v) => v.id === fromUrl) ? fromUrl : list[0]?.id
    if (initial) setActiveId(initial)
    return () => window.removeEventListener(VARIANT_EVENT, onVariant)
  }, [list])

  const active = list.find((v) => v.id === activeId) || list[0]
  if (!active?.footnoteHtml) return null
  return <ArticleBoundaryFootnotes html={active.footnoteHtml} />
}