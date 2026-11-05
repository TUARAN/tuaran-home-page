import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const extensionContext = require('../../tools/x-reply-clipboard-extension/extensionContext.js')
const background = require('../../tools/x-reply-clipboard-extension/background.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

function extractFunction(source, name) {
  const marker = `function ${name}(`
  const start = source.indexOf(marker)
  assert.notEqual(start, -1, name)
  let depth = 0
  let started = false
  for (let index = source.indexOf('{', start); index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') {
      depth += 1
      started = true
    } else if (char === '}') {
      depth -= 1
      if (started && depth === 0) return source.slice(start, index + 1)
    }
  }
  throw new Error(`unterminated ${name}`)
}

test('extension context is alive only while runtime id can be read', () => {
  const scope = { chrome: { runtime: { id: 'ext-id' } } }
  assert.equal(extensionContext.extensionContextAlive(scope), true)
  scope.chrome.runtime.id = ''
  assert.equal(extensionContext.extensionContextAlive(scope), false)
  delete scope.chrome.runtime.id
  assert.equal(extensionContext.extensionContextAlive(scope), false)
  scope.chrome.runtime = new Proxy({}, { get() { throw new Error('Extension context invalidated.') } })
  assert.equal(extensionContext.extensionContextAlive(scope), false)
  assert.equal(extensionContext.extensionContextAlive({}), false)
})

test('invalidated-context errors are recognized and other failures are left alone', () => {
  assert.equal(extensionContext.isExtensionContextInvalidatedError(new Error('Extension context invalidated.')), true)
  assert.equal(extensionContext.isExtensionContextInvalidatedError('Uncaught (in promise) Error: Extension context invalidated.'), true)
  assert.equal(extensionContext.isExtensionContextInvalidatedError(new Error('无法连接扩展后台')), false)
  assert.equal(extensionContext.isExtensionContextInvalidatedError(null), false)
})

test('content script stops the render loop and storage listener when the context dies', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const cleared = []
  const removed = []
  const sandbox = {
    chrome: {
      runtime: {
        id: 'ext-id',
        onMessage: { removeListener(fn) { removed.push(fn.name) } }
      },
      storage: { onChanged: { removeListener(fn) { removed.push(fn.name) } } }
    },
    window: {
      clearInterval(id) { cleared.push(['interval', id]) },
      clearTimeout(id) { cleared.push(['timeout', id]) }
    },
    onExtensionStorageChanged() {},
    onExtensionRuntimeMessage() {}
  }
  sandbox.XrcExtensionContext = {
    extensionContextAlive() { return extensionContext.extensionContextAlive(sandbox) },
    isExtensionContextInvalidatedError(error) { return extensionContext.isExtensionContextInvalidatedError(error) }
  }
  vm.createContext(sandbox)
  const block = [
    'let extensionContextRetired = false',
    'let panelRenderTimer = 11',
    'let viewsDismissTimer = 12',
    'let updateNoticeTimer = 13',
    extractFunction(source, 'extensionContextAlive'),
    extractFunction(source, 'isExtensionContextInvalidatedError'),
    extractFunction(source, 'retireExtensionContext'),
    extractFunction(source, 'noteExtensionContextFailure'),
    extractFunction(source, 'ensureExtensionContext'),
    'globalThis.alive = extensionContextAlive',
    'globalThis.note = noteExtensionContextFailure',
    'globalThis.ensure = ensureExtensionContext'
  ].join('\n')
  vm.runInContext(block, sandbox)
  assert.equal(sandbox.alive(), true)
  assert.equal(sandbox.note(new Error('Extension context invalidated.')), true)
  assert.equal(sandbox.alive(), false)
  assert.deepEqual(cleared, [['interval', 11], ['interval', 12], ['timeout', 13]])
  assert.deepEqual(removed, ['onExtensionStorageChanged', 'onExtensionRuntimeMessage'])
  assert.equal(sandbox.ensure(), false)
  assert.equal(cleared.length, 3)
  assert.match(source, /panelRenderTimer = window\.setInterval/)
  assert.match(source, /panelMissing/)
  assert.match(source, /refreshScheduleView\(\)\.catch/)
})

