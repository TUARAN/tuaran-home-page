import { isH5PayClientMode } from './clientMode.mjs'

/** H5 下单成功后按虎皮椒文档直接跳转 url，失败时留在本页点按钮 */
export function redirectH5PayIfNeeded(data) {
  if (typeof window === 'undefined') return false
  const url = String(data?.payUrl || '').trim()
  if (!url || !isH5PayClientMode(data?.clientMode)) return false
  window.location.assign(url)
  return true
}