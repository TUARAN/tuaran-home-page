import { repairUnclosedFrontmatter, stripPreamble } from './aSharePublishCore.js'
import { validateCryptoDraft } from './cryptoResearchCore.js'

export const CRYPTO_AUTO_PUBLISH_DELAY_MS = 3 * 24 * 60 * 60 * 1000

export function cryptoAutoPublishAt(draft) {
  const pendingAt = Number(draft?.updated_at)
  return Number.isFinite(pendingAt) && pendingAt > 0 ? pendingAt + CRYPTO_AUTO_PUBLISH_DELAY_MS : null
}

export function cryptoDraftToArticleContent(content, coin = null) {
  const text = repairUnclosedFrontmatter(stripPreamble(content))
  validateCryptoDraft(text, coin)
  return text
}

export function cryptoPublishFileName(draft) {
  const date = String(draft?.draft_date || '').trim()
  const coinId = String(draft?.coin_id || '').trim().toLowerCase()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`draft_date 非法：${date}`)
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(coinId)) throw new Error(`coin_id 非法：${coinId}`)
  return `${date}-crypto-${coinId}.md`
}

export function cryptoPublishSlug(fileName) {
  const match = /^\d{4}-\d{2}-\d{2}-(.+?)\.md$/u.exec(String(fileName || ''))
  if (!match) throw new Error(`文件名无法推导 slug：${fileName}`)
  return match[1]
}
