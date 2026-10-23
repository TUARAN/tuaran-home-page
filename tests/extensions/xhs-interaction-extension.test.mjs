import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const note = require('../../tools/xhs-interaction-extension/note.js')
const poster = require('../../tools/xhs-interaction-extension/poster.js')
const background = require('../../tools/xhs-interaction-extension/background.js')
const manager = require('../../tools/xhs-interaction-extension/manager-core.js')
const extensionDir = new URL('../../tools/xhs-interaction-extension/', import.meta.url)

function element({ id, index = 0, title = '', author = '', href = '', authorHref = '', top = 0 }) {
  const attrs = { 'data-note-id': id, 'data-index': String(index) }
  return {
    getAttribute(name) { return attrs[name] || '' },
    querySelector(selector) {
      if (selector.includes('title')) return { textContent: title }
      if (selector.includes('.name') || selector.includes('.author .name')) return { textContent: author }
      if (selector.includes('a.cover')) return { getAttribute: () => href }
      if (selector.includes('a.author')) return { getAttribute: () => authorHref }
      return null
    },
    getBoundingClientRect() { return { top } },
  }
}

test('note manager prioritizes comments and applies exact visibility thresholds', () => {
  function card(likes, comments = '0') {
    const buttons = Array.from({ length: 5 }, (_, index) => ({
      classList: { contains: (name) => name === 'note-card__action-btn--del' && index === 4 },
    }))
    return {
      matches: (selector) => selector === '.note-card',
      getAttribute: () => JSON.stringify({ noteTarget: { value: { noteId: '6ad6a8880000000028023796' } } }),
      querySelector: (selector) => ({ textContent: selector === '.note-card__time' ? '2026-10-20 07:32' : '我的笔记' }),
      querySelectorAll: (selector) => selector.includes('row--stats')
        ? ['437625', comments, likes, '1592', '1895'].map((textContent) => ({ textContent }))
        : buttons,
    }
  }
  assert.equal(manager.readCard(card('99')).target, '仅自己可见')
  assert.equal(manager.readCard(card('99', '10')).target, '仅自己可见')
  assert.equal(manager.readCard(card('99', '11')).target, '公开可见')
  assert.equal(manager.readCard(card('100', '11')).target, '公开可见')
  assert.equal(manager.readCard(card('无法读取', '11')).target, '公开可见')
  assert.equal(manager.readCard(card('99', '无法读取')).target, null)
  assert.equal(manager.readCard(card('99', '10+')).target, null)
  assert.equal(manager.readCard(card('99+', '0')).target, null)
  assert.equal(manager.readCard(card('100', '10')).target, null)
  assert.equal(manager.readCard(card('99')).eligible, true)
  assert.equal(manager.readCard(card('99')).publishedAt, new Date(2026, 9, 20, 7, 32).getTime())
  assert.equal(manager.readCard(card('100')).eligible, false)
  assert.equal(manager.readCard(card('4077')).eligible, false)
  assert.equal(manager.readCard(card('无法读取')).eligible, false)
  const safeCard = card('1')
  const safeItem = manager.readCard(safeCard)
  assert.equal(manager.permissionButton(safeCard), safeCard.querySelectorAll('actions')[0])
  assert.equal(manager.inspectCandidate(safeItem, safeCard).button, manager.permissionButton(safeCard))
  assert.equal(manager.inspectCandidate(safeItem, null).skipReason, '笔记已从列表消失')
  assert.equal(manager.inspectCandidate({ ...safeItem, likes: 2 }, safeCard).skipReason, '点赞数、评论数或发布时间已变化')
  assert.equal(manager.inspectCandidate({ ...safeItem, comments: 1 }, safeCard).skipReason, '点赞数、评论数或发布时间已变化')
  assert.equal(manager.inspectCandidate({ ...safeItem, publishedAt: 0 }, safeCard).skipReason, '点赞数、评论数或发布时间已变化')
  const noPermissionButton = {
    ...safeCard,
    querySelectorAll(selector) {
      return selector.includes('row--stats') ? safeCard.querySelectorAll(selector) : []
    },
  }
  assert.equal(manager.inspectCandidate(safeItem, noPermissionButton).skipReason, '权限按钮结构变化')
  const privateCard = {
    ...safeCard,
    querySelector(selector) {
      if (selector === '.note-card__cover') return { querySelectorAll: () => [{ children: [], textContent: '仅自己可见' }] }
      return safeCard.querySelector(selector)
    },
  }
  assert.equal(manager.readCard(privateCard).isPrivate, true)
  assert.equal(manager.inspectCandidate(safeItem, privateCard).already, true)
  const highCommentPrivate = card('1', '11')
  const highCommentPrivateCard = { ...highCommentPrivate, querySelector: privateCard.querySelector }
  assert.equal(manager.readCard(highCommentPrivateCard).target, '公开可见')
  assert.equal(manager.inspectCandidate(manager.readCard(highCommentPrivateCard), highCommentPrivateCard).button, manager.permissionButton(highCommentPrivateCard))
  assert.equal(manager.parseCount('1.2万'), 12000)
  assert.equal(manager.totalNotes([{ textContent: '正在加载中...' }, { textContent: '- 共10篇笔记 -' }]), 10)
  assert.equal(manager.listComplete(10, 10), true)
  assert.equal(manager.listComplete(10, 100), false)
  assert.equal(manager.listComplete(10, 0), false)
  assert.equal(manager.loadingSettled({ loaded: 20, total: 20, unchanged: 0, atBottom: true, loading: false }), false)
  assert.equal(manager.loadingSettled({ loaded: 20, total: 20, unchanged: 15, atBottom: false, loading: false }), false)
  assert.equal(manager.loadingSettled({ loaded: 20, total: 20, unchanged: 15, atBottom: true, loading: true }), false)
  assert.equal(manager.loadingSettled({ loaded: 20, total: 20, unchanged: 15, atBottom: true, loading: false }), true)
  assert.equal(manager.loadingSettled({ loaded: 20, total: 40, unchanged: 15, atBottom: true, loading: false }), false)
})

