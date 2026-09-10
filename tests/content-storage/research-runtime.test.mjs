import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const read = (name) => fs.readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8')
function load(name, scope, exports) {
  const source = read(name).replace(/^import .*\n/gm, '').replace(/export /g, '')
  return new Function(...Object.keys(scope), `${source}\nreturn {${exports.join(',')}}`)(...Object.values(scope))
}
function harness() {
  let state = null, failure = null, assetReads = 0
  const entry = {category:'topics',slug:'existing',title:'Title',content:'Body',variants:[{id:'one',content:'one'},{id:'two',content:'two'}]}
  const runtime = load('lib/researchRuntime.js', {
    cache:(fn)=>fn, getD1:()=>({}),
    readContentCatalog:async()=>({researchKeys:['topics/existing'],researchMeta:{'topics/existing':entry},researchRedirects:{existing:'/articles/research/topics/existing'}}),
    readContentAsset:async()=>{assetReads++;return entry},
    readResearchRoute:async()=>{if(failure)throw failure;return state ? {found:true,status:state,href:'/articles/research/topics/existing'} : {found:false}},
    readResearchDocument:async()=>{if(failure)throw failure;return state ? {found:true,status:state,entry:state==='published'?{...entry,content:'D1 body'}:null} : {found:false}},
  }, ['getRuntimeResearchEntry','resolveResearchPath'])
  return {...runtime,setState(value){state=value},setFailure(value){failure=value},get assetReads(){return assetReads}}
}

test('research details prefer D1, preserve variants, and never restore a tombstone from archive',async()=>{
  const h=harness()
  assert.equal((await h.getRuntimeResearchEntry('topics','existing')).content,'Body')
  h.setState('published')
  const entry=await h.getRuntimeResearchEntry('topics','existing')
  assert.equal(entry.content,'D1 body');assert.equal(entry.variants.length,2)
  for(const status of ['draft','retired']){
    h.setState(status)
    assert.equal(await h.getRuntimeResearchEntry('topics','existing'),null)
    assert.equal((await h.resolveResearchPath('/articles/existing')).status,status)
  }
  assert.equal(h.assetReads,1)
})

test('only missing additive schema allows fallback; outages do not reveal historical body',async()=>{
  const h=harness()
  h.setFailure(new Error('no such table: content_routes'))
  assert.equal((await h.getRuntimeResearchEntry('topics','existing')).content,'Body')
  h.setFailure(new Error('D1 connection unavailable'))
  await assert.rejects(h.getRuntimeResearchEntry('topics','existing'),/unavailable/)
  assert.equal(h.assetReads,1)
})

test('research HTTP gate returns real 404/307 before streaming and keeps variant query',async()=>{
  let route={found:true,status:'published',href:'/articles/research/topics/current'}
  const gate=load('lib/articleRequestGate.js',{resolveResearchPath:async()=>route},['gateArticleRequest']).gateArticleRequest
  const redirect=await gate('/articles/research/topics/2026-09-10-current','?v=two','https://preview.example')
  assert.equal(redirect.status,307)
  assert.equal(redirect.headers.get('location'),'https://preview.example/articles/research/topics/current?v=two')
  assert.equal(await gate('/articles/research/topics/current'),null)
  route={found:true,status:'retired'}
  assert.equal((await gate('/articles/research/topics/current')).status,404)
})

test('RSS and sitemap remove withdrawn and encrypted research, add new runtime documents',()=>{
  const {applyResearchDiscovery}=load('lib/researchDiscovery.js',{escapeDiscoveryXml:(s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')},['applyResearchDiscovery'])
  const entries=[{category:'topics',slug:'old',status:'retired'},{category:'topics',slug:'secret',status:'published',encrypted:true},{category:'topics',slug:'new',title:'New & safe',summary:'Summary',date:'2026-09-10',status:'published'}]
  const rss='<rss><channel><item><link>https://2aran.com/articles/research/topics/old?v=one</link><description>WITHDRAWN BODY</description></item><item><link>https://2aran.com/articles/research/topics/secret</link></item><item><link>https://2aran.com/articles/ordinary</link></item></channel></rss>'
  const output=applyResearchDiscovery(rss,entries,'rss')
  assert.doesNotMatch(output,/WITHDRAWN|\/old|\/secret/)
  assert.match(output,/New &amp; safe/);assert.match(output,/\/ordinary/)
  const sitemap=applyResearchDiscovery('<urlset><url><loc>https://2aran.com/articles/research/topics/old</loc></url></urlset>',entries,'sitemap')
  assert.doesNotMatch(sitemap,/\/old|\/secret/);assert.match(sitemap,/\/topics\/new/)
})

test('knowledge directory overlays research tombstones, new taxonomy and ordinary posts on the server',async()=>{
  const href=(slug)=>`/articles/research/topics/${slug}`
  const rows=[['old','retired',false],['secret','published',true],['new','published',false]].map(([slug,status,encrypted])=>({status,metadata_json:JSON.stringify({category:'topics',slug,title:slug,encrypted})}))
  const {readRuntimeKnowledgeItems}=load('lib/knowledgeRuntime.js',{
    readContentCatalog:async()=>({knowledgeItems:[{id:'research:topics:old',href:href('old'),title:'Stale'},{id:'resource',href:'/resources/existing',title:'Existing'}]}),
    listResearchOverrides:async()=>rows,
    listDiscoverablePosts:async()=>[{slug:'post',title:'Post'}],
    researchKnowledgeItem:(entry)=>({id:entry.slug,href:href(entry.slug),title:entry.title,subjects:['ai_dev']}),
    isAShareResearchEntry:()=>false,
    articlePostToKnowledgeItem:(post)=>({id:post.slug,href:`/articles/${post.slug}`,title:post.title}),
    listContentIndex:async()=>[],
    taxonomyForManualEntry:()=>({}),researchSortKey:(date)=>date,compareSortKeyDesc:()=>0,
  },['readRuntimeKnowledgeItems'])
  const items=await readRuntimeKnowledgeItems()
  assert.deepEqual(items.map((item)=>item.href),['/resources/existing',href('new'),'/articles/post'])
  assert.deepEqual(items.find((item)=>item.title==='new').subjects,['ai_dev'])
})

test('admin list reports real Git document states, including unpublished and encrypted records',()=>{
  const {mergeAdminContentItems}=load('lib/adminContentList.js',{},['mergeAdminContentItems'])
  const researchDocuments=['draft','published','retired'].map((status)=>({content_key:`research:topics:${status}`,status,updated_at:100,metadata_json:JSON.stringify({category:'topics',slug:status,title:status,encrypted:status==='published'})}))
  const rows=mergeAdminContentItems({researchDocuments})
  assert.equal(rows.length,3)
  for(const row of rows){assert.equal(row.source,'git');assert.equal(row.entity,'research-document');assert.equal(row.status,row.title);assert.equal(row.body_json,undefined)}
})
