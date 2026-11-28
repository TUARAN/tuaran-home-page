'use client'

import { useState } from 'react'

import { buildGuestDistributionTaskPrompt } from '../../../lib/distribution/taskPrompt'
import { copyPlainText } from '../../../lib/content/contentClipboard'

function GuestDistributeIcon() {
  return (
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
      <circle cx="7" cy="4.5" r="2" />
      <path d="M3.5 12v-1.2c0-1.5 1.6-2.3 3.5-2.3s3.5.8 3.5 2.3V12" />
      <path d="M10.5 3.5 12 2v3.5H10.5V3.5Z" />
    </svg>
  )
}

export default function ArticleGuestDistributeButton({
  title,
  url,
  summary = '',
  tags = [],
}) {
  const [state, setState] = useState('idle')

  async function handleClick() {
    if (state === 'working') return
    setState('working')
    const text = buildGuestDistributionTaskPrompt({ title, url, summary, tags })
    const ok = await copyPlainText(text)
    setState(ok ? 'done' : 'fail')
    window.setTimeout(() => setState('idle'), ok ? 2400 : 3200)
  }

  const label = state === 'working' ? '…' : state === 'done' ? '已复制' : state === 'fail' ? '失败' : '分发到我的号'

  return (
    <button
      type="button"
      onClick={handleClick}
      className="article-action-button px-3 py-1 text-xs"
      title="复制「自备账号」分发任务：用阿燃分发智能体 + ego lite 发到你的平台账号；不含全文，需打开原文链接"
    >
      <GuestDistributeIcon />
      <span>{label}</span>
    </button>
  )
}