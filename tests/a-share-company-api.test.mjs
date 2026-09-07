import assert from 'node:assert/strict'
import test from 'node:test'

import { GET } from '../app/api/a-shares/companies/route.js'

test('A-share company API serves the requested generated page', async () => {
  const originalFetch = globalThis.fetch
  const requestedPaths = []
  globalThis.fetch = async (input) => {
    const url = new URL(input)
    requestedPaths.push(url.pathname)
    if (url.pathname.endsWith('/index.json')) {
      return Response.json({ pageSize: 100, total: 201, totalPages: 3 })
    }
    return Response.json({ page: 3, pageSize: 100, total: 201, totalPages: 3, companies: [{ code: 'TEST' }] })
  }

  try {
    const response = await GET(new Request('https://2aran.com/api/a-shares/companies?page=99'))
    assert.equal(response.status, 200)
    assert.deepEqual(requestedPaths, [
      '/generated/a-shares/index.json',
      '/generated/a-shares/page-3.json',
    ])
    assert.equal((await response.json()).companies[0].code, 'TEST')
  } finally {
    globalThis.fetch = originalFetch
  }
})
