import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { shareDialog, waitForShareDialog, findAction, createController, LEDGER_KEY } = require('../../tools/x-reply-clipboard-extension/communityShare.js')

test('recognizes the visible group picker by Search, group rows and Send even without a Share heading', async () => {
  const body = {}
  const send = {
    innerText: 'Send',
    getAttribute: () => null,
    getClientRects: () => [1],
    closest: () => null,
  }
  const picker = {
    innerText: 'Search BlueV Mutual Follow Group 825 people NGSLin @NGSLin99 Creator Circle 267 people Write a message... Send',
    parentElement: body,
    closest: () => null,
    querySelector: (selector) => selector.includes('placeholder') ? search : null,
    querySelectorAll: (selector) => selector.includes('button') ? [send] : [],
  }
  const search = { parentElement: picker, matches: () => false }
  const doc = {
    body,
    querySelectorAll: (selector) => selector.includes('role="dialog"') ? [] : [search],
  }

  assert.equal(shareDialog(doc), picker)
  assert.equal(await waitForShareDialog(doc, async () => {}), picker)
  assert.equal(findAction(picker, /^Send$/u), send)
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
    querySelectorAll: (selector) => selector.includes('cellInnerDiv') ? [row] : selector.includes('button') ? [pickerSend] : [],
    scrollTop: 0,
    clientHeight: 600,
  }
  const search = { parentElement: picker, matches: () => false }
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
  const doc = {
    body,
    querySelector: () => null,
    querySelectorAll: (selector) => {
      if (selector.includes('article[data-testid="tweet"]')) return [article]
      if (selector.includes('role="dialog"')) return []
      if (selector.includes('data-testid="toast"')) return sent ? [{ innerText: 'Message sent' }] : []
      if (selector.includes('role="heading"')) return [search]
      if (selector.includes('button')) return [outsideSend, pickerSend]
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
    saveLedger: async (value) => { savedLedger = value },
  })

  await controller.start({ handle: 'tuaran' })
  assert.equal(selected, true)
  assert.equal(sent, true)
  assert.equal(outsideSent, false)
  assert.equal(controller.snapshot().shared, 1)
  assert.equal(Object.keys(savedLedger['123'] || {}).length, 1)
})
