import { prepareContentIndexUpsert } from '../../lib/contentIndexStatements.mjs'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { isMarkdownDocument, normalizeArticleDocument, markdownFileToDraft, MAX_MARKDOWN_BYTES } from '../../lib/articleDocument.mjs'
import { articlePostToContentEntry } from '../../lib/articleContentIndex.mjs'
import { renderMarkdown } from '../../lib/research/markdown.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8')
function load(name, scope, exports) {
  scope = { prepareContentIndexUpsert, ...scope }
  const source = read(name).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\s*$/gm, '').replace(/export /g, '')
  return new Function(...Object.keys(scope), `${source}\nreturn {${exports.join(',')}}`)(...Object.values(scope))
}

test('historical archive preserves every body and metadata excludes body fields', () => {
  const filename = path.join(root, 'app/(site)/articles/articlesData.js')
  const source = fs.readFileSync(filename, 'utf8').replace(/^import (\w+) from '([^']+\.json)'\s*$/gm,
    (_, name, relative) => `const ${name} = ${fs.readFileSync(path.resolve(path.dirname(filename), relative), 'utf8')};`)
    .replace('export const articles =', 'const articles =')
  const original = JSON.parse(vm.runInNewContext(`${source}\nJSON.stringify(articles)`))
  const { articles } = load('lib/articleMetadata.js', {}, ['articles'])
  assert.equal(articles.length, original.length)
  for (const article of original) {
    assert.deepEqual(JSON.parse(read(`public/data/article-archive/${article.slug}.json`)), article)
    const { content, markdown, ...metadata } = article
    assert.deepEqual(articles.find((item) => item.slug === article.slug), metadata)
  }
})

