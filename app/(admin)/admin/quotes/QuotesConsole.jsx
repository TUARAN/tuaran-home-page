'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminPage } from '../../components/ui'

async function readJson(response) {
  try { return await response.json() } catch { return null }
}

export default function QuotesConsole() {
  const [quote, setQuote] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [quoteCount, setQuoteCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/quotes', { cache: 'no-store', credentials: 'same-origin' })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.message || data?.error || `HTTP_${response.status}`)
      setQuote(data?.quote || null)
      setQuotes(Array.isArray(data?.quotes) ? data.quotes : [])
      setQuoteCount(Number(data?.quoteCount) || 0)
    } catch (reason) {
      setError(reason?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AdminPage title="短句存档" description="查看既有原创短句和生成记录。">
      <div className="mx-auto max-w-3xl space-y-5">
        {error ? <Notice tone="error">{error}</Notice> : null}

        <section className="rounded-xl border border-[#d9dbd0] bg-white p-6 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-[#858779] dark:text-gray-500">最新生成</p>
            <p className="text-xs text-[#858779] dark:text-gray-500">名言池 {quoteCount} 条</p>
          </div>
          {loading ? <p className="mt-4 text-sm text-[#858779]">读取中…</p> : quote ? (
            <blockquote className="mt-4 font-serif text-xl leading-9 text-[#292a24] dark:text-gray-100">
              “{quote.text}”
              <footer className="mt-2 font-sans text-sm text-[#858779] dark:text-gray-500">— {quote.author}</footer>
            </blockquote>
          ) : <p className="mt-4 text-sm text-[#858779] dark:text-gray-500">尚未生成</p>}
        </section>

        <section className="rounded-xl border border-[#d9dbd0] bg-white p-6 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
          <p className="text-xs font-medium text-[#858779] dark:text-gray-500">生成记录</p>
          {loading ? null : quotes.length ? (
            <div className="mt-4 divide-y divide-[#eceee7] dark:divide-[#252e39]">
              {quotes.map((item) => (
                <article key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="font-serif text-base leading-7 text-[#292a24] dark:text-gray-100">“{item.text}”</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#858779] dark:text-gray-500">
                    <span>{item.generationTrigger === 'automation' ? '自动生成' : '手动生成'}</span>
                    {item.generationModel ? <span>{item.generationModel}</span> : null}
                    {item.createdAt ? <time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleString('zh-CN')}</time> : null}
                  </div>
                  {item.generationPrompt ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#9a9c91] dark:text-gray-600">提示语：{item.generationPrompt}</p> : null}
                </article>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-[#858779] dark:text-gray-500">暂无记录</p>}
        </section>
      </div>
    </AdminPage>
  )
}

function Notice({ tone, children }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  }
  return <div className={`rounded-lg border px-3 py-2 text-sm ${styles[tone]}`}>{children}</div>
}
