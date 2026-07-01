'use client'

import { useCallback, useEffect, useState } from 'react'

import { useSessionAccount } from './SessionProvider'

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
 * 燃币墙：用 resourceKey 标识一篇/一段受保护内容。
 *  - 服务端未配置该资源 → 直接放行（门槛判定永远以服务端为准，前端只做展示）。
 *  - 已解锁 → 渲染 children。
 *  - 未解锁 → 显示预览(preview) + 解锁面板；余额足够则一键使用燃币解锁，不足提示补充。
 *  - 游客 → 引导登录或先使用试用额度。
 */
export default function RanbiGate({ resourceKey, children, preview = null, title = '此内容需要燃币解锁' }) {
  const { user, loading: userLoading } = useSessionAccount()
  const [state, setState] = useState({ loading: true })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!resourceKey) return
    try {
      const res = await fetch(`/api/points/unlock?resourceKey=${encodeURIComponent(resourceKey)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      setState({ loading: false, ...(data || {}) })
    } catch (e) {
      setState({ loading: false, error: String(e?.message || e) })
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
        } else if (res.status === 401) {
          goToLogin()
          return
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

  // 资源未配置门槛，或已解锁 → 直接给全文
  if (state.loading || userLoading) {
    return <div className="my-6 h-24 animate-pulse rounded-xl bg-[#eef0ea] dark:bg-gray-800/60" />
  }
  if (state.exists === false || state.unlocked) {
    return <>{children}</>
  }

  const isGuest = !user
  const cost = Number(state.cost || 0)
  const balance = Number(state.balance || 0)

  return (
    <div className="my-6">
      {preview ? <div className="relative">{preview}</div> : null}
      <div className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
        <p className="text-base font-semibold text-[#7a5b1e] dark:text-amber-200">🔥 {title}</p>
        <p className="mt-1.5 text-sm text-[#8a7a55] dark:text-amber-300/80">
          需 <span className="font-semibold">{cost}</span> 燃币解锁，解锁后永久可读。
        </p>

        {isGuest && balance < cost ? (
          <button
            type="button"
            onClick={goToLogin}
            className="mt-4 rounded-full border border-[#caa86a] bg-white px-5 py-1.5 text-sm font-medium text-[#7a5b1e] hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            登录后补充燃币
          </button>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={unlock}
              disabled={busy}
              className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#6a4f19] disabled:opacity-60 dark:border-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
            >
              {busy ? '解锁中…' : `使用 ${cost} 燃币解锁`}
            </button>
            <span className="text-xs text-[#8a7a55] dark:text-amber-300/70">当前余额 {balance} 燃币</span>
          </div>
        )}

        {error ? <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
      </div>
    </div>
  )
}
