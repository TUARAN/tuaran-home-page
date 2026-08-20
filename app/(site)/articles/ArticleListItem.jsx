'use client'

import Link from 'next/link'

import CanvasOriginBadge from '../components/CanvasOriginBadge'
import {
  CONTENT_GROUP_META,
  SUBJECT_META,
  getContentGroup,
  getDisplaySubject,
} from '../../../lib/contentTaxonomy'

const KIND_TAG_CLASS = {
  article: 'border-[#d8d5ce] bg-transparent text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]',
  analysis: 'border-[#d8d5ce] bg-transparent text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]',
  practice: 'border-[#d8d5ce] bg-transparent text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]',
  interactive: 'border-[#d8d5ce] bg-transparent text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]',
  resource: 'border-[#d8d5ce] bg-transparent text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]',
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function formatPv(pv) {
  if (pv === null || typeof pv === 'undefined') return '-'
  const number = Number(pv)
  if (!Number.isFinite(number) || number < 0) return '-'
  if (number === 0) return '0'
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(number)
}

/**
 * 内容目录的单行条目。同时被静态 fallback（服务端）和交互目录（客户端）复用，
 * 保证初始 HTML 与 hydration 后的布局完全一致，避免先卡片后换行的样式跳变。
 * @param {{ item: object, position?: number, fromSearch?: boolean, selectedSubject?: string }} props
 */
export default function ArticleListItem({ item, position, fromSearch = false, selectedSubject = 'all' }) {
  const external = isExternalHref(item.href)
  const group = getContentGroup(item.contentKind)
  const displaySubject = getDisplaySubject(item.subjects, selectedSubject)
  const analyticsEvent = fromSearch
    ? 'search_result_click'
    : group === 'resource'
      ? 'resource_action'
      : 'entry_click'

  return (
    <Link
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      data-analytics-event={analyticsEvent}
      data-analytics-surface={fromSearch ? 'directory_search' : 'directory'}
      data-analytics-destination-kind={item.contentKind}
      data-analytics-destination-id={item.id}
      data-analytics-subject={item.subjects?.[0] || ''}
      data-analytics-delivery={item.delivery || ''}
      data-analytics-action={group === 'resource' ? 'open' : ''}
      data-analytics-position={position}
      className="h5-feed-row article-row group block border-b border-[var(--site-line)] bg-transparent no-underline transition-colors last:border-b-0 hover:bg-white/80 hover:no-underline dark:hover:bg-[#151d27]"
    >
      <div className={`h5-feed-row-body grid items-start gap-3 px-[0.9rem] py-[0.7rem] md:gap-4 md:px-5 md:py-4 ${item.image ? 'grid-cols-[minmax(0,1fr)_72px] md:grid-cols-[minmax(0,1fr)_136px]' : ''}`}>
        <div className="min-w-0">
          <div className="mb-2 hidden min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:flex">
            <span className="shrink-0 text-sm text-[#a39aac]">▪</span>
            {item.dateLabel || item.date ? (
              <span className="shrink-0 whitespace-nowrap text-xs text-[#958aa1] dark:text-gray-400">
                {item.dateLabel || item.date}
              </span>
            ) : null}
            {displaySubject ? (
              <span className="inline-flex rounded-full border border-[#d8d5ce] bg-transparent px-2 py-[2px] text-[11px] text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]">
                {SUBJECT_META[displaySubject]?.label}
              </span>
            ) : null}
            <span
              className={[
                'inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border px-2 py-[2px] text-[11px]',
                KIND_TAG_CLASS[group] || KIND_TAG_CLASS.article,
              ].join(' ')}
            >
              {CONTENT_GROUP_META[group]?.label || '内容'}
            </span>
            <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" />
          </div>
          <h2 className="h5-feed-title line-clamp-2 text-[16px] font-semibold leading-snug text-[var(--site-ink)] transition-colors group-hover:text-[var(--site-accent-strong)] md:ml-5 md:text-[17px] md:leading-7">
            {item.title}
          </h2>
          {item.summary ? (
            <p className="h5-feed-summary mt-1 line-clamp-1 text-[13px] leading-5 text-[var(--site-muted)] transition-colors md:ml-5 md:mt-2 md:line-clamp-2 md:text-sm md:leading-relaxed">
              {item.summary}
            </p>
          ) : null}
          <div className="h5-feed-meta mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--site-faint)] md:ml-5 md:mt-2 md:gap-x-3 md:text-[13px]">
            <span className="hidden md:inline">{external ? '打开来源 →' : item.delivery === 'interact' ? '开始探索 →' : '打开内容 →'}</span>
            {item.dateLabel || item.date ? (
              <span className="md:hidden">{item.dateLabel || item.date}</span>
            ) : null}
            {item.readingMinutes ? <span className="hidden font-mono text-[11px] md:inline">· {item.readingMinutes} min</span> : null}
            {'pv' in item ? (
              <span className="font-mono text-[11px]">{item.dateLabel || item.date ? ' · ' : ''}阅读量 {item.pvLoading ? '-' : formatPv(item.pv)}</span>
            ) : null}
          </div>
        </div>
        {item.image ? (
          <div className="h5-feed-thumb relative h-[72px] overflow-hidden rounded-[4px] border border-[var(--site-line)] bg-[var(--site-panel)] dark:bg-gray-950 md:h-24 md:w-[136px] md:rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image.src}
              alt={item.image.alt || `${item.title} 配图`}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                const box = event.currentTarget.parentElement
                if (box) box.style.display = 'none'
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        ) : null}
      </div>
    </Link>
  )
}
