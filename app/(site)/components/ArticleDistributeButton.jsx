'use client'

import { useState } from 'react'

import { adminArticleDistributionHref, resolveDistributionContentKey } from '../../../lib/distribution/contentKey'
import { buildDistributionClaimPrompt, buildDistributionTaskPrompt } from '../../../lib/distribution/taskPrompt'
import { copyPlainText } from '../../../lib/content/contentClipboard'
import { useSessionAccount } from './SessionProvider'

function DistributeIcon() {
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
      <rect x="1.5" y="2" width="11" height="9" rx="1.5" />
      <path d="m4 5.5 1.75 1.5L4 8.5" />
      <path d="M7.5 8.5H10" />
      <path d="M9.5 3.5 12 6" />
      <path d="M9.5 6V3.5H12" />
    </svg>
  )
}

export default function ArticleDistributeButton({
  category,
  slug,
  title,
  url,
  summary = '',
  tags = [],
  markdown = '',
}) {
  const { loading, isOwner } = useSessionAccount()
  const [state, setState] = useState('idle')
  const contentKey = resolveDistributionContentKey(category, slug)
  const adminHref = adminArticleDistributionHref(contentKey)

  if (loading || !isOwner || (!contentKey && !markdown)) return null

  async function buildPrompt() {
    if (!markdown) return { mode: 'admin', text: '' }
    try {
      const response = await fetch('/api/distribution/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, summary, tags, markdown, contentKey }),
      })
      if (response.ok) {
        const job = await response.json()
        return {
          mode: 'job',
          text: buildDistributionClaimPrompt({ jobId: job.id, token: job.token, title, origin: window.location.origin }),
        }
      }
    } catch {
      // 网络失败退回离线任务。
    }
    return { mode: 'offline', text: buildDistributionTaskPrompt({ title, url, summary, tags, markdown }) }
  }

  async function handleClick(event) {
    if (state === 'working') return
  /* 按住 Meta/Shift 打开后台，便于选平台和核对正文 */
    if (event.metaKey || event.shiftKey) {
      window.open(adminHref, '_blank', 'noopener,noreferrer')
      return
    }
    if (!markdown) {
      window.location.href = adminHref
      return
    }
    setState('working')
    const prompt = await buildPrompt()
    if (prompt.mode === 'admin') {
      window.location.href = adminHref
      setState('idle')
      return
    }
    const copied = await copyPlainText(prompt.text)
    setState(copied ? (prompt.mode === 'job' ? 'copied' : 'offline') : 'failed')
    setTimeout(() => setState('idle'), 2500)
  }

  const label = {
    working: '建任务…',
    copied: '已复制领取指令',
    offline: '已复制离线任务',
    failed: '复制失败',
  }[state] || '文章分发'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      title="建分发任务并复制领取指令，交给本机 2aran-distributor 智能体；Shift/⌘ 点击打开后台分发页选平台"
      className="article-action-button owner-only-action px-3 py-1 text-xs"
    >
      <DistributeIcon />
      <span>{label}</span>
    </button>
  )
}