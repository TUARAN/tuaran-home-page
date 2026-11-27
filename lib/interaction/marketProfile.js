/** 大互动智能体市场画像：中文社区 zh、英文市场 en。 */

export const INTERACTION_MARKET_ZH = 'zh'
export const INTERACTION_MARKET_EN = 'en'

export const INTERACTION_MARKET_LABELS = Object.freeze({
  [INTERACTION_MARKET_ZH]: '中文社区',
  [INTERACTION_MARKET_EN]: 'English',
})

const CJK_RE = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u
const LATIN_RE = /[A-Za-z]/

export function normalizeInteractionMarket(value) {
  const key = String(value || '').trim().toLowerCase()
  if (key === INTERACTION_MARKET_EN) return INTERACTION_MARKET_EN
  if (key === INTERACTION_MARKET_ZH || !key) return INTERACTION_MARKET_ZH
  return null
}

export function interactionMarketLabel(market) {
  return INTERACTION_MARKET_LABELS[normalizeInteractionMarket(market)] || INTERACTION_MARKET_LABELS[INTERACTION_MARKET_ZH]
}

export function textHasCjk(text) {
  return CJK_RE.test(String(text || ''))
}

export function textHasLatin(text) {
  return LATIN_RE.test(String(text || ''))
}

/** 英文市场帖文：有拉丁字母且不含 CJK。 */
export function textMatchesEnglishMarket(text) {
  const value = String(text || '').trim()
  if (!value) return false
  if (textHasCjk(value)) return false
  return textHasLatin(value)
}

/** 英文市场资料：名或简介可读英文且无 CJK（与中文池 profileHasChinese 对称）。 */
export function profileMatchesEnglishMarket(name, bio) {
  const combined = `${String(name || '').trim()} ${String(bio || '').trim()}`.trim()
  if (!combined) return false
  return textMatchesEnglishMarket(combined)
}

/** 中文市场资料：名或简介含汉字（扩展 mutual.js 口径）。 */
export function profileMatchesChineseMarket(name, bio) {
  const left = String(name || '')
  const right = String(bio || '')
  return textHasCjk(left) || textHasCjk(right)
}