import Link from 'next/link'

import { AuthorByline } from './ArticleAuthorIntro'
import OwnerOnlyArticleMeta from './OwnerOnlyArticleMeta'
import { CONTENT_GROUP_META, SUBJECT_META, getContentGroup } from '../../../lib/contentTaxonomy'

export default function ArticleDetailHeader({
  categoryHref,
  categoryLabel,
  dateLabel,
  dateTime,
  readingMinutes,
  pvNode,
  metaExtras,
  ownerMeta,
  actions,
  title,
  summary,
  summaryLabel = '',
  tags = [],
  taxonomy,
}) {
  const subjectId = taxonomy?.subjects?.[0]
  const groupId = taxonomy?.contentKind ? getContentGroup(taxonomy.contentKind) : ''
  const subjectLabel = SUBJECT_META[subjectId]?.label
  const typeLabel = CONTENT_GROUP_META[groupId]?.label

  return (
    <header className="research-article-header mb-8 border-b pb-4">
      <div className="research-article-meta flex flex-wrap items-center gap-2 text-xs">
        <Link href="/articles" className="opacity-80 underline underline-offset-4 hover:opacity-100">
          统一内容目录
        </Link>
        {subjectLabel && typeLabel ? (
          <>
            <span aria-hidden="true">·</span>
            <Link
              href={`/articles?subject=${subjectId}`}
              className="rounded-md border border-[#d8d5ce] bg-transparent px-2 py-0.5 text-[11px] text-[#6f6b63] no-underline transition hover:border-[#bdb8ae] hover:text-[#3f3b35] dark:border-[#373d48] dark:text-[#aeb5c0]"
            >
              {subjectLabel}
            </Link>
            <Link
              href={`/articles?group=${groupId}`}
              className="rounded-full border border-[#d8d5ce] bg-transparent px-2 py-0.5 text-[11px] text-[#6f6b63] no-underline transition hover:border-[#bdb8ae] hover:text-[#3f3b35] dark:border-[#373d48] dark:text-[#aeb5c0]"
            >
              {typeLabel}
            </Link>
          </>
        ) : (
          <>
            <span aria-hidden="true">·</span>
            <Link
              href={categoryHref}
              className="opacity-80 underline underline-offset-4 hover:opacity-100"
            >
              {categoryLabel}
            </Link>
          </>
        )}
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
        {ownerMeta ? <OwnerOnlyArticleMeta {...ownerMeta} /> : null}
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
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="内容标签">
          <span className="text-[10px] text-[#958aa1] dark:text-gray-500">标签</span>
          {tags.map((tag) => (
            <span key={tag} className="research-pill px-2 py-0.5 text-[11px] opacity-70">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  )
}
