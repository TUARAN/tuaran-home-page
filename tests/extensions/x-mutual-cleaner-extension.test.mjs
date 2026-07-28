import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const extensionDir = new URL('../../tools/x-mutual-cleaner-extension/', import.meta.url)

function createExtensionContext(initialPathname) {
  const elements = new Map()
  const windowListeners = new Map()
  const intervals = []
  const location = { pathname: initialPathname }

  const document = {
    readyState: 'complete',
    hidden: false,
    body: { scrollHeight: 0 },
    documentElement: {
      scrollHeight: 0,
      appendChild(element) {
        elements.set(element.id, element)
      },
    },
    getElementById(id) {
      return elements.get(id) || null
    },
    createElement() {
      const listeners = new Map()
      return {
        id: '',
        innerHTML: '',
        addEventListener(type, listener) {
          listeners.set(type, listener)
        },
        querySelector() {
          return {
            addEventListener() {},
          }
        },
        remove() {
          elements.delete(this.id)
        },
      }
    },
    addEventListener() {},
    querySelector() {
      return null
    },
    querySelectorAll() {
      return []
    },
  }

  const history = {
    pushState() {},
    replaceState() {},
  }

  const window = {
    location,
    history,
    innerHeight: 900,
    scrollY: 0,
    setTimeout,
    queueMicrotask,
    setInterval(callback) {
      intervals.push(callback)
      return intervals.length
    },
    addEventListener(type, listener) {
      windowListeners.set(type, listener)
    },
  }

  const context = vm.createContext({
    console,
    document,
    history,
    location,
    setTimeout,
    window,
  })

  return {
    context,
    elements,
    location,
    navigate(pathname, method = 'pushState') {
      location.pathname = pathname
      history[method]({}, '', pathname)
    },
    popstate(pathname) {
      location.pathname = pathname
      windowListeners.get('popstate')?.()
    },
  }
}

test('panel follows supported X list routes during SPA navigation', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const browser = createExtensionContext('/home')

  vm.runInContext(source, browser.context)
  assert.equal(browser.elements.has('x-mutual-cleaner-panel'), false)

  browser.navigate('/tuaran/following')
  await Promise.resolve()
  assert.equal(browser.elements.has('x-mutual-cleaner-panel'), true)

  browser.navigate('/tuaran/status/123')
  await Promise.resolve()
  assert.equal(browser.elements.has('x-mutual-cleaner-panel'), false)

  browser.navigate('/tuaran/verified_followers', 'replaceState')
  await Promise.resolve()
  assert.equal(browser.elements.has('x-mutual-cleaner-panel'), true)

  browser.popstate('/explore')
  assert.equal(browser.elements.has('x-mutual-cleaner-panel'), false)
})

test('release version is consistent across extension and download metadata', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const catalog = await readFile(new URL('../../lib/resourceCatalog.js', import.meta.url), 'utf8')
  const resourcePage = await readFile(
    new URL('../../app/(site)/resources/x-mutual-cleaner-extension/page.jsx', import.meta.url),
    'utf8',
  )

  assert.equal(manifest.version, '0.1.12')
  assert.match(catalog, /x-mutual-cleaner-extension-v0\.1\.12\.zip/)
  assert.match(resourcePage, /Chrome 插件 v0\.1\.12/)
})
