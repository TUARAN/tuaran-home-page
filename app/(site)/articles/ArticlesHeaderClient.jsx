'use client'

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function ArticlesHeaderClient() {
  const { resolvedTheme } = useTheme()
  const [quote, setQuote] = useState(null)
  const requestRef = useRef(null)

  const refreshQuote = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    try {
      const response = await fetch('/api/quotes', {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('QUOTE_REQUEST_FAILED')

      const nextQuote = await response.json()
      if (!nextQuote?.id || !nextQuote?.text || !nextQuote?.author) return

      setQuote(nextQuote)
    } catch (error) {
      if (error.name !== 'AbortError') setQuote(null)
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!resolvedTheme) return

    refreshQuote()
    return () => requestRef.current?.abort()
  }, [refreshQuote, resolvedTheme])

  return (
    <header className="mb-4 hidden md:block">
      <div className="flex min-w-0 flex-nowrap items-baseline gap-3 overflow-hidden">
        <h1 className="shrink-0 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          内容导航
        </h1>
        {quote ? <div className="min-w-0">
          <p aria-live="polite" className="min-w-0 truncate text-[12px] text-[#85877d] dark:text-[#737f91] md:w-[clamp(14rem,26vw,18rem)] md:shrink-0 md:text-[13px]">
            <q>{quote.text}</q>
            <cite className="ml-1 not-italic">— {quote.author}</cite>
          </p>
        </div> : null}
      </div>
    </header>
  )
}
