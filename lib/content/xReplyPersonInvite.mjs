import { COMMUNITY_ACTION_SECRET_KEY } from '../community/communityActions.js'

const ID_RE = /^[A-Za-z0-9_-]{8,80}$/
const CODE_RE = /^[A-Za-z0-9_-]{16,64}$/
const STATUSES = new Set(['downloadable', 'bound', 'revoked'])

function cleanLabel(value) {
  return String(value || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 80)
}

function cleanHandle(value) {
  return String(value || '').replace(/^@+/u, '').replace(/\s+/g, '').trim().slice(0, 40).toLowerCase()
}

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createPersonInviteCode() {
  const random = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...random)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function presentInvite(row) {
  if (!row) return null
  return {
    id: String(row.id || ''),
    label: String(row.label || ''),
    status: String(row.status || ''),
    deviceId: String(row.device_id || ''),
    accountHandle: String(row.account_handle || ''),
    downloadCount: Number(row.download_count || 0),
    lastDownloadAt: row.last_download_at == null ? null : Number(row.last_download_at),
    boundAt: row.bound_at == null ? null : Number(row.bound_at),
    lastSeenAt: row.last_seen_at == null ? null : Number(row.last_seen_at),
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
    createdBy: String(row.created_by || ''),
  }
}

export async function readOwnerCommunitySecret(db) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').bind(COMMUNITY_ACTION_SECRET_KEY).first()
  return String(row?.value || '')
}

export async function listPersonInvites(db, { limit = 100 } = {}) {
  const max = Math.max(1, Math.min(300, Math.trunc(Number(limit) || 100)))
  const result = await db.prepare(
    `SELECT id, code, label, status, device_id, account_handle, download_count,
            last_download_at, bound_at, last_seen_at, created_at, updated_at, created_by
       FROM x_reply_person_invites
      ORDER BY created_at DESC
      LIMIT ?`,
  ).bind(max).all()
  return (result?.results || []).map((row) => {
    const item = presentInvite(row)
    // Never list plaintext codes after creation.
    return item
  })
}

export async function findPersonInviteByCode(db, code) {
  const value = String(code || '').trim()
  if (!CODE_RE.test(value)) return null
  const row = await db.prepare(
    `SELECT id, code, label, status, device_id, account_handle, download_count,
            last_download_at, bound_at, last_seen_at, created_at, updated_at, created_by
       FROM x_reply_person_invites WHERE code = ?`,
  ).bind(value).first()
  if (!row) return null
  return { ...presentInvite(row), code: String(row.code || '') }
}

export async function createPersonInvite(db, { label = '', actor = 'owner', code = '' } = {}) {
  const now = Date.now()
  const inviteCode = String(code || '').trim() || createPersonInviteCode()
  if (!CODE_RE.test(inviteCode)) throw new Error('INVALID_INVITE_CODE')
  const id = newId()
  const owner = String(actor || 'owner')
  await db.prepare(
    `INSERT INTO x_reply_person_invites (
       id, code, label, status, device_id, account_handle, download_count,
       last_download_at, bound_at, last_seen_at, created_at, updated_at, created_by
     ) VALUES (?, ?, ?, 'downloadable', '', '', 0, NULL, NULL, NULL, ?, ?, ?)`,
  ).bind(id, inviteCode, cleanLabel(label), now, now, owner).run()
  return {
    id,
    code: inviteCode,
    label: cleanLabel(label),
    status: 'downloadable',
    createdAt: now,
    createdBy: owner,
  }
}

export async function resetPersonInviteToDownloadable(db, id, actor = 'owner') {
  const inviteId = String(id || '').trim()
  if (!inviteId) return { ok: false, error: 'INVALID_ID' }
  const now = Date.now()
  const result = await db.prepare(
    `UPDATE x_reply_person_invites
        SET status = 'downloadable',
            device_id = '',
            account_handle = '',
            bound_at = NULL,
            updated_at = ?
      WHERE id = ? AND status IN ('bound', 'revoked', 'downloadable')`,
  ).bind(now, inviteId).run()
  if (!Number(result?.meta?.changes || 0)) return { ok: false, error: 'NOT_FOUND' }
  return { ok: true, updatedAt: now, updatedBy: String(actor || 'owner') }
}

export async function revokePersonInvite(db, id, actor = 'owner') {
  const inviteId = String(id || '').trim()
  if (!inviteId) return { ok: false, error: 'INVALID_ID' }
  const now = Date.now()
  const result = await db.prepare(
    `UPDATE x_reply_person_invites
        SET status = 'revoked', updated_at = ?
      WHERE id = ? AND status != 'revoked'`,
  ).bind(now, inviteId).run()
  if (!Number(result?.meta?.changes || 0)) return { ok: false, error: 'NOT_FOUND' }
  return { ok: true, updatedAt: now, updatedBy: String(actor || 'owner') }
}

/**
 * Download unlock: owner master secret always; person code only while downloadable.
 * @returns {{ ok: true, kind: 'owner'|'person', invite?: object } | { ok: false, error: string, status: number }}
 */
