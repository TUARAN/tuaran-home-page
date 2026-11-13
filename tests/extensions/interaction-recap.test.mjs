import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const recap = require('../../tools/x-reply-clipboard-extension/interactionRecap.js')
const background = require('../../tools/x-reply-clipboard-extension/background.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)
const CALENDAR_URL = 'https://2aran.com/resources/big-interaction-whitepaper/calendar'
const SAMPLE_TEXT = '感谢过去一天的互动，谢谢 @VicentYip @xiaqingfeng666 @AlanShao111 @JMkernt @DISONYYDS @fngmn134813 @daniel_w_zj @ynggu2548245 @DearYoung28 @grok 愿意一起聊天。往期可以来大互动日历翻翻：https://2aran.com/resources/big-interaction-whitepaper/calendar'

const sampleDay = JSON.parse(await readFile(new URL('../../lib/interaction/dailyTop/days/2026-11-05.json', import.meta.url), 'utf8'))

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

test('local thank-you mentions the top handles without rank numbers', () => {
  const composed = recap.composeThankYou(sampleDay)
  assert.equal(composed.source, 'local')
  assert.equal(composed.text, SAMPLE_TEXT)
  assert.equal(recap.hasRankMarker(composed.text), false)
  assert.equal((composed.text.match(/@/g) || []).length, 10)
  assert.equal(composed.text.endsWith(CALENDAR_URL), true)
  for (const row of sampleDay.top) {
    assert.equal(composed.text.includes(`@${row.handle}`), true)
    assert.equal(composed.text.includes(row.displayName), false)
    assert.equal(composed.text.includes(String(row.count)), false)
    assert.equal(composed.text.includes(row.breakdown), false)
  }
  assert.equal(recap.hasRankMarker('1. @grok'), true)
  assert.equal(recap.hasRankMarker('第1名 @grok'), true)
  assert.equal(recap.hasRankMarker('#2 @grok'), true)
  assert.equal(recap.hasRankMarker('2 @grok'), true)
  assert.equal(recap.hasRankMarker('@fngmn134813 @grok'), false)
})

test('uses API thankYouText only when it mentions every handle, keeps the calendar, and has no ranks', () => {
  const fromApi = recap.composeThankYou({ ...sampleDay, thankYouText: `  ${SAMPLE_TEXT}  ` })
  assert.equal(fromApi.source, 'api')
  assert.equal(fromApi.text, SAMPLE_TEXT)

  const ranked = recap.composeThankYou({ ...sampleDay, thankYouText: `1. @VicentYip ${SAMPLE_TEXT}` })
  assert.equal(ranked.source, 'local')
  assert.equal(ranked.text, SAMPLE_TEXT)
  assert.equal(recap.hasRankMarker(ranked.text), false)

  const missingHandle = recap.composeThankYou({
    ...sampleDay,
    thankYouText: SAMPLE_TEXT.replace('@grok ', ''),
  })
  assert.equal(missingHandle.source, 'local')

  const missingCalendar = recap.composeThankYou({
    ...sampleDay,
    thankYouText: SAMPLE_TEXT.replace(CALENDAR_URL, 'https://example.com/calendar'),
  })
  assert.equal(missingCalendar.source, 'local')
  assert.equal(missingCalendar.text.endsWith(CALENDAR_URL), true)

  const short = recap.composeThankYou({ top: [{ handle: 'grok', rank: 1 }, { handle: 'fngmn134813', rank: 2 }] })
  assert.equal(short.text, `感谢过去一天的互动，谢谢 @grok @fngmn134813 愿意一起聊天。往期可以来大互动日历翻翻：${CALENDAR_URL}`)
  assert.equal(recap.hasRankMarker(short.text), false)
})

test('daily top client reads the latest day, a chosen day, a 404, and an offline failure', async () => {
  const seen = []
  const latest = await recap.fetchDailyTop('', async (url) => {
    seen.push(url)
    return jsonResponse(200, sampleDay)
  })
  assert.deepEqual(seen, ['https://2aran.com/api/interaction/daily-top'])
  assert.equal(latest.ok, true)
  assert.equal(latest.sent, false)
  assert.equal(latest.source, 'local')
  assert.equal(latest.text, SAMPLE_TEXT)
  assert.equal(latest.day.date, '2026-11-05')

  seen.length = 0
  const dated = await recap.fetchDailyTop('2026-11-05', async (url) => {
    seen.push(url)
    return jsonResponse(200, { ...sampleDay, thankYouText: SAMPLE_TEXT })
  })
  assert.deepEqual(seen, ['https://2aran.com/api/interaction/daily-top?date=2026-11-05'])
  assert.equal(dated.source, 'api')
  assert.equal(dated.text, SAMPLE_TEXT)

  const missing = await recap.fetchDailyTop('2026-11-09', async () => jsonResponse(404, { error: 'missing' }))
  assert.equal(missing.ok, false)
  assert.equal(missing.status, 404)
  assert.equal(missing.retryable, true)
  assert.match(missing.error, /2026-11-09/)
  assert.equal(missing.text, undefined)

  let called = false
  const invalid = await recap.fetchDailyTop('2026-02-31', async () => {
    called = true
    return jsonResponse(200, sampleDay)
  })
  assert.equal(called, false)
  assert.match(invalid.error, /YYYY-MM-DD/)

  const offline = await recap.fetchDailyTop('', async () => {
    throw new TypeError('Failed to fetch')
  })
  assert.equal(offline.ok, false)
  assert.equal(offline.offline, true)
  assert.equal(offline.retryable, true)
  assert.match(offline.error, /暂时连不上/)

  const unreadable = await recap.fetchDailyTop('', async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new SyntaxError('not json') },
  }))
  assert.equal(unreadable.ok, false)
  assert.match(unreadable.error, /无法读取/)

  const badSchema = await recap.fetchDailyTop('', async () => jsonResponse(200, { ...sampleDay, schemaVersion: 2 }))
  assert.equal(badSchema.ok, false)
  assert.equal(badSchema.text, undefined)
})

