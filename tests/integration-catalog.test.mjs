import assert from 'node:assert/strict'
import test from 'node:test'

import {
  INTEGRATION_SERVICES,
  INTEGRATION_WEBHOOKS,
  probeEnvStatus,
} from '../lib/integrationCatalog.js'
import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
} from '../lib/deepseekKeysCore.js'

test('integration services are unique and well-formed', () => {
  const ids = INTEGRATION_SERVICES.map((service) => service.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const service of INTEGRATION_SERVICES) {
    assert.ok(service.label)
    assert.ok(service.purpose)
    assert.ok(Array.isArray(service.envRefs))
    for (const ref of service.envRefs) {
      assert.match(ref, /^[A-Z][A-Z0-9_]*$/)
    }
  }
})

test('webhook endpoints have path, purpose and secret reference', () => {
  for (const webhook of INTEGRATION_WEBHOOKS) {
    assert.ok(webhook.path.startsWith('POST /api/'))
    assert.ok(webhook.purpose)
    assert.ok(webhook.secretEnv.includes('SECRET'))
    assert.ok(webhook.workflow)
  }
})

test('probeEnvStatus marks configured env vars without leaking values', () => {
  const status = probeEnvStatus({
    X_API_KEY: 'secret-value',
    MORNING_GREETING_SECRET: 's',
  })
  assert.equal(status.X_API_KEY, true)
  assert.equal(status.MORNING_GREETING_SECRET, true)
  assert.equal(status.X_API_KEY_SECRET, false)
  assert.equal(status.A_SHARE_COLLECT_SECRET, false)
  // 只返回布尔
  assert.deepEqual(
    Object.values(status).filter((value) => typeof value !== 'boolean'),
    [],
  )
})

test('integration credential cipher round-trips with master secret', async () => {
  const master = 'test-master-secret-for-integration-keys'
  const cipher = await encryptApiKey('sk-1234567890abcdef', master)
  assert.equal(await decryptApiKey(cipher, master), 'sk-1234567890abcdef')
  assert.equal(maskApiKey('sk-1234567890abcdef'), 'sk-1****cdef')
})
