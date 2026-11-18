import { Skeleton } from '../../components/loading/LoadingPrimitives'

const PARAGRAPHS = [
  { heading: false, widths: ['100%', '96%', '68%'] },
  { heading: false, widths: ['100%', '92%', '80%'] },
  { heading: true, widths: [] },
  { heading: false, widths: ['98%', '100%', '74%'] },
  { heading: false, widths: ['100%', '88%'] },
  { heading: true, widths: [] },
  { heading: false, widths: ['96%', '100%', '62%'] },
]

function ParagraphSkeleton({ widths, index }) {
  return (
    <div className="space-y-2">
      {widths.map((width, line) => (
        <Skeleton
          key={line}
          className="h-3.5 rounded"
          style={{ width, '--skeleton-index': index + line }}
        />
      ))}
    </div>
  )
}

/**
 * 文章详情页的页面级骨架。文案和留白贴近 ArticleDetailHeader + 正文首屏，
 * 让站内导航切换后立刻有稳定的结构，不出现整页跳变。
 */
export default function ArticleReadingSkeleton({ label = '正在打开文章' }) {
  return (
    <div
      className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-8"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>

      <header className="mb-4 border-b border-[var(--site-line)] pb-4" aria-hidden="true">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-5 space-y-2.5">
          <Skeleton className="h-7 w-[94%] rounded-md sm:h-9" />
          <Skeleton className="h-7 w-[64%] rounded-md sm:h-9" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-12 rounded" />
          <Skeleton className="h-3.5 w-16 rounded" />
        </div>
      </header>

      <div className="mb-6 rounded-lg border border-[var(--site-line)] p-4" aria-hidden="true">
        <Skeleton className="h-3 w-14 rounded" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-[86%] rounded" />
          <Skeleton className="h-3.5 w-[58%] rounded" />
        </div>
      </div>

      <div className="space-y-4" aria-hidden="true">
        {PARAGRAPHS.map((paragraph, index) => (
          paragraph.heading ? (
            <Skeleton key={index} className="mt-6 h-5 w-40 rounded-md" />
          ) : (
            <ParagraphSkeleton key={index} widths={paragraph.widths} index={index * 3} />
          )
        ))}
      </div>
    </div>
  )
}
