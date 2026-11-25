import assert from 'node:assert/strict'
import test from 'node:test'

import { X_CHROME_FREE_PATHS, X_SHORT_REWRITES, xRouteDecision } from '../../lib/site/xSiteRoutes.js'

const preview = 'cursor-rename-x-workbench-47.tuaran.pages.dev'

test('x.2aran.com rewrites short paths and redirects old ones', () => {
  assert.equal(xRouteDecision('x.2aran.com', '/theory').pathname, '/resources/big-interaction-whitepaper')
  assert.equal(xRouteDecision('x.2aran.com', '/docs').pathname, '/resources/x-reply-clipboard-extension/docs')
  assert.equal(xRouteDecision('x.2aran.com', '/calendar').pathname, '/resources/big-interaction-whitepaper/calendar')
  assert.equal(xRouteDecision('x.2aran.com', '/roundtable').pathname, '/resources/big-interaction-whitepaper/roundtable')
  assert.equal(xRouteDecision('x.2aran.com', '/grokbot').pathname, '/resources/big-interaction-whitepaper/grokbot')
  assert.equal(xRouteDecision('x.2aran.com', '/extension').pathname, '/resources/x-reply-clipboard-extension')
  assert.deepEqual(xRouteDecision('x.2aran.com', '/x-workbench'), { action: 'redirect', location: 'https://x.2aran.com/', status: 308 })
  assert.deepEqual(xRouteDecision('x.2aran.com', '/resources/big-interaction-whitepaper'), { action: 'redirect', location: 'https://x.2aran.com/theory', status: 308 })
  assert.deepEqual(xRouteDecision('x.2aran.com', '/x'), { action: 'redirect', location: 'https://x.2aran.com/theory', status: 308 })
})

test('2aran.com old and short paths redirect to the subdomain', () => {
  assert.deepEqual(xRouteDecision('2aran.com', '/x-workbench'), { action: 'redirect', location: 'https://x.2aran.com/', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/x'), { action: 'redirect', location: 'https://x.2aran.com/theory', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/resources/big-interaction-whitepaper'), { action: 'redirect', location: 'https://x.2aran.com/theory', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/resources/big-interaction-whitepaper/calendar'), { action: 'redirect', location: 'https://x.2aran.com/calendar', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/resources/big-interaction-whitepaper/roundtable'), { action: 'redirect', location: 'https://x.2aran.com/roundtable', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/resources/x-reply-clipboard-extension/docs'), { action: 'redirect', location: 'https://x.2aran.com/docs', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/resources/x-reply-clipboard-extension'), { action: 'redirect', location: 'https://x.2aran.com/extension', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/extension'), { action: 'redirect', location: 'https://x.2aran.com/extension', status: 308 })
  assert.deepEqual(xRouteDecision('2aran.com', '/theory'), { action: 'redirect', location: 'https://x.2aran.com/theory', status: 308 })
  assert.equal(xRouteDecision('2aran.com', '/resources/big-interaction-whitepaper/archive/1.jpg'), null)
})

test('preview host opens short paths and redirects old content paths', () => {
  assert.equal(xRouteDecision(preview, '/theory').action, 'rewrite')
  assert.equal(xRouteDecision(preview, '/docs').action, 'rewrite')
  assert.equal(xRouteDecision(preview, '/calendar').action, 'rewrite')
  assert.equal(xRouteDecision(preview, '/roundtable').action, 'rewrite')
  assert.equal(xRouteDecision(preview, '/extension').action, 'rewrite')
  assert.equal(xRouteDecision(preview, '/x-workbench'), null)
  assert.deepEqual(xRouteDecision(preview, '/x'), { action: 'redirect', location: '/theory', status: 308 })
  assert.deepEqual(xRouteDecision(preview, '/resources/big-interaction-whitepaper'), { action: 'redirect', location: '/theory', status: 308 })
  assert.deepEqual(xRouteDecision(preview, '/resources/x-reply-clipboard-extension/docs'), { action: 'redirect', location: '/docs', status: 308 })
  assert.deepEqual(xRouteDecision(preview, '/resources/x-reply-clipboard-extension'), { action: 'redirect', location: '/extension', status: 308 })
})

test('every x.2aran.com short page and its rewrite target hides the main site chrome', () => {
  for (const [short, target] of Object.entries(X_SHORT_REWRITES)) {
    assert.ok(X_CHROME_FREE_PATHS.includes(short), short)
    assert.ok(X_CHROME_FREE_PATHS.includes(target), target)
  }
  assert.ok(X_CHROME_FREE_PATHS.includes('/grokbot'))
  assert.ok(X_CHROME_FREE_PATHS.includes('/resources/big-interaction-whitepaper/grokbot'))
})
