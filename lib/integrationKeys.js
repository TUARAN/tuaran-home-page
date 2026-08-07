/**
 * 集成与 API Keys 存取（Edge 运行时）。
 * 凭证明文用 AES-GCM 加密落库（主密钥 INTEGRATION_KEYS_ENC_SECRET，
 * 未配置时回退 DEEPSEEK_KEYS_ENC_SECRET），列表只返回掩码。
 */

import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { decryptApiKey, encryptApiKey, maskApiKey } from './deepseekKeysCore'
import { probeEnvStatus } from './integrationCatalog'

export { probeEnvStatus } from './integrationCatalog'

export function getIntegrationEnv(explicitEnv) {
  if (explicitEnv) return explicitEnv
  const ctx = getOptionalRequestContext()
  if (ctx?.env) return ctx.env
  return (typeof process !== 'undefined' && process.env) || {}
}

export function getIntegrationMasterSecret(env) {
  return String(
    env?.INTEGRATION_KEYS_ENC_SECRET
      || env?.DEEPSEEK_KEYS_ENC_SECRET
      || process.env.INTEGRATION_KEYS_ENC_SECRET
      || process.env.DEEPSEEK_KEYS_ENC_SECRET
      || '',
  ).trim()
}

function rowToCredential(row) {
  return {
    id: row.id,
    name: row.name || '',
    service: row.service || '',
    kind: row.kind || 'secret',
    envRef: row.env_ref || '',
    keyHint: row.key_hint || '',
    baseUrl: row.base_url || '',
    status: row.status || 'active',
    note: row.note || '',
    usedCount: Number(row.used_count) || 0,
    lastUsedAt: row.last_used_at == null ? null : Number(row.last_used_at),
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

export async function listIntegrationCredentials(db) {
  const { results } = await db
    .prepare('SELECT * FROM integration_credentials ORDER BY updated_at DESC')
    .all()
  return (results || []).map(rowToCredential)
}

export async function upsertIntegrationCredential(db, {
  id = '',
  name = '',
  service = '',
  kind = 'secret',
  envRef = '',
  value = '',
  baseUrl = '',
  status = 'active',
  note = '',
  masterSecret,
}) {
  const now = Date.now()
  const credentialId = String(id || crypto.randomUUID())
  const cleanName = String(name || '').trim().slice(0, 80)
  const cleanService = String(service || 'other').trim().slice(0, 60)
  const cleanKind = ['secret', 'token', 'webhook'].includes(kind) ? kind : 'secret'
  const cleanEnvRef = String(envRef || '').trim().slice(0, 120)
  const cleanBaseUrl = String(baseUrl || '').trim().slice(0, 500)
  const cleanStatus = status === 'disabled' ? 'disabled' : 'active'
  const cleanNote = String(note || '').trim().slice(0, 500)
  if (!cleanName) return { ok: false, error: 'MISSING_NAME' }

  const existing = await db
    .prepare('SELECT key_cipher, key_hint FROM integration_credentials WHERE id = ?')
    .bind(credentialId)
    .first()

  let cipher = existing?.key_cipher || ''
  let hint = ''
  if (String(value || '').trim()) {
    if (!masterSecret) {
      return { ok: false, error: 'ENC_SECRET_MISSING', detail: '请先配置 INTEGRATION_KEYS_ENC_SECRET（或 DEEPSEEK_KEYS_ENC_SECRET）再保存凭证。' }
    }
    cipher = await encryptApiKey(value, masterSecret)
    hint = maskApiKey(value)
  } else if (!existing) {
    return { ok: false, error: 'MISSING_VALUE' }
  } else {
    hint = existing.key_hint || ''
  }

  await db
    .prepare(
      `INSERT INTO integration_credentials
         (id, name, service, kind, env_ref, key_hint, key_cipher, base_url, status, note, used_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         service = excluded.service,
         kind = excluded.kind,
         env_ref = excluded.env_ref,
         key_hint = excluded.key_hint,
         key_cipher = excluded.key_cipher,
         base_url = excluded.base_url,
         status = excluded.status,
         note = excluded.note,
         updated_at = excluded.updated_at`,
    )
    .bind(
      credentialId,
      cleanName,
      cleanService,
      cleanKind,
      cleanEnvRef,
      hint,
      cipher,
      cleanBaseUrl,
      cleanStatus,
      cleanNote,
      now,
      now,
    )
    .run()

  const row = await db.prepare('SELECT * FROM integration_credentials WHERE id = ?').bind(credentialId).first()
  return { ok: true, credential: rowToCredential(row) }
}

export async function deleteIntegrationCredential(db, id) {
  if (!id) return { ok: false, error: 'MISSING_ID' }
  const result = await db.prepare('DELETE FROM integration_credentials WHERE id = ?').bind(id).run()
  return { ok: Boolean(result?.meta?.changes), id }
}

export { decryptApiKey }