test('note manager scope uses publication time and stops only on verified newest-first order', () => {
  const now = new Date(2026, 9, 20, 12, 0)
  const month = manager.cutoffForRange('month', now)
  assert.equal(month, new Date(2026, 8, 20, 12, 0).getTime())
  assert.equal(manager.cutoffForRange('week', now), new Date(2026, 9, 13, 12, 0).getTime())
  assert.equal(manager.cutoffForRange('three-months', now), new Date(2026, 6, 20, 12, 0).getTime())
  assert.equal(manager.cutoffForRange('all', now), null)
  assert.equal(manager.cutoffForRange('month', new Date(2026, 2, 31, 12)), new Date(2026, 1, 28, 12).getTime())
  assert.equal(manager.parsePublishedAt('2026-10-20 07:32'), new Date(2026, 9, 20, 7, 32).getTime())
  assert.equal(manager.parsePublishedAt('2026-02-30 07:32'), null)
  assert.equal(manager.parsePublishedAt('无法读取'), null)
  assert.equal(manager.withinRange({ publishedAt: month }, month), true)
  assert.equal(manager.withinRange({ publishedAt: month - 1 }, month), false)
  assert.equal(manager.withinRange({ publishedAt: null }, month), false)
  assert.equal(manager.withinRange({ publishedAt: null }, null), true)
  const sorted = [{ publishedAt: month + 2 }, { publishedAt: month }, { publishedAt: month - 1 }]
  assert.equal(manager.pastRangeBoundary(sorted, 3, month), true)
  assert.equal(manager.pastRangeBoundary([{ publishedAt: month - 1 }], 1, month), false)
  assert.equal(manager.pastRangeBoundary(sorted.slice(1), 2, month), false)
  assert.equal(manager.pastRangeBoundary(sorted, 4, month), false)
  assert.equal(manager.pastRangeBoundary([sorted[0], { publishedAt: null }, sorted[2]], 3, month), false)
  assert.equal(manager.pastRangeBoundary([sorted[0], { ...sorted[1], isPinned: true }, sorted[2]], 3, month), false)
  assert.equal(manager.pastRangeBoundary([sorted[2], sorted[0]], 2, month), false)
  assert.equal(manager.pastRangeBoundary(sorted, 3, null), false)
})

