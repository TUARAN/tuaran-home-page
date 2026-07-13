'use client'

import { useMemo, useState } from 'react'

export default function AiLearningLibrary({ books, copyrightNotice }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [toast, setToast] = useState('')

  const categories = useMemo(() => ['全部', ...new Set(books.map((book) => book.category))], [books])
  const filteredBooks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('zh-CN')
    return books.filter((book) => {
      if (category !== '全部' && book.category !== category) return false
      if (!needle) return true
      return [book.title, book.category, book.level, book.description, ...(book.tags || [])]
        .join('\n')
        .toLocaleLowerCase('zh-CN')
        .includes(needle)
    })
  }, [books, category, query])

  async function copyCode(book) {
    if (!book.code) return
    try {
      await navigator.clipboard.writeText(book.code)
      setToast(`已复制「${book.title}」提取码：${book.code}`)
    } catch {
      setToast(`提取码：${book.code}`)
    }
    window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4 border-b border-[#e3e6e8] pb-5 dark:border-gray-800 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9a7a37] dark:text-amber-400">Library</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#27313b] dark:text-gray-100">AI 经典书目</h2>
          <p className="mt-1 text-xs text-[#7b858f] dark:text-gray-500">当前显示 {filteredBooks.length} / {books.length} 本</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-[#d9dfe4] bg-white px-3 py-2.5 focus-within:border-[#8d9aa5] md:w-80 dark:border-gray-700 dark:bg-gray-900">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-[#89949e]" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>
          <span className="sr-only">搜索书名、方向或标签</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索书名、方向或标签" className="min-w-0 flex-1 bg-transparent text-sm text-[#303b45] outline-none placeholder:text-[#a6afb7] dark:text-gray-100" />
        </label>
      </div>

      <div className="my-5 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1.5 text-xs transition ${category === item ? 'border-[#27313b] bg-[#27313b] text-white dark:border-white dark:bg-white dark:text-gray-950' : 'border-[#dbe0e4] text-[#68747f] hover:border-[#9da8b1] dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            {item}
          </button>
        ))}
      </div>

      {filteredBooks.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBooks.map((book, index) => (
            <article key={book.title} className="group flex flex-col rounded-2xl border border-[#e1e5e8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#bdc7cf] hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#e8eef5,#f5ecdd)] font-mono text-xs font-bold text-[#5d6c79] dark:bg-[linear-gradient(145deg,#222e3a,#332b20)] dark:text-gray-300">{String(index + 1).padStart(2, '0')}</span>
                <span className="rounded-full bg-[#f2f4f5] px-2.5 py-1 text-[10px] font-medium text-[#6f7b86] dark:bg-gray-800 dark:text-gray-400">{book.level}</span>
              </div>
              <p className="mt-4 text-[11px] text-[#a17a2d] dark:text-amber-400/80">{book.category}</p>
              <h3 className="mt-1 text-lg font-semibold leading-7 text-[#27313b] dark:text-gray-100">{book.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#69747e] dark:text-gray-400">{book.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(book.tags || []).map((tag) => <span key={tag} className="rounded-full border border-[#e0e4e7] px-2 py-0.5 text-[10px] text-[#7b858f] dark:border-gray-700 dark:text-gray-500">#{tag}</span>)}
                {book.parts ? <span className="rounded-full border border-[#e0e4e7] px-2 py-0.5 text-[10px] text-[#7b858f] dark:border-gray-700 dark:text-gray-500">{book.parts} 个分卷</span> : null}
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-[#edf0f2] pt-4 dark:border-gray-800">
                <a href={book.link} target="_blank" rel="noreferrer" className="rounded-lg bg-[#27313b] px-3 py-2 text-xs font-medium text-white transition hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200">资源入口 ↗</a>
                {book.code ? <button type="button" onClick={() => copyCode(book)} className="rounded-lg border border-[#d8dee3] px-3 py-2 text-xs text-[#64717c] transition hover:border-[#9da8b1] hover:text-[#27313b] dark:border-gray-700 dark:text-gray-400 dark:hover:text-white">复制提取码</button> : null}
              </div>
              <p className="mt-3 text-[10px] text-[#a2aab1] dark:text-gray-600">{copyrightNotice}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d9dfe4] py-16 text-center text-sm text-[#8b959e] dark:border-gray-800 dark:text-gray-500">没有找到匹配书目。</div>
      )}

      {toast ? <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-full bg-[#202830] px-4 py-2 text-xs text-white shadow-xl dark:bg-white dark:text-gray-950">{toast}</div> : null}
    </section>
  )
}
