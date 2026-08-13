'use client'

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_QUOTE = {
  id: 'laozi-first-step',
  text: '千里之行，始于足下。',
  author: '老子',
}

const LAST_QUOTE_KEY = 'articles:last-quote'

export default function ArticlesHeaderClient() {
  const { resolvedTheme } = useTheme()
  const [quote, setQuote] = useState(DEFAULT_QUOTE)
  const requestRef = useRef(null)

  const refreshQuote = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    const previousQuote = window.sessionStorage.getItem(LAST_QUOTE_KEY) || DEFAULT_QUOTE.id

    try {
      const response = await fetch(`/api/quotes?exclude=${encodeURIComponent(previousQuote)}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('QUOTE_REQUEST_FAILED')

      const nextQuote = await response.json()
      if (!nextQuote?.id || !nextQuote?.text || !nextQuote?.author) return

      window.sessionStorage.setItem(LAST_QUOTE_KEY, nextQuote.id)
      setQuote(nextQuote)
    } catch (error) {
      if (error.name !== 'AbortError') window.sessionStorage.setItem(LAST_QUOTE_KEY, DEFAULT_QUOTE.id)
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
    <header className="mb-4">
      <div className="flex min-w-0 flex-nowrap items-baseline gap-3 overflow-hidden">
        <h1 className="shrink-0 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          内容导航
        </h1>
        <div className="min-w-0">
          <p aria-live="polite" className="min-w-0 truncate text-[12px] text-[#85877d] dark:text-[#737f91] md:w-[clamp(14rem,26vw,18rem)] md:shrink-0 md:text-[13px]">
            <q>{quote.text}</q>
            <cite className="ml-1 not-italic">— {quote.author}</cite>
          </p>
        </div>
      </div>
    </header>
  )
}
