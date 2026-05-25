'use client'

import { useState } from 'react'

export default function DownloadPptButton({ title, subtitle, markdown, images, fileName }) {
  const [state, setState] = useState('idle') // idle | working | done | failed

  function flash(next, ms = 2000) {
    setState(next)
    setTimeout(() => setState('idle'), ms)
  }

  async function handleClick() {
    if (state === 'working') return
    setState('working')
    try {
      const { generateAndDownloadPptx } = await import('../../../../../lib/research/pptx')
      await generateAndDownloadPptx({ title, subtitle, markdown, images, fileName })
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
      disabled={state === 'working'}
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
