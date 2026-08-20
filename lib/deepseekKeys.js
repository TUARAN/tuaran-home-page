/**
 * DeepSeek 密钥管理（Edge 运行时）
 *
 * 支持两套密钥来源：
 *   1. 数据库密钥（deepseek_keys 表）：明文用 AES-GCM 加密后落库，
 *      加密主密钥取环境变量 DEEPSEEK_KEYS_ENC_SECRET，界面只显示掩码。
 *   2. 环境变量默认密钥（DEEPSEEK_API_KEY）：兼容既有部署，作为兜底。
 *
 * 任务绑定规则（deepseek_keys.bound_tasks，JSON 数组）：
 *   - [{ source, taskType }]：精确匹配 source + taskType。
 *   - [{ source }]（taskType 为空）：匹配该 source 下的所有任务类型。
 *   - []（未绑定）：全局兜底密钥，任意未匹配任务可用。
 *   解析优先级：精确绑定 > source 绑定 > 公用密钥池 / 全局兜底 > 最近启用的数据库密钥 > 环境变量。
 *   全站目前只有一把 DeepSeek key；绑到 A 股研究或问候文案的密钥，路过互动同样能用。
 */

import { getOptionalRequestContext } from '@cloudflare/next-on-pages'
import { getD1 } from './d1.js'
import {
  ENV_DEFAULT_KEY_ID,
  ENV_DEFAULT_KEY_NAME,
  decryptApiKey,
  maskApiKey,
  parseBindings,
  pickResolvedKeyRow,
} from './deepseekKeysCore.js'

export {
  DEEPSEEK_SHARED_SOURCES,
  DEEPSEEK_SITE_MODEL,
  ENV_DEFAULT_KEY_ID,
  ENV_DEFAULT_KEY_NAME,
  decryptApiKey,
  encryptApiKey,
  isDeepSeekSharedSource,
  maskApiKey,
  parseBindings,
} from './deepseekKeysCore.js'

export function getKeyStoreEnv(explicitEnv) {
  if (explicitEnv) return explicitEnv
  const ctx = getOptionalRequestContext()
  if (ctx?.env) return ctx.env
  return (typeof process !== 'undefined' && process.env) || {}
}

function defaultEnvKey(env) {
  return {
    apiKey: String(env.DEEPSEEK_API_KEY || ''),
    baseUrl: String(env.DEEPSEEK_BASE_URL || ''),
    model: String(env.DEEPSEEK_MODEL || ''),
    keyId: ENV_DEFAULT_KEY_ID,
    keyName: ENV_DEFAULT_KEY_NAME,
    fromEnv: true,
  }
}

/**
 * 按任务解析要使用的 DeepSeek 密钥。
 * 返回 { apiKey, baseUrl, model, keyId, keyName, fromEnv }；
 * 数据库不可用、未配置加密主密钥或没有匹配密钥时回退环境变量默认密钥。
 */
export async function resolveDeepSeekKey({ env, source = '', taskType = '' } = {}) {
  const resolvedEnv = getKeyStoreEnv(env)
  const fallback = defaultEnvKey(resolvedEnv)
  let db
  try {
    db = getD1()
  } catch {
    return fallback
  }
  const masterSecret = String(resolvedEnv.DEEPSEEK_KEYS_ENC_SECRET || '').trim()
  if (!masterSecret) return fallback

  try {
    const { results } = await db
      .prepare("SELECT * FROM deepseek_keys WHERE status = 'active' ORDER BY updated_at DESC")
      .all()
    if (!results?.length) return fallback
    const best = pickResolvedKeyRow(results, String(source || ''), String(taskType || ''), {
      allowLastResort: true,
    })
    if (!best) return fallback
    const apiKey = await decryptApiKey(best.key_cipher, masterSecret)
    if (!apiKey) return fallback
    db.prepare('UPDATE deepseek_keys SET last_used_at = ?, used_count = used_count + 1 WHERE id = ?')
      .bind(Date.now(), best.id)
      .run()
      .catch(() => {})
    return {
      apiKey,
      baseUrl: String(best.base_url || ''),
      model: String(best.default_model || ''),
      keyId: best.id,
      keyName: String(best.name || '未命名密钥'),
      fromEnv: false,
    }
  } catch (error) {
    console.error('resolveDeepSeekKey failed', error)
    return fallback
  }
}

/** 后台列表用：只输出掩码与统计，绝不返回密文。 */
export async function listDeepSeekKeys(db) {
  const { results } = await db.prepare('SELECT * FROM deepseek_keys ORDER BY updated_at DESC').all()
  const rows = results || []
  if (!rows.length) return []
  const placeholders = rows.map(() => '?').join(',')
  const { results: usageRows } = await db
    .prepare(
      `SELECT key_id,
              COUNT(*) AS calls,
              SUM(CASE WHEN execution_status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,
              SUM(CASE WHEN execution_status = 'failed' THEN 1 ELSE 0 END) AS failed,
              COALESCE(SUM(total_tokens), 0) AS total_tokens,
              MAX(finished_at) AS last_finished_at
       FROM deepseek_tasks
       WHERE key_id IN (${placeholders}) AND key_id != ''
       GROUP BY key_id`,
    )
    .bind(...rows.map((row) => row.id))
    .all()
  const usage = new Map((usageRows || []).map((row) => [row.key_id, row]))
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    keyHint: row.key_hint,
    status: row.status,
    baseUrl: row.base_url,
    defaultModel: row.default_model,
    note: row.note,
    bindings: parseBindings(row.bound_tasks),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: Number(row.last_used_at) || Number(usage.get(row.id)?.last_finished_at) || null,
    usedCount: Number(row.used_count) || 0,
    usage: usage.get(row.id)
      ? {
          calls: Number(usage.get(row.id).calls) || 0,
          succeeded: Number(usage.get(row.id).succeeded) || 0,
          failed: Number(usage.get(row.id).failed) || 0,
          totalTokens: Number(usage.get(row.id).total_tokens) || 0,
        }
      : { calls: 0, succeeded: 0, failed: 0, totalTokens: 0 },
  }))
}
