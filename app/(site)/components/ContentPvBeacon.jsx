'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../../components/loading/LoadingPrimitives'

const DISPLAY_TIMEOUT_MS = 3_000
const PV_CACHE_TTL_MS = 30_000
const pvMemoryCache = new Map()

function formatPv(pv) {
  const n = Number(pv) || 0
  if (n <= 0) return '-'
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

function normalizePv(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : null
}

function readCachedPv(key) {
  const memoryEntry = pvMemoryCache.get(key)
  if (memoryEntry?.expiresAt > Date.now()) return memoryEntry.pv

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(`content-pv-cache:${key}`) || 'null')
    const pv = normalizePv(stored?.pv)
    if (pv !== null && stored?.expiresAt > Date.now()) {
      pvMemoryCache.set(key, { pv, expiresAt: stored.expiresAt })
      return pv
    }
  } catch {
    // 缓存不可用不影响实时读取。
  }
  return null
}

function writeCachedPv(key, value) {
  const pv = normalizePv(value)
  if (pv === null) return
  const entry = { pv, expiresAt: Date.now() + PV_CACHE_TTL_MS }
  pvMemoryCache.set(key, entry)
  try {
    window.sessionStorage.setItem(`content-pv-cache:${key}`, JSON.stringify(entry))
  } catch {
    // Safari 隐私模式等场景可能禁用 sessionStorage，忽略即可。
  }
}

/**
 * 阅读统计探针：挂载时给 /api/research-pv 记一次访问。
 * 统一用于精选文章、调研、资料、资源主题页与灵感流。
 *
 * - 默认 display=false：无界面，只上报、渲染 null（保持旧用法不变）。
 * - display=true：把返回的阅读量渲染成「阅读量 N」，用于资源页页头露出数字。
 *
 * 展示与写入解耦：只读 GET 立即读取当前数字，POST 独立后台上报，不再阻塞界面。
 * 去重：服务端按「访客指纹 + 1 小时桶」幂等；客户端再用 sessionStorage 10 秒节流，避免同会话刷量。
 */
export default function ContentPvBeacon({ category, slug, display = false, initialPv }) {
  const hasInitialPv = Number.isFinite(initialPv)
  const [pv, setPv] = useState(hasInitialPv ? Math.max(0, initialPv) : null)
  const [loading, setLoading] = useState(!hasInitialPv)

  useEffect(() => {
    if (!category || !slug) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    const key = `${category}/${slug}`

    const applyPv = (value) => {
      const nextPv = normalizePv(value)
      if (cancelled || nextPv === null) return
      writeCachedPv(key, nextPv)
      setPv((current) => current === null ? nextPv : Math.max(current, nextPv))
    }

    setPv(hasInitialPv ? Math.max(0, initialPv) : null)
    setLoading(display && !hasInitialPv)

    let controller = null
    let timeoutId = null
    if (display) {
      const cachedPv = readCachedPv(key)
      if (cachedPv !== null) {
        applyPv(cachedPv)
        setLoading(false)
      }

      // 展示数字只依赖轻量 GET；3 秒无响应就结束转圈，稍后 POST 成功仍可补上数字。
      controller = new AbortController()
      timeoutId = window.setTimeout(() => {
        controller.abort()
        if (!cancelled) setLoading(false)
      }, DISPLAY_TIMEOUT_MS)

      fetch(`/api/research-pv?keys=${encodeURIComponent(key)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => applyPv(data?.counts?.[key]))
        .catch(() => {})
        .finally(() => {
          window.clearTimeout(timeoutId)
          if (!cancelled) setLoading(false)
        })
    }

    // 统计写入与展示请求并行执行；它的延迟或失败不再控制 loading 状态。
    try {
      const storageKey = `content-pv-hit:${category}:${slug}`
      const now = Date.now()
      const last = Number(window.sessionStorage.getItem(storageKey)) || 0
      const throttled = now - last < 10_000

      if (!throttled) {
        window.sessionStorage.setItem(storageKey, String(now))
        fetch('/api/research-pv', {
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
          .then((data) => applyPv(data?.pv))
          .catch(() => {})
      }
    } catch {
      // 统计失败不影响页面
    }

    return () => {
      cancelled = true
      controller?.abort()
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [category, slug, display, hasInitialPv, initialPv])

  if (!display) return null

  if (loading && pv === null) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span>阅读量</span>
        <LoadingSpinner size="sm" />
        <span className="sr-only">阅读量加载中</span>
      </span>
    )
  }

  if (pv === null) return <span>阅读量 --</span>
  return <span>阅读量 {formatPv(pv)}</span>
}
