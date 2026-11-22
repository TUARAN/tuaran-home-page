import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const login = await readFile(new URL('../../app/api/auth/login/route.js', import.meta.url), 'utf8')
const callback = await readFile(new URL('../../app/api/auth/callback/x/route.js', import.meta.url), 'utf8')
const session = await readFile(new URL('../../lib/auth/edgeSession.js', import.meta.url), 'utf8')

test('X login uses OAuth 2.0 authorize endpoint with S256 PKCE', () => {
  assert.match(login, /https:\/\/x\.com\/i\/oauth2\/authorize/)
  assert.match(login, /code_challenge_method', 'S256'/)
  assert.match(login, /MISSING_X_OAUTH_CONFIG/)
})

test('X callback verifies state, sends PKCE verifier and binds by numeric X id', () => {
  assert.match(callback, /INVALID_STATE/)
  assert.match(callback, /code_verifier: verifier/)
  assert.match(callback, /api\.x\.com\/2\/oauth2\/token/)
  assert.match(callback, /providerAccountId = String\(xUser\.id\)/)
  assert.match(callback, /id: `x:\$\{providerAccountId\}`/)
  assert.doesNotMatch(callback, /id: `google:/)
})

test('PKCE helper and X secrets are exposed by edgeSession', () => {
  assert.match(session, /export async function createPkcePair/)
  assert.match(session, /X_CLIENT_ID/)
})
