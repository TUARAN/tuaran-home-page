/**
 * 大互动共享账号池。日历、插件日报聚合等从这里取 handle；
 * 新增账号只维护这一处。公开首页展示账号见 `publicShowcaseAgent`。
 */

export const X_INTERACTION_AGENT_POOL = Object.freeze([
  { name: '矿工阿三', handle: 'tarsixseveneig1' },
  { name: '矿长阿富', handle: 'TuaranX' },
  { name: '矿工小十三', handle: 'tuaran003' },
])

const PUBLIC_SHOWCASE_HANDLE = 'TuaranX'

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

/** x.2aran.com 公开首页只展示站长主智能体，与账号池其它成员区分。 */
export function publicShowcaseAgent() {
  const agent = findInteractionAgent(PUBLIC_SHOWCASE_HANDLE)
  if (!agent) throw new Error(`public showcase handle missing from pool: ${PUBLIC_SHOWCASE_HANDLE}`)
  return agent
}