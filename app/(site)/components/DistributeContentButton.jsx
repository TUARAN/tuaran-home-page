'use client'

import { adminArticleDistributionHref, resolveDistributionContentKey } from '../../../lib/distribution/contentKey'
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
      <path d="M2 11.5 12 2.5" />
      <path d="m5 2.5 7 0 0 7" />
      <path d="M2 5v6.5h6.5" />
    </svg>
  )
}

export default function DistributeContentButton({ category, slug }) {
  const { loading, isOwner } = useSessionAccount()
  const contentKey = resolveDistributionContentKey(category, slug)

  if (loading || !isOwner || !contentKey) return null

  return (
    <a
      href={adminArticleDistributionHref(contentKey)}
      className="article-action-button owner-only-action px-3 py-1 text-xs"
      title="前往后台分发智能体页，为当前文章建分发任务"
    >
      <DistributeIcon />
      <span>文章分发</span>
    </a>
  )
}
