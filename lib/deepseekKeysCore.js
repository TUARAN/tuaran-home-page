/**
 * DeepSeek 密钥 · 纯逻辑核心（无 Cloudflare 依赖，可单测）
 * 加密、掩码与任务绑定解析；D1 存取见 lib/deepseekKeys.js。
 */

export const ENV_DEFAULT_KEY_ID = 'env:DEEPSEEK_API_KEY'
export const ENV_DEFAULT_KEY_NAME = '环境变量默认密钥（DEEPSEEK_API_KEY）'

/** 默认共用同一把密钥的自动化来源；新增 source 必须同步加入，否则未绑定时会落到空的环境变量。 */
export const DEEPSEEK_SHARED_SOURCES = Object.freeze([
  'a-share-research',
  'admin-model-dispatch',
  'engagement-bot',
  'stock-analysis',
  'x-daily-greeting',
])

export function isDeepSeekSharedSource(source) {
  return DEEPSEEK_SHARED_SOURCES.includes(String(source || ''))
}

/** 掩码显示：sk-****abcd，只保留首 4 位与末 4 位。 */
export function maskApiKey(key) {
  const value = String(key || '').trim()
  if (value.length <= 8) return '***'
  return `${value.slice(0, 4)}****${value.slice(-4)}`
}

function toBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function subtle() {
  const api = globalThis.crypto?.subtle
  if (!api) throw new Error('当前运行时没有 Web Crypto（crypto.subtle）')
  return api
}

/** 任意长度主密钥统一派生为 32 字节 AES-256-GCM 密钥。 */
async function deriveKeyMaterial(secret) {
  const api = await subtle()
  const digest = await api.digest('SHA-256', new TextEncoder().encode(secret))
  return api.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/** AES-GCM 加密 API Key，返回 { v, iv, data } JSON 字符串。 */
export async function encryptApiKey(key, masterSecret) {
  const secret = String(masterSecret || '').trim()
  if (!secret) throw new Error('缺少 DEEPSEEK_KEYS_ENC_SECRET，无法加密存储 API Key')
  const keyMaterial = await deriveKeyMaterial(secret)
  const api = await subtle()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await api.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    new TextEncoder().encode(String(key || '')),
  )
  return JSON.stringify({ v: 1, iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)) })
}

/** 解密 deepseek_keys.key_cipher。 */
export async function decryptApiKey(payload, masterSecret) {
  const secret = String(masterSecret || '').trim()
  if (!secret) throw new Error('缺少 DEEPSEEK_KEYS_ENC_SECRET，无法解密 API Key')
  const parsed = JSON.parse(String(payload || ''))
  if (parsed?.v !== 1 || !parsed.iv || !parsed.data) throw new Error('无法识别的密钥密文格式')
  const keyMaterial = await deriveKeyMaterial(secret)
  const api = await subtle()
  const plain = await api.decrypt(
    { name: 'AES-GCM', iv: fromBase64(parsed.iv) },
    keyMaterial,
    fromBase64(parsed.data),
  )
  return new TextDecoder().decode(plain)
}

export function parseBindings(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        source: String(item.source || '').trim().slice(0, 100),
        taskType: String(item.taskType || '').trim().slice(0, 100),
      }))
      .filter((item) => item.source)
  } catch {
    return []
  }
}

function bindingScore(bindings, source, taskType) {
  if (!bindings.length) return 1
  if (bindings.some((b) => b.source === source && b.taskType && b.taskType === taskType)) return 3
  if (bindings.some((b) => b.source === source && !b.taskType)) return 2
  // 全站目前共用一把 DeepSeek key：绑到任一公用 source，其他公用任务也能用。
  if (isDeepSeekSharedSource(source) && bindings.some((b) => isDeepSeekSharedSource(b.source))) return 1
  return 0
}

/** 纯函数：从密钥行里选最匹配的一条，便于单测。 */
export function pickBestKeyRow(rows, source, taskType) {
  let best = null
  let bestScore = 0
  for (const row of rows || []) {
    const score = bindingScore(parseBindings(row.bound_tasks), source, taskType)
    if (score > bestScore) {
      best = row
      bestScore = score
    }
  }
  return best
}

/** 无绑定匹配时取最近更新的启用密钥；调用方只在环境变量兜底为空时使用。 */
export function pickLastResortKeyRow(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

/**
 * 绑定匹配优先；没有匹配时可用最近更新的启用密钥作全站兜底。
 * 当前站点只有一把 DeepSeek key，未给某个 source 单独绑定也不应报缺 Key。
 */
export function pickResolvedKeyRow(rows, source, taskType, { allowLastResort = false } = {}) {
  return pickBestKeyRow(rows, source, taskType) || (allowLastResort ? pickLastResortKeyRow(rows) : null)
}

/**
 * 全站默认 flash。密钥上的 default_model、环境变量 DEEPSEEK_MODEL 不再改模型；
 * 只有调用方显式传 model / taskDefaultModel 才会换。
 */
export function resolveDeepSeekModel({
  model = '',
  taskDefaultModel = '',
  fallback = 'deepseek-v4-flash',
} = {}) {
  return String(model || '').trim() || String(taskDefaultModel || '').trim() || fallback
}
