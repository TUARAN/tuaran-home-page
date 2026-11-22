// x.2aran.com 工作台的纯逻辑：账号名归一、套餐额度、人格与记忆校验。
// 不碰存储与网络；原则冲突检查复用扩展里冻结的 principleConflict，云端与插件规则一致。
import planner from '../../../tools/x-reply-clipboard-extension/agentPlanner.js'

export const PERSONA_LIMITS = Object.freeze({ role: 120, goal: 120, tone: 80 })
export const MEMORY_LIMITS = Object.freeze({ items: 30, text: 120 })
export const MEMORY_TYPES = Object.freeze(['account', 'preference', 'rule'])

// P5 之前不收费，只有 free 一档；额度先记账，超额拒绝。
export const PLANS = Object.freeze({
  free: Object.freeze({
    accounts: 3,
    quota: Object.freeze({ rewrite: 30, image: 10, agent_chat: 200 }),
  }),
})
export const QUOTA_KINDS = Object.freeze(Object.keys(PLANS.free.quota))

export function accountKey(value) {
  const key = String(value || '').trim().replace(/^@+/, '').toLowerCase()
  if (!/^[a-z0-9_]{1,15}$/.test(key) || key === 'default') return ''
  return key
}

export function periodKey(now = Date.now()) {
  const d = new Date(now)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function planFor() {
  return PLANS.free
}

function oneLine(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function validatePersona(input, conflictOf = planner.principleConflict) {
  const persona = {}
  for (const [field, max] of Object.entries(PERSONA_LIMITS)) {
    const text = oneLine(input?.[field], max)
    const conflict = text ? conflictOf(text) : ''
    if (conflict) return { ok: false, error: 'PRINCIPLE_CONFLICT', field, reason: conflict }
    persona[field] = text
  }
  return { ok: true, persona }
}

export function validateMemory(input, conflictOf = planner.principleConflict) {
  const list = Array.isArray(input) ? input : []
  const seen = new Set()
  const memory = []
  for (const item of list) {
    const text = oneLine(item?.text, MEMORY_LIMITS.text)
    if (!text || seen.has(text)) continue
    const conflict = conflictOf(text)
    if (conflict) return { ok: false, error: 'PRINCIPLE_CONFLICT', field: 'memory', reason: conflict }
    seen.add(text)
    memory.push({
      id: oneLine(item?.id, 40),
      type: MEMORY_TYPES.includes(item?.type) ? item.type : 'account',
      text,
      source: item?.source === 'agent' ? 'agent' : 'user',
      at: Number.isFinite(Number(item?.at)) ? Number(item.at) : 0,
    })
  }
  if (memory.length > MEMORY_LIMITS.items) return { ok: false, error: 'MEMORY_FULL' }
  return { ok: true, memory }
}
