'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

function safeJson(res) {
  return res
    .text()
    .then((text) => (text ? JSON.parse(text) : null))
    .catch(() => null)
}

function fenLabel(fen) {
  return (Number(fen || 0) / 100).toFixed(Number(fen) % 100 === 0 ? 0 : 2)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 现金解锁面板（软墙底部）。圈子和付费文章共用同一套逻辑：
 * - 无需登录即可下单：后端按 gated_resources 实配现金价放行游客，复用游客签名 cookie。
 * - 下单成功展示网关二维码，3 秒轮询一次订单状态。
 * - 支付成功 → 当场解锁阅读（onUnlocked），同时请对方留邮箱，用于换设备或清缓存后找回。
 *   留邮箱是可选项，不填也能直接读。
 */
export default function PayUnlockPanel({
  resourceKey,
  priceFen,
  unitLabel = '内容',
  lockedTitle = '这部分内容需要单独解锁',
  lockedHint,
  paidTitle = '支付成功，内容已解锁',
  paidHint,
  finishLabel = '直接阅读',
  onUnlocked,
}) {
  const [phase, setPhase] = useState('idle') // idle | creating | qr | paid | error
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false)
  const [refreshNote, setRefreshNote] = useState('')
  const [email, setEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailNote, setEmailNote] = useState('')
  const pollRef = useRef(null)
  const settledRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const finish = useCallback(() => {
    if (settledRef.current) return
    settledRef.current = true
    stopPolling()
    setPhase('idle')
    setOrder(null)
    if (typeof onUnlocked === 'function') onUnlocked()
  }, [onUnlocked, stopPolling])

  // 支付已确认：先停在面板里请对方留邮箱，读完点「开始阅读」才撤墙
  const enterPaid = useCallback(() => {
    stopPolling()
    setPhase('paid')
  }, [stopPolling])

  // silent=true 供 3 秒自动轮询使用，不出提示；手动点「刷新状态」时给出可见反馈
  const checkStatus = useCallback(
    async (orderNo, { silent = false } = {}) => {
      if (!silent) {
        setChecking(true)
        setRefreshNote('')
      }
      try {
        const res = await fetch(`/api/pay/status?orderNo=${encodeURIComponent(orderNo)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        if (res.status === 401) {
          if (!silent) setRefreshNote('订单凭证已失效，请取消后重新下单。')
          return 'unauthorized'
        }
        const data = await safeJson(res)
        if (data?.unlocked || data?.status === 'paid') {
          enterPaid()
          return 'paid'
        }
        if (!silent) {
          if (res.status === 404) setRefreshNote('订单不存在或已失效，请取消后重新下单。')
          else if (!res.ok) setRefreshNote('查询失败，请稍后再试。')
          else setRefreshNote('还未查到支付结果。刚付款可能有几秒延迟，稍等再点一次。')
        }
        return 'unpaid'
      } catch {
        if (!silent) setRefreshNote('网络异常，请稍后再试。')
        return 'error'
      } finally {
        if (!silent) setChecking(false)
      }
    },
    [enterPaid]
  )

  useEffect(() => {
    if (phase !== 'qr' || !order?.orderNo) return undefined
    pollRef.current = setInterval(() => checkStatus(order.orderNo, { silent: true }), 3000)
    return stopPolling
  }, [phase, order?.orderNo, checkStatus, stopPolling])

  async function create() {
    setPhase('creating')
    setMessage('')
    try {
      const returnTo = `${window.location.pathname}${window.location.search || ''}`
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ resourceKey, returnTo }),
      })
      const data = await safeJson(res)
      if (res.status === 401) {
        setPhase('error')
        setMessage('这条内容暂不支持免登录购买，请稍后再试或联系站长。')
        return
      }
      if (data?.error === 'ALREADY_UNLOCKED') {
        finish()
        return
      }
      if (!res.ok || data?.ok === false) {
        const map = {
          PRICE_NOT_SET: '这篇还没有开放单独购买。',
          GATEWAY_NOT_CONFIGURED: '支付通道正在配置，稍后再试或联系站长。',
          GATEWAY_REQUEST_FAILED: '支付网关暂时不可用，稍后再试。',
          GATEWAY_REJECTED: '支付网关拒绝了这次下单，请稍后再试。',
          RATE_LIMITED: '操作太频繁，请稍等一会儿再试。',
        }
        setPhase('error')
        setMessage(map[data?.error] || data?.error || `下单失败（HTTP ${res.status}）`)
        return
      }
      setOrder(data)
      setPhase('qr')
    } catch (e) {
      setPhase('error')
      setMessage(String(e?.message || e))
    }
  }

  async function saveEmail() {
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setEmailNote('请输入有效的邮箱地址。')
      return
    }
    if (!order?.orderNo) {
      finish()
      return
    }
    setSavingEmail(true)
    setEmailNote('')
    try {
      const res = await fetch('/api/pay/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ orderNo: order.orderNo, email: value }),
      })
      const data = await safeJson(res)
      if (res.ok && data?.ok !== false) {
        finish()
        return
      }
      const map = {
        INVALID_EMAIL: '邮箱格式不对，请检查后重试。',
        CONTACT_UNAVAILABLE: '邮箱暂时存不下，不影响阅读；稍后可在订单里补填。',
        RATE_LIMITED: '操作太频繁，稍后再试。',
      }
      setEmailNote(map[data?.error] || '保存失败，可稍后重试，或直接开始阅读。')
    } catch {
      setEmailNote('网络异常，可稍后重试，或直接开始阅读。')
    } finally {
      setSavingEmail(false)
    }
  }

  const busy = phase === 'creating'

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
      {phase === 'paid' ? (
        <>
          <p className="text-base font-semibold text-[#7a5b1e] dark:text-amber-200">{paidTitle}</p>
          <p className="mt-1.5 text-sm text-[#8a7a55] dark:text-amber-300/80">
            {paidHint || '留个邮箱，换设备或清缓存后凭它找回阅读权益；不填也能直接读。'}
          </p>
          <form
            className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              saveEmail()
            }}
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-label="联系邮箱"
              className="w-full rounded-lg border border-[#e2d9c4] bg-white px-3 py-2 text-sm text-[#33352c] outline-none focus:border-[#caa86a] dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100"
            />
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <button
                type="submit"
                disabled={savingEmail}
                className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-6 py-2 text-sm font-semibold text-white hover:bg-[#6a4f19] disabled:opacity-60 dark:border-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
              >
                {savingEmail ? '正在保存…' : '保存邮箱并继续'}
              </button>
              <button
                type="button"
                onClick={finish}
                className="rounded-full px-4 py-2 text-xs text-[#8a7a55] hover:text-[#7a5b1e] dark:text-amber-300/70"
              >
                {finishLabel}
              </button>
            </div>
          </form>
          {emailNote ? (
            <p className="mt-2 text-xs text-[#a23b2a] dark:text-red-300">{emailNote}</p>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-base font-semibold text-[#7a5b1e] dark:text-amber-200">{lockedTitle}</p>
          <p className="mt-1.5 text-sm text-[#8a7a55] dark:text-amber-300/80">
            {lockedHint || `¥${fenLabel(priceFen)} 永久解锁此${unitLabel} · 无需登录，付完即可使用`}
          </p>

          {phase === 'qr' && order ? (
            <div className="mt-4 flex flex-col items-center gap-2">
              {order.qrCode ? (
                // 网关返回的是二维码图片地址，PC 端由本站本地展示
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={order.qrCode}
                  alt="支付二维码"
                  width={180}
                  height={180}
                  className="rounded-lg border border-[#e2d9c4] bg-white p-2 dark:border-amber-900/40"
                />
              ) : (
                <a
                  href={order.payUrl}
                  className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-6 py-2 text-sm font-medium text-white hover:bg-[#6a4f19]"
                >
                  打开支付页
                </a>
              )}
              <p className="text-xs text-[#8a7a55] dark:text-amber-300/80">
                微信扫码支付 ¥{order.amountLabel || fenLabel(priceFen)}，支付成功后本页自动解锁
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => checkStatus(order.orderNo)}
                  disabled={checking}
                  className="rounded-full border border-[#caa86a] bg-white px-4 py-1.5 text-xs font-medium text-[#7a5b1e] hover:bg-[#fffdf7] disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  {checking ? '正在查询…' : '我已支付，刷新状态'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopPolling()
                    setPhase('idle')
                    setOrder(null)
                    setRefreshNote('')
                  }}
                  className="rounded-full px-3 py-1.5 text-xs text-[#8a7a55] hover:text-[#7a5b1e] dark:text-amber-300/70"
                >
                  取消
                </button>
              </div>
              {refreshNote ? (
                <p className="text-xs text-[#8a7a55] dark:text-amber-300/80">{refreshNote}</p>
              ) : null}
              <p className="text-[11px] text-[#a8966f] dark:text-amber-300/60">
                订单号 {order.orderNo}
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={create}
                disabled={busy}
                className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#6a4f19] disabled:opacity-60 dark:border-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
              >
                {busy ? '正在下单…' : `¥${fenLabel(priceFen)} 立即解锁`}
              </button>
              <p className="text-xs text-[#8a7a55] dark:text-amber-300/80">
                微信扫码支付 · 数字内容，解锁后不支持退款
              </p>
              {phase === 'error' && message ? (
                <p className="text-xs text-[#a23b2a] dark:text-red-300">{message}</p>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
