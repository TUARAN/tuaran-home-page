import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { buildHomeRecommendationCatalog } from '../../lib/homeRecommendationCatalogCore.js'

function load(file, scope, exports) {
  const source = fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8').replace(/^import .*\n/gm, '').replace(/export /g, '')
  return new Function(...Object.keys(scope), `${source}\nreturn {${exports.join(',')}}`)(...Object.values(scope))
}

test('recommendations include new D1 posts and research, exclude withdrawn and encrypted entries', async () => {
  const archive = { articles: [], researchMeta: { 'topics/old': { category:'topics',slug:'old',title:'Old' } } }
  const {getRuntimeHomeRecommendationCatalog} = load('lib/homeRecommendationRuntime.js', {
    readContentCatalog:async()=>archive,
    listResearchOverrides:async()=>['old','new','secret'].map((slug)=>({status:slug==='old'?'retired':'published',metadata_json:JSON.stringify({category:'topics',slug,title:slug,encrypted:slug==='secret'})})),
    listDiscoverablePosts:async()=>[{slug:'online-post',title:'Online',publishedAt:1}],
    postDiscoveryDate:()=>new Date('2026-09-10'),buildHomeRecommendationCatalog,
  }, ['getRuntimeHomeRecommendationCatalog'])
  const catalog = await getRuntimeHomeRecommendationCatalog()
  assert.ok(catalog.some((entry)=>entry.id==='column:online-post'))
  assert.ok(catalog.some((entry)=>entry.id==='research:topics:new'))
  assert.ok(!catalog.some((entry)=>['research:topics:old','research:topics:secret'].includes(entry.id)))
})

test('recommendation API disables stale caching and returns current catalog', async () => {
  const {GET} = load('app/api/recommendations/home/route.js', {
    getRuntimeHomeRecommendationCatalog:async()=>[{id:'new'}],getHomeRecommendationSettings:async()=>({pinnedIds:['new']}),
  }, ['GET'])
  const response = await GET()
  assert.equal(response.headers.get('cache-control'),'no-store')
  assert.deepEqual((await response.json()).catalog,[{id:'new'}])
})

test('weekly links resolve runtime metadata with stable comments and content keys',()=>{
  const {resolveArticleKey,resolveContentKey}=load('lib/articleLinks.js',{
    resolveContentEntry:()=>null,CONTENT_TYPE_LABELS:{},
  },['resolveArticleKey','resolveContentKey'])
  const metadata=new Map([['research:topics:new',{title:'New title',href:'/articles/research/topics/new'}],['article:online',{title:'Online title',href:'/articles/online'}]])
  assert.equal(resolveArticleKey('research:topics:new',metadata).title,'New title')
  assert.equal(resolveContentKey('topics','new',metadata).href,'/articles/research/topics/new')
  assert.equal(resolveArticleKey('article:online',metadata).title,'Online title')
})
