/**
 * 大互动共享账号池。日历、插件日报聚合、公开首页智能体卡片都从这里取账号；
 * 中文与英文市场分池维护，新增账号写入对应数组并带上 market。
 */

import { INTERACTION_MARKET_EN, INTERACTION_MARKET_ZH, normalizeInteractionMarket } from './marketProfile.js'

export { INTERACTION_MARKET_EN, INTERACTION_MARKET_ZH, normalizeInteractionMarket }

/** 中文社区智能体（现有五个运营账号）。 */
export const X_INTERACTION_AGENT_POOL = Object.freeze([
  { name: '矿工阿三', handle: 'tarsixseveneig1', market: INTERACTION_MARKET_ZH },
  { name: '矿长阿富', handle: 'TuaranX', market: INTERACTION_MARKET_ZH },
  { name: '矿工小十三', handle: 'tuaran003', market: INTERACTION_MARKET_ZH },
  { name: '矿工阿柒', handle: 'DrBenjamin81269', market: INTERACTION_MARKET_ZH },
  { name: '灯下掘行者', handle: 'DrBenjamin5102', market: INTERACTION_MARKET_ZH },
])

/** 英文市场智能体；新英文账号只加在这里。 */
export const X_INTERACTION_AGENT_POOL_EN = Object.freeze([
  { name: 'Lantern Vale', handle: 'mHCncHeboklldif', market: INTERACTION_MARKET_EN },
])

export function interactionAgentCatalog() {
  return [...X_INTERACTION_AGENT_POOL, ...X_INTERACTION_AGENT_POOL_EN]
}

export function interactionAgentHandles(market) {
  const list = market ? interactionAgentCatalog().filter((entry) => entry.market === market) : interactionAgentCatalog()
  return list.map((entry) => entry.handle)
}

export function normalizeAgentHandle(value) {
  return String(value || '').replace(/^@+/, '').trim()
}

export function findInteractionAgent(handle) {
  const key = normalizeAgentHandle(handle).toLowerCase()
  if (!key) return null
  return interactionAgentCatalog().find((entry) => entry.handle.toLowerCase() === key) || null
}

export function interactionMarketForHandle(handle) {
  return findInteractionAgent(handle)?.market || null
}

export function isEnglishInteractionAgent(handle) {
  return interactionMarketForHandle(handle) === INTERACTION_MARKET_EN
}

export function isChineseInteractionAgent(handle) {
  const market = interactionMarketForHandle(handle)
  return market === INTERACTION_MARKET_ZH || market == null
}