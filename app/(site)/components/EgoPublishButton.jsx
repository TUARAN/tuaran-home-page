'use client'

import { useState } from 'react'

import { buildEgoPublishPrompt } from '../../../lib/article/egoPublishPrompt'
import { copyPlainText } from '../../../lib/content/contentClipboard'
import { useSessionAccount } from './SessionProvider'

export default function EgoPublishButton({ title, url, summary = '', tags = [], markdown = '' }) {
  const { loading, isOwner } = useSessionAccount()
  const [state, setState] = useState('idle')

  if (loading || !isOwner || !markdown) return null

  async function handleCopy() {
    const prompt = buildEgoPublishPrompt({ title, url, summary, tags, markdown })
    const copied = await copyPlainText(prompt)
    setState(copied ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), 2000)
  }

  const label = state === 'copied' ? '已复制' : state === 'failed' ? '复制失败' : 'ego'

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      title="复制给智能体的发布指令：用 ego lite 的 Aran 账号发布到掘金、CSDN"
      className="article-action-button owner-only-action px-3 py-1 text-xs"
    >
      <EgoIcon />
      <span>{label}</span>
    </button>
  )
}

function EgoIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2" width="11" height="9" rx="1.5" />
      <path d="m4 5.5 1.75 1.5L4 8.5" />
      <path d="M7.5 8.5H10" />
    </svg>
  )
}