test('extension transport reports 404 and offline without calling another host', async () => {
  const previous = global.chrome
  const calls = []
  global.chrome = {
    runtime: {
      async sendMessage(message) {
        calls.push(message)
        assert.equal(message.type, 'xrc-interaction-daily-top')
        if (message.url.includes('date=')) return { ok: false, offline: true }
        return { ok: true, status: 404, body: '{"error":"missing"}' }
      },
    },
  }
  try {
    const missing = await recap.fetchDailyTop('')
    assert.equal(missing.status, 404)
    assert.equal(missing.ok, false)
    const offline = await recap.fetchDailyTop('2026-11-11')
    assert.equal(offline.offline, true)
    assert.match(offline.error, /暂时连不上/)
    assert.deepEqual(calls.map((message) => message.url), [
      'https://2aran.com/api/interaction/daily-top',
      'https://2aran.com/api/interaction/daily-top?date=2026-11-11',
    ])
  } finally {
    if (previous) global.chrome = previous
    else delete global.chrome
  }

  const fetched = []
  const found = await background.readDailyTopTransport('https://2aran.com/api/interaction/daily-top?date=2026-11-05', async (url) => {
    fetched.push(url)
    return { status: 404, text: async () => 'missing' }
  })
  assert.equal(found.status, 404)
  assert.deepEqual(fetched, ['https://2aran.com/api/interaction/daily-top?date=2026-11-05'])
  const blocked = await background.readDailyTopTransport('https://evil.example/api/interaction/daily-top', async () => {
    throw new Error('should not fetch')
  })
  assert.equal(blocked.ok, false)
  assert.match(blocked.error, /无效/)
  const down = await background.readDailyTopTransport('https://2aran.com/api/interaction/daily-top', async () => {
    throw new TypeError('Failed to fetch')
  })
  assert.equal(down.offline, true)
})

