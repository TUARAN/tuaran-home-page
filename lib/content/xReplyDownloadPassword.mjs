export const X_REPLY_DOWNLOAD_PASSWORD_KEY = 'resource.x-reply-clipboard-extension.download-password'

// Published v3.12.1 password remains valid until the owner generates a replacement.
const PASSWORD_SALT = '5e41ccb77b481a35a528d3de64c9d81d'
const PASSWORD_HASH = 'b101ab8a1d712d7b036826d4292634fd90896068e9ac282cf96082eda265bb00'

const INITIAL_RECORD = Object.freeze({ salt: PASSWORD_SALT, hash: PASSWORD_HASH, createdAt: null, updatedBy: '', initial: true })

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function validRecord(record) {
  return record && /^[a-f0-9]{32}$/.test(record.salt) && /^[a-f0-9]{64}$/.test(record.hash)
}

export async function readXReplyDownloadPassword(db) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?1')
    .bind(X_REPLY_DOWNLOAD_PASSWORD_KEY).first()
  if (!row) return INITIAL_RECORD
  const record = JSON.parse(String(row.value || ''))
  if (!validRecord(record)) throw new Error('INVALID_DOWNLOAD_PASSWORD_RECORD')
  return record
}

export async function createXReplyDownloadPassword(actor = 'owner') {
  const random = crypto.getRandomValues(new Uint8Array(18))
  const password = btoa(String.fromCharCode(...random)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
  const hash = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))))
  return { password, record: { salt, hash, createdAt: Date.now(), updatedBy: String(actor || 'owner') } }
}

export async function saveXReplyDownloadPassword(db, record) {
  if (!validRecord(record)) throw new Error('INVALID_DOWNLOAD_PASSWORD_RECORD')
  await db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  ).bind(X_REPLY_DOWNLOAD_PASSWORD_KEY, JSON.stringify(record), record.createdAt, record.updatedBy).run()
}

export async function verifyXReplyDownloadPassword(password, record) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 || !validRecord(record)) return false
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${record.salt}:${password}`)))
  const expected = record.hash.match(/../g).map((part) => parseInt(part, 16))
  let different = 0
  for (let index = 0; index < digest.length; index += 1) different |= digest[index] ^ expected[index]
  return different === 0
}

export function xReplyDownloadPasswordStatus(record) {
  return { initial: Boolean(record.initial), createdAt: record.createdAt || null, updatedBy: record.updatedBy || '' }
}
