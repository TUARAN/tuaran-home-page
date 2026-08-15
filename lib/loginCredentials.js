import { getD1 } from './d1'
import { parseCredentialToken, verifyCredentialSecret } from './credentialAuth'

export async function authenticateLoginCredential(rawCredential) {
  const parsed = parseCredentialToken(rawCredential)
  if (!parsed) return { ok: false, error: 'INVALID_CREDENTIAL', status: 401 }

  const db = getD1()
  const row = await db
    .prepare(
      `SELECT id, user_id, label, account_login, account_name, secret_salt,
              secret_hash, hash_iterations, expires_at, disabled_at
       FROM login_credentials
       WHERE id = ?1`
    )
    .bind(parsed.id)
    .first()

  const now = Date.now()
  if (!row || row.disabled_at || (row.expires_at && Number(row.expires_at) <= now)) {
    return { ok: false, error: 'INVALID_CREDENTIAL', status: 401 }
  }
  const valid = await verifyCredentialSecret(
    parsed.secret,
    row.secret_salt,
    row.secret_hash,
    row.hash_iterations
  )
  if (!valid) return { ok: false, error: 'INVALID_CREDENTIAL', status: 401 }

  const profile = {
    provider: 'credential',
    login: String(row.account_login || row.label || row.id),
    name: String(row.account_name || row.label || '凭证用户'),
    image: null,
    email: '',
  }
  await db
    .prepare('UPDATE login_credentials SET last_used_at = ?1, use_count = use_count + 1 WHERE id = ?2')
    .bind(now, row.id)
    .run()
  return {
    ok: true,
    user: { id: String(row.user_id), ...profile },
    providerAccountId: String(row.id),
    profile,
  }
}
