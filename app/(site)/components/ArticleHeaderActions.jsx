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
        <details className="article-owner-actions">
          <summary className="article-owner-actions-trigger" aria-label="展开站长工具">
            <svg viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="6" width="9" height="6.5" rx="2" />
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
            </svg>
            <span>站长</span>
            <svg className="article-owner-actions-chevron" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3.5 5.5 3.5 3 3.5-3" />
            </svg>
          </summary>
          <div className="article-owner-actions-popover" aria-label="站长工具">
            <div className="article-owner-actions-tools">{children}</div>
          </div>
        </details>
      ) : null}
    </div>
  )
}
