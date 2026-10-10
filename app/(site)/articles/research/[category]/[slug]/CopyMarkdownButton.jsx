'use client'

import { useState } from 'react'
import { copyPlainText } from '../../../../../../lib/contentClipboard'

export default function CopyMarkdownButton({ markdown }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const result = await copyPlainText(markdown)
    if (!result) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      title="复制文章的 Markdown 源码"
      className="article-action-button px-3 py-1 text-xs"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? '已复制' : '复制 Markdown'}</span>
    </button>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="9" height="9" rx="1.5" />
      <path d="M10.5 4V2.5A1.5 1.5 0 0 0 9 1H2.5A1.5 1.5 0 0 0 1 2.5V9a1.5 1.5 0 0 0 1.5 1.5H4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7.5L6 11l5.5-7" />
    </svg>
  )
}
