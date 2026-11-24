/**
 * 大互动共享账号池。日历、插件日报聚合、公开首页智能体卡片都从这里取账号；
 * 新增账号只维护这一处。
 */

export const X_INTERACTION_AGENT_POOL = Object.freeze([
  { name: '矿工阿三', handle: 'tarsixseveneig1' },
  { name: '矿长阿富', handle: 'TuaranX' },
  { name: '矿工小十三', handle: 'tuaran003' },
])

export function interactionAgentHandles() {
  return X_INTERACTION_AGENT_POOL.map((entry) => entry.handle)
}

export function normalizeAgentHandle(value) {
  return String(value || '').replace(/^@+/, '').trim()
}

export function findInteractionAgent(handle) {
  const key = normalizeAgentHandle(handle).toLowerCase()
  if (!key) return null
  return X_INTERACTION_AGENT_POOL.find((entry) => entry.handle.toLowerCase() === key) || null
}
