'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * 调研燃币墙（软墙 · 自动扣费）。
 *
 * 行为：
 *  - 打开文章即自动结算——余额够就静默扣 5 燃币（解锁后永久可读），并弹一个会自动消失的提示，
 *    不需要用户点任何按钮；正文始终可见。
 *  - 已解锁（之前付过）→ 直接看，不再扣、不提示。
 *  - 余额不足 → 截断正文 + 「燃币不足」挂卡（游客引导注册得 100）。
 *  - 资源未配置 / 无 D1 / 任何异常 → 直接放行（fail-open），绝不因燃币系统故障挡正文。
 *  - 扣费幂等：unlockResource 以 resource_unlocks 兜底，重复打开不会重复扣。
 */
export default function ResearchPaywall({ resourceKey, children }) {
  // phase: loading | free | content | wall
  const [phase, setPhase] = useState('loading')
  const [info, setInfo] = useState({})
  const [charged, setCharged] = useState(false)
  const settledRef = useRef(false)
  const toastTimerRef = useRef(null)

  const announceCharge = useCallback((isGuest) => {
    setCharged(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    // 游客提示带注册引导，停留久一点；登录用户只是轻提示
    toastTimerRef.current = setTimeout(() => setCharged(false), isGuest ? 9000 : 4200)
  }, [])

  const autoUnlock = useCallback(
    async (status) => {
      try {
        const res = await fetch('/api/points/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ resourceKey }),
        })
        const data = await safeJson(res)
        if (res.ok && data?.ok !== false) {
          const merged = { ...status, ...data }
          setInfo((prev) => ({ ...prev, ...merged }))
          setPhase('content')
          // 真正发生扣费才提示；已解锁（幂等命中）不打扰
          if (!data?.alreadyUnlocked) {
            announceCharge(!merged.authed)
          }
          return
        }
        if (data?.error === 'INSUFFICIENT_BALANCE') {
          setInfo((prev) => ({ ...prev, ...status, ...data }))
          setPhase('wall')
          return
        }
        // 其它错误（含 401 等）→ fail-open
        setPhase('content')
      } catch {
        setPhase('content')
      }
    },
    [resourceKey, announceCharge]
  )

  const settle = useCallback(async () => {
    if (!resourceKey) return setPhase('free')
    try {
      const res = await fetch(`/api/points/unlock?resourceKey=${encodeURIComponent(resourceKey)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok || !data || data.exists === false) return setPhase('free')
      setInfo(data)
      if (data.unlocked) return setPhase('content')

      const cost = Number(data.cost || 0)
      const balance = Number(data.balance || 0)
      if (balance >= cost) {
        await autoUnlock(data) // 余额够 → 静默自动扣费
      } else {
        setPhase('wall') // 余额不足 → 拦截
      }
    } catch {
      setPhase('free') // fail-open
    }
  }, [resourceKey, autoUnlock])

  useEffect(() => {
    if (settledRef.current) return
    settledRef.current = true
    settle()
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [settle])

  function goToLogin() {
    const returnTo = `${window.location.pathname}${window.location.search || ''}`
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
  }

  const wall = phase === 'wall'
  const cost = Number(info.cost || 0)
  const balance = Number(info.balance || 0)
  const isGuest = !info.authed
  const need = Number(info.need ?? Math.max(0, cost - balance))

  return (
    <div>
      <div className={wall ? 'relative max-h-[60vh] overflow-hidden' : ''}>
        {children}
        {wall ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[var(--site-bg)]"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {wall ? (
        <div className="mt-6 rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-base font-semibold text-[#7a5b1e] dark:text-amber-200">
            🔥 燃币不足，还差 {need} 枚
          </p>
          <p className="mt-1.5 text-sm text-[#8a7a55] dark:text-amber-300/80">
            每篇调研需 {cost} 燃币 · 当前余额 <span className="font-semibold">{balance}</span> 燃币
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            {isGuest ? (
              <>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-6 py-2 text-sm font-medium text-white hover:bg-[#6a4f19] dark:border-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                >
                  注册 / 登录，立得 100 燃币
                </button>
                <span className="text-xs text-[#8a7a55] dark:text-amber-300/70">
                  绑定后之前解锁过的文章仍免费可读
                </span>
              </>
            ) : (
              <a
                href="#comments"
                className="rounded-full border border-[#caa86a] bg-white px-6 py-2 text-sm font-medium text-[#7a5b1e] hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                评论 / 每日签到赚燃币
              </a>
            )}
          </div>
        </div>
      ) : null}

      {/* 自动扣费提示：底部居中，几秒后自动消失；游客带注册引导 */}
      {charged ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#e2d9c4] bg-[#fbf7ee]/95 py-2 pl-4 pr-2 text-sm font-medium text-[#7a5b1e] shadow-lg backdrop-blur dark:border-amber-900/50 dark:bg-amber-950/85 dark:text-amber-100">
            <span>
              🔥 已消耗 {cost} 燃币 · 余额 {balance}
              {isGuest ? (
                <span className="hidden sm:inline">
                  ，游客燃币仅够读约 {Math.max(0, Math.floor(balance / (cost || 1)))} 篇
                </span>
              ) : null}
            </span>
            {isGuest ? (
              <button
                type="button"
                onClick={goToLogin}
                className="shrink-0 rounded-full border border-[#caa86a] bg-[#7a5b1e] px-3 py-1 text-xs font-semibold text-white hover:bg-[#6a4f19] dark:border-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
              >
                注册得 100 →
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setCharged(false)}
              aria-label="关闭提示"
              className="shrink-0 rounded-full px-1.5 text-base leading-none text-[#a8966f] hover:text-[#7a5b1e] dark:text-amber-300/60 dark:hover:text-amber-200"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
