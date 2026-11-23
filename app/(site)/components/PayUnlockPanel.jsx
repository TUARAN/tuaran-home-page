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

/**
 * 现金解锁面板（软墙底部）。
 * - 未登录点购买 → 先登录，付费权益必须挂在账号上。
 * - 下单成功展示网关二维码，3 秒轮询一次订单状态。
 * - 支付成功回调 onUnlocked，由外层把墙撤掉。
 */
export default function PayUnlockPanel({ resourceKey, priceFen, unitLabel = '内容', onUnlocked }) {
  const [phase, setPhase] = useState('idle') // idle | creating | qr | error
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')
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

  const poll = useCallback(
    async (orderNo) => {
      try {
        const res = await fetch(`/api/pay/status?orderNo=${encodeURIComponent(orderNo)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        const data = await safeJson(res)
        if (data?.unlocked || data?.status === 'paid') finish()
      } catch {
        // 网络抖动继续轮询，由总时长兜底
      }
    },
    [finish]
  )

  useEffect(() => {
    if (phase !== 'qr' || !order?.orderNo) return undefined
    pollRef.current = setInterval(() => poll(order.orderNo), 3000)
    return stopPolling
  }, [phase, order?.orderNo, poll, stopPolling])

  async function create() {
    setPhase('creating')
    setMessage('')
    try {
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ resourceKey }),
      })
      const data = await safeJson(res)
      if (res.status === 401) {
        const returnTo = `${window.location.pathname}${window.location.search || ''}`
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
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

  const busy = phase === 'creating'

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
      <p className="text-base font-semibold text-[#7a5b1e] dark:text-amber-200">
        这部分内容需要单独解锁
      </p>
      <p className="mt-1.5 text-sm text-[#8a7a55] dark:text-amber-300/80">
        ¥{fenLabel(priceFen)} 永久解锁此{unitLabel} · 同一账号在任何设备都能继续读
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
            微信/支付宝扫码支付 ¥{order.amountLabel || fenLabel(priceFen)}，支付成功后本页自动解锁
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => poll(order.orderNo)}
              className="rounded-full border border-[#caa86a] bg-white px-4 py-1.5 text-xs font-medium text-[#7a5b1e] hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              我已支付，刷新状态
            </button>
            <button
              type="button"
              onClick={() => {
                stopPolling()
                setPhase('idle')
                setOrder(null)
              }}
              className="rounded-full px-3 py-1.5 text-xs text-[#8a7a55] hover:text-[#7a5b1e] dark:text-amber-300/70"
            >
              取消
            </button>
          </div>
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
            数字内容，解锁后不支持退款
          </p>
          {phase === 'error' && message ? (
            <p className="text-xs text-[#a23b2a] dark:text-red-300">{message}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
