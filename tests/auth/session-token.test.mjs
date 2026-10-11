import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

import { validatePublicHttpUrl } from '../../lib/auth/abuseControls.js'

const source = await readFile(new URL('../../lib/auth/edgeSession.js', import.meta.url), 'utf8')
const { signSession, verifySession } = vm.runInNewContext(
  `${source.replace(/^import .*$/gm, '').replace(/^export /gm, '')}\n;({ signSession, verifySession })`,
  { crypto, TextEncoder, TextDecoder, btoa, atob, URL },
)

test('session token round-trips through the standard JWT separators', async () => {
  const secret = 'test-session-secret'
  const token = await signSession(
    { user: { id: 'github:1', login: 'tuaran' }, exp: Math.floor(Date.now() / 1000) + 60 },
    secret,
  )

  assert.equal(token.split('.').length, 3)
  const payload = await verifySession(token, secret)
  assert.equal(payload.user.login, 'tuaran')
})

test('private IPv4 hosts stay blocked when the address uses single dots', () => {
  assert.equal(validatePublicHttpUrl('http://127.0.0.1/admin').error, 'URL_HOST_NOT_ALLOWED')
  assert.equal(validatePublicHttpUrl('https://example.com/ok').ok, true)
})
