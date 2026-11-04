import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const { shareScopes, shareDialog, groupRows, waitForShareDialog, findAction, sendButtonNearDialog, createController, LEDGER_KEY } = require('../../tools/x-reply-clipboard-extension/communityShare.js')

test('recognizes the visible group picker by Search, group rows and Send even without a Share heading', async () => {
  const body = {}
  const send = {
    innerText: 'Send',
    getAttribute: () => null,
    getClientRects: () => [1],
    closest: () => null,
    ownerDocument: { defaultView: { getComputedStyle: () => ({ opacity: '1', pointerEvents: 'auto' }) } },
  }
  const picker = {
    innerText: 'Search BlueV Mutual Follow Group 825 people NGSLin @NGSLin99 Creator Circle 267 people Write a message... Send',
    parentElement: body,
    closest: () => null,
    querySelector: (selector) => selector.includes('placeholder') ? search : null,
    querySelectorAll: (selector) => selector.includes('input') ? [search] : selector.includes('button') ? [send] : [],
    ownerDocument: { defaultView: { getComputedStyle: () => ({ opacity: '0.5', pointerEvents: 'auto' }) } },
  }
  send.parentElement = picker
  const search = { parentElement: picker, matches: () => false, placeholder: 'Search' }
  const doc = {
    body,
    querySelectorAll: (selector) => selector.includes('role="dialog"') ? [] : [search],
  }

  assert.equal(shareDialog(doc), picker)
  assert.equal(await waitForShareDialog(doc, async () => {}), picker)
  assert.equal(findAction(picker, /^Send$/u), null)
  assert.equal(findAction(picker, /^Send$/u, { ignoreAncestorOpacity: true }), send)
})

test('finds the compose picker from an accessible Search input before Send becomes ready', () => {
  const body = {}
  const search = { getAttribute: (name) => name === 'aria-label' ? 'Search' : null, matches: () => false }
  const picker = {
    innerText: 'BlueV Mutual Follow Group 825 people',
    parentElement: body,
    closest: () => null,
    querySelectorAll: (selector) => selector.includes('input') ? [search] : [],
  }
  let parent = picker
  for (let depth = 0; depth < 15; depth++) {
    const wrapper = { parentElement: parent, closest: () => null, innerText: '', querySelectorAll: () => [] }
    parent = wrapper
  }
  search.parentElement = parent
  const doc = {
    body,
    defaultView: { location: { pathname: '/messages/compose' } },
    querySelectorAll: (selector) => selector.includes('role="dialog"') ? [] : [search],
  }

  assert.equal(shareDialog(doc), picker)
})

test('finds Send in the picker footer when the list and footer are sibling containers', () => {
  const body = {}
  const send = { innerText: 'Send', getAttribute: () => null, getClientRects: () => [1], closest: () => null }
  const wrapper = { parentElement: body, querySelectorAll: () => [send] }
  const list = { parentElement: wrapper, querySelectorAll: () => [] }
  assert.equal(sendButtonNearDialog(list, { body }), send)
})

test('finds clickable XChat group rows even when they have no legacy test IDs', () => {
  const row = (label, opacity) => ({
    innerText: label,
    getAttribute: () => null,
    getClientRects: () => [1],
    closest: () => null,
    contains: () => false,
    ownerDocument: { defaultView: { getComputedStyle: () => ({ opacity, pointerEvents: 'auto' }) } },
  })
  const group = row('BlueV Mutual Follow Group 825 people', '1')
  const grey = row('Rory, Seayo and 843 others 845 people', '0.4')
  const person = row('NGSLin @NGSLin99', '1')
  const picker = { querySelectorAll: (selector) => selector === 'div, li, button' ? [group, grey, person] : [] }
  assert.deepEqual(groupRows(picker).map(({ name }) => name), ['BlueV Mutual Follow Group'])
})

