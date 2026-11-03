'use client'

import { useState } from 'react'

export const WECHAT_ID = 'atar24'

export default function WeChatContact({ tone = 'site', className = '' }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(WECHAT_ID)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const toneClass = tone === 'dark'
    ? 'border-[#2d4d61] bg-[#102032] text-[#7fe6da] hover:border-[#34e0d0]'
    : 'border-[var(--site-line)] bg-[var(--site-panel)] text-[var(--site-ink)] hover:border-[var(--site-line-strong)]'

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[12px] transition ${toneClass} ${className}`}
      aria-label={`复制微信号 ${WECHAT_ID}`}
    >
      <span>微信 {WECHAT_ID}</span>
      <span>{copied ? '已复制' : '复制'}</span>
    </button>
  )
}
