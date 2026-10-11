import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const note = require('../../tools/xhs-interaction-extension/note.js')
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

test('extension manifest only runs on Xiaohongshu and DeepSeek', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.equal(manifest.name, '小红书高频互动助手')
  assert.equal(manifest.version, '0.1.1')
  assert.match(content, /重启任务/)
  assert.match(content, /评论成功/)
  assert.deepEqual(manifest.content_scripts[0].js, ['note.js', 'content.js'])
  assert.deepEqual(manifest.host_permissions, ['https://www.xiaohongshu.com/*', 'https://api.deepseek.com/*'])
  assert.match(content, /#detail-title/)
  assert.match(content, /p\.content-input\[contenteditable='true'\]/)
  assert.match(content, /button\.btn\.submit/)
  assert.match(content, /#exploreFeeds/)
  assert.match(content, /#homefeed_recommend/)
  assert.match(content, /xhsia-comment/)
  assert.match(content, /creator\.xiaohongshu\.com\/publish\/publish/)
})
