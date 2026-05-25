'use client'

import { useEffect, useState } from 'react'

const QUERY_KEY = 'v'
const EVENT_NAME = 'research:variant'

function resolveInitialVariantId(variants) {
  if (typeof window === 'undefined') return variants[0]?.id || ''
  const fromUrl = (new URLSearchParams(window.location.search).get(QUERY_KEY) || '').toLowerCase()
  if (fromUrl && variants.some((v) => v.id === fromUrl)) return fromUrl
  return variants[0]?.id || ''
}

export default function DownloadPptButton({ title, subtitle, fileBaseName, images, variants }) {
  const list = Array.isArray(variants) && variants.length > 0 ? variants : []
  const [activeId, setActiveId] = useState(list[0]?.id)
  const [state, setState] = useState('idle') // idle | working | done | failed

  // Sync with ResearchBody: initial URL read + custom event subscription
  useEffect(() => {
    if (list.length === 0) return
    setActiveId(resolveInitialVariantId(list))
    function onVariant(e) {
      const next = e?.detail?.id
      if (next && list.some((v) => v.id === next)) setActiveId(next)
    }
    window.addEventListener(EVENT_NAME, onVariant)
    return () => window.removeEventListener(EVENT_NAME, onVariant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function flash(next, ms = 2000) {
    setState(next)
    setTimeout(() => setState('idle'), ms)
  }

  async function handleClick() {
    if (state === 'working') return
    const active = list.find((v) => v.id === activeId) || list[0]
    if (!active) {
      flash('failed', 2500)
      return
    }
    setState('working')
    try {
      const { generateAndDownloadPptx } = await import('../../../../../lib/research/pptx')
      const baseName = fileBaseName || title || 'research'
      const pptFileName = `${baseName}${active.id && list.length > 1 ? `-${active.id}` : ''}`
      await generateAndDownloadPptx({
        title,
        subtitle,
        markdown: active.content || '',
        images: images || [],
        fileName: pptFileName,
      })
      flash('done')
    } catch (err) {
      console.error('[ppt download]', err)
      flash('failed', 2500)
    }
  }

  const label =
    state === 'working' ? '生成中…' : state === 'done' ? '已下载' : state === 'failed' ? '失败' : 'PPT'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'working' || list.length === 0}
      aria-live="polite"
      title="把当前版本的调研下载为 PPT"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ddd] bg-white px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#999] hover:text-[#222] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
    >
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1.5" y="2" width="11" height="8" rx="1" />
        <path d="M5 12h4" />
        <path d="M7 10v2" />
      </svg>
      <span>{label}</span>
    </button>
  )
}