test('Markdown retains exact text, rejects private frontmatter and enforces byte budget', () => {
  const markdown = '# 测试\n\n## 标题\n\n| A | B |\n|---|---|\n| 1 | 2 |\n'
  const draft = markdownFileToDraft(markdown, 'test.md')
  assert.equal(draft.title, '测试')
  assert.equal(draft.content.markdown, markdown)
  assert.ok(isMarkdownDocument(draft.content))
  assert.throws(() => markdownFileToDraft('---\nencrypted: true\n---\n秘密'), /frontmatter/)
  assert.equal(normalizeArticleDocument({type:'markdown', markdown: '字'.repeat(MAX_MARKDOWN_BYTES)}).error, 'MARKDOWN_TOO_LARGE')
  assert.equal(normalizeArticleDocument({type:'markdown', markdown: null}).error, 'INVALID_MARKDOWN')
  const html = renderMarkdown(`${markdown}\n<script>alert(1)</script>\n\n[x](javascript:alert(1))`)
  assert.match(html, /<table>/)
  assert.match(html, /<h2/)
  assert.doesNotMatch(html, /<script|href="javascript:/)
})

function harness({ owner = true } = {}) {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(read('migrations/0024_article_posts.sql'))
  sqlite.exec(read('migrations/0035_content_index.sql'))
  let beforeBatch
  const db = {
    prepare(sql) {
      let values = []
      const statement = {
        bind(...args) { values = args; return statement },
        async first() { return sqlite.prepare(sql).get(...values) || null },
        async all() { return { results: sqlite.prepare(sql).all(...values) } },
        async run() { return { meta: sqlite.prepare(sql).run(...values) } },
      }
      return statement
    },
    async batch(statements) {
      if (beforeBatch) { const callback = beforeBatch; beforeBatch = null; callback() }
      sqlite.exec('BEGIN')
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec('COMMIT'); return results }
      catch (error) { sqlite.exec('ROLLBACK'); throw error }
    },
  }
  const scope = { getD1: () => db, normalizeArticleDocument, articlePostToContentEntry,
    getOwnerOrReject: async () => owner ? {ok:true} : {ok:false, response:Response.json({error:'FORBIDDEN'}, {status:403})},
    isReservedArticleSlug: (slug) => slug === 'reserved',
    resolveReservedArticleSlug: async (slug) => ({ reserved: slug === 'reserved' }),
    taxonomyForArticle: () => ({}),
  }
  Object.assign(scope, load('lib/articlePosts.js', scope, ['rowToArticlePost','normalizeSlug','normalizeTags','EMPTY_ARTICLE_DOC','getPublishedArticlePostBySlug']))
  Object.assign(scope, load('lib/contentIndex.js', scope, ['prepareDeleteContentEntry','prepareUpsertContentEntry']))
  return { sqlite, scope, create: load('app/api/admin/articles/route.js',scope,['POST']).POST,
    update: load('app/api/admin/articles/[id]/route.js',scope,['PUT']).PUT,
    race(callback) { beforeBatch = callback },
  }
}
const req = (body) => new Request('https://example.com/api/admin/articles', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
const payload = {title:'测试文章',slug:'new-markdown',summary:'摘要',content:{type:'markdown',markdown:'## 原文\n\n正文'},contentText:'untrusted divergent text',tags:['测试']}

test('real routes preserve Markdown through draft, publish, revision conflict and withdrawal', async () => {
  const h = harness()
  const created = await (await h.create(req(payload))).json()
  assert.ok(created.ok)
  const context = { params:Promise.resolve({id:created.article.id}) }
  assert.equal(await h.scope.getPublishedArticlePostBySlug(payload.slug), null)
  const published = await h.update(req({...payload,status:'published',revision:1}), context)
  assert.equal(published.status,200)
  assert.equal((await h.scope.getPublishedArticlePostBySlug(payload.slug)).content.markdown,payload.content.markdown)
  assert.equal(h.sqlite.prepare('SELECT content_key FROM content_index').get().content_key,'article:new-markdown')
  assert.equal(h.sqlite.prepare('SELECT content_text FROM article_posts').get().content_text,payload.content.markdown)
  assert.equal((await h.update(req({...payload,status:'published',revision:1}),context)).status,409)
  const withdrawn = await h.update(req({...payload,status:'draft',revision:2}),context)
  assert.equal(withdrawn.status,200)
  const firstPublishedAt = (await withdrawn.clone().json()).article.publishedAt
  assert.ok(firstPublishedAt > 0)
  const renamed = await h.update(req({...payload,slug:'renamed-after-withdrawal',status:'draft',revision:3}),context)
  assert.equal(renamed.status,409)
  assert.equal((await renamed.json()).error,'PUBLISHED_SLUG_IMMUTABLE')
  assert.equal(await h.scope.getPublishedArticlePostBySlug(payload.slug),null)
  assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM content_index').get().n,0)
  h.sqlite.close()
})

test('permission and reserved paths reject writes; race rolls back index as well as body', async () => {
  const denied = harness({owner:false})
  assert.equal((await denied.create(req(payload))).status,403)
  assert.equal(denied.sqlite.prepare('SELECT count(*) AS n FROM article_posts').get().n,0)
  denied.sqlite.close()
  const h = harness()
  assert.equal((await h.create(req({...payload,slug:'reserved'}))).status,409)
  const {article} = await (await h.create(req(payload))).json()
  h.race(() => h.sqlite.prepare('UPDATE article_posts SET revision = 2, title = ? WHERE id = ?').run('另一编辑器',article.id))
  const response = await h.update(req({...payload,status:'published',revision:1}),{params:Promise.resolve({id:article.id})})
  assert.equal(response.status,409)
  assert.equal((await response.json()).error,'REVISION_CONFLICT')
  assert.equal(h.sqlite.prepare('SELECT title FROM article_posts').get().title,'另一编辑器')
  assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM content_index').get().n,0)
  h.sqlite.close()
})

test('archive reader uses deployment binding and fails closed for a missing or mismatched asset', async () => {
  let seen
  let response = new Response(JSON.stringify({slug:'known',title:'Original',markdown:'正文'}))
  const archive = load('lib/articleArchive.js', {
    readContentCatalog: async () => ({ articles:[{slug:'known'}] }),
    getOptionalRequestContext: () => ({ env:{ ASSETS:{ fetch: async (request) => { seen = request; return response } } } }),
  }, ['getArchivedArticle'])
  assert.equal(await archive.getArchivedArticle('../private'),null)
  assert.equal((await archive.getArchivedArticle('known')).markdown,'正文')
  assert.equal(seen.url,'https://2aran.com/data/article-archive/known.json')
  assert.equal(seen.headers.get('cookie'),null)
  response = new Response('{}',{status:404})
  await assert.rejects(archive.getArchivedArticle('known'),/unavailable/)
  response = new Response(JSON.stringify({slug:'wrong',title:'Wrong'}))
  await assert.rejects(archive.getArchivedArticle('known'),/Invalid/)
})

test('article gate checks publication before streaming without exposing draft metadata', async () => {
  const h = harness()
  const gate = load('lib/articleRequestGate.js',{...h.scope,resolveResearchPath:async(path)=>({found:true,status:'published',href:path})},['gateArticleRequest']).gateArticleRequest
  assert.equal(await gate('/articles/reserved'),null)
  assert.equal(await gate('/articles/research/topics/existing'),null)
  assert.equal((await gate('/articles/missing')).status,404)
  const {article} = await (await h.create(req(payload))).json()
  const draft = await gate('/articles/new-markdown')
  assert.equal(draft.status,404)
  assert.equal(draft.headers.get('cache-control'),'no-store')
  assert.doesNotMatch(await draft.text(), /测试文章|正文/)
  await h.update(req({...payload,status:'published',revision:1}),{params:Promise.resolve({id:article.id})})
  assert.equal(await gate('/articles/new-markdown'),null)
  assert.equal(await gate('/articles/new-markdown.rsc'),null)
  h.sqlite.close()
  const offline = load('lib/articleRequestGate.js',{...h.scope,getD1:()=>{throw new Error('offline')}},['gateArticleRequest']).gateArticleRequest
  assert.equal((await offline('/articles/new-markdown')).status,503)
})

test('D1 index pagination retains more than 1000 entries with stable ties', async () => {
  const h = harness()
  const insert = h.sqlite.prepare(`INSERT INTO content_index
    (content_key,content_type,category,slug,title,href,date,status,source,created_at,updated_at)
    VALUES (?, 'article', 'posts', ?, ?, ?, '2026-09-10', 'published', 'manual', 1, 1)`)
  for (let index = 0; index < 1007; index++) {
    const slug = `bulk-${String(index).padStart(4,'0')}`
    insert.run(`article:${slug}`,slug,slug,`/articles/${slug}`)
  }
  const {listContentIndex} = load('lib/contentIndex.js',h.scope,['listContentIndex'])
  const first = await listContentIndex({limit:1000,offset:0})
  const second = await listContentIndex({limit:1000,offset:1000})
  assert.equal(first.length,1000)
  assert.equal(second.length,7)
  assert.equal(new Set([...first,...second].map((entry)=>entry.contentKey)).size,1007)
  assert.equal(second.at(-1).slug,'bulk-1006')
  h.sqlite.close()
})
