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
      className="article-row group block border-b border-[#e8e2ef] bg-transparent no-underline transition-colors last:border-b-0 hover:bg-white/80 hover:no-underline dark:border-gray-800 dark:hover:bg-[#151d27]"
    >
      <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_136px] sm:px-5">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
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
          <h2 className="ml-5 line-clamp-2 text-[17px] font-semibold leading-7 text-[#20172f] transition-colors group-hover:text-[#120b1f] dark:text-gray-100 dark:group-hover:text-white">
            {item.title}
          </h2>
          {item.summary ? (
            <p className="ml-5 mt-2 line-clamp-2 text-sm leading-relaxed text-[#6b6472] transition-colors group-hover:text-[#3c3149] dark:text-gray-300 dark:group-hover:text-gray-200">
              {item.summary}
            </p>
          ) : null}
          <div className="ml-5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#958aa1] dark:text-gray-400">
            <span>{external ? '打开来源 →' : item.delivery === 'interact' ? '开始探索 →' : '打开内容 →'}</span>
            {item.readingMinutes ? <span className="font-mono text-[11px]">· {item.readingMinutes} min</span> : null}
            {'pv' in item ? (
              <span className="font-mono text-[11px]">· 阅读量 {item.pvLoading ? '-' : formatPv(item.pv)}</span>
            ) : null}
          </div>
        </div>
        {item.image ? (
          <div className="relative h-28 overflow-hidden rounded-md border border-[#ded8e4] bg-[#f3eff7] dark:border-gray-800 dark:bg-gray-950 sm:h-24 sm:w-[136px]">
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
