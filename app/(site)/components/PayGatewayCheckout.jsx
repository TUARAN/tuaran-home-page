'use client'

import { useState } from 'react'
import { isH5PayClientMode } from '../../../lib/pay/clientMode.mjs'
import { savePayImageAndOpenWechat } from '../../../lib/pay/payH5Wechat.browser.mjs'

/**
 * 虎皮椒收银展示：Web 本地展示二维码图；H5 主路径跳转 url，备用路径保存付款图 + 微信扫一扫。
 */
export default function PayGatewayCheckout({
  order,
  amountLabel,
  checking,
  onRefresh,
  onCancel,
  qrClassName = 'rounded-lg border border-[#e2d9c4] bg-white p-2 dark:border-amber-900/40',
  h5LinkClassName = 'rounded-full border border-[#caa86a] bg-[#7a5b1e] px-6 py-2 text-sm font-medium text-white hover:bg-[#6a4f19]',
  h5AltClassName = 'rounded-full border border-[#d8c89a] bg-white px-5 py-2 text-sm font-medium text-[#7a5b1e] hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  noteClassName = 'text-xs text-[#8a7a55] dark:text-amber-300/80',
  h5Note = '首选直接跳转微信；若无法唤起，可保存付款图后在微信扫一扫里从相册识别',
  webNote,
}) {
  const h5 = isH5PayClientMode(order?.clientMode)
  const payUrl = String(order?.payUrl || '').trim()
  const qrCode = String(order?.qrCode || '').trim()
  const payImageUrl = String(order?.payImageUrl || order?.qrCode || '').trim()
  const canScreenshotPay = h5 && Boolean(payImageUrl || order?.orderNo)

  const [shotBusy, setShotBusy] = useState(false)
  const [shotNote, setShotNote] = useState('')

  function goPay() {
    if (!payUrl) return
    window.location.assign(payUrl)
  }

  async function saveAndOpenWechat() {
    if (!order?.orderNo) return
    setShotBusy(true)
    setShotNote('')
    try {
      await savePayImageAndOpenWechat(order.orderNo)
      setShotNote('若未自动打开微信：打开微信 → 扫一扫 → 相册 → 选择刚保存的付款图')
    } catch {
      setShotNote('保存失败，请先点「前往微信支付」；仍不行请取消后重新下单。')
    } finally {
      setShotBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {h5 ? (
        payUrl || canScreenshotPay ? (
          <>
            {payUrl ? (
              <button type="button" onClick={goPay} className={h5LinkClassName}>
                前往微信支付
              </button>
            ) : null}
            {canScreenshotPay ? (
              <button
                type="button"
                onClick={saveAndOpenWechat}
                disabled={shotBusy}
                className={h5AltClassName}
              >
                {shotBusy ? '正在保存…' : '保存付款图并打开微信'}
              </button>
            ) : null}
            <p className={`${noteClassName} max-w-xs text-center leading-relaxed`}>
              {h5Note}
              {amountLabel ? ` · ¥${amountLabel}` : ''}
            </p>
            {shotNote ? <p className={`${noteClassName} max-w-sm text-center text-[#7a5b1e] dark:text-amber-200`}>{shotNote}</p> : null}
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