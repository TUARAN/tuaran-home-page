'use client'

/**
 * 统一后台分页条。API 约定：?offset=&limit=，响应返回 total。
 * 支持上一页 / 下一页 + 数字页码（带首尾与省略），滚动列表页统一使用。
 */

const PAGE_WINDOW = 2

function pageNumbers(page, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }
  const start = Math.max(2, page - PAGE_WINDOW)
  const end = Math.min(pageCount - 1, page + PAGE_WINDOW)
  const pages = []
  if (start > 2) pages.push('ellipsis-left')
  for (let value = start; value <= end; value += 1) pages.push(value)
  if (end < pageCount - 1) pages.push('ellipsis-right')
  return [1, ...pages, pageCount]
}

export default function AdminPagination({
  total = 0,
  offset = 0,
  limit = 20,
  onOffsetChange,
  loading = false,
  pageSizeOptions = null,
}) {
  const page = Math.floor(offset / limit) + 1
  const pageCount = Math.max(1, Math.ceil(total / limit))
  if (total <= limit && !pageSizeOptions) return null

  const go = (nextOffset) => {
    if (loading) return
    const clamped = Math.min(Math.max(0, nextOffset), Math.max(0, total - limit))
    onOffsetChange?.(clamped)
  }

  const base =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40'
  const idle =
    'border-[#d8dad0] bg-white text-[#53554d] hover:bg-[#edefe7] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:bg-[#151c25]'
  const active =
    'border-[#15140f] bg-[#15140f] text-white dark:border-gray-100 dark:bg-gray-100 dark:text-[#111827]'

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
      <p className="mb-0 text-[12px] text-[#858779] dark:text-[#8e9ab0]">
        共 {total.toLocaleString('zh-CN')} 条 · 第 {page} / {pageCount} 页
      </p>
      <nav aria-label="分页" className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`${base} ${idle}`}
          disabled={loading || page <= 1}
          onClick={() => go(offset - limit)}
        >
          上一页
        </button>
        {pageNumbers(page, pageCount).map((value, index) =>
          typeof value === 'string' ? (
            <span key={`${value}-${index}`} className="px-1 text-[12px] text-[#9a9c8e] dark:text-[#5d6b80]">
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              className={`${base} ${value === page ? active : idle}`}
              disabled={loading || value === page}
              onClick={() => go((value - 1) * limit)}
              aria-current={value === page ? 'page' : undefined}
            >
              {value}
            </button>
          ),
        )}
        <button
          type="button"
          className={`${base} ${idle}`}
          disabled={loading || page >= pageCount}
          onClick={() => go(offset + limit)}
        >
          下一页
        </button>
      </nav>
    </div>
  )
}
