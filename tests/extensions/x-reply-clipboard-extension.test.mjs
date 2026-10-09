import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const loop = require('../../tools/x-reply-clipboard-extension/loop.js')
const mutual = require('../../tools/x-reply-clipboard-extension/mutual.js')
const poster = require('../../tools/x-reply-clipboard-extension/poster.js')
const background = require('../../tools/x-reply-clipboard-extension/background.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

test('offscreen timer message wakes a wait without relying on the page timer', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const listeners = []
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        lastError: null,
        onMessage: { addListener(listener) { listeners.push(listener) } },
        sendMessage(message, callback) {
          callback({ ok: true })
          setTimeout(() => {
            for (const listener of listeners) {
              listener({ type: 'xrc-timer-fired', requestId: message.requestId })
            }
          }, 5)
        },
      },
    },
  })
  vm.runInContext(source, context)

  const startedAt = Date.now()
  await context.XInteractionTimer.wait(1000)
  assert.ok(Date.now() - startedAt < 250)
})

test('background timer keeps its originating tab and routes the wake-up back to that content script', async () => {
  const runtimeMessages = []
  const tabMessages = []
  globalThis.chrome = {
    offscreen: { async createDocument() {} },
    runtime: {
      getURL(pathname) { return `chrome-extension://test/${pathname}` },
      async getContexts() { return [{ contextType: 'OFFSCREEN_DOCUMENT' }] },
      async sendMessage(message) { runtimeMessages.push(message) },
    },
    tabs: {
      async sendMessage(tabId, message, options) { tabMessages.push({ tabId, message, options }) },
    },
  }

  try {
    await background.scheduleBackgroundTimer(
      { requestId: 'timer-1', delayMs: 2000 },
      { tab: { id: 42 }, frameId: 0 },
    )
    assert.deepEqual(runtimeMessages, [{
      type: 'xrc-offscreen-schedule',
      requestId: 'timer-1',
      delayMs: 2000,
      tabId: 42,
      frameId: 0,
    }])

    await background.deliverBackgroundTimer({ requestId: 'timer-1', tabId: 42, frameId: 0 })
    assert.deepEqual(tabMessages, [{
      tabId: 42,
      message: { type: 'xrc-timer-fired', requestId: 'timer-1' },
      options: { frameId: 0 },
    }])
  } finally {
    delete globalThis.chrome
  }
})

test('plugin stable runtime spans multiple task tabs and stops only after the final task stops', async () => {
  let savedRuntime = null
  const existingTabs = new Set([11, 22])
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) { return { [key]: savedRuntime } },
        async set(value) { savedRuntime = value.xrcPluginRuntime },
      },
    },
    tabs: {
      async get(tabId) {
        if (!existingTabs.has(tabId)) throw new Error('tab closed')
        return { id: tabId }
      },
    },
  }

  try {
    const first = await background.updatePluginRuntime(
      { mode: 'timeline', active: true },
      { tab: { id: 11 } },
    )
    const stableStartedAt = first.runtime.startedAt
    assert.ok(stableStartedAt > 0)

    const second = await background.updatePluginRuntime(
      { mode: 'notifications', active: true },
      { tab: { id: 22 } },
    )
    assert.equal(second.runtime.startedAt, stableStartedAt)
    assert.deepEqual(Object.keys(second.runtime.tasks).sort(), ['notifications', 'timeline'])

    await background.updatePluginRuntime({ mode: 'timeline', active: false }, { tab: { id: 11 } })
    assert.equal(savedRuntime.startedAt, stableStartedAt)
    assert.deepEqual(Object.keys(savedRuntime.tasks), ['notifications'])

    await background.updatePluginRuntime({ mode: 'notifications', active: false }, { tab: { id: 22 } })
    assert.equal(savedRuntime.startedAt, null)
    assert.deepEqual(savedRuntime.tasks, {})
  } finally {
    delete globalThis.chrome
  }
})

test('short DOM polling stays local instead of flooding the offscreen timer channel', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  let sent = 0
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        onMessage: { addListener() {} },
        sendMessage() { sent += 1 },
      },
    },
  })
  vm.runInContext(source, context)
  await context.XInteractionTimer.wait(5)
  assert.equal(context.XInteractionTimer.BACKGROUND_TIMER_MIN_MS, 1000)
  assert.equal(sent, 0)
})

test('AI poster formats blank lines and keeps the random interval between 25 and 35 minutes', () => {
  assert.equal(poster.randomIntervalMs(() => 0), 25 * 60 * 1000)
  assert.ok(poster.randomIntervalMs(() => 0.999999) <= 35 * 60 * 1000)
  assert.equal(poster.randomIntervalMs(() => 0, 'slow'), 50 * 60 * 1000)
  assert.equal(poster.randomIntervalMs(() => 1, 'turbo'), 10 * 60 * 1000)
  assert.equal(poster.randomIntervalMs(() => 0, 'fast'), 12 * 60 * 1000)
  assert.equal(poster.postScheduleProfile('missing').id, 'medium')
  assert.equal(poster.formatPostSchedule('fast').interval, '12～18 分钟')
  assert.equal(poster.snapshot().nextPostAt, 0)
  poster.setSchedulePace('turbo')
  assert.equal(poster.snapshot().schedulePace, 'turbo')
  assert.equal(poster.snapshot().nextPostAt, 0)
  poster.setSchedulePace('medium')
  assert.equal(poster.formatPost('推文：第一行\n第二行\n\n第三行'), '第一行\n\n第二行\n\n第三行')
  assert.equal(poster.editorText({ innerText: '第一行\n\n\n第二行' }), '第一行\n\n第二行')
  assert.ok(Array.from(poster.formatPost('内容'.repeat(300))).length <= 270)
})

