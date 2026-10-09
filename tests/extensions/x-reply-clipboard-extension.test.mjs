import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const loop = require('../../tools/x-reply-clipboard-extension/loop.js')
const mutual = require('../../tools/x-reply-clipboard-extension/mutual.js')
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

test('content script keeps the 35-reply refresh loop wired to the reply popup', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const mutualSource = await readFile(new URL('mutual.js', extensionDir), 'utf8')
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

  assert.equal(manifest.manifest_version, 3)
  assert.equal(manifest.name, 'X Interaction Assistant')
  assert.equal(manifest.version, '3.1.6')
  assert.ok(manifest.host_permissions.includes('https://x.com/*'))
  assert.ok(manifest.host_permissions.includes('https://twitter.com/*'))
  assert.ok(manifest.host_permissions.includes('https://api.deepseek.com/*'))
  assert.equal(manifest.content_scripts[0].world, 'MAIN')
  assert.deepEqual(manifest.content_scripts[0].js, ['draftFill.js'])
  assert.deepEqual(manifest.content_scripts[1].js, ['phrases.js', 'loop.js', 'timer.js', 'mutual.js', 'content.js'])
  assert.deepEqual(manifest.permissions, ['storage', 'offscreen'])
  assert.equal(manifest.background.service_worker, 'background.js')
  assert.match(timerSource, /xrc-timer-schedule/)
  assert.match(timerSource, /xrc-timer-fired/)
  assert.match(offscreenSource, /new Worker\(chrome\.runtime\.getURL\("timer-worker\.js"\)\)/)
  assert.match(timerWorkerSource, /setTimeout/)
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
  assert.match(content, /SUBMIT_TIMEOUT_MS = 15000/)
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
  assert.match(content, /X 互动帮手/)
  assert.match(content, /data-xrc-assistant="mutual"/)
  assert.match(content, /data-xrc-assistant="timeline"/)
  assert.match(content, /data-xrc-assistant="notifications"/)
  assert.match(content, /功能导航/)
  assert.doesNotMatch(content, /当前助手/)
  assert.match(content, /通知回复/)
  assert.match(content, /互关浇友/)
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
  assert.match(content, /nextMode === "timeline" && window\.location\.pathname !== "\/home"/)
  assert.match(content, /nextMode === "notifications" && !isNotificationPath\(\)/)
  assert.match(content, /mutualApi\.run/)
  assert.match(content, /result !== "sent-composer-open"/)
  assert.match(content, /data-xrc-round-track/)
  assert.match(content, /data-xrc-round-segment/)
  assert.match(content, /data-xrc-page-meta/)
  assert.match(content, /class="xrc-phrase-pool" open/)
  assert.match(content, /data-xrc-phrase-index/)
  assert.match(content, /aria-selected/)
  assert.match(content, /data-xrc-runtime/)
  assert.match(content, /DEFAULT_REPLY_INTERVAL_SECONDS = 2/)
  assert.match(content, /DEFAULT_ROUND_INTERVAL_SECONDS = 5/)
  assert.match(content, /data-xrc-reply-interval/)
  assert.match(content, /data-xrc-round-interval/)
  assert.match(content, /data-xrc-settings/)
  assert.match(content, /回复方式与频率限制/)
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
  assert.match(content, /xrc-ai-generate/)
  assert.doesNotMatch(content, /connectionVerified|测试连接|xrc-ai-test|data-xrc-ai-test/)
  assert.match(content, /state\.replyMode === "ai" && !state\.aiKeySaved/)
  assert.doesNotMatch(content, /AI 模式需要先通过连接测试/)
  assert.match(content, /不会发送 X 登录 Cookie/)
  assert.match(content, /tweetText/)
  assert.match(content, /pendingReply/)
  assert.match(content, /function waitRateLimit/)
  assert.match(content, /replyIntervalSeconds/)
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
  assert.match(catalog, /x-reply-clipboard-extension-v3\.1\.6\.zip/)
  assert.match(resourcePage, /const VERSION = '3\.1\.6'/)
  assert.match(resourcePage, /X 互动帮手/)
  assert.match(resourcePage, /互关浇友/)
  assert.match(resourcePage, /通知回复/)
  assert.match(resourcePage, /const VERSION_HISTORY = \[/)
  assert.match(resourcePage, /version: '3\.1\.2'/)
  assert.match(resourcePage, /version: '3\.1\.1'/)
  assert.match(resourcePage, /version: '3\.1\.0'/)
  assert.match(resourcePage, /version: '3\.0\.0'/)
  assert.match(resourcePage, /version: '2\.0\.0'/)
  assert.match(resourcePage, /version: '0\.2\.1'/)
  assert.match(resourcePage, /当前版本 v\{VERSION\}/)
  assert.match(resourcePage, /下载 Chrome 插件 v\{VERSION\}/)
  assert.match(resourcePage, /\/resources\/x-clipboard-phrase/)
  assert.match(registry, /slug: 'x-reply-clipboard-extension', title: 'X 互动帮手'/)
  assert.match(registry, /'通知回复'/)
  assert.match(toolItems, /id: 'x-reply-clipboard',[\s\S]*title: 'X 互动帮手'/)
  assert.match(toolItems, /role: 'Chrome 扩展 · 时间线、通知回复与互关浇友'/)

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
  assert.match(background.REPLY_SYSTEM_PROMPT, /15 到 50 个中文字符/)
  assert.equal(background.cleanReply('回复：“这个角度很有意思\n值得继续观察👀”'), '这个角度很有意思 值得继续观察👀')
  assert.match(backgroundText, /https:\/\/api\.deepseek\.com\/chat\/completions/)
  assert.match(backgroundText, /thinking: \{ type: "disabled" \}/)
  assert.match(backgroundText, /max_tokens: 96/)
  assert.doesNotMatch(backgroundText, /xrc-ai-test|连通测试|test = false/)
  assert.match(backgroundText, /chrome\.storage\.local/)
})

test('writes the phrase into Draft state and keeps Reply disabled until that write', () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  assert.equal(draft.visibleDraftText({ textContent: '  学习了\u200b  ' }), '学习了')
  assert.equal(draft.visibleDraftText({ textContent: 'Post your reply' }), '')
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

test('main-world writer replaces the whole editor and supersedes an earlier listener', async () => {
  const source = await readFile(new URL('draftFill.js', extensionDir), 'utf8')
  assert.match(source, /x-reply-clipboard-draft-v2/)
  assert.match(source, /HANDLER_KEY/)
  assert.match(source, /removeEventListener\("message", previousHandler\)/)
  assert.match(source, /range\.selectNodeContents\(editor\)/)
  assert.doesNotMatch(source, /execCommand\("selectAll"/)
})
