import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { selectRelatedContent } from '../../lib/contentSelection.mjs'

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
function evaluate(source, scope, exports) {
  source = source.replace(/^import .*\n/gm, '').replace(/^export \{.*\n/gm, '').replace(/export /g, '')
  return new Function(...Object.keys(scope), `${source}\nreturn {${exports.join(',')}}`)(...Object.values(scope))
}

test('public archive contains no encrypted entries or article bodies', async () => {
  const archive = JSON.parse(await read('public/data/content-catalog.json'))
  assert.equal(archive.version, 1)
  assert.ok(archive.entries.length > 100)
  for (const entry of archive.entries) {
    assert.equal(entry.content, undefined)
    assert.equal(entry.markdown, undefined)
  }
  for (const entry of Object.values(archive.researchMeta)) assert.notEqual(entry.encrypted, true)
  for (const entry of archive.articles) {
    assert.equal(entry.content, undefined)
    assert.equal(entry.markdown, undefined)
  }
})

test('runtime catalog merges every D1 page, applies tombstones and updates recommendations', async () => {
  const archived = {contentKey:'research:topics:archive',type:'research',category:'topics',slug:'archive',title:'Archived',tags:['AI']}
  const current = {contentKey:'article:new',type:'article',category:'posts',title:'New',tags:['AI'],date:'2026-09-10'}
  const rows = Array.from({length:1005},(_,i)=>({contentKey:`article:other-${i}`,type:'article',category:'posts',title:`Other ${i}`,status:'published',tags:[],date:'2025-01-01'}))
  rows.push({...archived,status:'retired'}, {...current,status:'published'})
  const pages = []
  const runtime = evaluate(await read('lib/contentPipelineRuntime.js'), {
    readContentCatalog:async()=>({entries:[archived]}),
    listContentIndex:async({offset,limit})=>{pages.push(offset);return rows.slice(offset,offset+limit)},
    selectRelatedContent,
  }, ['listAllContent','getRelatedContent'])
  const entries = await runtime.listAllContent()
  assert.deepEqual(pages,[0,1000])
  assert.equal(entries.length,1006)
  assert.ok(entries.some((entry)=>entry.contentKey==='article:other-1004'))
  assert.ok(!entries.some((entry)=>entry.contentKey===archived.contentKey))
  assert.ok(entries.some((entry)=>entry.contentKey===current.contentKey))
  const related = await runtime.getRelatedContent('article:other-0',{limit:2})
  assert.equal(related[0].contentKey,'article:new')
})

test('catalog reads current deployment ASSETS, does not forward cookies, and validates schema', async () => {
  let request
  let payload = {version:1,entries:[],researchRedirects:{}}
  const runtime = evaluate(await read('lib/contentCatalogRuntime.js'),{
    getOptionalRequestContext:()=>({env:{ASSETS:{fetch:async(req)=>{request=req;return Response.json(payload)}}}}),
  },['readContentCatalog'])
  assert.deepEqual(await runtime.readContentCatalog(),payload)
  assert.equal(request.url,'https://2aran.com/data/content-catalog.json')
  assert.equal(request.headers.get('cookie'),null)
  payload = {version:2,entries:[]}
  await assert.rejects(runtime.readContentCatalog(),/Invalid/)
})

test('reservation uses runtime aliases and metadata instead of an embedded research directory', async () => {
  const runtime = evaluate(await read('lib/articleReservedSlugs.js'),{
    readContentCatalog:async()=>({articles:[{slug:'old-article'}],researchRedirects:{'2026-09-10-new-research':'/articles/research/topics/new-research'}}),
    resolveResearchPath:async(path)=>({found:path.endsWith('/2026-09-10-new-research')}),
  },['isReservedArticleSlug'])
  assert.equal(await runtime.isReservedArticleSlug('year-summary'),true)
  assert.equal(await runtime.isReservedArticleSlug('old-article'),true)
  assert.equal(await runtime.isReservedArticleSlug('2026-09-10-new-research'),true)
  assert.equal(await runtime.isReservedArticleSlug('unused'),false)
})

test('a failed D1 read cannot silently revive an archived item', async () => {
  const runtime = evaluate(await read('lib/contentPipelineRuntime.js'),{
    readContentCatalog:async()=>({entries:[{contentKey:'research:topics:retired',title:'Old'}]}),
    listContentIndex:async()=>{throw new Error('database unavailable')},
    selectRelatedContent,
  },['listAllContent','getRelatedContent'])
  await assert.rejects(runtime.listAllContent(),/database unavailable/)
  assert.deepEqual(await runtime.getRelatedContent('article:any'),[])
})

test('research aliases redirect before streaming and preserve variant query parameters',async()=>{
  const {gateArticleRequest}=evaluate(await read('lib/articleRequestGate.js'),{
    resolveReservedArticleSlug:async()=>({reserved:true,redirectHref:'/articles/research/topics/example'}),
    getD1:()=>{throw new Error('must not query article_posts for an archive alias')},
  },['gateArticleRequest'])
  const response=await gateArticleRequest('/articles/2026-09-10-example','?v=codex','https://preview.example')
  assert.equal(response.status,307)
  assert.equal(response.headers.get('location'),'https://preview.example/articles/research/topics/example?v=codex')
})
