import Link from 'next/link'

/**
 * RSS 订阅按钮：链到 /rss.xml，样式复用 .article-action-button，
 * 放在文章页头部操作区（与「分享」并列）。新标签页打开，避免打断阅读。
 *
 * props:
 * - size:  'sm'（默认）/ 'md'
 * - label: 按钮文案，默认「订阅」
 */
export default function RssButton({ size = 'sm', label = '订阅', className = '' }) {
  const paddingClass = size === 'md' ? 'px-3.5 py-1.5 text-sm' : 'px-3 py-1 text-xs'

  return (
    <Link
      href="/rss.xml"
      target="_blank"
      rel="noopener"
      title="RSS 订阅"
      aria-label="RSS 订阅"
      className={`article-action-button ${paddingClass} ${className}`}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="3.6" cy="12.4" r="1.1" fill="currentColor" stroke="none" />
        <path d="M2.6 8.1A5.3 5.3 0 0 1 7.9 13.4" />
        <path d="M2.6 4.5A8.9 8.9 0 0 1 11.5 13.4" />
      </svg>
      <span>{label}</span>
    </Link>
  )
}
