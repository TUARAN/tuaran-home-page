import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

import {
  X_EXTENSION_SHARED_MODULES,
  X_EXTENSION_TASK_SHELF,
  deriveTaskBundle,
  listedShelfTasks,
} from '../../lib/community/xExtensionTaskShelf.js'

const require = createRequire(import.meta.url)
const background = require('../../tools/x-reply-clipboard-extension/background.js')

test('task shelf lists the same tasks the extension schedules', () => {
  const ids = X_EXTENSION_TASK_SHELF.map((task) => task.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(new Set(ids), background.TASK_MODES)
  assert.equal(listedShelfTasks().length, 18)
  assert.ok(X_EXTENSION_SHARED_MODULES.includes('background.js'))
  assert.ok(X_EXTENSION_SHARED_MODULES.includes('content.js'))
})

test('derived bundle keeps listed tasks and refuses tasks that are off the shelf', () => {
  const derived = deriveTaskBundle(['timeline', 'mutual-targetFollow'])
  assert.equal(derived.ok, true)
  assert.deepEqual(derived.bundle.tasks, ['timeline', 'mutual-targetFollow'])
  assert.ok(derived.bundle.modules.includes('loop.js'))
  assert.ok(derived.bundle.modules.includes('mutual.js'))
  assert.ok(derived.bundle.modules.includes('leaderboard.js'))
  assert.deepEqual(derived.bundle.shared, [...X_EXTENSION_SHARED_MODULES])

  const shelf = [
    { id: 'timeline', shelf: 'listed', modules: ['loop.js'] },
    { id: 'poster-x', shelf: 'unlisted', modules: ['poster.js'] },
  ]
  const refused = deriveTaskBundle(['poster-x'], shelf)
  assert.equal(refused.ok, false)
  assert.deepEqual(refused.unlisted, ['poster-x'])
  assert.equal(deriveTaskBundle([], shelf).ok, false)
  assert.deepEqual(deriveTaskBundle(['missing'], shelf).missing, ['missing'])
})
