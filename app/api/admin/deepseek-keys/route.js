import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  encryptApiKey,
  getKeyStoreEnv,
  listDeepSeekKeys,
  maskApiKey,
  parseBindings,
} from '../../../../lib/deepseekKeys'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const STATUSES = new Set(['active', 'disabled'])
const MAX_NAME = 80
const MAX_NOTE = 500

function cleanBindings(value) {
  if (value == null) return null
  if (!Array.isArray(value)) throw new Error('INVALID_BINDINGS')
  const bindings = parseBindings(JSON.stringify(value))
  if (bindings.length > 20) throw new Error('TOO_MANY_BINDINGS')
  return bindings
}

function unavailable() {
  return Response.json(
    {
      status: 'unavailable',
      detail: 'D1 不可用或迁移 0059 尚未部署，无法管理 DeepSeek 密钥。',
    },
    { status: 503 },
  )
}

function dbError(error) {
  const detail = String(error?.message || error)
  if (detail.includes('no such table')) return unavailable()
  return Response.json({ error: 'DEEPSEEK_KEYS_FAILED', detail }, { status: 500 })
}

function missingMasterSecret() {
  return Response.json(
    {
      error: 'DEEPSEEK_KEYS_ENC_SECRET_NOT_CONFIGURED',
      detail: '请先在 Cloudflare Pages 环境变量配置 DEEPSEEK_KEYS_ENC_SECRET，用于加密存储 API Key。',
    },
    { status: 503 },
  )
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db
  try {
    db = getD1()
  } catch {
    return unavailable()
  }

  const env = getKeyStoreEnv()
  const envKeyConfigured = Boolean(env.DEEPSEEK_API_KEY)
  try {
    const keys = await listDeepSeekKeys(db)
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      envKeyConfigured,
      envKeyHint: envKeyConfigured ? maskApiKey(env.DEEPSEEK_API_KEY) : '',
      encSecretConfigured: Boolean(String(env.DEEPSEEK_KEYS_ENC_SECRET || '').trim()),
      keys,
    })
  } catch (error) {
    return dbError(error)
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const name = String(body?.name || '').trim().slice(0, MAX_NAME)
  const key = String(body?.key || '').trim()
  const baseUrl = String(body?.baseUrl || '').trim().slice(0, 200)
  const defaultModel = String(body?.defaultModel || '').trim().slice(0, 120)
  const status = body?.status || 'active'
  const note = String(body?.note || '').trim().slice(0, MAX_NOTE)

  if (!name) return Response.json({ error: 'MISSING_NAME' }, { status: 400 })
  if (key.length < 16) return Response.json({ error: 'INVALID_KEY_LENGTH' }, { status: 400 })
  if (!STATUSES.has(status)) return Response.json({ error: 'INVALID_STATUS' }, { status: 400 })
  let bindings
  try {
    bindings = cleanBindings(body?.bindings)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  const env = getKeyStoreEnv()
  const masterSecret = String(env.DEEPSEEK_KEYS_ENC_SECRET || '').trim()
  if (!masterSecret) return missingMasterSecret()

  let db
  try {
    db = getD1()
  } catch {
    return unavailable()
  }

  const now = Date.now()
  const id = crypto.randomUUID()
  try {
    const cipher = await encryptApiKey(key, masterSecret)
    await db
      .prepare(
        `INSERT INTO deepseek_keys
          (id, name, key_hint, key_cipher, base_url, default_model, status, note, bound_tasks, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        name,
        maskApiKey(key),
        cipher,
        baseUrl,
        defaultModel,
        status,
        note,
        JSON.stringify(bindings),
        now,
        now,
      )
      .run()
    return Response.json({ ok: true, id, name, keyHint: maskApiKey(key), createdAt: now }, { status: 201 })
  } catch (error) {
    return dbError(error)
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id || '').trim()
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })

  const name = body?.name == null ? null : String(body.name).trim().slice(0, MAX_NAME)
  const status = body?.status
  const baseUrl = body?.baseUrl == null ? null : String(body.baseUrl).trim().slice(0, 200)
  const defaultModel = body?.defaultModel == null ? null : String(body.defaultModel).trim().slice(0, 120)
  const note = body?.note == null ? null : String(body.note).trim().slice(0, MAX_NOTE)
  const newKey = body?.key == null ? null : String(body.key).trim()
  if (status != null && !STATUSES.has(status)) return Response.json({ error: 'INVALID_STATUS' }, { status: 400 })
  if (name === '') return Response.json({ error: 'INVALID_NAME' }, { status: 400 })
  if (newKey != null && newKey.length < 16) return Response.json({ error: 'INVALID_KEY_LENGTH' }, { status: 400 })

  let bindings = null
  if (body?.bindings != null) {
    try {
      bindings = cleanBindings(body.bindings)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  }
  if (name == null && status == null && baseUrl == null && defaultModel == null && note == null && newKey == null && bindings == null) {
    return Response.json({ error: 'NO_FIELDS' }, { status: 400 })
  }

  const env = getKeyStoreEnv()
  const masterSecret = String(env.DEEPSEEK_KEYS_ENC_SECRET || '').trim()
  if (newKey != null && !masterSecret) return missingMasterSecret()

  let db
  try {
    db = getD1()
  } catch {
    return unavailable()
  }

  const sets = ['updated_at = ?']
  const binds = [Date.now()]
  if (name != null) {
    sets.push('name = ?')
    binds.push(name)
  }
  if (status != null) {
    sets.push('status = ?')
    binds.push(status)
  }
  if (baseUrl != null) {
    sets.push('base_url = ?')
    binds.push(baseUrl)
  }
  if (defaultModel != null) {
    sets.push('default_model = ?')
    binds.push(defaultModel)
  }
  if (note != null) {
    sets.push('note = ?')
    binds.push(note)
  }
  if (bindings != null) {
    sets.push('bound_tasks = ?')
    binds.push(JSON.stringify(bindings))
  }
  if (newKey != null) {
    const cipher = await encryptApiKey(newKey, masterSecret)
    sets.push('key_cipher = ?')
    binds.push(cipher)
    sets.push('key_hint = ?')
    binds.push(maskApiKey(newKey))
  }
  binds.push(id)

  try {
    const result = await db
      .prepare(`UPDATE deepseek_keys SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, id, updatedAt: Date.now() })
  } catch (error) {
    return dbError(error)
  }
}

/** 停用密钥（软删除，保留调用历史可读性）。 */
export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id || '').trim()
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })

  let db
  try {
    db = getD1()
  } catch {
    return unavailable()
  }
  try {
    const result = await db
      .prepare("UPDATE deepseek_keys SET status = 'disabled', updated_at = ? WHERE id = ?")
      .bind(Date.now(), id)
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, id, disabled: true })
  } catch (error) {
    return dbError(error)
  }
}
