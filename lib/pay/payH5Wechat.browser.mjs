/**
 * H5 截图扫码：经本站代理下载付款图，再尝试唤起微信。
 */

export async function downloadPayImageViaSite(orderNo) {
  const id = String(orderNo || '').trim()
  if (!id) throw new Error('ORDER_NO_MISSING')
  const res = await fetch(`/api/pay/qrcode?orderNo=${encodeURIComponent(id)}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`DOWNLOAD_${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `2aran-pay-${id}.png`
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** 尝试打开微信；部分浏览器会拦截自定义 scheme，由调用方展示图文指引 */
export function tryOpenWeChatApp() {
  if (typeof window === 'undefined') return
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = 'weixin://'
  document.body.appendChild(iframe)
  window.setTimeout(() => {
    iframe.remove()
  }, 2000)
  window.location.href = 'weixin://'
}

/**
 * 保存付款图并唤起微信；返回是否已触发下载。
 */
export async function savePayImageAndOpenWechat(orderNo) {
  await downloadPayImageViaSite(orderNo)
  window.setTimeout(() => tryOpenWeChatApp(), 350)
  return true
}