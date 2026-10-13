import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const note = require('../../tools/xhs-interaction-extension/note.js')
const poster = require('../../tools/xhs-interaction-extension/poster.js')
const background = require('../../tools/xhs-interaction-extension/background.js')
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
  const creatorMain = await readFile(new URL('creator-main.js', extensionDir), 'utf8')
  assert.equal(manifest.name, '小红书高频互动助手')
  assert.equal(manifest.version, '0.2.6')
  assert.match(content, new RegExp(`const VERSION = "${manifest.version.replaceAll('.', '\\.')}"`))
  assert.match(creator, new RegExp(`const VERSION = "${manifest.version.replaceAll('.', '\\.')}"`))
  assert.match(content, /重启任务/)
  assert.match(content, /评论成功/)
  assert.match(content, /开始发笔记/)
  assert.deepEqual(manifest.content_scripts[0].js, ['receipt.js', 'note.js', 'poster.js', 'content.js'])
  assert.deepEqual(manifest.content_scripts[1].js, ['creator-main.js'])
  assert.equal(manifest.content_scripts[1].world, 'MAIN')
  assert.deepEqual(manifest.content_scripts[2].js, ['receipt.js', 'poster.js', 'creator.js'])
  assert.deepEqual(manifest.permissions, ['storage', 'alarms'])
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
