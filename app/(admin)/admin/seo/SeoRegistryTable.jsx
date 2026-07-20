'use client'

import { useMemo, useState } from 'react'

import { StatusPill } from '../../components/ui'

const TYPE_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'rich-page', label: '多维页面' },
  { key: 'article', label: '精选文章' },
  { key: 'research', label: '分析' },
  { key: 'resource', label: '资源' },
]

export default function SeoRegistryTable({ pages }) {
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => Object.fromEntries(
    TYPE_FILTERS.map((filter) => [
      filter.key,
      filter.key === 'all' ? pages.length : pages.filter((page) => page.contentType === filter.key).length,
    ]),
  ), [pages])

  const visiblePages = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return pages.filter((page) => {
      if (type !== 'all' && page.contentType !== type) return false
      if (!needle) return true
      return `${page.title} ${page.href} ${page.category} ${page.typeLabel}`.toLowerCase().includes(needle)
    })
  }, [pages, query, type])

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="SEO 内容类型" className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setType(filter.key)}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] transition ${
                type === filter.key
                  ? 'border-[#7f6b98] bg-[#ede7f3] font-semibold text-[#392b49] dark:border-[#8f83a1] dark:bg-[#292333] dark:text-gray-100'
                  : 'border-[#d8dad0] bg-white text-[#66685e] hover:border-[#aaa99d] dark:border-[#293545] dark:bg-[#111821] dark:text-gray-400'
              }`}
            >
              {filter.label}（{counts[filter.key]}）
            </button>
          ))}
        </nav>
        <label className="flex min-w-0 items-center gap-2 rounded-md border border-[#d8dad0] bg-white px-3 py-2 dark:border-[#293545] dark:bg-[#111821] lg:w-[320px]">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#989a8f]">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="标题、路径、分类"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#303129] outline-none placeholder:text-[#a5a79d] dark:text-gray-200"
          />
        </label>
      </div>

      <p className="mb-3 text-[11px] text-[#85877c] dark:text-[#78869a]">
        当前显示 {visiblePages.length} / {pages.length} 个内容页面
      </p>

      <div className="max-h-[720px] overflow-auto rounded-lg border border-[#e4e5dc] dark:border-[#263142]">
        <table className="w-full min-w-[1080px] border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-[#f7f8f3] dark:bg-[#111821]">
            <tr className="border-b border-[#e4e5dc] text-[#85877c] dark:border-[#263142] dark:text-[#78869a]">
              <th className="px-3 py-2 font-medium">页面</th>
              <th className="px-3 py-2 font-medium">类型</th>
              <th className="px-3 py-2 font-medium">Canonical</th>
              <th className="px-3 py-2 font-medium">SEO 状态</th>
              <th className="px-3 py-2 font-medium">Schema</th>
              <th className="px-3 py-2 font-medium">修改日</th>
              <th className="px-3 py-2 font-medium">索引</th>
              <th className="px-3 py-2 font-medium">增强项</th>
            </tr>
          </thead>
          <tbody>
            {visiblePages.map((page) => (
              <tr key={page.id} className="border-b border-[#eceee6] last:border-0 dark:border-[#1b2430]">
                <td className="max-w-[300px] px-3 py-3">
                  <a href={page.href} target="_blank" rel="noreferrer" className="font-medium text-[#22231e] hover:underline dark:text-gray-200">{page.title}</a>
                  <p className="mb-0 mt-1 text-[10.5px] text-[#94968a] dark:text-[#647185]">{page.category}</p>
                </td>
                <td className="px-3 py-3"><StatusPill tone="info" size="sm" icon={false}>{page.typeLabel}</StatusPill></td>
                <td className="max-w-[260px] break-all px-3 py-3 font-mono text-[10.5px] text-[#67695d] dark:text-gray-400">{page.href}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusPill tone={page.metadataReady ? 'success' : 'warning'} size="sm" icon={false}>Metadata</StatusPill>
                    <StatusPill tone={page.jsonLdReady ? 'success' : 'warning'} size="sm" icon={false}>JSON-LD</StatusPill>
                  </div>
                </td>
                <td className="px-3 py-3"><StatusPill tone={page.jsonLdReady ? 'info' : 'neutral'} size="sm" icon={false}>{page.schemaType}</StatusPill></td>
                <td className="px-3 py-3 font-mono text-[10.5px] text-[#67695d] dark:text-gray-400">{page.date || '—'}</td>
                <td className="px-3 py-3"><StatusPill tone={page.indexable ? 'success' : 'neutral'} size="sm">{page.indexable ? 'index' : 'noindex'}</StatusPill></td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusPill tone={page.hasImage ? 'success' : 'neutral'} size="sm" icon={false}>{page.imageLabel}</StatusPill>
                    <StatusPill tone={page.hasKeywords ? 'info' : 'neutral'} size="sm" icon={false}>{page.hasKeywords ? '关键词' : '无关键词集'}</StatusPill>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