test('selects a group and clicks Send inside the picker', async () => {
  let selected = false
  let sent = false
  let outsideSent = false
  let savedLedger = {}
  const button = (click) => ({
    innerText: 'Send', click, getAttribute: () => null, getClientRects: () => [1], closest: () => null,
  })
  const pickerSend = button(() => { sent = true })
  const outsideSend = button(() => { outsideSent = true })
  const row = {
    innerText: 'BlueV Mutual Follow Group 825 people',
    click: () => { selected = true },
    getAttribute: () => null,
    getClientRects: () => [1],
    closest: () => null,
    contains: () => false,
  }
  const body = {}
  const picker = {
    innerText: 'Search BlueV Mutual Follow Group 825 people Write a message... Send',
    parentElement: body,
    closest: () => null,
    querySelector: (selector) => selector.includes('placeholder') ? search : null,
    querySelectorAll: (selector) => selector.includes('cellInnerDiv') ? [row] : selector.includes('input') ? [search] : selector.includes('data-testid="toast"') ? sent ? [{ innerText: 'Message sent' }] : [] : selector.includes('button') ? [pickerSend] : [],
    scrollTop: 0,
    clientHeight: 600,
    ownerDocument: { defaultView: { getComputedStyle: () => ({ opacity: '0.5', pointerEvents: 'auto' }) } },
  }
  pickerSend.parentElement = picker
  pickerSend.ownerDocument = { defaultView: { getComputedStyle: () => ({ opacity: '1', pointerEvents: 'auto' }) } }
  const search = { parentElement: picker, matches: () => false, placeholder: 'Search' }
  const article = {
    parentElement: null,
    querySelector: () => null,
    querySelectorAll: () => [timeLink],
  }
  const timeLink = {
    getAttribute: () => '/tuaran/status/123',
    querySelector: () => ({}),
    closest: () => article,
  }
  const embed = { shadowRoot: picker }
  const doc = {
    body,
    querySelector: () => null,
    querySelectorAll: (selector) => {
      if (selector.includes('article[data-testid="tweet"]')) return [article]
      if (selector.includes('xchatEmbedShare')) return [embed]
      if (selector.includes('role="dialog"')) return []
      if (selector.includes('data-testid="toast"')) return []
      if (selector.includes('role="heading"')) return [search]
      if (selector.includes('button')) return [outsideSend, pickerSend]
      return []
    },
  }
  assert.equal(shareScopes(doc)[0], picker)
  assert.equal(shareDialog(doc), picker)
  const sessionStorage = new Map()
  const controller = createController({
    document: doc,
    window: {
      location: { pathname: '/tuaran' },
      sessionStorage: { getItem: (key) => sessionStorage.get(key), setItem: (key, value) => sessionStorage.set(key, value) },
    },
    wait: async () => {},
    random: () => 0,
    loadLedger: async () => ({ [LEDGER_KEY]: savedLedger }),
    saveLedger: async (value) => { savedLedger = value },
  })

  await controller.start({ handle: 'tuaran' })
  assert.equal(selected, true)
  assert.equal(sent, true)
  assert.equal(outsideSent, false)
  assert.equal(controller.snapshot().shared, 1)
  assert.equal(Object.keys(savedLedger['123'] || {}).length, 2)
  assert.ok(Number(savedLedger['123'].__completedAt) > 0)
})

