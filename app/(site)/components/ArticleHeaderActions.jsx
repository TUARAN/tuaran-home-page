'use client'

import RssButton from './RssButton'
import SharePageButton from './SharePageButton'
import { useSessionAccount } from './SessionProvider'

export default function ArticleHeaderActions({
  title,
  text,
  url,
  children,
  actionsEnabled = true,
  className = '',
}) {
  const { loading, isOwner } = useSessionAccount()

  return (
    <div className={`article-header-actions ${className}`}>
      <div className="article-reader-actions" aria-label="文章操作">
        {actionsEnabled ? <SharePageButton title={title} text={text} url={url} /> : null}
        <RssButton label="RSS" />
      </div>
      {actionsEnabled && children && !loading && isOwner ? (
        <div className="article-owner-actions" aria-label="站长工具">
          <span className="article-owner-actions-label">
            <svg viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="6" width="9" height="6.5" rx="2" />
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
            </svg>
            <span>站长</span>
          </span>
          <div className="article-owner-actions-tools">{children}</div>
        </div>
      ) : null}
    </div>
  )
}
