'use client'

import { isH5PayClientMode } from '../../../lib/pay/clientMode.mjs'

/**
 * 虎皮椒收银展示：Web 本地展示二维码图；H5 只提供跳转链，不展示 url_qrcode。
 */
export default function PayGatewayCheckout({
  order,
  amountLabel,
  checking,
  onRefresh,
  onCancel,
  qrClassName = 'rounded-lg border border-[#e2d9c4] bg-white p-2 dark:border-amber-900/40',
  h5LinkClassName = 'rounded-full border border-[#caa86a] bg-[#7a5b1e] px-6 py-2 text-sm font-medium text-white hover:bg-[#6a4f19]',
  noteClassName = 'text-xs text-[#8a7a55] dark:text-amber-300/80',
  h5Note = '手机端将跳转到微信完成支付；支付成功后返回本页自动解锁',
  webNote,
}) {
  const h5 = isH5PayClientMode(order?.clientMode)
  const payUrl = String(order?.payUrl || '').trim()
  const qrCode = String(order?.qrCode || '').trim()

  function goPay() {
    if (!payUrl) return
    window.location.assign(payUrl)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {h5 ? (
        payUrl ? (
          <>
            <button type="button" onClick={goPay} className={h5LinkClassName}>
              前往微信支付
            </button>
            <p className={noteClassName}>
              {h5Note}
              {amountLabel ? ` · ¥${amountLabel}` : ''}
            </p>
          </>
        ) : (
          <p className={noteClassName}>未拿到手机支付链接，请取消后重试或联系站长。</p>
        )
      ) : qrCode ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="支付二维码" width={180} height={180} className={qrClassName} />
          <p className={noteClassName}>
            {webNote || `微信扫码支付${amountLabel ? ` ¥${amountLabel}` : ''}，支付成功后本页自动解锁`}
          </p>
        </>
      ) : (
        <p className={noteClassName}>未拿到支付二维码，请取消后重试或联系站长。</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={checking}
          className="rounded-full border border-[#caa86a] bg-white px-4 py-1.5 text-xs font-medium text-[#7a5b1e] hover:bg-[#fffdf7] disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {checking ? '正在查询…' : '我已支付，刷新状态'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1.5 text-xs text-[#8a7a55] hover:text-[#7a5b1e] dark:text-amber-300/70"
        >
          取消
        </button>
      </div>
    </div>
  )
}