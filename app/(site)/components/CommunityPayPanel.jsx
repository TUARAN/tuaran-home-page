'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

const STORAGE_PREFIX = 'community:pay:'
const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000

function safeJson(res) {
  return res
    .text()
    .then((text) => (text ? JSON.parse(text) : null))
    .catch(() => null)
}

function fenLabel(fen) {
  return (Number(fen || 0) / 100).toFixed(Number(fen) % 100 === 0 ? 0 : 2)
}

function readStored(resourceKey) {
  if (!resourceKey || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${resourceKey}`)
    const data = raw ? JSON.parse(raw) : null
    if (!data?.orderNo || Date.now() - Number(data.at || 0) > REMEMBER_MS) return null
    return data
  } catch {
    return null
  }
}

function writeStored(resourceKey, data) {
  if (!resourceKey || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${resourceKey}`, JSON.stringify({ ...data, at: Date.now() }))
  } catch {
    // 隐私模式下写不了本地存储，不影响本次付款
  }
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

/**
 * 社群方案的在线支付面板。
 * - 不用登录：圈子订单由服务端签发游客身份，登录用户仍按账号记录。
 * - 下单拿网关二维码，3 秒轮询本人订单状态；支付回调写订单。
 * - 已支付 → 请用户留邮箱，作为站长核对订单后的联系方式。
 * - 支付网关未配置 / 价格未设 → 给出可读提示，不暴露接口细节。
 */
export default function CommunityPayPanel({ plan }) {
  const resourceKey = plan?.resourceKey || ''
  const priceFen = Math.round(Number(plan?.price || 0) * 100)
  const planName = plan?.name || '所选方案'
  const emailInputId = useId()

  const [phase, setPhase] = useState('idle') // idle | creating | qr | paid | error
  const [order, setOrder] = useState(null)
  const [paidOrderNo, setPaidOrderNo] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState('')
  const pollRef = useRef(null)
  const settledRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const markPaid = useCallback(
    (orderNo) => {
      if (settledRef.current) return
      settledRef.current = true
      stopPolling()
      setOrder(null)
      setPaidOrderNo(String(orderNo || ''))
      const stored = readStored(resourceKey)
      setEmail(String(stored?.email || ''))
      setEmailSaved(Boolean(stored?.email))
      setPhase('paid')
    },
    [stopPolling, resourceKey]
  )

  // 再次进入时凭本地记住的订单号认已支付，不依赖登录账号的解锁记录
  useEffect(() => {
    let cancelled = false
    settledRef.current = false
    const stored = readStored(resourceKey)
    if (!resourceKey || !stored?.orderNo) return () => { cancelled = true }
    fetch(`/api/pay/status?orderNo=${encodeURIComponent(stored.orderNo)}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(safeJson)
      .then((data) => {
        if (cancelled) return
        if (data?.unlocked || data?.status === 'paid') markPaid(stored.orderNo)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [resourceKey, markPaid])

  const poll = useCallback(
    async (orderNo) => {
      try {
        const res = await fetch(`/api/pay/status?orderNo=${encodeURIComponent(orderNo)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        if (res.status === 401) {
          stopPolling()
          setPhase('error')
          setMessage('浏览器没有保存订单身份，请允许 Cookie 后重新下单。')
          return
        }
        const data = await safeJson(res)
        if (data?.unlocked || data?.status === 'paid') markPaid(orderNo)
      } catch {
        // 网络抖动继续轮询
      }
    },
    [markPaid, stopPolling]
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
      const returnTo = `${window.location.pathname}${window.location.search || ''}`
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ resourceKey, returnTo }),
      })
      const data = await safeJson(res)
      if (data?.error === 'ALREADY_UNLOCKED') {
        markPaid('')
        return
      }
      if (!res.ok || data?.ok === false) {
        const map = {
          UNAUTHORIZED: '下单需要保存订单身份，请允许 Cookie 后重试。',
          GUEST_UNAVAILABLE: '订单身份暂时不可用，请稍后再试。',
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
      setPaidOrderNo(String(data?.orderNo || ''))
      writeStored(resourceKey, { orderNo: data?.orderNo || '', email: '' })
      setPhase('qr')
    } catch (e) {
      setPhase('error')
      setMessage(String(e?.message || e))
    }
  }

  async function submitEmail(event) {
    event.preventDefault()
    const value = email.trim()
    if (!validEmail(value)) {
      setEmailError('请填写有效的邮箱地址')
      return
    }
    if (!paidOrderNo) {
      setEmailError('没找到订单号，请刷新页面后重试')
      return
    }
    setEmailBusy(true)
    setEmailError('')
    try {
      const res = await fetch('/api/pay/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ orderNo: paidOrderNo, email: value }),
      })
      const data = await safeJson(res)
      if (!res.ok || data?.ok === false) {
        const map = {
          INVALID_EMAIL: '邮箱格式不对，请检查后再提交。',
          ORDER_NOT_FOUND: '没找到这笔订单，请刷新页面后重试。',
          ORDER_NOT_PAID: '订单还没确认支付成功，稍等几秒再试。',
          UNAUTHORIZED: '浏览器没有保存订单身份，请允许 Cookie 后重新下单。',
          CONTACT_UNAVAILABLE: '联系方式暂时无法保存，请稍后再试。',
        }
        setEmailError(map[data?.error] || `提交失败（HTTP ${res.status}）`)
        return
      }
      const saved = String(data?.email || value).toLowerCase()
      setEmail(saved)
      setEmailSaved(true)
      writeStored(resourceKey, { orderNo: paidOrderNo, email: saved })
    } catch (e) {
      setEmailError(String(e?.message || e))
    } finally {
      setEmailBusy(false)
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
          {emailSaved
            ? `已收到 ${email}，站长核对订单后会通过这个邮箱联系你。`
            : `请留下邮箱作为联系方式，站长核对「${planName}」订单后通过邮件联系你。`}
        </p>
        {!emailSaved ? (
          paidOrderNo ? (
            <form className="community-xh-pay-email" onSubmit={submitEmail}>
              <label htmlFor={emailInputId}>联系邮箱</label>
              <input
                id={emailInputId}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError('')
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <button type="submit" disabled={emailBusy || !paidOrderNo} className="community-xh-pay-button">
                {emailBusy ? '提交中…' : '提交邮箱'}
              </button>
            </form>
          ) : (
            <p className="community-xh-pay-note">这个方案此前已购买，无需重复付款。</p>
          )
        ) : (
          <div className="community-xh-pay-actions">
            <button type="button" onClick={() => setEmailSaved(false)} className="community-xh-pay-cancel">
              修改邮箱
            </button>
          </div>
        )}
        {emailError ? <p className="community-xh-pay-error">{emailError}</p> : null}
        {paidOrderNo ? <p className="community-xh-pay-order">订单号 {paidOrderNo}</p> : null}
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
            微信扫码支付 ¥{order.amountLabel || fenLabel(priceFen)}，无需登录，支付成功本页自动识别。
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
            微信扫码，无需登录；付款后留个邮箱，站长会联系你。
          </p>
          {phase === 'error' && message ? <p className="community-xh-pay-error">{message}</p> : null}
        </>
      )}
    </div>
  )
}