test('filling a recap draft never auto-sends', async () => {
  let sends = 0
  const filled = await recap.fillRecapDraft(SAMPLE_TEXT, async (text) => {
    assert.equal(text, SAMPLE_TEXT)
    return { ok: true, seen: text }
  })
  assert.equal(filled.ok, true)
  assert.equal(filled.sent, false)

  const blocked = await recap.fillRecapDraft(SAMPLE_TEXT, async () => {
    sends += 1
    return { ok: true, sent: true }
  })
  assert.equal(sends, 1)
  assert.equal(blocked.ok, false)
  assert.equal(blocked.sent, false)
  assert.equal(blocked.reason, 'send-blocked')

  const failed = await recap.fillRecapDraft(SAMPLE_TEXT, async () => {
    throw new Error('composer unavailable')
  })
  assert.equal(failed.ok, false)
  assert.equal(failed.sent, false)

  const posterSource = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const recapSource = await readFile(new URL('interactionRecap.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const fillBody = posterSource.slice(posterSource.indexOf('async function fillPostDraft'), posterSource.indexOf('function successNoticeNodes'))
  assert.match(fillBody, /async function fillPostDraft/)
  assert.match(fillBody, /sent: false/)
  assert.match(fillBody, /poster-running/)
  assert.doesNotMatch(fillBody, /tweetButton/)
  assert.doesNotMatch(fillBody, /realClick/)
  assert.doesNotMatch(fillBody, /publishPost/)
  assert.equal(fillBody.match(/\.click\(/g).length, 1)
  assert.match(posterSource, /realClick\(findInlineComposer\(\)\?\.submit/)
  assert.match(recapSource, /互动数据盘点/)
  assert.match(recapSource, /填入发帖框，不发送/)
  assert.match(recapSource, /不会自动发出/)
  assert.doesNotMatch(recapSource, /tweetButton|publishPost|FLOW_TASKS|realClick/)
  const flow = backgroundSource.match(/const FLOW_TASKS = \[([^\]]+)\]/)
  assert.ok(flow)
  assert.doesNotMatch(flow[1], /recap|daily-top|dailyTop/)
  assert.match(backgroundSource, /xrc-interaction-daily-top/)
})

test('poster fill writes the inline or dialog composer and does not click Post', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const phrase = '感谢过去一天的互动，谢谢 @grok 愿意一起聊天。'

  async function run(mode) {
    const clicks = { submit: 0, open: 0 }
    const messages = []
    let opened = false
    const listeners = new Set()
    const editor = {
      innerText: mode === 'occupied' ? '已经写了一句' : '',
      isConnected: true,
      closest: () => null,
      getBoundingClientRect: () => ({ width: 200, height: 40, top: 10, bottom: 50 }),
      parentElement: null,
    }
    const submit = {
      disabled: false,
      innerText: mode === 'reply' ? 'Reply' : 'Post',
      textContent: mode === 'reply' ? 'Reply' : 'Post',
      getAttribute: () => null,
      closest: () => null,
      getBoundingClientRect: () => ({ width: 40, height: 20, top: 80, bottom: 100 }),
      click() { clicks.submit += 1 },
    }
    const container = {
      parentElement: null,
      querySelector: (selector) => (selector.includes('tweetButtonInline') ? submit : null),
    }
    editor.parentElement = container
    const opener = { click() { clicks.open += 1; opened = true } }
    const composeDialog = {
      innerText: 'Post',
      textContent: 'Post',
      closest: () => null,
      querySelector(selector) {
        if (selector.includes('tweetTextarea')) return editor
        if (selector.includes('tweetButton')) return submit
        return null
      },
    }
    const replyDialog = {
      innerText: 'Replying to @someone',
      textContent: 'Replying to @someone',
      closest: () => null,
      querySelector(selector) {
        if (selector.includes('tweetTextarea')) return editor
        if (selector.includes('tweetButton')) return { innerText: 'Reply', textContent: 'Reply' }
        return null
      },
    }
    const fakeWindow = {
      location: { pathname: '/home', origin: 'https://x.com' },
      setTimeout,
      clearTimeout,
      addEventListener(_name, fn) { listeners.add(fn) },
      removeEventListener(_name, fn) { listeners.delete(fn) },
      postMessage(message) {
        if (message.direction !== 'request') return
        messages.push(message)
        if (message.text) editor.innerText = message.text
        for (const listener of listeners) {
          listener({ source: fakeWindow, data: {
            channel: message.channel, direction: 'response', requestId: message.requestId, result: { ok: true },
          } })
        }
      },
    }
    const fakeDocument = {
      querySelector(selector) {
        if (selector.includes('SideNav_NewTweet_Button') && mode === 'dialog') return opener
        return null
      },
      querySelectorAll(selector) {
        if (selector.includes('tweetTextarea_0')) return mode === 'inline' || mode === 'occupied' ? [editor] : []
        if (selector.includes('tweetButtonInline')) return mode === 'inline' || mode === 'occupied' ? [submit] : []
        if (selector === '[role="dialog"]') {
          if (mode === 'reply') return [replyDialog]
          if (mode === 'dialog' && opened) return [composeDialog]
        }
        return []
      },
    }
    const context = {
      window: fakeWindow,
      document: fakeDocument,
      console,
      setTimeout,
      clearTimeout,
      URL,
      Date,
      Promise,
    }
    vm.createContext(context)
    vm.runInContext(source, context)
    const result = await context.XInteractionPoster.fillPostDraft(phrase)
    return { result, clicks, messages, editor }
  }

  const inline = await run('inline')
  assert.equal(inline.result.ok, true)
  assert.equal(inline.result.sent, false)
  assert.equal(inline.result.seen, phrase)
  assert.equal(inline.editor.innerText, phrase)
  assert.equal(inline.clicks.submit, 0)
  assert.equal(inline.clicks.open, 0)
  assert.equal(inline.messages[0].scope, 'post')

  const dialog = await run('dialog')
  assert.equal(dialog.result.ok, true)
  assert.equal(dialog.result.sent, false)
  assert.equal(dialog.editor.innerText, phrase)
  assert.equal(dialog.clicks.submit, 0)
  assert.equal(dialog.clicks.open, 1)
  assert.equal(dialog.messages[0].scope, 'compose')

  const occupied = await run('occupied')
  assert.equal(occupied.result.ok, false)
  assert.equal(occupied.result.sent, false)
  assert.equal(occupied.result.reason, 'composer-not-empty')
  assert.equal(occupied.editor.innerText, '已经写了一句')
  assert.equal(occupied.clicks.submit, 0)
  assert.equal(occupied.messages.length, 0)

  const reply = await run('reply')
  assert.equal(reply.result.reason, 'reply-dialog-open')
  assert.equal(reply.result.sent, false)
  assert.equal(reply.clicks.submit, 0)
  assert.equal(reply.messages.length, 0)

  const missing = await run('missing')
  assert.equal(missing.result.reason, 'no-composer')
  assert.equal(missing.result.sent, false)
  assert.equal(missing.clicks.submit, 0)
  assert.equal(missing.clicks.open, 0)
})

test('compose scope writes the new-post dialog and leaves an open reply dialog alone', async () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  const previousDocument = global.document
  const previousWindow = global.window
  const focused = []
  function editor(label) {
    return {
      label,
      innerText: '',
      closest: () => null,
      getBoundingClientRect: () => ({ width: 20, height: 20 }),
      focus() { focused.push(label) },
    }
  }
  const replyEditor = editor('reply')
  const postEditor = editor('post')
  const replyDialog = {
    innerText: 'Replying to @someone',
    textContent: 'Replying to @someone',
    querySelector(selector) {
      if (selector.includes('tweetTextarea')) return replyEditor
      if (selector.includes('tweetButton')) return { innerText: 'Reply', textContent: 'Reply' }
      return null
    },
  }
  const composeDialog = {
    innerText: 'Post',
    textContent: 'Post',
    querySelector(selector) {
      if (selector.includes('tweetTextarea')) return postEditor
      if (selector.includes('tweetButton')) return { innerText: 'Post', textContent: 'Post' }
      return null
    },
  }
  global.window = {}
  global.document = {
    querySelector: () => null,
    querySelectorAll: (selector) => (selector.includes('dialog') ? [replyDialog, composeDialog] : []),
    execCommand(_command, _show, value) {
      const current = focused.at(-1) === 'post' ? postEditor : replyEditor
      current.innerText += String(value || '')
      return true
    },
  }
  try {
    const result = await draft.fillReplyComposer('感谢 @grok', { scope: 'compose' })
    assert.equal(focused.includes('reply'), false)
    assert.equal(focused.includes('post'), true)
    assert.equal(replyEditor.innerText, '')
    assert.match(postEditor.innerText, /感谢 @grok/)
    assert.notEqual(result.reason, 'no-editor')
  } finally {
    global.document = previousDocument
    global.window = previousWindow
  }
})

test('manifest declares 2aran.com and loads the recap outside the daily task list', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const readme = await readFile(new URL('README.md', extensionDir), 'utf8')
  const scripts = manifest.content_scripts[3].js
  assert.equal(manifest.version, '4.9.63')
  assert.ok(manifest.host_permissions.includes('https://2aran.com/*'))
  assert.ok(scripts.indexOf('poster.js') < scripts.indexOf('interactionRecap.js'))
  assert.ok(scripts.indexOf('interactionRecap.js') < scripts.indexOf('content.js'))
  assert.ok(scripts.indexOf('interactionRecap.js') < scripts.indexOf('experiments.js'))
  assert.match(readme, /v4\.9\.54（2026-11-12，本地测试）/)
  assert.match(readme, /不会自动发出/)
})
