'use client'

import { useEffect, useState } from 'react'

function formatPv(pv) {
  const n = Number(pv) || 0
  if (n <= 0) return '-'
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

/**
 * 阅读统计探针：挂载时给 /api/research-pv 记一次访问。
 * 统一用于精选文章、调研、资料、资源主题页与灵感流。
 *
 * - 默认 display=false：无界面，只上报、渲染 null（保持旧用法不变）。
 * - display=true：把返回的阅读量渲染成「阅读量 N」，用于资源页页头露出数字。
 *
 * 去重：服务端按「访客指纹 + 1 小时桶」幂等；客户端再用 sessionStorage 10 秒节流，避免同会话刷量。
 * 节流命中时若需展示数字，改用只读 GET 取当前计数，绝不重复 POST 刷量。
 */
export default function ContentPvBeacon({ category, slug, display = false, initialPv }) {
  const hasInitialPv = Number.isFinite(initialPv)
  const [pv, setPv] = useState(hasInitialPv ? Math.max(0, initialPv) : null)
  const [loading, setLoading] = useState(!hasInitialPv)

  useEffect(() => {
    if (!category || !slug) return
    let cancelled = false
    const key = `${category}/${slug}`
    try {
      const storageKey = `content-pv-hit:${category}:${slug}`
      const now = Date.now()
      const last = Number(window.sessionStorage.getItem(storageKey)) || 0
      const throttled = now - last < 10_000

      // 旧行为：不展示数字且本会话内已打过点 → 直接跳过，不发请求。
      if (throttled && !display) return

      let request
      if (throttled) {
        // 已计过数，仅为展示拉一次当前计数。
        request = fetch(`/api/research-pv?keys=${encodeURIComponent(key)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.counts?.[key])
      } else {
        window.sessionStorage.setItem(storageKey, String(now))
        request = fetch('/api/research-pv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            category,
            slug,
            referrer: document.referrer || '',
            utmSource: new URLSearchParams(window.location.search).get('utm_source') || '',
            utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || '',
            utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
          }),
          keepalive: true,
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.pv)
      }

      request
        .then((value) => {
          if (!cancelled && typeof value === 'number') setPv(value)
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } catch {
      // 统计失败不影响页面
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [category, slug, display])

  if (!display) return null

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

  if (pv === null) return <span>阅读量 --</span>
  return <span>阅读量 {formatPv(pv)}</span>
}