export async function authorizeDownloadInvite(db, plaintext) {
  const value = String(plaintext || '').trim()
  if (value.length < 8 || value.length > 128) return { ok: false, error: 'INVALID_PASSWORD', status: 403 }
  const ownerSecret = await readOwnerCommunitySecret(db)
  if (ownerSecret && value === ownerSecret) return { ok: true, kind: 'owner' }

  const invite = await findPersonInviteByCode(db, value)
  if (!invite) return { ok: false, error: 'INVALID_PASSWORD', status: 403 }
  if (invite.status === 'bound') return { ok: false, error: 'INVITE_BOUND', status: 403 }
  if (invite.status === 'revoked') return { ok: false, error: 'INVITE_REVOKED', status: 403 }
  if (invite.status !== 'downloadable') return { ok: false, error: 'INVALID_PASSWORD', status: 403 }
  return { ok: true, kind: 'person', invite }
}

export async function markPersonInviteDownloaded(db, inviteId, now = Date.now()) {
  const id = String(inviteId || '').trim()
  if (!id) return
  await db.prepare(
    `UPDATE x_reply_person_invites
        SET download_count = download_count + 1,
            last_download_at = ?,
            updated_at = ?
      WHERE id = ? AND status = 'downloadable'`,
  ).bind(now, now, id).run()
}

/**
 * Receipt auth: owner master, or non-revoked person invite.
 * When bind=true (heartbeat/report): bound invites must match deviceId;
 * downloadable invites bind on first use with a deviceId.
 * When bind=false (model-fallback / history pull): code match only.
 */
export async function authorizeCommunitySecret(db, headerValue, {
  deviceId = '',
  accountHandle = '',
  now = Date.now(),
  bind = true,
} = {}) {
  const value = String(headerValue || '').trim()
  if (!value) return { ok: false, status: 401, error: 'UNAUTHORIZED' }

  const ownerSecret = await readOwnerCommunitySecret(db)
  if (ownerSecret && value === ownerSecret) {
    return { ok: true, kind: 'owner' }
  }

  const invite = await findPersonInviteByCode(db, value)
  if (!invite || invite.status === 'revoked') {
    if (!ownerSecret) return { ok: false, status: 503, error: 'SECRET_NOT_CONFIGURED' }
    return { ok: false, status: 401, error: 'UNAUTHORIZED' }
  }

  if (!bind) {
    return { ok: true, kind: 'person', invite, bound: invite.status === 'bound' }
  }

  const device = String(deviceId || '').trim()
  if (invite.status === 'bound') {
    if (!device || !ID_RE.test(device) || device !== invite.deviceId) {
      return { ok: false, status: 401, error: 'DEVICE_MISMATCH' }
    }
    await db.prepare(
      `UPDATE x_reply_person_invites
          SET last_seen_at = ?, account_handle = CASE WHEN ? != '' THEN ? ELSE account_handle END, updated_at = ?
        WHERE id = ?`,
    ).bind(now, cleanHandle(accountHandle), cleanHandle(accountHandle), now, invite.id).run()
    return { ok: true, kind: 'person', invite, bound: true }
  }

  // downloadable → bind on first authenticated use with a device id
  if (!device || !ID_RE.test(device)) {
    return { ok: false, status: 400, error: 'DEVICE_REQUIRED' }
  }
  const bound = await bindPersonInviteOnFirstUse(db, invite.id, {
    deviceId: device,
    accountHandle,
    now,
  })
  if (!bound.ok) return { ok: false, status: bound.status || 401, error: bound.error }
  return { ok: true, kind: 'person', invite: bound.invite, bound: true }
}

export async function bindPersonInviteOnFirstUse(db, inviteId, { deviceId, accountHandle = '', now = Date.now() } = {}) {
  const id = String(inviteId || '').trim()
  const device = String(deviceId || '').trim()
  if (!id || !ID_RE.test(device)) return { ok: false, error: 'DEVICE_REQUIRED', status: 400 }

  const existing = await db.prepare(
    `SELECT id, code, label, status, device_id, account_handle, download_count,
            last_download_at, bound_at, last_seen_at, created_at, updated_at, created_by
       FROM x_reply_person_invites WHERE id = ?`,
  ).bind(id).first()
  if (!existing) return { ok: false, error: 'NOT_FOUND', status: 404 }
  if (existing.status === 'revoked') return { ok: false, error: 'INVITE_REVOKED', status: 401 }
  if (existing.status === 'bound') {
    if (String(existing.device_id || '') !== device) return { ok: false, error: 'DEVICE_MISMATCH', status: 401 }
    return { ok: true, invite: { ...presentInvite(existing), code: String(existing.code || '') } }
  }

  const handle = cleanHandle(accountHandle)
  const result = await db.prepare(
    `UPDATE x_reply_person_invites
        SET status = 'bound',
            device_id = ?,
            account_handle = ?,
            bound_at = ?,
            last_seen_at = ?,
            updated_at = ?
      WHERE id = ? AND status = 'downloadable'`,
  ).bind(device, handle, now, now, now, id).run()
  if (!Number(result?.meta?.changes || 0)) {
    // Race: another request bound it
    const again = await findPersonInviteByCode(db, existing.code)
    if (again?.status === 'bound' && again.deviceId === device) return { ok: true, invite: again }
    if (again?.status === 'bound') return { ok: false, error: 'DEVICE_MISMATCH', status: 401 }
    return { ok: false, error: 'BIND_FAILED', status: 409 }
  }
  return {
    ok: true,
    invite: {
      ...presentInvite({
        ...existing,
        status: 'bound',
        device_id: device,
        account_handle: handle,
        bound_at: now,
        last_seen_at: now,
        updated_at: now,
      }),
      code: String(existing.code || ''),
    },
  }
}

export function isValidInviteStatus(status) {
  return STATUSES.has(String(status || ''))
}
