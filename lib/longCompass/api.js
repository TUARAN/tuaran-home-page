// 长期罗盘客户端 API 封装
//
// 只跟 /api/private-records 打交道，不涉及 React、不持有口令。
// 关心服务端形状变化时，改这一个文件。

import { isValidEnvelope } from './crypto.js'

async function readJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 120) }
  }
}

/**
 * 拉所有加密记录。
 * @returns {Promise<{
 *   status: 'ok' | 'unauthorized' | 'forbidden' | 'error',
 *   user?: object,
 *   items?: Array<{ id, kind, payload, createdAt, updatedAt }>,
 *   error?: string
 * }>}
 */
export async function fetchEncryptedRecords() {
  const res = await fetch('/api/private-records', { cache: 'no-store' })
  if (res.status === 401) return { status: 'unauthorized' }
  if (res.status === 403) return { status: 'forbidden' }

  const data = await readJson(res)
  if (!res.ok) {
    return { status: 'error', error: data?.error || `HTTP_${res.status}` }
  }

  const rawItems = Array.isArray(data?.items) ? data.items : []
  const items = rawItems.filter((it) => it && isValidEnvelope(it.payload))

  return {
    status: 'ok',
    user: data?.user || null,
    items,
    skippedCount: rawItems.length - items.length,
  }
}