test('picks the topmost unseen post that still has a reply button', () => {
  const processed = new Set(['2'])
  const next = loop.nextTweet(
    [
      { id: '2', top: 10, replyButton: {} },
      { id: '3', top: 400, replyButton: {} },
      { id: '1', top: 0, replyButton: null },
      { id: '4', top: 80, replyButton: {} },
    ],
    processed,
  )

  assert.equal(next.id, '4')
})

test('reloads after 35 successful replies and after the timeline stalls', () => {
  assert.deepEqual(loop.shouldReload({ pageCount: 35, succeeded: 35, stalled: false }), {
    reload: true,
    reason: 'batch',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 8, succeeded: 8, stalled: true }), {
    reload: true,
    reason: 'stalled',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 0, succeeded: 0, stalled: true }), {
    reload: false,
    reason: '',
  })
  assert.equal(loop.BATCH_SIZE, 35)
  assert.equal(loop.ROUNDS_PER_RUN, 5)
  assert.equal(loop.RUN_SIZE, 175)
  assert.deepEqual(loop.batchTransition({ pageCount: 34, completedRounds: 0 }), {
    action: 'continue',
    completedRounds: 0,
    pageCount: 34,
  })
  assert.deepEqual(loop.batchTransition({ pageCount: 35, completedRounds: 0 }), {
    action: 'reload',
    completedRounds: 1,
    pageCount: 0,
  })
  assert.deepEqual(loop.batchTransition({ pageCount: 35, completedRounds: 4 }), {
    action: 'complete',
    completedRounds: 5,
    pageCount: 0,
  })
})

test('creates one persisted-size random execution plan within the configured ranges', () => {
  const minimumPlan = loop.createRunPlan(() => 0)
  assert.deepEqual(minimumPlan, { pace: 'medium', rounds: 3, roundTargets: [25, 25, 25], total: 75 })

  const maximumPlan = loop.createRunPlan(() => 1)
  assert.deepEqual(maximumPlan, { pace: 'medium', rounds: 5, roundTargets: [35, 35, 35, 35, 35], total: 175 })
  assert.equal(loop.randomReplyDelaySeconds(() => 0), 5)
  assert.equal(loop.randomReplyDelaySeconds(() => 1), 15)
  assert.equal(loop.randomCycleDelayMs(() => 0), 2 * 60 * 60 * 1000)
  assert.equal(loop.randomCycleDelayMs(() => 1), 3 * 60 * 60 * 1000)

  assert.deepEqual(loop.SCHEDULE_PROFILES.map((item) => item.label), ['慢', '中', '快', '超快'])
  assert.equal(loop.DEFAULT_SCHEDULE_PACE, 'medium')
  assert.equal(loop.schedulePaceIndex('slow'), 0)
  assert.equal(loop.schedulePaceIndex('turbo'), 3)
  assert.equal(loop.scheduleProfile('missing').id, 'medium')
  assert.equal(loop.createRunPlan(() => 0, 'slow').rounds, 2)
  assert.equal(loop.createRunPlan(() => 0, 'slow').roundTargets[0], 12)
  assert.equal(loop.createRunPlan(() => 1, 'turbo').rounds, 8)
  assert.equal(loop.createRunPlan(() => 1, 'turbo').roundTargets[0], 55)
  assert.equal(loop.randomReplyDelaySeconds(() => 0, 'turbo'), 1)
  assert.equal(loop.randomReplyDelaySeconds(() => 1, 'fast'), 6)
  assert.equal(loop.randomCycleDelayMs(() => 0, 'turbo'), 20 * 60 * 1000)
  assert.equal(loop.randomCycleDelayMs(() => 1, 'slow'), 6 * 60 * 60 * 1000)
  assert.equal(loop.formatSchedule('medium').cycleDelay, '2～3 小时')
  assert.equal(loop.formatSchedule('fast').cycleDelay, '60～90 分钟')
  assert.equal(loop.formatSchedule('turbo').replyDelay, '1～3 秒')
  assert.deepEqual(loop.scheduleBounds(), { minReplies: 12, maxReplies: 55, minRounds: 2, maxRounds: 8 })
})

test('treats a disabled Reply button and empty composer placeholders as not ready', () => {
  assert.equal(loop.isSubmitEnabled(null), false)
  assert.equal(loop.isSubmitEnabled({ disabled: true, getAttribute() { return null } }), false)
  assert.equal(
    loop.isSubmitEnabled({ disabled: false, getAttribute(name) { return name === 'aria-disabled' ? 'true' : null } }),
    false,
  )
  assert.equal(loop.isSubmitEnabled({ disabled: false, getAttribute() { return null } }), true)
  assert.equal(loop.composerText({ innerText: 'Post your reply' }), '')
  assert.equal(loop.composerText({ textContent: '  学习了 \u200b' }), '学习了')
})

test('reads a post id from a status permalink', () => {
  assert.equal(loop.statusIdFromHref('/Ocean_Yu1/status/1840000000000000000'), '1840000000000000000')
  assert.equal(loop.statusIdFromHref('https://x.com/Ocean_Yu1/status/99/photo/1'), '99')
  assert.equal(loop.statusIdFromHref('/home'), '')
})

test('reads and normalizes the post author handle from a status permalink', () => {
  assert.equal(loop.handleFromStatusHref('/Ocean_Yu1/status/1840000000000000000'), 'ocean_yu1')
  assert.equal(loop.handleFromStatusHref('https://x.com/TUARAN/status/99/photo/1'), 'tuaran')
  assert.equal(loop.handleFromStatusHref('/i/web/status/99'), '')
  assert.equal(loop.normalizeHandle('@TUARAN'), 'tuaran')
})

