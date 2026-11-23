'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useSessionAccount } from './SessionProvider'

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
 * 社群方案的虎皮椒支付面板。
 * - 只认登录账号：付款权益挂账号，建单 401 时先登录再回来。
 * - 下单拿网关二维码，3 秒轮询本人订单状态；支付回调写 resource_unlocks。
 * - 已支付（本次轮询命中或再次进入查到 unlock）→ 展示加微信进群引导，不再发截图。
 * - 支付网关未配置 / 价格未设 → 给出可读提示，不暴露接口细节。
 */
export default function CommunityPayPanel({ plan }) {
  const resourceKey = plan?.resourceKey || ''
  const priceFen = Math.round(Number(plan?.price || 0) * 100)
  const planName = plan?.name || '所选方案'
  const { user } = useSessionAccount()

  const [phase, setPhase] = useState('idle') // idle | creating | qr | paid | error
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

  // 再次进入时识别已支付状态：只有登录账号的 unlock 记录算数
  useEffect(() => {
    let cancelled = false
    settledRef.current = false
    if (!resourceKey || !user?.id) return () => { cancelled = true }
    safeJson(
      fetch(`/api/points/unlock?resourceKey=${encodeURIComponent(resourceKey)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
    )
      .then((data) => {
        if (cancelled) return
        if (data?.unlocked) {
          settledRef.current = true
          setPhase('paid')
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [resourceKey, user?.id])

  const markPaid = useCallback(() => {
    if (settledRef.current) return
    settledRef.current = true
    stopPolling()
    setOrder(null)
    setPhase('paid')
  }, [stopPolling])

  const poll = useCallback(
    async (orderNo) => {
      try {
        const res = await fetch(`/api/pay/status?orderNo=${encodeURIComponent(orderNo)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        const data = await safeJson(res)
        if (data?.unlocked || data?.status === 'paid') markPaid()
      } catch {
        // 网络抖动继续轮询，由总时长兜底
      }
    },
    [markPaid]
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
        markPaid()
        return
      }
      if (!res.ok || data?.ok === false) {
        const map = {
          PRICE_NOT_SET: '这个方案还没开放在线支付，请联系站长。',
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

  if (phase === 'paid') {
    return (
      <div className="community-xh-pay">
        <div className="community-xh-pay-done">
          <span aria-hidden="true">✓</span>
          <strong>支付成功</strong>
        </div>
        <p className="community-xh-pay-note">
          请加作者微信，说明「{planName}」已付款。站长按后台订单核对后拉你进群。
        </p>
      </div>
    )
  }

  return (
    <div className="community-xh-pay">
      {phase === 'qr' && order ? (
        <>
          <div className="community-xh-pay-qr">
            {order.qrCode ? (
              // 网关返回二维码图片地址，本地展示；外链图不走 next/image 优化
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.qrCode} alt="支付二维码" width={180} height={180} />
            ) : (
              <a href={order.payUrl} target="_blank" rel="noreferrer" className="community-xh-pay-link">
                打开支付页
              </a>
            )}
          </div>
          <p className="community-xh-pay-note">
            微信 / 支付宝扫码支付 ¥{order.amountLabel || fenLabel(priceFen)}，支付成功本页自动识别。
          </p>
          <div className="community-xh-pay-actions">
            <button type="button" onClick={() => poll(order.orderNo)} className="community-xh-pay-refresh">
              我已支付，刷新状态
            </button>
            <button
              type="button"
              onClick={() => {
                stopPolling()
                setPhase('idle')
                setOrder(null)
              }}
              className="community-xh-pay-cancel"
            >
              取消
            </button>
          </div>
          <p className="community-xh-pay-order">订单号 {order.orderNo}</p>
        </>
      ) : (
        <>
          <button type="button" onClick={create} disabled={phase === 'creating'} className="community-xh-pay-button">
            {phase === 'creating' ? '正在下单…' : `¥${fenLabel(priceFen)} 立即支付`}
          </button>
          <p className="community-xh-pay-note">
            微信 / 支付宝扫码，付款后自动识别，无需发截图。
          </p>
          {phase === 'error' && message ? <p className="community-xh-pay-error">{message}</p> : null}
        </>
      )}
    </div>
  )
}
