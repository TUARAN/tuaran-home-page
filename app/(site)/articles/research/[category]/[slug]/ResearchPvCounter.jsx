'use client'

import { useEffect, useMemo, useState } from 'react'

function formatPv(pv) {
  const n = Number(pv) || 0
  if (n <= 0) return '-'
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

export default function ResearchPvCounter({ category, slug, initialPv }) {
  const hasInitialPv = Number.isFinite(initialPv)
  const [pv, setPv] = useState(hasInitialPv ? Math.max(0, initialPv) : null)
  const [loading, setLoading] = useState(!hasInitialPv)
  const storageKey = useMemo(() => `research-pv-hit:${category}:${slug}`, [category, slug])

  useEffect(() => {
    let cancelled = false

    async function increment() {
      try {
        const now = Date.now()
        const lastHit = Number(window.sessionStorage.getItem(storageKey)) || 0
        if (now - lastHit < 10_000) {
          setLoading(false)
          return
        }
        window.sessionStorage.setItem(storageKey, String(now))

        const res = await fetch('/api/research-pv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, slug }),
          keepalive: true,
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && typeof data?.pv === 'number') {
          setPv(data.pv)
        }
      } catch {
        // 阅读量统计失败不影响正文阅读。
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    increment()
    return () => {
      cancelled = true
    }
  }, [category, slug, storageKey])

  if (loading && pv === null) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span>阅读量</span>
        <span
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#bbb] border-t-transparent dark:border-gray-500 dark:border-t-transparent"
          aria-hidden="true"
        />
        <span className="sr-only">阅读量加载中</span>
      </span>
    )
  }

  if (pv === null) {
    return <span>阅读量 --</span>
  }

  return <span>阅读量 {formatPv(pv)}</span>
}
