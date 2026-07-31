'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'

const DEFAULT_QUOTE = {
  id: 'laozi-first-step',
  text: '千里之行，始于足下。',
  author: '老子',
}

const LAST_QUOTE_KEY = 'articles:last-quote'

const GROUP_TITLES = {
  all: '统一内容目录',
  article: '文章',
  analysis: '深度分析',
  practice: '工程实践',
  resource: '资源与档案',
}

const LEGACY_GROUPS = {
  column: 'article',
  posts: 'article',
  research: 'analysis',
  companies: 'analysis',
  people: 'analysis',
  topics: 'analysis',
  tech: 'analysis',
  business: 'analysis',
  other: 'analysis',
  works: 'practice',
  'engineering-cases': 'practice',
  'build-logs': 'practice',
  resources: 'resource',
}

function normalizeGroup(params) {
  const group = params?.get('group')
  if (GROUP_TITLES[group]) return group
  const kind = params?.get('kind')
  if (kind === 'article') return 'article'
  if (['practice', 'guide', 'interactive'].includes(kind)) return 'practice'
  if (['resource', 'archive'].includes(kind)) return 'resource'
  if (['analysis', 'profile', 'fact_check'].includes(kind)) return 'analysis'
  if (params?.get('entity') || params?.get('company_industry') || params?.get('company_role')) return 'analysis'
  const delivery = params?.get('delivery')
  if (['subscribe', 'download', 'watch_listen', 'external'].includes(delivery)) return 'resource'
  if (delivery === 'interact') return 'practice'
  return LEGACY_GROUPS[params?.get('tab')] || 'all'
}

export default function ArticlesHeaderClient() {
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const activeGroup = normalizeGroup(searchParams)
  const [quote, setQuote] = useState(DEFAULT_QUOTE)

  useEffect(() => {
    if (!resolvedTheme) return

    const controller = new AbortController()
    const previousQuote = window.sessionStorage.getItem(LAST_QUOTE_KEY) || DEFAULT_QUOTE.id

    fetch(`/api/quotes?exclude=${encodeURIComponent(previousQuote)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('QUOTE_REQUEST_FAILED')
        return response.json()
      })
      .then((nextQuote) => {
        if (!nextQuote?.id || !nextQuote?.text || !nextQuote?.author) return
        window.sessionStorage.setItem(LAST_QUOTE_KEY, nextQuote.id)
        setQuote(nextQuote)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') window.sessionStorage.setItem(LAST_QUOTE_KEY, DEFAULT_QUOTE.id)
      })

    return () => controller.abort()
  }, [resolvedTheme])

  return (
    <header className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
            {GROUP_TITLES[activeGroup]}
          </h1>
          <figure className="mt-2 text-[13.5px] leading-[1.8] text-[#5c5e52] dark:text-[#9aa5b6]">
            <blockquote>“{quote.text}”</blockquote>
            <figcaption className="mt-0.5 text-[12px] text-[#85877d] dark:text-[#737f91]">— {quote.author}</figcaption>
          </figure>
        </div>
      </div>
    </header>
  )
}