test('permission dropdown uses browser input once and checks the visible option', async () => {
  let open = false
  const clicks = []
  const option = { label: '仅自己可见' }
  const arrow = {}
  const wrapper = { querySelector: () => arrow }
  const modal = { querySelector: () => wrapper }
  assert.equal(await manager.openPermissionChoice(modal, {
    optionsOpen: () => open,
    choiceFor: (label) => label === '仅自己可见' && open ? option : null,
    waitFor: async (predicate) => predicate(),
    trustedClick(target) { clicks.push(target); open = true },
  }), option)
  assert.deepEqual(clicks, [arrow])
  const publicOption = { label: '公开可见' }
  assert.equal(await manager.openPermissionChoice(modal, {
    optionsOpen: () => open,
    choiceFor: (label) => label === '公开可见' ? publicOption : null,
    waitFor: async (predicate) => predicate(),
    trustedClick(target) { clicks.push(target) },
  }, '公开可见'), publicOption)
  assert.deepEqual(clicks, [arrow])
  assert.equal(await manager.openPermissionChoice(modal, {
    optionsOpen: () => open,
    choiceFor: () => option,
    waitFor: async (predicate) => predicate(),
    trustedClick(target) { clicks.push(target) },
  }), option)
  assert.deepEqual(clicks, [arrow])
})

test('permission hit test accepts the same control parent and rejects an overlay', () => {
  const wrapper = { contains: (node) => node === main || node === arrow }
  const main = {}
  const arrow = { closest: () => wrapper }
  const overlay = {}
  assert.equal(manager.clickRegionMatches(arrow, main), true)
  assert.equal(manager.clickRegionMatches(arrow, wrapper), true)
  assert.equal(manager.clickRegionMatches(arrow, overlay), false)
  assert.equal(manager.clickRegionMatches(arrow, null), false)
  assert.equal(manager.permissionHitState(arrow, main), 'ready')
  assert.equal(manager.permissionHitState(arrow, { closest: (selector) => selector === '.perm-loading-mask' ? {} : null }), 'loading')
  assert.equal(manager.permissionHitState(arrow, overlay), 'blocked')
})

test('browser permission clicks are restricted to the manager page and detach after input', async () => {
  const previous = globalThis.chrome
  const calls = []
  globalThis.chrome = {
    runtime: { id: 'xhs-extension' },
    debugger: {
      async attach(target, version) { calls.push(['attach', target.tabId, version]) },
      async sendCommand(target, method, params) { calls.push([method, params.type, params.x, params.y]) },
      async detach(target) { calls.push(['detach', target.tabId]) },
    },
  }
  try {
    const sender = { id: 'xhs-extension', url: 'https://creator.xiaohongshu.com/new/note-manager', tab: { id: 3, width: 1200, height: 800 } }
    assert.equal(background.permissionClickAllowed({ type: 'xhsia-permission-click', x: 200, y: 300 }, sender), true)
    assert.equal(background.permissionClickAllowed({ type: 'xhsia-permission-click', x: 200, y: 300 }, { ...sender, url: 'https://creator.xiaohongshu.com/publish/publish' }), false)
    assert.equal(background.permissionClickAllowed({ type: 'xhsia-permission-click', x: 200, y: 300 }, { ...sender, id: 'other-extension' }), false)
    assert.equal(background.permissionClickAllowed({ type: 'xhsia-permission-click', x: 1400, y: 300 }, sender), false)
    assert.deepEqual(await background.dispatchPermissionClick({ type: 'xhsia-permission-click', x: 200, y: 300 }, sender), { ok: true })
    assert.deepEqual(calls.map((call) => call[0]), ['attach', 'Input.dispatchMouseEvent', 'Input.dispatchMouseEvent', 'Input.dispatchMouseEvent', 'detach'])
    assert.deepEqual(calls.slice(1, 4).map((call) => call[1]), ['mouseMoved', 'mousePressed', 'mouseReleased'])
  } finally { globalThis.chrome = previous }
})

test('explore feed and note paths stay distinct', () => {
  assert.equal(note.isExploreFeedPath('/explore'), true)
  assert.equal(note.isExploreFeedPath('/explore/'), true)
  assert.equal(note.isExploreFeedPath('/'), true)
  assert.equal(note.noteIdFromPath('/explore/6abe51c3000000001801b294'), '6abe51c3000000001801b294')
  assert.equal(note.isExploreFeedPath('/explore/6abe51c3000000001801b294'), false)
  assert.equal(
    note.noteIdFromHref('/explore/6abe51c3000000001801b294?xsec_token=abc&xsec_source=pc_feed'),
    '6abe51c3000000001801b294',
  )
})

