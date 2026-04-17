'use client'

import { useEffect, useId, useState } from 'react'

export default function WebLlmModal() {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'web-llm-nav no-underline hover:no-underline',
          'web-llm-float',
          open ? 'web-llm-nav-active' : '',
        ].join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="web-llm-nav-icon shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v2.2" />
          <path d="M8.2 8.2h7.6a2.8 2.8 0 0 1 2.8 2.8v4.6a2.8 2.8 0 0 1-2.8 2.8H8.2a2.8 2.8 0 0 1-2.8-2.8V11a2.8 2.8 0 0 1 2.8-2.8Z" />
          <path d="M9.5 12.7h.01" />
          <path d="M14.5 12.7h.01" />
          <path d="M9 16h6" />
          <path d="M7 8.7 5.4 7.5" />
          <path d="M17 8.7l1.6-1.2" />
        </svg>
        <span className="web-llm-nav-label">大模型问答</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f1a12]/55 px-3 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div className="flex h-[min(88vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#e8e0cc] bg-[#fdfdf0] shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eee] px-4 py-3 dark:border-gray-800">
              <h2
                id={titleId}
                className="mb-0 border-0 pb-0 text-lg font-normal text-[#222] dark:text-gray-100"
              >
                大模型问答
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-gray-200/90 bg-white text-lg leading-none text-[#555] transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <iframe
              title="大模型问答"
              src="/web-llm/embed"
              className="min-h-0 w-full flex-1 border-0 bg-[#fdfdf0] dark:bg-gray-900"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
