/**
 * 评论大V / 关注候选的按市场名单与榜单独正本。
 * 扩展经 scripts/sync-interaction-kol-sources.mjs 生成 kolMarketSources.js。
 */

export const INTERACTION_MARKET_ZH = 'zh'
export const INTERACTION_MARKET_EN = 'en'

/** 中文：X榜单 + 7 天换组内置池。 */
export const KOL_BUILTIN_POOLS_ZH = Object.freeze([
  Object.freeze(['xupaopaogm', 'thankucrypto', 'hotmailfromsh', 'weiyux2021', 'huoshan007']),
  Object.freeze(['alanshao111', 'vicentyip', 'xiaqingfeng666', 'JMkernt', 'DISONYYDS']),
])

/**
 * 英文：公开讨论的 AI / 产品圈账号（纯英文时间线为主）。
 * 暂不接中文 xbangdan；优先首页英文发现，再回退本组。
 */
export const KOL_BUILTIN_POOLS_EN = Object.freeze([
  Object.freeze(['karpathy', 'sama', 'ylecun', 'paulg', 'pmarca']),
  Object.freeze(['naval', 'levelsio', 'benedictevans', 'simonw', 'swyx']),
])

export const KOL_BUILTIN_POOLS = Object.freeze({
  [INTERACTION_MARKET_ZH]: KOL_BUILTIN_POOLS_ZH,
  [INTERACTION_MARKET_EN]: KOL_BUILTIN_POOLS_EN,
})

export const KOL_LEADERBOARD_BOARDS = Object.freeze({
  [INTERACTION_MARKET_ZH]: Object.freeze([
    Object.freeze({ id: 'xbangdan-accounts', url: 'https://xbangdan.com/accounts/' }),
  ]),
  [INTERACTION_MARKET_EN]: Object.freeze([]),
})

export const KOL_LEADERBOARD_CACHE_KEY = Object.freeze({
  [INTERACTION_MARKET_ZH]: 'xrcLeaderboardCache',
  [INTERACTION_MARKET_EN]: 'xrcLeaderboardCacheEn',
})

export function normalizeKolMarket(value) {
  return String(value || '').toLowerCase() === INTERACTION_MARKET_EN
    ? INTERACTION_MARKET_EN
    : INTERACTION_MARKET_ZH
}

export function builtinPoolsForMarket(market = INTERACTION_MARKET_ZH) {
  const key = normalizeKolMarket(market)
  return KOL_BUILTIN_POOLS[key] || KOL_BUILTIN_POOLS_ZH
}

export function leaderboardBoardsForMarket(market = INTERACTION_MARKET_ZH) {
  const key = normalizeKolMarket(market)
  return KOL_LEADERBOARD_BOARDS[key] || []
}

export function leaderboardCacheKeyForMarket(market = INTERACTION_MARKET_ZH) {
  const key = normalizeKolMarket(market)
  return KOL_LEADERBOARD_CACHE_KEY[key] || KOL_LEADERBOARD_CACHE_KEY[INTERACTION_MARKET_ZH]
}