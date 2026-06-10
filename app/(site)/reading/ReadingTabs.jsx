'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const TAB_ALL = 'all'

function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

export default function ReadingTabs({ categories, reviews }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const validTabs = useMemo(() => [TAB_ALL, ...categories.map((item) => item.slug)], [categories])
  const initialTab = (() => {
    const fromUrl = searchParams?.get('tab')
    return validTabs.includes(fromUrl) ? fromUrl : TAB_ALL
  })()
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    const fromUrl = searchParams?.get('tab')
    const next = validTabs.includes(fromUrl) ? fromUrl : TAB_ALL
    if (next !== tab) setTab(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, validTabs])

  function selectTab(next) {
    setTab(next)
    router.replace(next === TAB_ALL ? '/reading' : `/reading?tab=${next}`, { scroll: false })
  }

  const reviewCounts = useMemo(() => {
    const counts = Object.fromEntries(categories.map((item) => [item.slug, 0]))
    counts[TAB_ALL] = reviews.length
    for (const review of reviews) {
      counts[review.category] = (counts[review.category] || 0) + 1
    }
    return counts
  }, [categories, reviews])

  const visibleCategories = tab === TAB_ALL ? categories : categories.filter((item) => item.slug === tab)

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 border-b border-[#dee0db] pb-2 dark:border-gray-800">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
          Book Notes
        </p>
        <nav aria-label="书库分类" className="flex flex-nowrap items-center gap-4 overflow-x-auto text-sm">
          <button
            type="button"
            onClick={() => selectTab(TAB_ALL)}
            className={classNames(
              'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-2 transition-colors',
              tab === TAB_ALL
                ? 'border-[#333] font-semibold text-[#222] dark:border-gray-100 dark:text-gray-100'
                : 'border-transparent text-[#616358] hover:text-[#222] dark:text-gray-400 dark:hover:text-gray-100',
            )}
          >
            <span>全部</span>
            <span className="text-[#999] dark:text-gray-500">{reviews.length}</span>
          </button>
          {categories.map((item) => {
            const active = tab === item.slug
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => selectTab(item.slug)}
                className={classNames(
                  'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-2 transition-colors',
                  active
                    ? 'border-[#333] font-semibold text-[#222] dark:border-gray-100 dark:text-gray-100'
                    : 'border-transparent text-[#616358] hover:text-[#222] dark:text-gray-400 dark:hover:text-gray-100',
                )}
              >
                <span>{item.label}</span>
                <span className="text-[#999] dark:text-gray-500">{reviewCounts[item.slug] || 0}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-6">
        {visibleCategories.map((category) => {
          const categoryReviews = reviews.filter((review) => review.category === category.slug)
          return (
            <section
              key={category.slug}
              className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5"
            >
              <div className="flex flex-col gap-3 border-b border-[#eee] pb-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#555] text-[11px] font-semibold text-white dark:bg-gray-600">
                      {category.no}
                    </span>
                    <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100">{category.label}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#666] dark:text-gray-300">{category.description}</p>
                </div>
                <div className="shrink-0 rounded-md border border-[#dee0db] bg-[#f6f7f4] px-3 py-2 text-xs text-[#646658] dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                  {categoryReviews.length ? `${categoryReviews.length} 篇笔记` : '待读书评'}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-[#63655f] dark:text-gray-400">书单</p>
                <div className="flex flex-wrap gap-2">
                  {category.books.map((book) => (
                    <span
                      key={`${category.slug}-${book}`}
                      className="rounded-full border border-[#d1d3cb] bg-white/70 px-2 py-1 text-xs text-[#53554d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300"
                    >
                      《{book}》
                    </span>
                  ))}
                </div>
              </div>

              {categoryReviews.length ? (
                <div className="mt-5 space-y-4">
                  {categoryReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-[#777] dark:text-gray-400">
                  这个分类先回收为一级书单，后续只补成文书评或读书笔记。
                </p>
              )}
            </section>
          )
        })}
      </div>
    </section>
  )
}

function ReviewCard({ review }) {
  return (
    <article className="rounded-md border border-[#dee0db] bg-[#fafbf9] p-4 dark:border-gray-800 dark:bg-gray-950/60">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#d1d3cb] bg-white px-2 py-[1px] text-[11px] text-[#53554d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
          {review.kind}
        </span>
        <h3 className="text-base font-semibold text-[#333] dark:text-gray-100">{review.title}</h3>
      </div>
      {review.summary ? <p className="mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">{review.summary}</p> : null}

      {review.paragraphs?.length ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-[#666] dark:text-gray-300">
          {review.paragraphs.map((paragraph, index) => (
            <p key={`${review.id}-p-${index}`} className="m-0">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {review.notes?.length ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-[#666] dark:text-gray-300">
          {review.notes.map((note, index) => (
            <div key={`${review.id}-note-${index}`} className="space-y-1">
              {note.original ? (
                <p className="m-0 font-semibold text-[#444] dark:text-gray-200">{note.original}</p>
              ) : null}
              <p className="m-0">{note.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      {review.table?.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#dee0db] dark:border-gray-800">
                <th className="py-2 pr-4 text-left text-xs font-bold text-[#444] dark:text-gray-200">派系</th>
                <th className="py-2 pr-4 text-left text-xs font-bold text-[#444] dark:text-gray-200">核心问题</th>
                <th className="py-2 pr-4 text-left text-xs font-bold text-[#444] dark:text-gray-200">代表人物</th>
                <th className="py-2 pr-4 text-left text-xs font-bold text-[#444] dark:text-gray-200">代表书籍</th>
                <th className="py-2 text-left text-xs font-bold text-[#444] dark:text-gray-200">一句话定位</th>
              </tr>
            </thead>
            <tbody className="text-[#666] dark:text-gray-300">
              {review.table.map((row) => (
                <tr key={`${row.school}-${row.figure}-${row.book}`} className="border-b border-[#eee] dark:border-gray-800">
                  <td className="whitespace-nowrap py-3 pr-4 font-semibold text-[#444] dark:text-gray-200">{row.school}</td>
                  <td className="py-3 pr-4">{row.question}</td>
                  <td className="whitespace-nowrap py-3 pr-4">{row.figure}</td>
                  <td className="whitespace-nowrap py-3 pr-4">《{row.book}》</td>
                  <td className="py-3">{row.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  )
}