test('recognizes only notification tweets that reply to the signed-in account', () => {
  assert.equal(loop.isNotificationReplyText('Replying to @TUARAN', '@tuaran'), true)
  assert.equal(loop.isNotificationReplyText('正在回复 @tuaran', 'TUARAN'), true)
  assert.equal(loop.isNotificationReplyText('liked your reply', 'tuaran'), false)
  assert.equal(loop.isNotificationReplyText('Replying to @someone_else', 'tuaran'), false)
})

test('limits notification interaction to the most recent two hours', () => {
  const now = Date.parse('2026-10-09T12:00:00.000Z')
  assert.equal(loop.NOTIFICATION_WINDOW_MS, 2 * 60 * 60 * 1000)
  assert.equal(loop.timestampFromDatetime('2026-10-09T10:30:00.000Z'), Date.parse('2026-10-09T10:30:00.000Z'))
  assert.equal(loop.isWithinNotificationWindow(Date.parse('2026-10-09T10:00:00.000Z'), now), true)
  assert.equal(loop.isWithinNotificationWindow(Date.parse('2026-10-09T09:59:59.000Z'), now), false)
  assert.equal(loop.isOlderThanNotificationWindow(Date.parse('2026-10-09T09:59:59.000Z'), now), true)
  assert.equal(loop.timestampFromDatetime('not-a-date'), 0)
})

test('recognizes the list routes used by the integrated mutual helper', () => {
  assert.equal(mutual.isFollowingPath('/tuaran/following'), true)
  assert.equal(mutual.isFollowingPath('/tuaran/followers'), false)
  assert.equal(mutual.isFollowersPath('/tuaran/followers'), true)
  assert.equal(mutual.isFollowersPath('/tuaran/verified_followers'), true)
  assert.equal(mutual.isFollowersPath('/home'), false)
  assert.equal(mutual.constants.FOLLOW_ACTION_DELAY_MS, 2000)
  assert.equal(mutual.constants.FOLLOW_BATCH_SIZE, 15)
  assert.equal(mutual.constants.FOLLOW_BATCH_COOLDOWN_MS, 1800000)
  assert.equal(mutual.constants.FOLLOW_MAX_PER_RUN, 400)
  assert.equal(mutual.constants.FOLLOW_DAILY_LIMIT, 400)
})

test('loads one shared follow quota for follow-back and target-follow modes', async () => {
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  globalThis.chrome = {
    storage: {
      local: {
        get: async () => ({
          xrcTargetFollowDaily: { date: today, count: 23, batchProgress: 8, cooldownUntil: 0 },
        }),
        set: async () => {},
      },
    },
  }
  try {
    const snapshot = await mutual.refreshSharedFollowRate()
    assert.equal(snapshot.sharedDailyFollowed, 23)
    assert.equal(snapshot.sharedBatchProgress, 8)
  } finally {
    delete globalThis.chrome
  }
})

test('matches a saved phrase after X collapses spaces or inserts invisible characters', () => {
  const phrases = require('../../tools/x-reply-clipboard-extension/phrases.js')
  assert.equal(loop.normalizePhraseText(' 🧇.  .🧇\u200b '), '🧇..🧇')
  assert.equal(loop.phraseIndexFromText(phrases, '手写内容'), -1)
  assert.equal(loop.repeatedPhraseIndexFromText(phrases, '稳稳'), phrases.indexOf('稳'))
  assert.equal(loop.repeatedPhraseIndexFromText(phrases, '手写内容'), -1)
  assert.equal(loop.placeholderMixedPhraseIndexFromText(phrases, '稳st your reply'), phrases.indexOf('稳'))
  assert.equal(loop.placeholderMixedPhraseIndexFromText(phrases, '手写内容'), -1)
})

test('picks a different phrase index and never repeats the current one', () => {
  assert.equal(loop.nextPhraseIndex(1, 0, () => 0), 0)
  assert.equal(loop.nextPhraseIndex(55, 0, () => 0), 1)
  assert.equal(loop.nextPhraseIndex(55, 10, () => 10), 11)
  assert.equal(loop.nextPhraseIndex(55, 54, () => 53), 53)
  assert.equal(loop.nextPhraseIndex(55, 54, () => 0), 0)
  const phrases = require('../../tools/x-reply-clipboard-extension/phrases.js')
  assert.equal(phrases.length, 100)
  assert.equal(phrases[0], '原来是这样，这下前因后果就说得通了。')
  assert.equal(new Set(phrases).size, 100)
  assert.ok(phrases.every((phrase) => phrase.trim()))
  assert.ok(phrases.every((phrase) => phrase.length >= 10))
  assert.ok(phrases.includes('正解，我感觉这个没毛病。'))
  assert.ok(phrases.includes('不错😌谢谢老铁的分享～'))
  const emojiPhrases = phrases.filter((phrase) => /\p{Extended_Pictographic}/u.test(phrase))
  assert.ok(emojiPhrases.length >= 30 && emojiPhrases.length <= 45)
  assert.ok(emojiPhrases.every((phrase) => /[\p{Script=Han}A-Za-z]/u.test(phrase)))
})

