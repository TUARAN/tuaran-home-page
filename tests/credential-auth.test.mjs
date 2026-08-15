import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CREDENTIAL_HASH_ITERATIONS,
  createCredentialSalt,
  createCredentialToken,
  hashCredentialSecret,
  parseCredentialToken,
  verifyCredentialSecret,
} from '../lib/credentialAuth.js'

test('生成的凭证可解析且不暴露散列材料', () => {
  const token = createCredentialToken()
  const parsed = parseCredentialToken(token)
  assert.ok(parsed)
  assert.match(parsed.id, /^cred_[A-Za-z0-9_-]{12}$/)
  assert.equal(parsed.token, token)
  assert.equal(parseCredentialToken('bad-token'), null)
})

test('PBKDF2 只接受正确的凭证 secret', async () => {
  const parsed = parseCredentialToken(createCredentialToken())
  const salt = createCredentialSalt()
  const hash = await hashCredentialSecret(parsed.secret, salt)
  assert.equal(await verifyCredentialSecret(parsed.secret, salt, hash, CREDENTIAL_HASH_ITERATIONS), true)
  assert.equal(await verifyCredentialSecret(`${parsed.secret}x`, salt, hash, CREDENTIAL_HASH_ITERATIONS), false)
})
