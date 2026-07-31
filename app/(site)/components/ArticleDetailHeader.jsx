import Link from 'next/link'

import { AuthorByline } from './ArticleAuthorIntro'

export default function ArticleDetailHeader({
  categoryHref,
  categoryLabel,
  dateLabel,
  dateTime,
  readingMinutes,
  pvNode,
  metaExtras,
  actions,
  title,
  summary,
  summaryLabel = '',
  tags = [],
}) {
  return (
    <header className="research-article-header mb-8 border-b pb-4">
      <div className="research-article-meta flex flex-wrap items-center gap-2 text-xs">
        <Link href="/articles" className="opacity-80 underline underline-offset-4 hover:opacity-100">
          统一内容目录
        </Link>
        <span aria-hidden="true">·</span>
        <Link
          href={categoryHref}
          className="opacity-80 underline underline-offset-4 hover:opacity-100"
        >
          {categoryLabel}
        </Link>
        {metaExtras}
        {dateLabel ? (
          <>
            <span aria-hidden="true">·</span>
            <time dateTime={dateTime || dateLabel}>{dateLabel}</time>
          </>
        ) : null}
        {readingMinutes ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes} min read</span>
          </>
        ) : null}
        {pvNode ? (
          <>
            <span aria-hidden="true">·</span>
            {pvNode}
          </>
        ) : null}
        {actions}
      </div>

      <h1 className="research-article-title mt-3 text-2xl leading-snug">{title}</h1>

      <aside className="research-summary-box mt-4 border-l-2 px-4 py-3 text-sm leading-7">
        <AuthorByline />
        {summary ? (
          <div className="research-summary-divider mt-2 border-t pt-3">
            {summaryLabel ? (
              <span className="research-summary-label mr-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                {summaryLabel}
              </span>
            ) : null}
            {summary}
          </div>
        ) : null}
      </aside>

      {tags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="research-pill px-2 py-0.5 text-[11px]">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  )
}
