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

  const toneClass = tone === 'panel'
    ? 'min-h-10 w-full justify-between rounded-xl border-[#3c372e] bg-[#1c1b17] text-[#f1f0ea] hover:border-[#8f9478]'
    : tone === 'dark'
      ? 'rounded-full border-[#2d4d61] bg-[#102032] text-[#7fe6da] hover:border-[#34e0d0]'
      : 'rounded-full border-[var(--site-line)] bg-[var(--site-panel)] text-[var(--site-ink)] hover:border-[var(--site-line-strong)]'

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`site-wechat-contact inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[12px] transition ${toneClass} ${className}`}
      aria-label={`复制微信号 ${WECHAT_ID}`}
    >
      <span>微信 {WECHAT_ID}</span>
      <span className={tone === 'panel' ? 'rounded-full bg-[#c1c6a8] px-2 py-0.5 text-[11px] font-semibold text-[#1a1a14]' : ''}>
        {copied ? '已复制' : '复制'}
      </span>
    </button>
  )
}
