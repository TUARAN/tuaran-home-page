import assert from 'node:assert/strict'
import test from 'node:test'

import { isSupabaseEmailAuthEnabled, signInSupabaseEmail, signUpSupabaseEmail } from '../../lib/supabase/emailAuth.js'

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  SUPABASE_EMAIL_AUTH_ENABLED: 'true',
  NEXTAUTH_URL: 'https://2aran.com',
}

test('Supabase email registration requests confirmation on the 2aran login URL', async () => {
  const result = await signUpSupabaseEmail(env, {
    email: 'Reader@Example.com', password: 'a-valid-password', name: '读者',
  }, async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/signup?redirect_to=https%3A%2F%2F2aran.com%2Flogin%3FemailConfirmed%3D1')
    assert.equal(options.headers.apikey, env.SUPABASE_PUBLISHABLE_KEY)
    assert.deepEqual(JSON.parse(options.body), {
      email: 'reader@example.com', password: 'a-valid-password', data: { display_name: '读者' },
    })
    return { ok: true, json: async () => ({ user: { id: 'new-user' } }) }
  })
  assert.deepEqual(result, { ok: true, pendingConfirmation: true })
})

test('Supabase email sign-in requires a confirmed address before creating a site identity', async () => {
  const fetcher = async () => ({
    ok: true,
    json: async () => ({
      access_token: 'token',
      user: { id: 'auth-user', email: 'reader@example.com', email_confirmed_at: null },
    }),
  })
  assert.deepEqual(await signInSupabaseEmail(env, 'reader@example.com', 'password', fetcher), {
    ok: false, error: 'EMAIL_NOT_CONFIRMED', status: 403,
  })
  const result = await signInSupabaseEmail(env, 'reader@example.com', 'password', async () => ({
    ok: true,
    json: async () => ({
      access_token: 'token',
      user: { id: 'auth-user', email: 'reader@example.com', email_confirmed_at: '2026-10-14T00:00:00Z' },
    }),
  }))
  assert.equal(result.providerAccountId, 'auth-user')
  assert.equal(result.profile.email, 'reader@example.com')
  assert.doesNotMatch(JSON.stringify(result), /access_token|password/)
})

test('Supabase email mode stays off until explicitly enabled and configured', () => {
  assert.equal(isSupabaseEmailAuthEnabled({ ...env, SUPABASE_EMAIL_AUTH_ENABLED: 'false' }), false)
  assert.equal(isSupabaseEmailAuthEnabled({ SUPABASE_EMAIL_AUTH_ENABLED: 'true' }), false)
  assert.equal(isSupabaseEmailAuthEnabled(env), true)
})

test('registration rejects a malformed upstream success response', async () => {
  const result = await signUpSupabaseEmail(env, {
    email: 'reader@example.com', password: 'a-valid-password', name: '读者',
  }, async () => ({ ok: true, json: async () => ({}) }))
  assert.deepEqual(result, { ok: false, error: 'SUPABASE_AUTH_INVALID_RESPONSE', status: 502 })
})