test('next note follows feed order and skips processed cards', () => {
  const notes = [
    note.mapNoteElement(element({
      id: 'bbb',
      index: 1,
      title: '年底买车',
      href: '/explore/bbb',
      top: 10,
    })),
    note.mapNoteElement(element({
      id: 'aaa',
      index: 0,
      title: '假如 ai大模型有寿命，谁最短命？',
      author: '马gor带ai出海',
      href: '/explore/aaa?xsec_source=pc_feed',
      authorHref: '/user/profile/637859b4000000001f01f4ef?channel_type=explore_feed',
      top: 400,
    })),
  ]
  assert.equal(notes[1].authorId, '637859b4000000001f01f4ef')
  assert.equal(note.nextNote(notes, new Set()).id, 'aaa')
  assert.equal(note.nextNote(notes, new Set(['aaa'])).id, 'bbb')
  assert.equal(note.nextNote(notes, new Set(['aaa', 'bbb'])), null)
})

test('detail title can be longer than the card title', () => {
  assert.equal(note.titlesRelated('假如 ai大模型有寿命，谁最短命？', '假如 ai大模型有寿命'), true)
  assert.equal(note.titlesRelated('年底买车必看', '假如 ai大模型有寿命，谁最短命？'), false)
  assert.equal(note.titlesRelated('', '有标题'), false)
})

test('send button stays disabled while the composer is empty', () => {
  assert.equal(note.isSendEnabled({ disabled: true, classList: { contains: () => true } }), false)
  assert.equal(note.isSendEnabled({ disabled: false, classList: { contains: (name) => name === 'gray' } }), false)
  assert.equal(note.isSendEnabled({ disabled: false, classList: { contains: () => false } }), true)
  assert.equal(note.composerText({ textContent: '说点什么...' }), '')
  assert.equal(note.composerText({ textContent: 'opus 5.5 现在更像主力' }), 'opus 5.5 现在更像主力')
})

test('comment source keeps the note and asks for a different sentence', () => {
  const source = note.buildCommentSource({
    title: '假如 ai大模型有寿命，谁最短命？',
    body: 'gpt 发布以来，大模型已经一大堆了',
    comments: ['今年AI的智能增长速度明显比23～25年快'],
    avoid: '短命鬼',
  })
  assert.match(source, /笔记标题：假如 ai大模型有寿命/)
  assert.match(source, /已有评论/)
  assert.match(source, /不要重复这句：短命鬼/)
})

test('run plan follows the selected pace', () => {
  const plan = note.createRunPlan(() => 0, 'medium')
  assert.equal(plan.pace, 'medium')
  assert.equal(plan.rounds, 2)
  assert.equal(plan.roundTargets.length, 2)
  assert.ok(plan.roundTargets.every((value) => value === 12))
  assert.equal(note.randomReplyDelaySeconds(() => 0.99, 'turbo'), 6)
  const transition = note.batchTransition({ pageCount: 12, completedRounds: 1, batchSize: 12, roundsPerRun: 2 })
  assert.equal(transition.action, 'complete')
})

test('comment cleanup drops labels, quotes, and tags', () => {
  assert.equal(background.cleanComment('评论： “opus 5.5 更耐用” #gpt @someone'), 'opus 5.5 更耐用')
  assert.match(background.COMMENT_SYSTEM_PROMPT, /12 到 40 个中文字符/)
  assert.equal(background.DEEPSEEK_MODEL, 'deepseek-flash')
})

test('a newly appeared comment counts as sent', () => {
  assert.equal(note.commentAppeared(['旧评论'], ['旧评论', 'opus 5.5 现在更像主力'], 'opus 5.5 现在更像主力'), true)
  assert.equal(note.commentAppeared(['opus 5.5 现在更像主力'], ['opus 5.5 现在更像主力'], 'opus 5.5 现在更像主力'), false)
})

test('note draft keeps a Xiaohongshu title and two cards', () => {
  const draft = poster.parseNote(`\`\`\`json
{"sourceTitle":"DeepSeek Bot来了","title":"这是一个超过二十个汉字的标题应该被截断掉后面","body":"正文：第一句。\\n\\n第二句说的是模型更新。","cards":["钩子就写在第一张","要点一\\n要点二"],"topics":["#AI","人工智能","第三个"]}
\`\`\``)
  assert.equal(Array.from(draft.title).length, 20)
  assert.equal(draft.title.startsWith('这是一个超过二十'), true)
  assert.equal(draft.body.includes('正文：'), false)
  assert.deepEqual(draft.cards, ['钩子就写在第一张', '要点一\n要点二'])
  assert.deepEqual(draft.topics, ['AI', '人工智能'])
  const attached = poster.attachSource(draft, [
    { title: '别的资讯', key: 'qbitai:别的资讯' },
    { title: 'DeepSeek Bot来了', key: 'qbitai:DeepSeek Bot来了' },
  ])
  assert.equal(attached.sourceKey, 'qbitai:DeepSeek Bot来了')
})

