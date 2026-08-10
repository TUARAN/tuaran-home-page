import Link from 'next/link'

import { AuthorByline } from './ArticleAuthorIntro'
import OwnerOnlyArticleMeta from './OwnerOnlyArticleMeta'
import {
  CONTENT_GROUP_META,
  CONTENT_KIND_META,
  SUBJECT_META,
  getContentGroup,
} from '../../../lib/contentTaxonomy'

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
  const typeLabel = CONTENT_KIND_META[taxonomy?.contentKind]?.label || CONTENT_GROUP_META[groupId]?.label

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

      {subjectLabel && typeLabel ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="内容分类">
          <Link
            href={`/articles?subject=${subjectId}`}
            className="group rounded-xl border border-[#cdb6df] bg-[#f7effc] px-3 py-2.5 no-underline transition hover:border-[#9874b4] hover:bg-white dark:border-[#523968] dark:bg-[#24182f] dark:hover:border-[#755291]"
          >
            <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b6a9e] dark:text-[#b99dca]">主题</span>
            <span className="mt-0.5 block text-sm font-semibold text-[#56366d] dark:text-[#e1c9ed]">{subjectLabel}</span>
          </Link>
          <Link
            href={`/articles?group=${groupId}`}
            className="group rounded-xl border border-[#a9d4d8] bg-[#edf9f9] px-3 py-2.5 no-underline transition hover:border-[#5fa8ae] hover:bg-white dark:border-[#285158] dark:bg-[#102428] dark:hover:border-[#3b7980]"
          >
            <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#56868a] dark:text-[#82bdc1]">类型</span>
            <span className="mt-0.5 block text-sm font-semibold text-[#1e686e] dark:text-[#b7e5e8]">{typeLabel}</span>
          </Link>
        </div>
      ) : null}

      {tags.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="内容标签">
          <span className="text-[10px] text-[#958aa1] dark:text-gray-500">标签</span>
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
