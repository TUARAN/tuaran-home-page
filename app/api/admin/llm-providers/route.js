import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { encryptApiKey, getKeyStoreEnv, maskApiKey } from '../../../../lib/deepseekKeys'
import { normalizeOllamaBaseUrl } from '../../../../lib/ollamaCore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const STATUSES = new Set(['active', 'disabled'])
const AUTH_TYPES = new Set(['none', 'bearer', 'cloudflare_access'])

function unavailable(error) {
  return Response.json({
    error: 'LLM_PROVIDERS_UNAVAILABLE',
    detail: String(error?.message || error || 'D1 不可用或迁移 0071 尚未部署。'),
  }, { status: 503 })
}

function cleanText(value, length) {
  return String(value || '').trim().slice(0, length)
}

function mapRow(row, usage = {}) {
  const authType = row.auth_type || (row.auth_cipher ? 'bearer' : 'none')
  return {
    id: row.id,
    type: row.provider_type,
    name: row.name,
    baseUrl: row.base_url,
    defaultModel: row.default_model,
    authType,
    authHint: authType === 'cloudflare_access' ? '已安全保存' : row.auth_hint,
    authSecondaryHint: authType === 'cloudflare_access' ? '已安全保存' : (row.auth_secondary_hint || ''),
    status: row.status,
    note: row.note,
    lastCheckedAt: Number(row.last_checked_at) || null,
    lastCheckStatus: row.last_check_status,
    lastCheckDetail: row.last_check_detail,
    lastUsedAt: Number(row.last_used_at) || Number(usage.last_finished_at) || null,
    usedCount: Number(row.used_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usage: {
      calls: Number(usage.calls) || 0,
      succeeded: Number(usage.succeeded) || 0,
      failed: Number(usage.failed) || 0,
      totalTokens: Number(usage.total_tokens) || 0,
    },
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  try {
    const db = getD1()
    const [{ results }, { results: usageRows }] = await Promise.all([
      db.prepare("SELECT * FROM llm_providers WHERE provider_type = 'ollama' ORDER BY updated_at DESC").all(),
      db.prepare(
        `SELECT provider_id, COUNT(*) AS calls,
                SUM(CASE WHEN execution_status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,
                SUM(CASE WHEN execution_status = 'failed' THEN 1 ELSE 0 END) AS failed,
                COALESCE(SUM(total_tokens), 0) AS total_tokens,
                MAX(finished_at) AS last_finished_at
         FROM deepseek_tasks WHERE provider = 'ollama' AND provider_id != '' GROUP BY provider_id`,
      ).all(),
    ])
    const usage = new Map((usageRows || []).map((row) => [row.provider_id, row]))
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      encSecretConfigured: Boolean(cleanText(getKeyStoreEnv().DEEPSEEK_KEYS_ENC_SECRET, 10000)),
      providers: (results || []).map((row) => mapRow(row, usage.get(row.id))),
    })
  } catch (error) {
    return unavailable(error)
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)
  const name = cleanText(body?.name, 80)
  const model = cleanText(body?.defaultModel, 160)
  const token = cleanText(body?.token, 2000)
  const clientId = cleanText(body?.clientId, 2000)
  const clientSecret = cleanText(body?.clientSecret, 2000)
  const authType = cleanText(body?.authType || (token ? 'bearer' : 'none'), 40)
  const note = cleanText(body?.note, 500)
  const status = body?.status || 'active'
  if (!name) return Response.json({ error: 'MISSING_NAME' }, { status: 400 })
  if (!model) return Response.json({ error: 'MISSING_DEFAULT_MODEL' }, { status: 400 })
  if (!STATUSES.has(status)) return Response.json({ error: 'INVALID_STATUS' }, { status: 400 })
  if (!AUTH_TYPES.has(authType)) return Response.json({ error: 'INVALID_AUTH_TYPE' }, { status: 400 })
  if (authType === 'bearer' && !token) return Response.json({ error: 'MISSING_BEARER_TOKEN' }, { status: 400 })
  if (authType === 'cloudflare_access' && (!clientId || !clientSecret)) {
    return Response.json({ error: 'MISSING_CLOUDFLARE_ACCESS_CREDENTIALS' }, { status: 400 })
  }
  let baseUrl
  try {
    baseUrl = normalizeOllamaBaseUrl(body?.baseUrl)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
  const secret = cleanText(getKeyStoreEnv().DEEPSEEK_KEYS_ENC_SECRET, 10000)
  if (authType !== 'none' && !secret) return Response.json({ error: 'LLM_KEYS_ENC_SECRET_NOT_CONFIGURED' }, { status: 503 })

  try {
    const db = getD1()
    const now = Date.now()
    const id = crypto.randomUUID()
    const primaryCredential = authType === 'cloudflare_access' ? clientId : authType === 'bearer' ? token : ''
    const secondaryCredential = authType === 'cloudflare_access' ? clientSecret : ''
    const cipher = primaryCredential ? await encryptApiKey(primaryCredential, secret) : ''
    const secondaryCipher = secondaryCredential ? await encryptApiKey(secondaryCredential, secret) : ''
    await db.prepare(
      `INSERT INTO llm_providers
        (id, provider_type, name, base_url, default_model, auth_type, auth_hint, auth_cipher,
         auth_secondary_hint, auth_secondary_cipher, status, note, created_at, updated_at)
       VALUES (?, 'ollama', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id, name, baseUrl, model, authType,
      primaryCredential ? maskApiKey(primaryCredential) : '', cipher,
      secondaryCredential ? '已安全保存' : '', secondaryCipher,
      status, note, now, now,
    ).run()
    return Response.json({ ok: true, id, createdAt: now }, { status: 201 })
  } catch (error) {
    return unavailable(error)
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)
  const id = cleanText(body?.id, 120)
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })
  if (body?.status != null && !STATUSES.has(body.status)) return Response.json({ error: 'INVALID_STATUS' }, { status: 400 })
  if (body?.authType != null && !AUTH_TYPES.has(body.authType)) return Response.json({ error: 'INVALID_AUTH_TYPE' }, { status: 400 })

  let existing
  try {
    existing = await getD1().prepare("SELECT * FROM llm_providers WHERE id = ? AND provider_type = 'ollama'").bind(id).first()
  } catch (error) {
    return unavailable(error)
  }
  if (!existing) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

  const sets = ['updated_at = ?']
  const binds = [Date.now()]
  for (const [field, column, max] of [
    ['name', 'name', 80], ['defaultModel', 'default_model', 160], ['note', 'note', 500],
  ]) {
    if (body?.[field] != null) {
      const value = cleanText(body[field], max)
      if ((field === 'name' || field === 'defaultModel') && !value) return Response.json({ error: `INVALID_${field.toUpperCase()}` }, { status: 400 })
      sets.push(`${column} = ?`)
      binds.push(value)
    }
  }
  if (body?.baseUrl != null) {
    try {
      sets.push('base_url = ?')
      binds.push(normalizeOllamaBaseUrl(body.baseUrl))
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  }
  if (body?.status != null) {
    sets.push('status = ?')
    binds.push(body.status)
  }
  const token = cleanText(body?.token, 2000)
  const clientId = cleanText(body?.clientId, 2000)
  const clientSecret = cleanText(body?.clientSecret, 2000)
  const authType = body?.authType == null
    ? (existing.auth_type || (existing.auth_cipher ? 'bearer' : 'none'))
    : cleanText(body.authType, 40)
  if (body?.authType != null || token || clientId || clientSecret) {
    const secret = cleanText(getKeyStoreEnv().DEEPSEEK_KEYS_ENC_SECRET, 10000)
    if (authType !== 'none' && !secret) return Response.json({ error: 'LLM_KEYS_ENC_SECRET_NOT_CONFIGURED' }, { status: 503 })
    const previousType = existing.auth_type || (existing.auth_cipher ? 'bearer' : 'none')
    if (authType === 'none') {
      sets.push('auth_type = ?', 'auth_cipher = ?', 'auth_hint = ?', 'auth_secondary_cipher = ?', 'auth_secondary_hint = ?')
      binds.push('none', '', '', '', '')
    } else if (authType === 'bearer') {
      if (!token && previousType !== 'bearer') return Response.json({ error: 'MISSING_BEARER_TOKEN' }, { status: 400 })
      sets.push('auth_type = ?', 'auth_secondary_cipher = ?', 'auth_secondary_hint = ?')
      binds.push('bearer', '', '')
      if (token) {
        sets.push('auth_cipher = ?', 'auth_hint = ?')
        binds.push(await encryptApiKey(token, secret), maskApiKey(token))
      }
    } else {
      const credentialsProvided = Boolean(clientId && clientSecret)
      if (!credentialsProvided && previousType !== 'cloudflare_access') {
        return Response.json({ error: 'MISSING_CLOUDFLARE_ACCESS_CREDENTIALS' }, { status: 400 })
      }
      if (Boolean(clientId) !== Boolean(clientSecret)) {
        return Response.json({ error: 'INCOMPLETE_CLOUDFLARE_ACCESS_CREDENTIALS' }, { status: 400 })
      }
      sets.push('auth_type = ?')
      binds.push('cloudflare_access')
      if (credentialsProvided) {
        sets.push('auth_cipher = ?', 'auth_hint = ?', 'auth_secondary_cipher = ?', 'auth_secondary_hint = ?')
        binds.push(
          await encryptApiKey(clientId, secret), maskApiKey(clientId),
          await encryptApiKey(clientSecret, secret), '已安全保存',
        )
      }
    }
  }
  if (sets.length === 1) return Response.json({ error: 'NO_FIELDS' }, { status: 400 })
  binds.push(id)
  try {
    const result = await getD1().prepare(`UPDATE llm_providers SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, id, updatedAt: Date.now() })
  } catch (error) {
    return unavailable(error)
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)
  const id = cleanText(body?.id, 120)
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })
  try {
    const result = await getD1().prepare("UPDATE llm_providers SET status = 'disabled', updated_at = ? WHERE id = ?")
      .bind(Date.now(), id).run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, id, disabled: true })
  } catch (error) {
    return unavailable(error)
  }
}