test('editor content confirms a completed multiline insert even if the page reply is lost', () => {
  const body = '第一段。\n\n第二段。\n第三段。'
  assert.equal(poster.insertedTextMatches('第一段。 第二段。 第三段。', body, true), true)
  assert.equal(poster.insertedTextMatches('第一段。 第二段。', body, true), false)
  assert.equal(poster.insertedTextMatches(`${body} #未选中的话题`, body, true), false)
})

test('today AI news is preferred over yesterday', () => {
  const now = new Date('2026-10-12T01:50:00Z')
  const items = [
    { title: '昨天的模型', key: 'a', day: '2026-10-11', time: 1, source: '量子位', summary: '旧闻' },
    { title: '今天的模型', key: 'b', day: '2026-10-12', time: 2, source: 'Hacker News', summary: '新闻' },
  ]
  const today = poster.selectNews(items, { now, usedKeys: [] })
  assert.equal(today.usingToday, true)
  assert.equal(today.day, '2026-10-12')
  assert.deepEqual(today.items.map((item) => item.title), ['今天的模型'])
  assert.match(poster.buildNoteSource(today), /今天的 AI 资讯/)
  const older = poster.selectNews(items, { now, usedKeys: ['b'] })
  assert.equal(older.usingToday, false)
  assert.equal(older.items[0].title, '昨天的模型')
  assert.match(poster.buildNoteSource(older), /今天还没有更新的条目/)
})

test('publish page ignores the hidden tab clone', () => {
  assert.equal(poster.isPublishPath('/publish/publish'), true)
  assert.equal(poster.isPublishPath('/publish/publish/'), true)
  assert.equal(poster.isPublishPath('/explore'), false)
  assert.equal(poster.isOverlayNode({
    'aria-hidden': 'true',
    'button-hp-installed': '1',
    style: 'position: absolute; opacity: 1e-05; pointer-events: auto;',
  }), true)
  assert.equal(poster.isOverlayNode({ 'data-hp-bound': '1' }), false)
  assert.equal(poster.randomIntervalMs(() => 0, 'medium'), 25 * 60 * 1000)
  assert.equal(poster.failureLabel('title-busy'), '标题框已有内容，发文已停下')
  assert.equal(poster.failureLabel('shadow-unavailable'), '发布组件按钮不可访问')
})

test('rss and hacker news items keep a source key', () => {
  const rss = poster.parseRssItems(`<rss><channel><item><title><![CDATA[量子位标题]]></title><pubDate>Mon, 12 Oct 2026 01:00:00 GMT</pubDate><description><![CDATA[<p>摘要</p>]]></description></item></channel></rss>`, '量子位', 'qbitai')
  assert.equal(rss[0].title, '量子位标题')
  assert.equal(rss[0].key, 'qbitai:量子位标题')
  assert.equal(rss[0].day, '2026-10-12')
  const hacker = poster.parseHackerNews({ hits: [
    { title: 'AI lawyers', objectID: '1', created_at_i: 1791767047, url: 'https://example.com' },
    { title: 'A food blog', objectID: '2', created_at_i: 1791767047, url: 'https://example.com/food' },
  ] })
  assert.equal(hacker.length, 1)
  assert.equal(hacker[0].key, 'hn:1')
  assert.match(background.NOTE_SYSTEM_PROMPT, /今天的 AI 资讯/)
  assert.equal(background.NOTE_TIMEOUT_MS, 20000)
})