test('content script keeps the randomized reply loop wired to the reply popup', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const mutualSource = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const posterSource = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const posterFixture = await readFile(new URL('fixtures/poster.html', extensionDir), 'utf8')
  const timerSource = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const offscreenSource = await readFile(new URL('offscreen.js', extensionDir), 'utf8')
  const timerWorkerSource = await readFile(new URL('timer-worker.js', extensionDir), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const catalog = await readFile(new URL('../../lib/resourceCatalog.js', import.meta.url), 'utf8')
  const registry = await readFile(new URL('../../lib/contentRegistry.js', import.meta.url), 'utf8')
  const toolItems = await readFile(new URL('../../lib/toolItems.js', import.meta.url), 'utf8')
  const resourcePage = await readFile(
    new URL('../../app/(site)/resources/x-reply-clipboard-extension/page.jsx', import.meta.url),
    'utf8',
  )
  const downloadButton = await readFile(
    new URL('../../app/(site)/resources/x-reply-clipboard-extension/ExtensionDownloadButton.jsx', import.meta.url),
    'utf8',
  )

  assert.equal(manifest.manifest_version, 3)
  assert.equal(manifest.name, 'X Interaction Assistant')
  assert.equal(manifest.version, '3.6.6')
  assert.ok(manifest.host_permissions.includes('https://x.com/*'))
  assert.ok(manifest.host_permissions.includes('https://twitter.com/*'))
  assert.ok(manifest.host_permissions.includes('https://api.deepseek.com/*'))
  assert.equal(manifest.content_scripts[0].world, 'MAIN')
  assert.deepEqual(manifest.content_scripts[0].js, ['draftFill.js'])
  assert.deepEqual(manifest.content_scripts[1].js, ['phrases.js', 'loop.js', 'timer.js', 'poster.js', 'mutual.js', 'content.js'])
  assert.deepEqual(manifest.permissions, ['storage', 'offscreen'])
  assert.equal(manifest.background.service_worker, 'background.js')
  assert.match(backgroundSource, /xrc-task-open/)
  assert.match(backgroundSource, /xrc-task-register/)
  assert.match(backgroundSource, /chrome\.tabs\.create/)
  assert.match(backgroundSource, /chrome\.tabs\.update/)
  assert.match(backgroundSource, /chrome\.storage\.session/)
  assert.match(backgroundSource, /chrome\.tabs\.sendMessage\(tabId, payload/)
  assert.match(backgroundSource, /scheduleBackgroundTimer\(message, sender\)/)
  assert.match(backgroundSource, /xrc-runtime-task-state/)
  assert.match(backgroundSource, /xrcPluginRuntime/)
  assert.match(timerSource, /xrc-timer-schedule/)
  assert.match(timerSource, /xrc-timer-fired/)
  assert.match(offscreenSource, /new Worker\(chrome\.runtime\.getURL\("timer-worker\.js"\)\)/)
  assert.match(offscreenSource, /tabId/)
  assert.match(timerWorkerSource, /setTimeout/)
  assert.match(timerWorkerSource, /tabId/)
  assert.match(posterSource, /tweetButtonInline/)
  assert.match(posterSource, /tweetTextarea_0/)
  assert.match(posterSource, /xrc-ai-post-generate/)
  assert.match(posterSource, /MIN_INTERVAL_MS = 25 \* 60 \* 1000/)
  assert.match(posterSource, /MAX_INTERVAL_MS = 35 \* 60 \* 1000/)
  assert.match(posterSource, /RETRY_INTERVAL_MS = 60 \* 1000/)
  assert.match(posterSource, /depth < 30/)
  assert.match(posterSource, /visibleSubmits/)
  assert.match(posterSource, /上次异常：\$\{state\.lastError\}/)
  assert.match(posterSource, /正在重试上次尚未发出的内容/)
  assert.match(posterSource, /state\.elapsedMs = state\.startedAt/)
  assert.match(posterFixture, /tweetButtonInline/)
  assert.match(posterFixture, /PASS poster sent=1/)
  assert.match(content, /data-testid="reply"/)
  assert.match(content, /tweetTextarea_/)
  assert.match(content, /contenteditable=\"true\"/)
  assert.match(content, /tweetButton/)
  assert.match(content, /location\.reload/)
  assert.match(content, /x-reply-clipboard-draft-v2/)
  assert.match(content, /nextPhraseIndex/)
  assert.match(content, /XReplyClipboardPhrases/)
  assert.doesNotMatch(content, /剪贴板是空的/)
  assert.doesNotMatch(content, /clipboard\.readText/)
  assert.doesNotMatch(content, /execCommand\("insertText"/)
  assert.match(content, /BATCH_SIZE/)
  assert.match(content, /seen === phrase/)
  assert.match(content, /SUBMIT_TIMEOUT_MS = 5000/)
  assert.match(content, /SEND_CONFIRM_TIMEOUT_MS = 5000/)
  assert.match(content, /ROUNDS_PER_RUN/)
  assert.match(content, /completedRounds/)
  assert.match(content, /processedIds: Array\.from\(processedIds\)/)
  assert.match(content, /回复已确认；X 未关闭弹窗，刷新后自动继续/)
  assert.match(content, /send-unconfirmed/)
  assert.match(content, /稍后重试同一条/)
  assert.match(content, /Your \(\?:post\|reply\) was sent/)
  assert.match(content, /currentAccountHandle/)
  assert.match(content, /tweet\.authorHandle !== ownHandle/)
  assert.doesNotMatch(content, /processedIds\.add\(next\.id\);\s*advancePhrase\(\);\s*writeSaved/)
  assert.doesNotMatch(content, /clickMatchingButton/)
  assert.doesNotMatch(content, /saveAndDismissComposer/)
  assert.doesNotMatch(content, /closeConfirmedComposer/)
  assert.doesNotMatch(content, /app-bar-close/)
  assert.doesNotMatch(content, /\bDiscard\b/)
  assert.match(content, /sent-composer-open/)
  assert.match(content, /phraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /repeatedPhraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /placeholderMixedPhraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /if \(!existingText\) return publishReply\(existingComposer, replyText\)/)
  assert.match(content, /getManifest/)
  assert.match(content, /X高频互动助手/)
  assert.match(content, /data-xrc-assistant="mutual"/)
  assert.match(content, /data-xrc-assistant="timeline"/)
  assert.match(content, /data-xrc-assistant="notifications"/)
  assert.match(content, /功能导航/)
  assert.doesNotMatch(content, /当前助手/)
  assert.match(content, /通知回复/)
  assert.match(content, /互关浇友/)
  assert.match(content, /推文浇给/)
  assert.match(content, /data-xrc-post-pace/)
  assert.match(content, /selectPosterPace/)
  assert.match(posterSource, /randomIntervalMs\(Math\.random, state\.schedulePace\)/)
  assert.match(content, /loopApi\.randomCycleDelayMs\(Math\.random, state\.schedulePace\)/)
  assert.match(content, /RECONNECT_INTERVAL_MS = 60 \* 1000/)
  assert.match(content, /finishCycleAndScheduleNext/)
  assert.match(content, /reconnectAndResume/)
  assert.match(content, /data-xrc-stable-runtime/)
  assert.match(content, /xrc-runtime-task-state/)
  assert.match(content, /cycleCount/)
  assert.match(content, /nextCycleAt/)
  assert.match(content, /xrc-task-open/)
  assert.match(content, /xrc-task-register/)
  assert.match(content, /requestedAssistantMode/)
  assert.match(content, /每项使用独立 X 页签，切换不会停止其他任务/)
  assert.doesNotMatch(content, /class="xrc-phrase-row"/)
  assert.match(content, /class="xrc-status xrc-reply-status"/)
  assert.ok(content.indexOf('data-xrc-assistant="timeline"') < content.indexOf('data-xrc-assistant="notifications"'))
  assert.ok(content.indexOf('data-xrc-assistant="notifications"') < content.indexOf('data-xrc-assistant="mutual"'))
  assert.match(content, /NOTIFICATION_HISTORY_KEY = "xrcNotificationProcessedIds"/)
  assert.match(content, /最近 2 小时/)
  assert.match(content, /state\.assistantMode !== "notifications"/)
  assert.match(content, /persistNotificationProcessed\(next\.id\)/)
  assert.doesNotMatch(content, /document\.hidden|visibilitychange|waitForForeground/)
  assert.doesNotMatch(mutualSource, /document\.hidden|visibilitychange|waitForForeground/)
  assert.match(content, /isNotificationReplyText/)
  assert.match(content, /data-testid="like"/)
  assert.match(content, /data-testid="unlike"/)
  assert.match(content, /likeNotificationReply/)
  assert.match(content, /data-xrc-mutual-action="unfollow"/)
  assert.match(content, /data-xrc-mutual-action="followBack"/)
  assert.match(content, /data-xrc-mutual-action="targetFollow"/)
  assert.match(content, /data-xrc-mutual-tab="unfollow"/)
  assert.match(content, /data-xrc-mutual-tab="followBack"/)
  assert.match(content, /data-xrc-mutual-tab="targetFollow"/)
  assert.match(content, /其他作者的 Followers 页面/)
  assert.match(content, /与关注候选共享：2 秒一个，每 15 个暂停 30 分钟，每日合计最多 400 个/)
  assert.match(content, /与回关粉丝共享：2 秒一个，每 15 个暂停 30 分钟，每日合计最多 400 个/)
  assert.match(content, /function selectMutualMode/)
  assert.match(content, /mutualMode/)
  assert.match(content, /button\.disabled = false;\s*button\.title = selected/)
  assert.match(content, /mutualApi\.run/)
  assert.match(content, /result !== "sent-composer-open"/)
  assert.match(content, /data-xrc-round-track/)
  assert.match(content, /data-xrc-round-segment/)
  assert.match(content, /data-xrc-page-meta/)
  assert.match(content, /class="xrc-phrase-pool" open/)
  assert.match(content, /data-xrc-phrase-index/)
  assert.match(content, /aria-selected/)
  assert.match(content, /data-xrc-runtime/)
  assert.match(content, /randomReplyDelaySeconds\(Math\.random, state\.schedulePace\)/)
  assert.match(content, /DEFAULT_ROUND_INTERVAL_SECONDS = 5/)
  assert.match(content, /每条间隔/)
  assert.match(content, /每轮回复/)
  assert.match(content, /插件不设置每日回复总量/)
  assert.doesNotMatch(content, /REPLY_DAILY_LIMIT|xrcReplyDailyQuota|xrc-reply-quota|额度已用完/)
  assert.doesNotMatch(backgroundSource, /REPLY_DAILY_LIMIT|xrcReplyDailyQuota|xrc-reply-quota/)
  assert.match(content, /data-xrc-settings/)
  assert.match(content, /回复方式与随机频率调度/)
  assert.match(content, /data-xrc-collapse/)
  assert.match(content, /data-xrc-expand/)
  assert.match(content, /data-xrc-mini-progress/)
  assert.match(content, /配置 AI 后开始/)
  assert.match(content, /panelView/)
  assert.match(content, /本轮已完成/)
  assert.match(content, /data-xrc-mode="template"/)
  assert.match(content, /data-xrc-mode="ai"/)
  assert.match(content, /replyMode: "ai"/)
  assert.match(content, /value === "template" \? "template" : "ai"/)
  assert.match(content, /data-xrc-ai-key/)
  assert.doesNotMatch(content, /type="password"/)
  assert.match(content, /data-xrc-secret-input/)
  assert.match(content, /data-1p-ignore="true"/)
  assert.match(content, /不要填写 X 登录密码/)
  assert.match(content, /xrc-ai-generate/)
  assert.doesNotMatch(content, /connectionVerified|测试连接|xrc-ai-test|data-xrc-ai-test/)
  assert.match(content, /state\.replyMode === "ai" && !state\.aiKeySaved/)
  assert.doesNotMatch(content, /AI 模式需要先通过连接测试/)
  assert.match(content, /不会发送 X 登录 Cookie/)
  assert.match(content, /tweetText/)
  assert.match(content, /pendingReply/)
  assert.match(content, /function waitRateLimit/)
  assert.match(content, /nextReplyDelaySeconds/)
  assert.match(content, /roundIntervalSeconds/)
  assert.match(content, /第 \$\{shownRound\} 轮/)
  assert.doesNotMatch(content, /本次执行/)
  assert.match(content, /function formatRuntime/)
  assert.match(content, /startedAt/)
  assert.match(content, /function centerPhraseItem/)
  assert.match(content, /activePhrase\.style\.order = "-1"/)
  assert.match(content, /list\.scrollTo\(\{ top: 0, behavior \}\)/)
  assert.doesNotMatch(content, /等待发送确认/)
  assert.match(content, /PHRASE_STORE = 7/)
  assert.match(content, /data-xrc-pace/)
  assert.match(content, /慢、中、快、超快/)
  assert.match(catalog, /x-reply-clipboard-extension-v3\.6\.6\.zip/)
  assert.match(resourcePage, /const VERSION = '3\.6\.6'/)
  assert.match(resourcePage, /X高频互动助手/)
  assert.match(resourcePage, /互关浇友/)
  assert.match(resourcePage, /通知回复/)
  assert.match(resourcePage, /const VERSION_HISTORY = \[/)
  assert.match(resourcePage, /version: '3\.5\.0'/)
  assert.match(resourcePage, /version: '3\.6\.0'/)
  assert.match(resourcePage, /version: '3\.6\.1'/)
  assert.match(resourcePage, /version: '3\.6\.2'/)
  assert.match(resourcePage, /version: '3\.6\.3'/)
  assert.match(resourcePage, /version: '3\.6\.4'/)
  assert.match(resourcePage, /version: '3\.6\.5'/)
  assert.match(resourcePage, /version: '3\.6\.6'/)
  assert.match(content, /xrc-assistant-tabs/)
  assert.doesNotMatch(content, /xrc-tab-index/)
  assert.match(resourcePage, /右侧搜索框下方/)
  assert.match(content, /data-xrc-docs-open/)
  assert.match(content, /官方公开规则/)
  assert.match(content, /技术上限不等于安全阈值或使用许可/)
  assert.match(content, /X 没有公开反自动化评分算法/)
  assert.match(content, /AUTOMATION_WARNING_RE/)
  assert.match(content, /DUPLICATE_REPLY_RE/)
  assert.match(content, /result === "duplicate-reply"/)
  assert.match(content, /forceDraft: true/)
  assert.match(content, /xrc-risk-stop-all/)
  assert.match(resourcePage, /version: '3\.1\.2'/)
  assert.match(resourcePage, /version: '3\.1\.1'/)
  assert.match(resourcePage, /version: '3\.1\.0'/)
  assert.match(resourcePage, /version: '3\.0\.0'/)
  assert.match(resourcePage, /version: '2\.0\.0'/)
  assert.match(resourcePage, /version: '0\.2\.1'/)
  assert.match(resourcePage, /当前版本 v\{VERSION\}/)
  assert.match(resourcePage, /<ExtensionDownloadButton href=\{DOWNLOAD_URL\} version=\{VERSION\}/)
  assert.match(downloadButton, /下载 Chrome 插件 v\$\{version\}/)
  assert.match(downloadButton, /INSUFFICIENT_BALANCE/)
  assert.match(downloadButton, /response\.blob\(\)/)
  assert.match(resourcePage, /\/resources\/x-clipboard-phrase/)
  assert.match(registry, /slug: 'x-reply-clipboard-extension', title: 'X高频互动助手'/)
  assert.match(registry, /'通知回复'/)
  assert.match(toolItems, /id: 'x-reply-clipboard',[\s\S]*title: 'X高频互动助手'/)
  assert.doesNotMatch(toolItems, /id: 'x-mutual-cleaner'/)
  assert.match(toolItems, /role: 'Chrome 扩展 · 回复、互关与 AI 定时发推'/)

  const desktopPage = await readFile(
    new URL('../../app/(site)/resources/x-clipboard-phrase/page.jsx', import.meta.url),
    'utf8',
  )
  assert.match(catalog, /x-clipboard-phrase-macos-v1\.0\.0\.zip/)
  assert.match(desktopPage, /const VERSION = '1\.0\.0'/)
  assert.match(desktopPage, /下载 macOS 应用 v\{VERSION\}/)
  assert.match(desktopPage, /\/resources\/x-reply-clipboard-extension/)
})

test('DeepSeek background worker keeps AI replies short and non-thinking', async () => {
  const backgroundText = await readFile(new URL('background.js', extensionDir), 'utf8')
  const background = require('../../tools/x-reply-clipboard-extension/background.js')

  assert.equal(background.DEEPSEEK_MODEL, 'deepseek-flash')
  assert.equal(background.REQUEST_TIMEOUT_MS, 10000)
  assert.equal(background.validTaskMode('poster'), 'poster')
  assert.equal(background.validTaskMode('unknown'), 'timeline')
  assert.equal(background.taskTabUrl('notifications', 'https://x.com/home'), 'https://x.com/notifications?xrcAssistant=notifications')
  assert.equal(background.taskTabUrl('poster', 'https://twitter.com/home'), 'https://twitter.com/home?xrcAssistant=poster')
  assert.match(background.REPLY_SYSTEM_PROMPT, /15 到 50 个中文字符/)
  assert.equal(background.cleanReply('回复：“这个角度很有意思\n值得继续观察👀”'), '这个角度很有意思 值得继续观察👀')
  assert.equal(background.cleanPost('推文：第一行\n第二行\n\n第三行'), '第一行\n\n第二行\n\n第三行')
  assert.match(backgroundText, /https:\/\/api\.deepseek\.com\/chat\/completions/)
  assert.match(backgroundText, /thinking: \{ type: "disabled" \}/)
  assert.match(backgroundText, /max_tokens: 96/)
  assert.match(backgroundText, /已被 X 判定为重复/)
  assert.match(backgroundText, /xrc-ai-post-generate/)
  assert.match(backgroundText, /max_tokens: 320/)
  assert.doesNotMatch(backgroundText, /xrc-ai-test|连通测试|test = false/)
  assert.match(backgroundText, /chrome\.storage\.local/)
})

test('task tabs are created once and reused without stopping the source task', async () => {
  const background = require('../../tools/x-reply-clipboard-extension/background.js')
  let savedTabs = {}
  let created = 0
  const focused = []
  global.chrome = {
    storage: {
      session: {
        async get(key) { return { [key]: savedTabs } },
        async set(value) { savedTabs = value.xrcTaskTabs },
      },
    },
    tabs: {
      async create({ url }) { created += 1; return { id: 77, windowId: 9, url } },
      async get(tabId) { return { id: tabId, windowId: 9, url: 'https://x.com/notifications' } },
      async update(tabId) { focused.push(tabId) },
    },
    windows: { async update() {} },
  }
  try {
    const first = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    const second = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    assert.equal(first.reused, false)
    assert.equal(second.reused, true)
    assert.equal(created, 1)
    assert.deepEqual(focused, [77])
    assert.equal(savedTabs.notifications, 77)
  } finally {
    delete global.chrome
  }
})

test('writes the phrase into Draft state and keeps Reply disabled until that write', () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  assert.equal(draft.visibleDraftText({ textContent: '  学习了\u200b  ' }), '学习了')
  assert.equal(draft.visibleDraftText({ textContent: 'Post your reply' }), '')
  assert.equal(draft.comparableDraftText({ innerText: '第一行\n\n\n第二行' }, 'post'), '第一行\n\n第二行')
  assert.equal(draft.isRecoverableDuplicateOrPlaceholderMix('稳稳', '稳'), true)
  assert.equal(draft.isRecoverableDuplicateOrPlaceholderMix('稳st your reply', '稳'), true)

  function Style() {}
  Style.prototype.clear = function clear() { return new Style() }

  function Character(style, entity) {
    this.style = style || new Style()
    this.entity = entity === undefined ? null : entity
  }
  Character.prototype.getStyle = function getStyle() { return this.style }
  Character.prototype.set = function set(key, value) {
    const next = new Character(this.style, this.entity)
    if (key === 'style') next.style = value
    if (key === 'entity') next.entity = value
    return next
  }

  function CharacterList(items) {
    if (!(this instanceof CharacterList)) return new CharacterList(items)
    this.items = items || []
    this.size = this.items.length
  }
  CharacterList.prototype.get = function get(index) { return this.items[index] }
  CharacterList.prototype.first = function first() { return this.items[0] }
  CharacterList.prototype.push = function push(item) { return new CharacterList([...this.items, item]) }

  function Block(props) {
    Object.assign(this, props)
  }
  Block.prototype.getText = function getText() { return this.text || '' }
  Block.prototype.getCharacterList = function getCharacterList() { return this.characterList }
  Block.prototype.merge = function merge(props) { return Object.assign(new Block(this), props) }

  function BlockMap(entries) {
    if (!(this instanceof BlockMap)) return new BlockMap(entries)
    this.entries = entries || []
  }
  BlockMap.prototype.set = function set(key, value) {
    return new BlockMap([...this.entries.filter((entry) => entry[0] !== key), [key, value]])
  }
  BlockMap.prototype.forEach = function forEach(fn) {
    this.entries.forEach((entry) => fn(entry[1], entry[0]))
  }

  function Content(blockMap) {
    this.blockMap = blockMap
  }
  Content.prototype.getBlockMap = function getBlockMap() { return this.blockMap }
  Content.prototype.set = function set(key, value) {
    const next = new Content(key === 'blockMap' ? value : this.blockMap)
    next[key] = value
    return next
  }

  function SelectionState() {}
  SelectionState.createEmpty = function createEmpty() { return new SelectionState() }

  function EditorState(content) {
    this.content = content
  }
  EditorState.prototype.getCurrentContent = function getCurrentContent() { return this.content }
  EditorState.prototype.getSelection = function getSelection() { return { constructor: SelectionState } }
  EditorState.push = function push(_editorState, content) { return new EditorState(content) }
  EditorState.moveSelectionToEnd = function moveSelectionToEnd(state) { return state }

  const phrase = '学习了'
  let editorState = new EditorState(new Content(new BlockMap([
    ['empty', new Block({ text: '', characterList: new CharacterList([new Character()]) })],
  ])))
  let replyEnabled = false
  const node = {
    props: {
      get editorState() { return editorState },
      onChange(next) {
        editorState = next
        replyEnabled = draft.readDraftText(node) === phrase
      },
    },
  }

  assert.equal(replyEnabled, false)
  draft.writeReplyDraft(node, phrase)
  assert.equal(draft.readDraftText(node), phrase)
  assert.equal(replyEnabled, true)

  const multiline = '第一行\n\n第二行'
  draft.writeReplyDraft(node, multiline)
  assert.equal(draft.readDraftText(node), multiline)
  assert.deepEqual(editorState.content.blockMap.entries.map((entry) => entry[1].text), ['第一行', '', '第二行'])

  const seen = []
  let index = 0
  for (let step = 0; step < 8; step += 1) {
    seen.push(require('../../tools/x-reply-clipboard-extension/phrases.js')[index])
    index = loop.nextPhraseIndex(55, index, () => 0)
  }
  assert.equal(seen[0], require('../../tools/x-reply-clipboard-extension/phrases.js')[0])
  assert.notEqual(seen[1], seen[0])
  for (let step = 1; step < seen.length; step += 1) assert.notEqual(seen[step], seen[step - 1])
})

function matchSelector(node, selector) {
  return selector.split(',').some((part) => {
    const text = part.trim()
    if (!text) return false
    if (text.startsWith('#')) return node.id === text.slice(1)
    const tagMatch = text.match(/^([a-zA-Z][\w-]*)/)
    let rest = text
    if (tagMatch && !text.startsWith('[')) {
      if (node.tag !== tagMatch[1]) return false
      rest = text.slice(tagMatch[1].length)
    }
    const attrs = [...rest.matchAll(/\[([^\]=]+)(?:=(['"])(.*?)\2)?\]/g)]
    if (rest.trim() && attrs.length === 0) return false
    return attrs.every((match) => (match[3] == null ? node.getAttribute(match[1]) != null : node.getAttribute(match[1]) === match[3]))
  })
}

function mountTree(spec, parent = null) {
  const node = {
    tag: spec.tag,
    attrs: spec.attrs || {},
    parentElement: parent,
    nodeType: 1,
    id: spec.attrs?.id || '',
    children: [],
  }
  node.getAttribute = (name) => node.attrs[name] ?? null
  node.matches = (selector) => matchSelector(node, selector)
  node.querySelector = (selector) => {
    for (const child of node.children) {
      if (child.matches(selector)) return child
      const found = child.querySelector(selector)
      if (found) return found
    }
    return null
  }
  node.querySelectorAll = (selector) => node.children.flatMap((child) => [
    ...(child.matches(selector) ? [child] : []),
    ...child.querySelectorAll(selector),
  ])
  node.closest = (selector) => {
    let current = node
    while (current) {
      if (current.matches?.(selector)) return current
      current = current.parentElement
    }
    return null
  }
  node.children = (spec.children || []).map((child) => mountTree(child, node))
  return node
}

function loadSidebarMountPoint(source) {
  const start = source.indexOf('const SIDEBAR_MODULE_SELECTOR')
  const end = source.indexOf('function dockPanel(')
  return new Function(`${source.slice(start, end)}\nreturn sidebarMountPoint;`)()
}

test('panel mounts under the search box inside the right sidebar', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const sidebarMountPoint = loadSidebarMountPoint(source)
  assert.match(source, /function sidebarMountPoint/)
  assert.match(source, /function dockPanel/)
  assert.match(source, /SearchBox_Search_Input/)
  assert.match(source, /xrcDock/)
  assert.match(css, /#x-reply-clipboard-panel\[data-xrc-dock="pending"\]/)
  assert.doesNotMatch(css, /position:\s*fixed/)
  assert.match(css, /position:\s*relative/)

  const sidebar = mountTree({
    tag: 'div',
    attrs: { 'data-testid': 'sidebarColumn' },
    children: [{
      tag: 'div',
      attrs: { id: 'column' },
      children: [
        {
          tag: 'div',
          attrs: { id: 'search-block' },
          children: [{
            tag: 'form',
            attrs: { role: 'search', 'aria-label': 'Search' },
            children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
          }],
        },
        { tag: 'div', attrs: { id: 'hidden' } },
        {
          tag: 'div',
          attrs: { id: 'modules' },
          children: [
            { tag: 'aside', attrs: { role: 'complementary', 'aria-label': 'Upgrade to Premium+' } },
            { tag: 'div', attrs: { 'data-testid': 'trend' } },
            { tag: 'nav', attrs: { role: 'navigation', 'aria-label': 'Footer' } },
          ],
        },
      ],
    }],
  })
  const mounted = sidebarMountPoint(sidebar)
  assert.equal(mounted.type, 'prepend')
  assert.equal(mounted.parent.id, 'modules')

  const flat = mountTree({
    tag: 'div',
    attrs: { 'data-testid': 'sidebarColumn' },
    children: [
      {
        tag: 'div',
        attrs: { id: 'search-block' },
        children: [{
          tag: 'form',
          attrs: { role: 'search' },
          children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
        }],
      },
      { tag: 'aside', attrs: { role: 'complementary', 'aria-label': 'Who to follow' } },
    ],
  })
  const flatMount = sidebarMountPoint(flat)
  assert.equal(flatMount.type, 'after')
  assert.equal(flatMount.anchor.id, 'search-block')

  const page = mountTree({
    tag: 'div',
    children: [
      { tag: 'nav', attrs: { role: 'navigation', 'aria-label': 'Primary' } },
      {
        tag: 'div',
        attrs: { 'data-testid': 'primaryColumn' },
        children: [{
          tag: 'form',
          attrs: { role: 'search' },
          children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
        }],
      },
      sidebar,
    ],
  })
  assert.equal(sidebarMountPoint(page).parent.id, 'modules')
  assert.equal(sidebarMountPoint(mountTree({
    tag: 'div',
    children: [{
      tag: 'form',
      attrs: { role: 'search' },
      children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
    }],
  })), null)
})

test('main-world writer replaces the whole editor and supersedes an earlier listener', async () => {
  const source = await readFile(new URL('draftFill.js', extensionDir), 'utf8')
  assert.match(source, /x-reply-clipboard-draft-v2/)
  assert.match(source, /HANDLER_KEY/)
  assert.match(source, /removeEventListener\("message", previousHandler\)/)
  assert.match(source, /range\.selectNodeContents\(editor\)/)
  assert.match(source, /command-replace/)
  assert.doesNotMatch(source, /execCommand\("selectAll"/)
})
