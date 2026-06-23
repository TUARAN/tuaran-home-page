'use client'

import { useCallback, useEffect, useState } from 'react'

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
 * 调研燃币墙（软墙）。
 *
 * 设计要点：
 *  - 正文 children 始终渲染进 DOM（SSR 也在），保证搜索引擎可收录、保住自然流量；
 *    锁定时只用 max-height + 渐隐「视觉」截断，并在下方挂解锁卡。
 *  - 任何异常 / 资源未配置 / 无 D1 → 直接放行（fail-open），绝不因为燃币系统故障挡住正文。
 *  - 游客与登录用户都能用燃币解锁；不足时游客引导注册（得 100），登录用户引导签到/评论。
 */
export default function ResearchPaywall({ resourceKey, children }) {
  const [state, setState] = useState({ phase: 'loading' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!resourceKey) return setState({ phase: 'free' })
    try {
      const res = await fetch(`/api/points/unlock?resourceKey=${encodeURIComponent(resourceKey)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok || !data || data.exists === false) {
        return setState({ phase: 'free' })
      }
      if (data.unlocked) return setState({ phase: 'unlocked', ...data })
      setState({ phase: 'locked', ...data })
    } catch {
      // fail-open：燃币系统不可用时照常给正文
      setState({ phase: 'free' })
    }
  }, [resourceKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  function goToLogin() {
    const returnTo = `${window.location.pathname}${window.location.search || ''}`
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
  }

  async function unlock() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/points/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ resourceKey }),
      })
      const data = await safeJson(res)
      if (!res.ok || data?.ok === false) {
        if (data?.error === 'INSUFFICIENT_BALANCE') {
          setError(`燃币不足，还差 ${data.need} 枚`)
          await refresh()
        } else {
          setError(data?.error || `HTTP ${res.status}`)
        }
        return
      }
      await refresh()
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const locked = state.phase === 'locked'
  const cost = Number(state.cost || 0)
  const balance = Number(state.balance || 0)
  const isGuest = !state.authed
  const enough = balance >= cost

  return (
    <div>
      <div className={locked ? 'relative max-h-[60vh] overflow-hidden' : ''}>
        {children}
        {locked ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[var(--site-bg)]"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {locked ? (
        <div className="mt-6 rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-base font-semibold text-[#7a5b1e] dark:text-amber-200">
            🔥 继续阅读需 {cost} 燃币
          </p>
          <p className="mt-1.5 text-sm text-[#8a7a55] dark:text-amber-300/80">
            解锁后永久可读 · 当前余额 <span className="font-semibold">{balance}</span> 燃币
          </p>

          {enough ? (
            <button
              type="button"
              onClick={unlock}
              disabled={busy}
              className="mt-4 rounded-full border border-[#caa86a] bg-[#7a5b1e] px-6 py-2 text-sm font-medium text-white hover:bg-[#6a4f19] disabled:opacity-60 dark:border-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
            >
              {busy ? '解锁中…' : `用 ${cost} 燃币解锁`}
            </button>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                燃币不足，还差 {Math.max(0, cost - balance)} 枚
              </p>
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
          )}

          {error ? <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
