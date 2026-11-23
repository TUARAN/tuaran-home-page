import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { clearEdgeCacheMemory, readThroughEdgeCache } from '../../lib/db/edgeCache.mjs'

class FakeCache {
  constructor() {
    this.store = new Map()
    this.puts = 0
  }

  async match(request) {
    const hit = this.store.get(request.url)
    if (!hit) return null
    return new Response(hit.body, { headers: { 'Content-Type': 'application/json' } })
  }

  async put(request, response) {
    this.puts += 1
    this.store.set(request.url, { body: await response.text() })
  }
}

function installCache() {
  const cache = new FakeCache()
  const previous = globalThis.caches
  globalThis.caches = { default: cache }
  return {
    cache,
    restore() {
      if (previous === undefined) delete globalThis.caches
      else globalThis.caches = previous
    },
  }
}

test('命中缓存后不再重复读取 D1', async () => {
  const { cache, restore } = installCache()
  clearEdgeCacheMemory()
  let reads = 0
  const read = async () => {
    reads += 1
    return { rows: [1, 2, 3] }
  }
  try {
    assert.deepEqual(await readThroughEdgeCache('test:hit', 60, read), { rows: [1, 2, 3] })
    assert.deepEqual(await readThroughEdgeCache('test:hit', 60, read), { rows: [1, 2, 3] })
    assert.equal(reads, 1)
    assert.equal(cache.puts, 1)
  } finally {
    restore()
  }
})

test('缓存过期后重新读取并覆盖旧值', async () => {
  const { restore } = installCache()
  clearEdgeCacheMemory()
  let reads = 0
  const read = async () => {
    reads += 1
    return { value: reads }
  }
  try {
    assert.deepEqual(await readThroughEdgeCache('test:ttl', 1, read), { value: 1 })
    await new Promise((resolve) => setTimeout(resolve, 1100))
    assert.deepEqual(await readThroughEdgeCache('test:ttl', 1, read), { value: 2 })
    assert.equal(reads, 2)
  } finally {
    restore()
  }
})

test('读取抛错时原样抛出，且不写入缓存', async () => {
  const { cache, restore } = installCache()
  clearEdgeCacheMemory()
  try {
    await assert.rejects(
      readThroughEdgeCache('test:error', 60, async () => { throw new Error('D1_DOWN') }),
      /D1_DOWN/,
    )
    assert.equal(cache.puts, 0)
    assert.deepEqual(await readThroughEdgeCache('test:error', 60, async () => ({ ok: true })), { ok: true })
  } finally {
    restore()
  }
})

test('空结果不写入缓存，避免把读空固定住', async () => {
  const { cache, restore } = installCache()
  clearEdgeCacheMemory()
  try {
    assert.equal(await readThroughEdgeCache('test:null', 60, async () => null), null)
    assert.equal(cache.puts, 0)
  } finally {
    restore()
  }
})

test('没有 Cache API 时退回进程内缓存', async () => {
  const previous = globalThis.caches
  delete globalThis.caches
  clearEdgeCacheMemory()
  try {
    let reads = 0
    const read = async () => {
      reads += 1
      return { local: true }
    }
    await readThroughEdgeCache('test:memory', 60, read)
    await readThroughEdgeCache('test:memory', 60, read)
    assert.equal(reads, 1)
  } finally {
    if (previous !== undefined) globalThis.caches = previous
    clearEdgeCacheMemory()
  }
})

test('高频整表扫的入口都接入了缓存', async () => {
  const pointsSource = await readFile(new URL('../../lib/ledger/points.js', import.meta.url), 'utf8')
  assert.match(pointsSource, /readThroughEdgeCache\('ranbi:supply-summary'/)

  const overviewRoute = await readFile(new URL('../../app/api/admin/overview/route.js', import.meta.url), 'utf8')
  assert.match(overviewRoute, /readThroughEdgeCache\(/)
  assert.match(overviewRoute, /admin:overview:/)

  const weeklyRoute = await readFile(new URL('../../app/api/admin/content-weekly/route.js', import.meta.url), 'utf8')
  assert.match(weeklyRoute, /admin:content-weekly:/)
  assert.match(weeklyRoute, /buildWeeklyAnalytics/)

  const researchRuntime = await readFile(new URL('../../lib/research/researchRuntime.js', import.meta.url), 'utf8')
  assert.match(researchRuntime, /readThroughEdgeCache\('research:content-documents'/)

  const poemcn = await readFile(new URL('../../workers/poemcn/src/index.js', import.meta.url), 'utf8')
  assert.match(poemcn, /readEdgeCache\(request\)/)
  assert.match(poemcn, /writeEdgeCache\(request/)
  assert.match(poemcn, /PAGE_CACHE_TTL_SEC = 300/)
})