test('logged-in compose pages keep the floating panel', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const present = new Set()
  const sandbox = {
    window: { location: { pathname: '/home' } },
    document: {
      querySelector(selector) {
        const id = [...present].find((item) => selector.includes(item))
        return id ? { id } : null
      }
    }
  }
  vm.createContext(sandbox)
  vm.runInContext(`${extractFunction(source, 'isLoginPage')}\n${extractFunction(source, 'looksLoggedIn')}\nglobalThis.loggedIn = looksLoggedIn`, sandbox)
  present.add('primaryColumn')
  assert.equal(sandbox.loggedIn(), true)
  present.clear()
  sandbox.window.location.pathname = '/compose/post'
  assert.equal(sandbox.loggedIn(), false)
  present.add('tweetTextarea_')
  assert.equal(sandbox.loggedIn(), true)
  present.clear()
  present.add('SideNav_NewTweet_Button')
  assert.equal(sandbox.loggedIn(), true)
  present.clear()
  present.add('AppTabBar_Profile_Link')
  assert.equal(sandbox.loggedIn(), true)
  sandbox.window.location.pathname = '/i/flow/login'
  present.add('primaryColumn')
  assert.equal(sandbox.loggedIn(), false)
})

test('toolbar click asks the active X tab to reopen the panel', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const calls = []
  const hidden = await background.reopenExtensionPanel(
    { id: 4, url: 'https://example.com/compose/post' },
    { sendMessage: async () => { throw new Error('should not send') } }
  )
  assert.deepEqual(hidden, { ok: false, error: 'not-x-tab' })
  const reopened = await background.reopenExtensionPanel(
    { id: 9, url: 'https://x.com/compose/post?text=hi' },
    { sendMessage: async (tabId, message) => { calls.push({ tabId, message }); return { ok: true, shown: true } } }
  )
  assert.deepEqual(reopened, { ok: true, shown: true })
  assert.deepEqual(calls, [{ tabId: 9, message: { type: background.XRC_PANEL_REOPEN } }])
  const twitter = await background.reopenExtensionPanel(
    { id: 3, url: 'https://twitter.com/home' },
    { sendMessage: async () => ({ ok: true, shown: false }) }
  )
  assert.deepEqual(twitter, { ok: true, shown: false })
  const dead = await background.reopenExtensionPanel(
    { id: 8, url: 'https://x.com/home' },
    { sendMessage: async () => { throw new Error('Extension context invalidated.') } }
  )
  assert.equal(dead.ok, false)
  assert.match(dead.error, /Extension context invalidated/)
  const insecure = await background.reopenExtensionPanel({ id: 2, url: 'http://x.com/home' }, { sendMessage: async () => ({ ok: true }) })
  assert.equal(insecure.error, 'not-x-tab')
  assert.match(backgroundSource, /chrome\.action\?\.onClicked\?\.addListener/)
  assert.match(backgroundSource, /reopenExtensionPanel\(tab\)/)
  const reopen = content.slice(content.indexOf('message?.type === "xrc-panel-reopen"'))
  assert.match(reopen, /panelDismissed = false/)
  assert.match(reopen, /renderPanel\(\)/)
  assert.equal(background.XRC_PANEL_REOPEN, 'xrc-panel-reopen')
})

test('extension source version is 4.9.26 and the context helper loads before the panel script', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const readme = await readFile(new URL('README.md', extensionDir), 'utf8')
  const { X_EXTENSION_LATEST_VERSION } = await import('../../lib/community/xExtensionVersion.js')
  const scripts = manifest.content_scripts[3].js
  assert.equal(manifest.version, '4.9.26')
  assert.equal(X_EXTENSION_LATEST_VERSION, manifest.version)
  assert.ok(scripts.indexOf('extensionContext.js') < scripts.indexOf('content.js'))
  assert.match(manifest.action.default_title, /重新打开/)
  assert.match(readme, /v4\.9\.10（2026-11-04，本地测试）/)
  assert.match(readme, /工具栏里的扩展图标可以重新打开/)
})
