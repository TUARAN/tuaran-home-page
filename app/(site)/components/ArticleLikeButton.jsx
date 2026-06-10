'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const VISITOR_KEY = 'tuaran:article-like-visitor'

function safeJson(res) {
  return res.text().then((text) => {
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return { error: 'NON_JSON_RESPONSE' }
    }
  })
}

function createVisitorKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
}

function getVisitorKey() {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY)
    if (existing && /^[a-zA-Z0-9_-]{16,80}$/.test(existing)) return existing
    const next = createVisitorKey()
    window.localStorage.setItem(VISITOR_KEY, next)
    return next
  } catch {
    return ''
  }
}

// 把后端错误码翻译成用户能理解的短句。
// 之前对 5xx / INTERNAL_SERVER_ERROR 完全静默，结果点了没反应又不知道为什么——
// 现在 5xx 类一律提示"稍后重试"，让用户知道是后端问题不是点没点上。
function translateError(raw) {
  if (!raw) return ''
  const code = String(raw)
  if (code === 'VISITOR_KEY_UNAVAILABLE') return '请允许浏览器存储后重试'
  if (code === 'RATE_LIMITED') return '操作太频繁，稍后再试'
  if (code === 'INVALID_ARTICLE_KEY' || code === 'INVALID_VISITOR_KEY') return ''
  if (/^HTTP_(5|429)/.test(code) || code.includes('INTERNAL') || code.includes('UNAVAILABLE')) {
    return '服务暂不可用，稍后重试'
  }
  if (/^HTTP_4/.test(code)) return '请求被拒绝'
  if (code === 'FETCH_FAILED' || code === 'LIKE_FAILED') return '网络异常，稍后重试'
  return ''
}

export default function ArticleLikeButton({ articleKey, size = 'md' }) {
  const [visitorKey, setVisitorKey] = useState('')
  const [count, setCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pulse, setPulse] = useState(false)
  const pulseTimerRef = useRef(null)

  const refresh = useCallback(async (nextVisitorKey) => {
    if (!articleKey || !nextVisitorKey) return
    setError('')
    try {
      const params = new URLSearchParams({ articleKey, visitorKey: nextVisitorKey })
      const res = await fetch(`/api/article-likes?${params.toString()}`, { cache: 'no-store' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setCount(Math.max(0, Number(data?.count) || 0))
      setLiked(!!data?.liked)
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [articleKey])

  useEffect(() => {
    const key = getVisitorKey()
    setVisitorKey(key)
    if (!key) {
      setError('VISITOR_KEY_UNAVAILABLE')
      setLoading(false)
      return
    }
    refresh(key)
  }, [refresh])

  useEffect(() => () => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
  }, [])

  async function toggleLike() {
    if (!articleKey || !visitorKey || busy) return
    setBusy(true)
    setError('')
    // 触发心形脉冲动画，与请求异步——按下立即有反馈
    setPulse(true)
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = setTimeout(() => setPulse(false), 320)
    try {
      const res = await fetch('/api/article-likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleKey, visitorKey }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setCount(Math.max(0, Number(data?.count) || 0))
      setLiked(!!data?.liked)
    } catch (e) {
      setError(e?.message || 'LIKE_FAILED')
    } finally {
      setBusy(false)
    }
  }

  const visibleError = useMemo(() => translateError(error), [error])
  const sizeCls = size === 'sm' ? 'h-8 px-3 text-[12.5px]' : 'h-9 px-3.5 text-[13.5px]'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className="inline-flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={toggleLike}
        disabled={loading || busy || !visitorKey}
        aria-pressed={liked}
        aria-label={liked ? `已点赞，当前 ${count} 个赞` : '点赞这篇文章'}
        title={liked ? '取消点赞' : '点赞支持'}
        className={[
          'group inline-flex w-full items-center justify-center gap-1.5 rounded-full border font-medium transition-all',
          'disabled:cursor-not-allowed disabled:opacity-60',
          sizeCls,
          liked
            ? 'border-[#d4a64a] bg-[#eaece0] text-[#8a5a14] shadow-[inset_0_-1px_0_rgba(180,120,30,0.08)] dark:border-[#9ba475] dark:bg-[#1c1d15] dark:text-[#9ba475]'
            : 'border-[#caccc0] bg-white text-[#4a4c42] hover:-translate-y-px hover:border-[#9ca08c] hover:text-[#15140f] hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100',
        ].join(' ')}
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={[
            iconSize,
            'shrink-0 transition-transform duration-300 ease-out',
            pulse ? 'scale-[1.35]' : 'scale-100',
            liked ? '' : 'group-hover:scale-110',
          ].join(' ')}
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 17.2 4.2 11.7a4 4 0 0 1-.5-5.2 3.4 3.4 0 0 1 5.1-.4L10 7.3l1.2-1.2a3.4 3.4 0 0 1 5.1.4 4 4 0 0 1-.5 5.2L10 17.2Z" />
        </svg>
        <span>点赞</span>
        {count > 0 ? (
          <span className="font-mono text-[12px] tabular-nums opacity-80">{count}</span>
        ) : null}
      </button>
      {visibleError ? (
        <span className="text-center text-[11px] text-[#a34f47] dark:text-[#b5a09b]">{visibleError}</span>
      ) : null}
    </div>
  )
}
