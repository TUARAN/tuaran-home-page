import assert from 'node:assert/strict'
import test from 'node:test'

import { checkSupabaseHealth, getSupabaseConfig } from '../../lib/supabase/health.js'

const env = {
  SUPABASE_URL: 'https://example.supabase.co/',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
}

test('Supabase config accepts an HTTPS project origin and keeps the key server-side', () => {
  assert.deepEqual(getSupabaseConfig(env), {
    url: 'https://example.supabase.co',
    publishableKey: 'sb_publishable_test',
  })
  assert.equal(getSupabaseConfig({}), null)
  assert.throws(() => getSupabaseConfig({ ...env, SUPABASE_URL: 'http://example.supabase.co' }))
})

test('health probe calls Supabase with the publishable key without returning it', async () => {
  const result = await checkSupabaseHealth(env, async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/health')
    assert.equal(options.headers.apikey, 'sb_publishable_test')
    return { ok: true, status: 200 }
  })
  assert.deepEqual(result, { status: 'healthy', httpStatus: 200 })
  assert.doesNotMatch(JSON.stringify(result), /sb_publishable/)
})

test('health probe reports missing configuration and remote failures', async () => {
  assert.deepEqual(await checkSupabaseHealth({}), { status: 'unconfigured' })
  assert.deepEqual(await checkSupabaseHealth(env, async () => ({ ok: false, status: 401 })), { status: 'error', httpStatus: 401 })
  assert.deepEqual(await checkSupabaseHealth(env, async () => { throw new Error('offline') }), { status: 'unreachable' })
})
