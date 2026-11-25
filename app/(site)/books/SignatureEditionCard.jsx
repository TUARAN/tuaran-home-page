'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { IconBallpen } from '@tabler/icons-react'

function safeJson(res) {
  return res
    .text()
    .then((text) => (text ? JSON.parse(text) : null))
    .catch(() => null)
}

function fenLabel(fen) {
  return (Number(fen || 0) / 100).toFixed(Number(fen) % 100 === 0 ? 0 : 2)
}

// 同页多张卡片共享一次定价请求（模块级缓存）
let editionsPromise = null
function loadEditions() {
  if (!editionsPromise) {
    editionsPromise = fetch('/api/books/signature/prices', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(safeJson)
      .catch(() => null)
  }
  return editionsPromise
}

/**
 * 站长亲笔签名版购买卡片（书页「购书渠道」区块内，Issue #613）。
 *
 * 支付走站内统一现金链路 /api/pay/create（resourceKey = signature:<slug>），
 * 无需登录，微信扫码付款；支付成功后在本卡片内填写收货信息，
 * 站长在后台按订单签发邮寄，并随书附赠手写寄语卡。
 *
 * 后台未上架（无定价或价格不一致）时整卡不渲染，书页保持原样。
 */
export default function SignatureEditionCard({ slug, title }) {
  const [edition, setEdition] = useState(null)
  const [loaded, setLoaded] = useState(false)
  // hidden | idle | creating | qr | paid | saving | done | error
  const [phase, setPhase] = useState('hidden')
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false)
  const [refreshNote, setRefreshNote] = useState('')
  const [recipient, setRecipient] = useState({ name: '', phone: '', address: '', email: '' })
  const [savedOrder, setSavedOrder] = useState(null)
  const pollRef = useRef(null)
  const settledRef = useRef(false)

  useEffect(() => {
    let alive = true
    loadEditions().then((data) => {
      if (!alive) return
      const hit = data?.editions?.find((e) => e.slug === slug)
      if (hit) setEdition(hit)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [slug])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

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
        const data = await safeJson(res)
        if (data?.status === 'paid') {
          stopPolling()
          setPhase('paid')
          return 'paid'
        }
        if (!silent) {
          if (res.status === 401 || res.status === 404) setRefreshNote('订单凭证已失效，请取消后重新下单。')
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
    [stopPolling]
  )

  useEffect(() => {
    if (phase !== 'qr' || !order?.orderNo) return undefined
    pollRef.current = setInterval(() => checkStatus(order.orderNo, { silent: true }), 3000)
    return stopPolling
  }, [phase, order?.orderNo, checkStatus, stopPolling])

  async function createOrder() {
    setPhase('creating')
    setMessage('')
    try {
      const returnTo = `${window.location.pathname}${window.location.search || ''}`
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          resourceKey: `signature:${slug}`,
          title: `《${title}》亲笔签名版`,
          returnTo,
        }),
      })
      const data = await safeJson(res)
      if (res.status === 401) {
        setPhase('error')
        setMessage('签名版暂未开放购买，请稍后再试。')
        return
      }
      if (!res.ok || data?.ok === false) {
        const map = {
          PRICE_NOT_SET: '签名版还没有开放购买。',
          GATEWAY_NOT_CONFIGURED: '支付通道正在配置，稍后再试。',
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

  async function saveRecipient(event) {
    event.preventDefault()
    setPhase('saving')
    setMessage('')
    try {
      const res = await fetch('/api/books/signature/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ orderNo: order?.orderNo, ...recipient }),
      })
      const data = await safeJson(res)
      if (res.ok && data?.ok) {
        setSavedOrder(data.order || null)
        setPhase('done')
        return
      }
      const map = {
        INVALID_NAME: '请填写收货人姓名（2-30 字）。',
        INVALID_PHONE: '请填写有效的手机号或区号-座机号。',
        INVALID_ADDRESS: '收货地址太短或太长，请补充完整（含省市和详细地址）。',
        ORDER_NOT_EDITABLE: '这单已进入发货流程或未支付，如需修改请联系站长。',
        RATE_LIMITED: '操作太频繁，稍后再试。',
        UNAUTHORIZED: '订单凭证已失效，请回书页重新下单。',
      }
      setPhase('paid')
      setMessage(map[data?.error] || data?.error || '保存失败，请稍后再试。')
    } catch {
      setPhase('paid')
      setMessage('网络异常，请稍后再试。')
    }
  }

  function cancelOrder() {
    stopPolling()
    setPhase('idle')
    setOrder(null)
    setRefreshNote('')
  }

  if (!loaded || !edition) return null

  const inputCls =
    'w-full rounded-lg border border-[#d9c6ae] bg-white px-3 py-2 text-sm text-[#33352c] outline-none focus:border-[#a86a2e] dark:border-[#6b5140] dark:bg-[#2a2420] dark:text-[#f0e4d6]'

  return (
    <div className="relative overflow-hidden rounded-[18px] border-2 border-[#c98a3d] bg-gradient-to-br from-[#fff4e2] via-[#fffaf3] to-[#fdeed8] p-5 shadow-[0_14px_38px_rgba(150,90,20,0.14)] dark:border-[#a5762f] dark:from-[#2b2118] dark:via-[#241d16] dark:to-[#2e2418] md:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#f4b96a]/40 blur-[70px] dark:bg-[#a55a2a]/30"
      />
      <div className="relative">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a8452a] px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-white">
            <IconBallpen size={13} aria-hidden="true" /> 站长亲笔签名版
          </span>
          <span className="rounded-full border border-[#c98a3d] bg-white/70 px-2 py-[2px] text-[11px] font-semibold text-[#8c5a1e] dark:border-[#8a6a3a] dark:bg-[#33291e] dark:text-[#eebb7a]">
            早鸟价 8.8 折 · 限时
          </span>
        </div>

        {phase === 'done' ? (
          <>
            <p className="text-[15px] font-semibold text-[#5c3a10] dark:text-[#f2cf96]">
              收货信息已保存，签名版已进入待发货队列
            </p>
            <p className="mt-1.5 text-[13px] leading-6 text-[#7a6647] dark:text-[#cba878]">
              站长会亲笔签名并附手写寄语卡，写完尽快寄出；发货后可在订单里查到快递单号。
            </p>
            <p className="mt-1 text-[12px] text-[#9b8a68] dark:text-[#a08a68]">
              订单号 {savedOrder?.orderNo || order?.orderNo}
            </p>
          </>
        ) : phase === 'paid' ? (
          <>
            <p className="text-[15px] font-semibold text-[#5c3a10] dark:text-[#f2cf96]">
              支付成功！填写收货信息，站长签名后寄出
            </p>
            <form className="mt-3 grid gap-2.5 sm:grid-cols-2" onSubmit={saveRecipient}>
              <label className="sm:col-span-1">
                <span className="sr-only">收货人姓名</span>
                <input
                  className={inputCls}
                  value={recipient.name}
                  onChange={(e) => setRecipient((p) => ({ ...p, name: e.target.value }))}
                  placeholder="收货人姓名"
                  autoComplete="name"
                  maxLength={30}
                />
              </label>
              <label className="sm:col-span-1">
                <span className="sr-only">手机号</span>
                <input
                  className={inputCls}
                  value={recipient.phone}
                  onChange={(e) => setRecipient((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="手机号"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="sr-only">收货地址</span>
                <textarea
                  className={`${inputCls} min-h-[72px] resize-y`}
                  value={recipient.address}
                  onChange={(e) => setRecipient((p) => ({ ...p, address: e.target.value }))}
                  placeholder="收货地址（省 / 市 / 区 + 详细地址）"
                  maxLength={200}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="sr-only">联系邮箱（选填）</span>
                <input
                  className={inputCls}
                  type="email"
                  value={recipient.email}
                  onChange={(e) => setRecipient((p) => ({ ...p, email: e.target.value }))}
                  placeholder="联系邮箱（选填，方便站长联系你）"
                  autoComplete="email"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={phase === 'saving'}
                  className="rounded-full bg-[#a8452a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f3a22] disabled:opacity-60"
                >
                  {phase === 'saving' ? '正在保存…' : '保存收货信息'}
                </button>
                <span className="text-[12px] text-[#9b8a68] dark:text-[#a08a68]">
                  信息仅用于寄书，发货前可在本页重新提交修改。
                </span>
              </div>
            </form>
            {message ? <p className="mt-2 text-xs text-[#a23b2a] dark:text-red-300">{message}</p> : null}
          </>
        ) : phase === 'qr' && order ? (
          <>
            <div className="flex flex-col items-center gap-2">
              {order.qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={order.qrCode}
                  alt="支付二维码"
                  width={170}
                  height={170}
                  className="rounded-lg border border-[#d9c6ae] bg-white p-2 dark:border-[#6b5140]"
                />
              ) : (
                <a
                  href={order.payUrl}
                  className="rounded-full bg-[#a8452a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8f3a22]"
                >
                  打开支付页
                </a>
              )}
              <p className="text-xs text-[#7a6647] dark:text-[#cba878]">
                微信扫码支付 ¥{order.amountLabel || fenLabel(edition.salePriceFen)}，支付成功后填写收货信息
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => checkStatus(order.orderNo)}
                  disabled={checking}
                  className="rounded-full border border-[#c98a3d] bg-white px-4 py-1.5 text-xs font-medium text-[#8c5a1e] hover:bg-[#fff8ec] disabled:opacity-60 dark:border-[#8a6a3a] dark:bg-[#33291e] dark:text-[#eebb7a]"
                >
                  {checking ? '正在查询…' : '我已支付，刷新状态'}
                </button>
                <button
                  type="button"
                  onClick={cancelOrder}
                  className="rounded-full px-3 py-1.5 text-xs text-[#9b8a68] hover:text-[#8c5a1e] dark:text-[#a08a68]"
                >
                  取消
                </button>
              </div>
              {refreshNote ? (
                <p className="text-xs text-[#9b8a68] dark:text-[#a08a68]">{refreshNote}</p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] font-semibold leading-6 text-[#5c3a10] dark:text-[#f2cf96]">
              不用去别家比价——这本书最好的版本在这里：{title}，站长亲笔签名，随书附赠一张手写寄语卡。
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[13px] text-[#9b8a68] line-through dark:text-[#a08a68]">
                定价 ¥{fenLabel(edition.basePriceFen)}
              </span>
              <span className="text-[26px] font-bold tabular-nums text-[#a8452a] dark:text-[#f0a262]">
                ¥{fenLabel(edition.salePriceFen)}
              </span>
              <span className="rounded-md bg-[#a8452a]/10 px-2 py-0.5 text-[12px] font-semibold text-[#a8452a] dark:bg-[#a5762f]/25 dark:text-[#f2cf96]">
                早鸟价 8.8 折
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={createOrder}
                  disabled={phase === 'creating'}
                  className="group relative inline-flex items-center gap-2 rounded-full bg-[#a8452a] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(168,69,42,0.28)] transition hover:-translate-y-0.5 hover:bg-[#8f3a22] disabled:opacity-60"
                >
                  <span className="rounded-sm bg-[#f5d9a8] px-1.5 py-0.5 text-[12px] font-bold leading-none text-[#7a3c14]">
                    亲签
                  </span>
                  {phase === 'creating' ? '正在下单…' : '购买亲笔签名版'}
                </button>
                <span className="text-[12px] leading-5 text-[#9b8a68] dark:text-[#a08a68]">
                  本站直购 · 微信扫码付款 · 签完寄出
                </span>
            </div>
            {phase === 'error' && message ? (
              <p className="mt-2 text-xs text-[#a23b2a] dark:text-red-300">{message}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
