import assert from 'node:assert/strict'
import test from 'node:test'
import { createVibeUvExperiment } from '../../lib/vibeCafeUvTest.mjs'

function storageFixture() {
  const values = new Map([['login', 'keep'], ['vc:telemetry:visitor:production', 'real-visitor']])
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}

for (const [mode, expectedUnique] of [['retain-reload', 1], ['clear-reload', 5], ['clear-only', 1]]) {
  test(`${mode}: identities and production storage isolation`, () => {
    const storage = storageFixture()
    let nextId = 0
    const experiment = createVibeUvExperiment({ storage, key: 'tuaran:uv-test:unit', mode, makeId: () => `test-${++nextId}` })
    const rows = Array.from({ length: 5 }, () => experiment.step())
    assert.equal(new Set(rows.map(row => row.visitorId)).size, expectedUnique)
    assert.equal(rows[0].changed, null)
    assert.equal(rows[4].changed, mode === 'clear-reload')
    if (mode === 'clear-only') {
      assert.equal(rows[4].storedId, null)
      assert.equal(rows[4].reinitialized, false)
      assert.equal(rows[4].visitorId, rows[0].visitorId)
    }
    experiment.cleanup()
    assert.deepEqual([...storage.values], [['login', 'keep'], ['vc:telemetry:visitor:production', 'real-visitor']])
  })
}

test('production storage keys and unknown scenarios cannot be used', () => {
  assert.throws(() => createVibeUvExperiment({ key: 'vc:telemetry:visitor:production', mode: 'clear-reload' }), /测试键/)
  assert.throws(() => createVibeUvExperiment({ key: 'tuaran:uv-test:unit', mode: 'invalid' }), /未知/)
})

test('unavailable localStorage fails instead of reporting a successful identity test', () => {
  const experiment = createVibeUvExperiment({ key: 'tuaran:uv-test:unit', mode: 'retain-reload', storage: {
    getItem() { throw new Error('storage blocked') },
  } })
  assert.throws(() => experiment.step(), /storage blocked/)
})