test('selects two groups before one Send and records none when X rejects the batch', async () => {
  let response = ''
  let sends = 0
  let shouldFail = false
  let postId = '456'
  let persistFails = false
  let savedLedger = {}
  const body = {}
  const rows = ['First Group 825 people', 'Second Group 267 people'].map((label) => ({
    innerText: label,
    click: () => { response = '' },
    getAttribute: () => null,
    getClientRects: () => [1],
    closest: () => null,
    contains: () => false,
  }))
  const send = {
    innerText: 'Send',
    click: () => { sends += 1; response = shouldFail ? 'Could not send message' : 'Message sent' },
    getAttribute: () => null,
    getClientRects: () => [1],
    closest: () => null,
    ownerDocument: { defaultView: { getComputedStyle: () => ({ opacity: '1', pointerEvents: 'auto' }) } },
  }
  const search = { placeholder: 'Search', matches: () => false }
  const picker = {
    innerText: 'Search First Group 825 people Second Group 267 people Send',
    parentElement: body,
    closest: () => null,
    querySelectorAll: (selector) => {
      if (selector.includes('cellInnerDiv')) return rows
      if (selector.includes('input')) return [search]
      if (selector.includes('data-testid="toast"')) return response ? [{ innerText: response }] : []
      if (selector.includes('button')) return [send]
      return []
    },
    scrollTop: 0,
    clientHeight: 600,
  }
  search.parentElement = picker
  send.parentElement = picker
  const article = { parentElement: null, querySelector: () => null, querySelectorAll: () => [timeLink] }
  const timeLink = { getAttribute: () => `/tuaran/status/${postId}`, querySelector: () => ({}), closest: () => article }
  const doc = {
    body,
    querySelector: () => null,
    querySelectorAll: (selector) => {
      if (selector.includes('article[data-testid="tweet"]')) return [article]
      if (selector.includes('xchatEmbedShare')) return [{ shadowRoot: picker }]
      return []
    },
  }
  const sessionStorage = new Map()
  const controller = createController({
    document: doc,
    window: {
      location: { pathname: '/tuaran' },
      sessionStorage: { getItem: (key) => sessionStorage.get(key), setItem: (key, value) => sessionStorage.set(key, value) },
    },
    wait: async () => {},
    random: () => 0,
    loadLedger: async () => ({ [LEDGER_KEY]: savedLedger }),
    saveLedger: async (value) => { if (persistFails) throw new Error('storage unavailable'); savedLedger = value },
  })

  await controller.start({ handle: 'tuaran' })
  assert.equal(sends, 1)
  assert.equal(controller.snapshot().shared, 2)
  assert.equal(controller.snapshot().running, false)
  assert.equal(Object.keys(savedLedger['456'] || {}).length, 3)
  assert.ok(Number(savedLedger['456'].__completedAt) > 0)
  assert.match(controller.snapshot().status, /最新帖子已标记为已分发，本轮完成/)

  savedLedger = { '456': { 'First Group|825 people': Date.now(), 'Second Group|267 people': Date.now() } }
  rows[0].innerText = 'First Group 826 people'
  await controller.start({ handle: 'tuaran' })
  assert.equal(sends, 1)
  assert.match(controller.snapshot().status, /已标记为已分发，跳过本轮/)

  postId = '789'
  shouldFail = true
  await controller.start({ handle: 'tuaran' })
  assert.equal(sends, 2)
  assert.equal(controller.snapshot().shared, 0)
  assert.equal(Object.keys(savedLedger['789'] || {}).length, 0)
  assert.match(controller.snapshot().status, /未记录成功/)

  shouldFail = false
  await controller.start({ handle: 'tuaran' })
  assert.equal(sends, 3)
  assert.ok(Number(savedLedger['789'].__completedAt) > 0)

  postId = '999'
  persistFails = true
  await controller.start({ handle: 'tuaran' })
  assert.equal(sends, 4)
  assert.equal(savedLedger['999'], undefined)
  assert.match(controller.snapshot().status, /无法保存已分发标记/)
})

test('a completed batch releases the scheduled task slot', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  const start = source.indexOf('async function completeCommunityShare(sender, status) {')
  const end = source.indexOf('async function removeRuntimeTab(', start)
  assert.ok(start >= 0 && end > start)
  const plan = { enabled: true, current: 'community-share', workTabId: 7, startedAt: 123, items: { 'community-share': {} } }
  let saved = false
  let inactive = false
  let ticked = false
  const context = {
    COMMUNITY_SHARE_RETRY_MS: 900000,
    readTaskSchedule: async () => plan,
    recordScheduleSegment: () => {},
    saveTaskSchedule: async () => { saved = true },
    updatePluginRuntime: async (message) => { inactive = message.mode === 'community-share' && message.active === false },
    tickTaskSchedule: async () => { ticked = true },
  }
  vm.createContext(context)
  vm.runInContext(`let scheduleWork = Promise.resolve();\n${source.slice(start, end)}`, context)
  await context.completeCommunityShare({ tab: { id: 7 } }, '本轮完成')
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(plan.current, '')
  assert.equal(plan.startedAt, 0)
  assert.ok(plan.items['community-share'].resumeAt > Date.now())
  assert.equal(plan.items['community-share'].reason, '本轮完成')
  assert.equal(saved, true)
  assert.equal(inactive, true)
  assert.equal(ticked, true)
})
