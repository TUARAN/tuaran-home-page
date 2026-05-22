'use client'

import { useState } from 'react'

export default function CopyMarkdownButton({ markdown }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const flash = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    try {
      await navigator.clipboard.writeText(markdown)
      flash()
      return
    } catch {
      // navigator.clipboard 不可用（非安全上下文等）时退化到 execCommand
    }

    const ta = document.createElement('textarea')
    ta.value = markdown
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      flash()
    } catch {
      // 静默失败
    }
    document.body.removeChild(ta)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      title="复制本篇调研的 Markdown 源码"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ddd] bg-white px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#999] hover:text-[#222] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
    >
      {copied ? (
        <svg
          viewBox="0 0 14 14"
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 7.5L6 11l5.5-7" />
        </svg>
      ) : (
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
          <rect x="4" y="4" width="9" height="9" rx="1.5" />
          <path d="M10.5 4V2.5A1.5 1.5 0 0 0 9 1H2.5A1.5 1.5 0 0 0 1 2.5V9a1.5 1.5 0 0 0 1.5 1.5H4" />
        </svg>
      )}
      <span>{copied ? '已复制' : '复制 Markdown'}</span>
    </button>
  )
}
