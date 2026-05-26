'use client'

import { useEffect, useMemo, useState } from 'react'

function formatPv(pv) {
  const n = Number(pv) || 0
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

export default function ResearchPvCounter({ category, slug, initialPv = 0 }) {
  const [pv, setPv] = useState(Number(initialPv) || 0)
  const storageKey = useMemo(() => `research-pv-hit:${category}:${slug}`, [category, slug])

  useEffect(() => {
    let cancelled = false

    async function increment() {
      try {
        const now = Date.now()
        const lastHit = Number(window.sessionStorage.getItem(storageKey)) || 0
        if (now - lastHit < 10_000) return
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
      }
    }

    increment()
    return () => {
      cancelled = true
    }
  }, [category, slug, storageKey])

  return <span>阅读量 {formatPv(pv)}</span>
}
