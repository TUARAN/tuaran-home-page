'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { balanceWithGuestTrial } from '../../../lib/ledger/guestTrial'
import PayUnlockPanel from './PayUnlockPanel'

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
 * 智能体中心权益门：安装、下载、复制配置等动作走与文章/圈子同一套 gated_resources。
 * 未配置价格 → 免费开放；配了 price_fen → 现金；仅 cost_points → 燃币。
 */
export default function AgentAccessGate({
  resourceKey,
  unitLabel = '能力',
  children,
  variant = 'section',
  className = '',
}) {
  const [phase, setPhase] = useState('loading')
  const [info, setInfo] = useState({})
  const settledRef = useRef(false)

  const autoUnlock = useCallback(async (status) => {
    try {
      const res = await fetch('/api/points/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ resourceKey }),
      })
      const data = await safeJson(res)
      if (res.ok && data?.ok !== false) {
        setInfo((prev) => ({ ...prev, ...status, ...data }))
        setPhase('unlocked')
        return
      }
      if (data?.error === 'INSUFFICIENT_BALANCE') {
        setInfo((prev) => ({ ...prev, ...status, ...data }))
        setPhase('wall')
        return
      }
      setPhase('unlocked')
    } catch {
      setPhase('unlocked')
    }
  }, [resourceKey])

  const settle = useCallback(async () => {
    if (!resourceKey) return setPhase('unlocked')
    try {
      const res = await fetch(`/api/points/unlock?resourceKey=${encodeURIComponent(resourceKey)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok || !data || data.exists === false) return setPhase('unlocked')
      setInfo(data)
      if (data.unlocked) return setPhase('unlocked')

      if (Number(data.priceFen || 0) > 0) {
        setPhase('wall')
        return
      }

      const cost = Number(data.cost || 0)
      if (balanceWithGuestTrial(data) >= cost) {
        await autoUnlock(data)
        return
      }
      setPhase('wall')
    } catch {
      setPhase('unlocked')
    }
  }, [resourceKey, autoUnlock])

  useEffect(() => {
    if (settledRef.current) return
    settledRef.current = true
    settle()
  }, [settle])

  function goToLogin() {
    const returnTo = `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
  }

  if (phase === 'loading') {
    return variant === 'inline' ? (
      <span className={`inline-flex text-xs text-[#8a7a55] ${className}`}>校验权益…</span>
    ) : (
      <motionShell className={className}><p className="text-sm text-[#8a7a55]">正在确认使用权益…</p></motionShell>
    )
  }

  if (phase === 'unlocked') {
    return <>{children}</>
  }

  const cost = Number(info.cost || 0)
  const balance = Number(info.balance || 0)
  const isGuest = !info.authed
  const need = Number(info.need ?? Math.max(0, cost - balance))
  const priceFen = Number(info.priceFen || 0)

  const barrier = priceFen > 0 ? (
    <PayUnlockPanel
      resourceKey={resourceKey}
      priceFen={priceFen}
      unitLabel={unitLabel}
      lockedTitle={`使用此${unitLabel}需要单独解锁`}
      lockedHint={`支付后可下载、安装或复制配置；数字内容解锁后不支持退款。`}
      paidTitle="支付成功，已解锁使用权益"
      paidHint="可以下载、安装或复制配置。留个邮箱便于换设备找回权益。"
      finishLabel="开始使用"
      onUnlocked={() => setPhase('unlocked')}
    />
  ) : (
    <div className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
      <p className="text-base font-semibold text-[#7a5b1e] dark:text-amber-200">🔥 燃币不足，还差 {need} 枚</p>
      <p className="mt-1.5 text-sm text-[#8a7a55] dark:text-amber-300/80">
        解锁此{unitLabel}需 {cost} 燃币 · 当前 <span className="font-semibold">{balance}</span> 燃币
      </p>
      <div className="mt-4 flex flex-col items-center gap-2">
        {isGuest ? (
          <button
            type="button"
            onClick={goToLogin}
            className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-6 py-2 text-sm font-medium text-white hover:bg-[#6a4f19]"
          >
            注册 / 登录后解锁
          </button>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => autoUnlock(info)}
              className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-5 py-2 text-sm font-medium text-white hover:bg-[#6a4f19]"
            >
              使用 {cost} 燃币解锁
            </button>
            <Link href="/ranbi#earn" className="rounded-full border border-[#caa86a] bg-white px-5 py-2 text-sm font-medium text-[#7a5b1e] hover:bg-[#fffdf7]">
              获取燃币
            </Link>
          </div>
        )}
      </div>
    </div>
  )

  if (variant === 'inline') {
    return <motionShell className={`${className} max-w-md`}>{barrier}</motionShell>
  }

  return (
    <motionShell className={className}>
      <p className="mb-3 text-sm text-[#6d6861]">说明与预览可免费阅读；下载、安装与复制配置需先解锁。</p>
      {barrier}
    </motionShell>
  )
}

function motionShell({ children, className = '' }) {
  return (
    <motionDiv className={`rounded-xl border border-[#ded8ce] bg-[#faf8f3] p-4 dark:border-[#2b333e] dark:bg-[#121820] ${className}`}>
      {children}
    </motionDiv>
  )
}

function motionDiv({ children, className }) {
  return <div className={className}>{children}</div>
}