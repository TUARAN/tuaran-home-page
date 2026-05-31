'use client'

import { useEffect, useMemo, useState } from 'react'

function normalizeParam(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function toSet(arr) {
  return new Set(arr.filter(Boolean))
}

export default function TwitterBookmarksFilterClient({
  categories,
  formats,
  itemsMeta,
  initialSelectedCategories,
  initialSelectedFormats,
}) {
  const [selectedCategories, setSelectedCategories] = useState(() => toSet(normalizeParam(initialSelectedCategories)))
  const [selectedFormats, setSelectedFormats] = useState(() => toSet(normalizeParam(initialSelectedFormats)))
  const [isExpanded, setIsExpanded] = useState(true)

  const visibleState = useMemo(() => {
    const categoryActive = selectedCategories.size > 0
    const formatActive = selectedFormats.size > 0

    const visibleItemIds = new Set()
    const visibleCategorySectionIds = new Set()

    for (const item of itemsMeta) {
      const categoryOk = !categoryActive || selectedCategories.has(item.category)
      const formatOk = !formatActive || selectedFormats.has(item.format)
      const ok = categoryOk && formatOk

      if (ok) {
        visibleItemIds.add(item.id)
        if (item.categorySectionId) visibleCategorySectionIds.add(item.categorySectionId)
      }
    }

    return {
      visibleItemIds,
      visibleCategorySectionIds,
      count: visibleItemIds.size,
    }
  }, [itemsMeta, selectedCategories, selectedFormats])

  // Apply show/hide to DOM nodes rendered by the server component.
  useEffect(() => {
    const { visibleItemIds, visibleCategorySectionIds } = visibleState

    // Cards
    const cardNodes = document.querySelectorAll('[data-bookmark-id]')
    cardNodes.forEach((node) => {
      const id = node.getAttribute('data-bookmark-id')
      const shouldShow = id && visibleItemIds.has(id)
      node.classList.toggle('hidden', !shouldShow)
      node.setAttribute('aria-hidden', shouldShow ? 'false' : 'true')
    })

    // Category sections
    const sectionNodes = document.querySelectorAll('[data-bookmark-category-section-id]')
    sectionNodes.forEach((node) => {
      const id = node.getAttribute('data-bookmark-category-section-id')
      const shouldShow = id && visibleCategorySectionIds.has(id)
      node.classList.toggle('hidden', !shouldShow)
      node.setAttribute('aria-hidden', shouldShow ? 'false' : 'true')
    })

    // TOC categories (top-level)
    const tocItemNodes = document.querySelectorAll('[data-toc-item-id]')
    tocItemNodes.forEach((node) => {
      const id = node.getAttribute('data-toc-item-id')
      if (!id) return
      const shouldShow = visibleCategorySectionIds.has(id)
      node.classList.toggle('hidden', !shouldShow)
      node.setAttribute('aria-hidden', shouldShow ? 'false' : 'true')
    })

    // TOC subitems (bookmark entries)
    const tocSubItemNodes = document.querySelectorAll('[data-toc-subitem-id]')
    tocSubItemNodes.forEach((node) => {
      const id = node.getAttribute('data-toc-subitem-id')
      if (!id) return
      const shouldShow = visibleItemIds.has(id)
      node.classList.toggle('hidden', !shouldShow)
      node.setAttribute('aria-hidden', shouldShow ? 'false' : 'true')
    })
  }, [visibleState])

  // Keep URL in sync without triggering navigation (no refresh / no RSC refetch).
  useEffect(() => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    url.searchParams.delete('category')
    url.searchParams.delete('format')

    for (const cat of selectedCategories) url.searchParams.append('category', cat)
    for (const fmt of selectedFormats) url.searchParams.append('format', fmt)

    window.history.replaceState({}, '', url)
  }, [selectedCategories, selectedFormats])

  const toggle = (kind, value) => {
    if (kind === 'category') {
      setSelectedCategories((prev) => {
        const next = new Set(prev)
        if (next.has(value)) next.delete(value)
        else next.add(value)
        return next
      })
      return
    }

    setSelectedFormats((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const clearAll = () => {
    setSelectedCategories(new Set())
    setSelectedFormats(new Set())
  }

  const selectedCategoryList = useMemo(() => Array.from(selectedCategories), [selectedCategories])
  const selectedFormatList = useMemo(() => Array.from(selectedFormats), [selectedFormats])
  const hasActiveFilters = selectedCategories.size > 0 || selectedFormats.size > 0

  return (
    <details
      className="mb-5 border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 px-3 py-2"
      open={isExpanded}
      onToggle={(e) => setIsExpanded(Boolean(e.currentTarget?.open))}
    >
      <summary className="cursor-pointer select-none list-none">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-[#333] dark:text-gray-100">筛选</div>
          <div className="text-xs text-[#999] dark:text-gray-400">当前：{visibleState.count} 条</div>

          <div className="ml-2 flex flex-wrap gap-1">
            {selectedCategoryList.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-[#eee] dark:border-gray-800 px-2 py-0.5 text-[11px] text-[#666] dark:text-gray-300"
              >
                {cat}
              </span>
            ))}
            {selectedFormatList.slice(0, 2).map((fmt) => (
              <span
                key={fmt}
                className="rounded-full border border-[#eee] dark:border-gray-800 px-2 py-0.5 text-[11px] text-[#666] dark:text-gray-300"
              >
                {fmt}
              </span>
            ))}
            {selectedCategoryList.length + selectedFormatList.length > 4 ? (
              <span className="text-[11px] text-[#999] dark:text-gray-400">+更多</span>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                clearAll()
              }}
              className="ml-auto text-xs rounded-md border border-[#eee] dark:border-gray-800 px-2 py-1 text-[#666] dark:text-gray-300"
            >
              清除
            </button>
          ) : null}
        </div>
      </summary>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs text-[#666] dark:text-gray-300 mb-2">分类</div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggle('category', cat)}
                className={
                  selectedCategories.has(cat)
                    ? 'rounded-full border border-[#111] dark:border-white px-2.5 py-1 text-[11px] text-[#111] dark:text-white'
                    : 'rounded-full border border-[#eee] dark:border-gray-800 px-2.5 py-1 text-[11px] text-[#666] dark:text-gray-300'
                }
                aria-pressed={selectedCategories.has(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-[#666] dark:text-gray-300 mb-2">形式</div>
          <div className="flex flex-wrap gap-2">
            {formats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => toggle('format', fmt)}
                className={
                  selectedFormats.has(fmt)
                    ? 'rounded-full border border-[#111] dark:border-white px-2.5 py-1 text-[11px] text-[#111] dark:text-white'
                    : 'rounded-full border border-[#eee] dark:border-gray-800 px-2.5 py-1 text-[11px] text-[#666] dark:text-gray-300'
                }
                aria-pressed={selectedFormats.has(fmt)}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </details>
  )
}