test('extension manifest only runs on Xiaohongshu and DeepSeek', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const creator = await readFile(new URL('creator.js', extensionDir), 'utf8')
  const managerSource = await readFile(new URL('manager.js', extensionDir), 'utf8')
  const docsSource = await readFile(new URL('docs.js', extensionDir), 'utf8')
  const creatorMain = await readFile(new URL('creator-main.js', extensionDir), 'utf8')
  assert.equal(manifest.name, '小红书高频互动助手')
  assert.equal(manifest.version, '0.7.0')
  assert.match(managerSource, /const VERSION = "0\.7\.0"/)
  assert.match(managerSource, /data-xhsp-range/)
  assert.match(managerSource, /core\.pastRangeBoundary\(result\.unique, result\.loadedCount, state\.cutoff\)/)
  assert.match(managerSource, /button\.textContent = active \? \(state\.stop \? "停止中…" : "执行中…"\) : "开始设置"/)
  assert.match(managerSource, /state\.running = true; state\.stop = false;\s*state\.range = [^\n]+;\s*state\.cutoff = core\.cutoffForRange\(state\.range\);\s*updateRunButton\(\)/)
  assert.match(managerSource, /finally \{ state\.running = false; updateRunButton\(\); \}/)
  assert.match(managerSource, /scrollListToBottom\(cards, markers\)/)
  assert.match(managerSource, /async function loadNextCards\(\)/)
  assert.doesNotMatch(managerSource, /loadAllCards\(/)
  assert.match(managerSource, /core\.loadingSettled\(/)
  assert.match(docsSource, /文档中心/)
  assert.match(docsSource, /Chrome debugger/)
  assert.match(docsSource, /data-xhsia-docs-close/)
  assert.match(docsSource, /data-xhsia-docs-topic="quality"/)
  assert.match(docsSource, /openSection\(panel, topic\)/)
  assert.match(managerSource, /data-action="guide">查看规则/)
  assert.match(managerSource, /openSection\(panel, "quality"\)/)
  assert.match(managerSource, /state\.autoScanStarted = true;\s*preview\(\)/)
  assert.ok(managerSource.indexOf('const result = scan();', managerSource.indexOf('async function run()'))
    < managerSource.indexOf('const loadResult = await loadNextCards();', managerSource.indexOf('async function run()')))
  assert.doesNotMatch(managerSource.match(/async function preview\(\) \{[\s\S]*?\n  async function run\(\)/)?.[0] || '', /loadNextCards\(/)
  assert.match(managerSource, /error instanceof NoteSkipError/)
  assert.match(managerSource, /state\.skipped\.set\(item\.id/)
  assert.match(managerSource, /item\.target === "仅自己可见" && item\.isPrivate/)
  assert.match(managerSource, /core\.openPermissionChoice\(modal, \{ optionsOpen, choiceFor, waitFor, trustedClick \}, item\.target\)/)
  assert.match(managerSource, /cancel\.click\(\);\s*if \(!await waitFor\(\(\) => !document\.querySelector\("\.permission-modal"\)/)
  assert.doesNotMatch(managerSource, /data-action="scan"/)
  assert.match(managerSource, /const PANEL_ID = "xhs-interaction-panel"/)
  assert.match(managerSource, /poster\.after\(section\)/)
  assert.doesNotMatch(managerSource, /document\.documentElement\.append\(panel\)/)
  for (const source of [content, creator]) {
    assert.match(source, /XhsInteractionDocs\?\.mount\(panel\)/)
    assert.match(source, /<nav class="xhsia-page-nav" aria-label="功能页面">/)
    assert.match(source, /data-xhsia-mode="comments" href="https:\/\/www\.xiaohongshu\.com\/explore">推荐评论<small>推荐页/)
    assert.match(source, /data-xhsia-mode="poster" href="\$\{posterApi\.PUBLISH_URL\}">笔记浇给<small>发文页/)
    assert.match(source, /data-xhsia-mode="private" href="https:\/\/creator\.xiaohongshu\.com\/new\/note-manager">高质帖管理<small>笔记管理页/)
    assert.doesNotMatch(source, /xhsia-page-hint/)
  }
  assert.doesNotMatch(managerSource, /xhsia-page-hint|xhsp-route-note|xhsia-mode-tabs/)
  assert.deepEqual(manifest.icons, {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  })
  assert.match(content, new RegExp(`const VERSION = "${manifest.version.replaceAll('.', '\\.')}"`))
  assert.match(creator, new RegExp(`const VERSION = "${manifest.version.replaceAll('.', '\\.')}"`))
  assert.match(content, /重启任务/)
  assert.match(content, /评论成功/)
  assert.match(content, /开始发笔记/)
  assert.deepEqual(manifest.content_scripts[0].js, ['receipt.js', 'note.js', 'poster.js', 'docs.js', 'content.js'])
  assert.deepEqual(manifest.content_scripts[1].js, ['creator-main.js'])
  assert.equal(manifest.content_scripts[1].world, 'MAIN')
  assert.deepEqual(manifest.content_scripts[2].js, ['receipt.js', 'poster.js', 'docs.js', 'creator.js', 'manager-core.js', 'manager.js'])
  assert.deepEqual(manifest.permissions, ['storage', 'alarms', 'debugger'])
  assert.deepEqual(manifest.host_permissions, [
    'https://www.xiaohongshu.com/*',
    'https://creator.xiaohongshu.com/*',
    'https://api.deepseek.com/*',
    'https://www.qbitai.com/*',
    'https://hn.algolia.com/*',
    'https://2aran.com/*',
  ])
  assert.match(content, /#detail-title/)
  assert.match(content, /p\.content-input\[contenteditable='true'\]/)
  assert.match(content, /button\.btn\.submit/)
  assert.match(content, /#exploreFeeds/)
  assert.match(content, /#homefeed_recommend/)
  assert.match(content, /xhsia-comment/)
  const posterSource = await readFile(new URL('poster.js', extensionDir), 'utf8')
  assert.match(posterSource, /creator\.xiaohongshu\.com\/publish\/publish/)
  assert.match(content, /PUBLISH_URL/)
  assert.match(creator, /上传图文/)
  assert.match(creator, /文字配图/)
  assert.match(creator, /再写一张/)
  assert.match(creator, /生成图片/)
  assert.match(creator, /下一步/)
  assert.match(creator, /\.tiptap\.ProseMirror/)
  assert.match(creator, /function findNoteEditor/)
  assert.match(creatorMain, /\.publish-page-publish-btn button\.ce-btn\.bg-red/)
  const backgroundText = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(backgroundText, /xhsia-note/)
  assert.match(backgroundText, /今天的 AI 资讯/)
  const importAt = backgroundText.indexOf('importScripts("poster.js")')
  assert.ok(importAt > 0 && importAt < backgroundText.indexOf('function loadPoster'))
  assert.equal(backgroundText.split('importScripts("poster.js")').length - 1, 1)
})

test('creator publish reaches the button inside the publish component shadow root', async () => {
  const source = await readFile(new URL('creator-main.js', extensionDir), 'utf8')
  let onMessage
  let buttonClicks = 0
  let componentCalls = 0
  const responses = []
  const button = {
    innerText: '发布', disabled: false,
    getBoundingClientRect: () => ({ width: 80, height: 30 }),
    getAttribute: (name) => name === 'aria-busy' ? 'false' : name === 'aria-disabled' ? 'false' : null,
    click: () => { buttonClicks += 1 },
  }
  const host = {
    getAttribute: (name) => name === 'is-publish' ? 'true' : name === 'submit-disabled' || name === 'submit-loading' ? 'false' : null,
    shadowRoot: { querySelector: (selector) => selector === '.publish-page-publish-btn button.ce-btn.bg-red' ? button : null },
  }
  const page = {
    addEventListener: (_name, listener) => { onMessage = listener },
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' }),
    postMessage: (message) => { responses.push(message.result) },
  }
  vm.runInNewContext(source, {
    window: page,
    document: { querySelectorAll: (selector) => selector === 'xhs-publish-btn' ? [host] : [] },
  })
  onMessage({ source: page, data: { channel: 'xhsia-creator', direction: 'request', requestId: '0', action: 'publish-ready' } })
  assert.equal(responses.at(-1).ok, true)
  onMessage({ source: page, data: { channel: 'xhsia-creator', direction: 'request', requestId: '1', action: 'publish' } })
  assert.equal(buttonClicks, 1)
  button.disabled = true
  onMessage({ source: page, data: { channel: 'xhsia-creator', direction: 'request', requestId: '2', action: 'publish' } })
  assert.equal(buttonClicks, 1)
  assert.equal(responses.at(-1).reason, 'submit-busy')
  delete host.shadowRoot
  host._onPublish = () => { componentCalls += 1 }
  onMessage({ source: page, data: { channel: 'xhsia-creator', direction: 'request', requestId: '3', action: 'publish' } })
  assert.equal(componentCalls, 1)
  assert.equal(responses.at(-1).via, 'component')
})
