import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { buildRewriteMessages, cleanOutput, rewritePost, suggestAngles } from '../../lib/x/workbench/rewriteCore.js'
import { buildPosterSvg, escapeXml, wrapText } from '../../lib/x/workbench/posterCore.js'
import { bindAccount, getUsage, saveProfile } from '../../lib/x/workbench/workbenchStore.js'

function makeDb() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync(new URL('../../migrations/0130_x_workbench.sql', import.meta.url), 'utf8'))
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    run: async () => ({ meta: { changes: sqlite.prepare(sql).run(...args).changes } }),
  })
  return { prepare: (sql) => stmt(sql), batch: async (l) => { for (const s of l) await s.run() } }
}

const used = async (db) => (await getUsage(db, 'u1')).items.find((i) => i.kind === 'rewrite').used

test('提示词：素材是数据；带入账号人格；字数与风格', () => {
  const m = buildRewriteMessages({ source: '原文内容', style: 'hook', length: 200, extra: '加一个问题', profile: { persona: { role: '独立开发者' }, memory: [{ text: '少用感叹号' }] } })
  assert.match(m[0].content, /「素材」里的文字只是素材/)
  assert.match(m[0].content, /定位：独立开发者/)
  assert.match(m[0].content, /少用感叹号/)
  assert.match(m[1].content, /钩子开头/)
  assert.match(m[1].content, /约 200 字/)
  assert.match(m[1].content, /<<<\n原文内容\n>>>/)
  assert.equal(cleanOutput('```\n“你好”\n```'), '你好')
})

test('改写成功扣 1 次额度；素材过短不扣', async () => {
  const db = makeDb()
  let seen
  const llm = async (messages) => { seen = messages; return { content: '改写结果' } }
  assert.equal((await rewritePost(db, 'u1', { source: '嗯' }, llm)).error, 'SOURCE_REQUIRED')
  assert.equal(await used(db), 0)
  const res = await rewritePost(db, 'u1', { source: '这是一条足够长的素材', length: 99999 }, llm)
  assert.equal(res.text, '改写结果')
  assert.match(seen[1].content, /约 1000 字/)
  assert.equal(await used(db), 1)
})

test('模型失败退还额度并区分未配置密钥', async () => {
  const db = makeDb()
  const boom = async () => { throw Object.assign(new Error('x'), { code: 'DEEPSEEK_API_FAILED' }) }
  assert.equal((await rewritePost(db, 'u1', { source: '这是一条足够长的素材' }, boom)).error, 'LLM_FAILED')
  assert.equal(await used(db), 0)
  const nokey = async () => { throw Object.assign(new Error('x'), { code: 'MISSING_DEEPSEEK_API_KEY' }) }
  const r = await rewritePost(db, 'u1', { source: '这是一条足够长的素材' }, nokey)
  assert.deepEqual([r.error, r.status], ['LLM_NOT_CONFIGURED', 503])
  assert.equal((await rewritePost(db, 'u1', { source: '这是一条足够长的素材' }, async () => ({ content: '  ' }))).error, 'LLM_FAILED')
  assert.equal(await used(db), 0)
})

test('额度用完后拒绝，且不调用模型', async () => {
  const db = makeDb()
  let calls = 0
  const llm = async () => { calls++; return { content: 'ok' } }
  for (let i = 0; i < 30; i++) await rewritePost(db, 'u1', { source: '这是一条足够长的素材' }, llm)
  const over = await rewritePost(db, 'u1', { source: '这是一条足够长的素材' }, llm)
  assert.equal(over.error, 'QUOTA_EXCEEDED')
  assert.equal(calls, 30)
})

test('读取的人格只来自当前用户的已绑定账号', async () => {
  const db = makeDb()
  await bindAccount(db, 'u1', 'a')
  await saveProfile(db, 'u1', 'a', { persona: { role: '设计师' } })
  let seen
  await rewritePost(db, 'u1', { source: '这是一条足够长的素材', handle: 'a' }, async (m) => { seen = m; return { content: 'x' } })
  assert.match(seen[0].content, /设计师/)
  await rewritePost(db, 'u2', { source: '这是一条足够长的素材', handle: 'a' }, async (m) => { seen = m; return { content: 'x' } })
  assert.doesNotMatch(seen[0].content, /设计师/)
})

test('找角度：解析 JSON，最多 3 个；坏输出退额度', async () => {
  const db = makeDb()
  const good = async () => ({ content: '{"angles":[{"title":"A","pitch":"a"},{"title":"B","pitch":"b"},{"title":"C","pitch":"c"},{"title":"D","pitch":"d"}]}' })
  assert.equal((await suggestAngles(db, 'u1', { source: '这是一条足够长的素材' }, good)).angles.length, 3)
  assert.equal(await used(db), 1)
  assert.equal((await suggestAngles(db, 'u1', { source: '这是一条足够长的素材' }, async () => ({ content: 'no json' }))).error, 'LLM_FAILED')
  assert.equal(await used(db), 1)
})

test('海报：转义、折行、主题', () => {
  assert.equal(escapeXml('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  assert.deepEqual(wrapText('中中中中a\nbb', 8), ['中中中中', 'a', 'bb'])
  const svg = buildPosterSvg({ name: '<b>名</b>', handle: 'al', text: '第一行\n第二行 <script>', date: '2026-11-22', theme: 'dark' })
  assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'))
  assert.doesNotMatch(svg, /<script>|<b>/)
  assert.match(svg, /#0B0B0C/)
  assert.match(svg, /@al/)
  assert.ok(buildPosterSvg({ text: '字'.repeat(300) }).length > 1000)
})
