'use client'

import { useState } from 'react'

import { buildDistributionClaimPrompt, buildDistributionTaskPrompt } from '../../../lib/distribution/taskPrompt'
import { copyPlainText } from '../../../lib/content/contentClipboard'
import { useSessionAccount } from './SessionProvider'

export default function EgoPublishButton({ title, url, summary = '', tags = [], markdown = '' }) {
  const { loading, isOwner } = useSessionAccount()
  const [state, setState] = useState('idle')

  if (loading || !isOwner || !markdown) return null

  // 先建任务台任务，复制领取指令；任务表未就绪或建任务失败时复制离线任务（整篇 Markdown）。
  async function buildPrompt() {
    try {
      const response = await fetch('/api/distribution/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, summary, tags, markdown }),
      })
      if (response.ok) {
        const job = await response.json()
        return { mode: 'job', text: buildDistributionClaimPrompt({ jobId: job.id, token: job.token, title, origin: window.location.origin }) }
      }
    } catch {
      // 网络失败同样退回离线任务。
    }
    return { mode: 'offline', text: buildDistributionTaskPrompt({ title, url, summary, tags, markdown }) }
  }

  async function handleCopy() {
    if (state === 'working') return
    setState('working')
    const prompt = await buildPrompt()
    const copied = await copyPlainText(prompt.text)
    setState(copied ? (prompt.mode === 'job' ? 'copied' : 'offline') : 'failed')
    setTimeout(() => setState('idle'), 2500)
  }

  const label = {
    working: '建任务…',
    copied: '已复制',
    offline: '已复制离线任务',
    failed: '复制失败',
  }[state] || 'ego'

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      title="建分发任务并复制领取指令：交给装了 2aran-distributor skill 的智能体，用 ego lite 发布到掘金、CSDN，结果回到后台任务台"
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
