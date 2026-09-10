import { prepareContentIndexUpsert } from '../../lib/contentIndexStatements.mjs'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { normalizeResearchSnapshot, researchSnapshotIndex } from '../../lib/researchDocument.mjs'

const read = (name) => fs.readFileSync(new URL(`../../${name}`,import.meta.url),'utf8')
function load(name, scope, exports) {
  scope = { prepareContentIndexUpsert, ...scope }
  const source=read(name).replace(/^import .*\n/gm,'').replace(/export /g,'')
  return new Function(...Object.keys(scope), `${source}\nreturn {${exports.join(',')}}`)(...Object.values(scope))
}
function harness() {
  const sql = new DatabaseSync(':memory:')
  sql.exec('PRAGMA foreign_keys=ON')
  sql.exec(read('migrations/0024_article_posts.sql'))
  sql.exec(read('migrations/0035_content_index.sql'))
  sql.exec(read('migrations/0089_content_documents.sql'))
  let race
  const db={prepare(query){let args=[];const statement={bind(...values){args=values;return statement},async first(){return sql.prepare(query).get(...args)||null},async run(){return sql.prepare(query).run(...args)}};return statement},
    async batch(statements){if(race){const callback=race;race=null;callback()};sql.exec('BEGIN');try{for(const statement of statements)await statement.run();sql.exec('COMMIT')}catch(error){sql.exec('ROLLBACK');throw error}}}
  const scope={getD1:()=>db,normalizeResearchSnapshot,researchSnapshotIndex}
  Object.assign(scope,load('lib/contentIndex.js',scope,['prepareUpsertContentEntry']))
  return {sql,db,setRace(callback){race=callback},...load('lib/researchPublication.js',scope,['publishResearchSnapshot','readResearchDocument','readResearchRoute'])}
}
function sample(slug='sample',category='topics') {
  return {entry:{category,slug,filename:`2026-09-10-${slug}.md`,title:'调研标题',date:'2026-09-10',content:'## 正文\n\n原始版本',raw:'SOURCE MUST NOT BE STORED',variants:[{id:'codex',label:'Codex',content:'原始版本'},{id:'manual',label:'TUARAN',content:'第二版本'}],tags:['AI'],encrypted:false,images:[]},sourcePath:`research/${category}/2026-09-10-${slug}.md`,sourceHash:'a'.repeat(64),status:'published'}
}

test('snapshots preserve variants and reject plaintext for encrypted content',()=>{
  const {document}=normalizeResearchSnapshot(sample())
  assert.equal(document.contentKey,'research:topics:sample')
  assert.equal(document.entry.raw,undefined)
  assert.equal(JSON.parse(document.metadataJson).content,undefined)
  assert.equal(JSON.parse(document.metadataJson).variants,undefined)
  assert.equal(JSON.parse(document.bodyJson).content,document.entry.content)
  assert.equal(document.entry.variants.length,2)
  assert.equal(document.routes.length,4)
  assert.equal(normalizeResearchSnapshot({...sample(),sourcePath:'../private'}).error,'INVALID_SOURCE_PATH')
  const secret=sample('secret');secret.entry.encrypted=true
  assert.equal(normalizeResearchSnapshot(secret).error,'INVALID_ENCRYPTED_SNAPSHOT')
  secret.entry.content='';secret.entry.variants=[];secret.entry.encryptedPayload={v:1,kdf:'PBKDF2-SHA256',iter:600000,salt:btoa('s'.repeat(16)),iv:btoa('i'.repeat(12)),data:btoa('c'.repeat(16))}
  const normalized=normalizeResearchSnapshot(secret).document
  assert.equal(researchSnapshotIndex(normalized).status,'retired')
  assert.equal(normalized.entry.encryptedPayload.data,btoa('c'.repeat(16)))
})

test('publication binds body, canonical key and old aliases atomically; retirement retains tombstones',async()=>{
  const h=harness();const input=sample()
  assert.equal((await h.publishResearchSnapshot(h.db,input,{expectedRevision:0})).ok,true)
  const result=await h.readResearchDocument(h.db,'topics','sample')
  assert.equal(result.entry.content,input.entry.content)
  assert.equal(result.entry.variants.length,2)
  for(const pathname of normalizeResearchSnapshot(input).document.routes){
    const route=await h.readResearchRoute(h.db,pathname)
    assert.equal(route.contentKey,'research:topics:sample');assert.equal(route.href,'/articles/research/topics/sample')
  }
  const indexed=h.sql.prepare('SELECT * FROM content_index').get()
  assert.equal(indexed.content_key,'research:topics:sample');assert.equal(indexed.source,'git')
  assert.equal((await h.publishResearchSnapshot(h.db,{...input,status:'retired'},{expectedRevision:1})).ok,true)
  const retired=await h.readResearchDocument(h.db,'topics','sample')
  assert.equal(retired.found,true);assert.equal(retired.entry,null)
  assert.equal((await h.readResearchRoute(h.db,'/articles/sample')).status,'retired')
  assert.equal(h.sql.prepare('SELECT status FROM content_index').get().status,'retired')
  h.sql.close()
})

test('alias conflicts and concurrent revisions roll back body, aliases and index together',async()=>{
  const h=harness();await h.publishResearchSnapshot(h.db,sample(),{expectedRevision:0})
  const collision=await h.publishResearchSnapshot(h.db,sample('sample','companies'),{expectedRevision:0})
  assert.equal(collision.error,'ROUTE_CONFLICT')
  assert.equal((await h.readResearchDocument(h.db,'companies','sample')).found,false)
  assert.equal(h.sql.prepare("SELECT count(*) AS n FROM content_index WHERE category='companies'").get().n,0)
  h.setRace(()=>h.sql.prepare("UPDATE content_documents SET revision=2 WHERE content_key='research:topics:sample'").run())
  const conflict=await h.publishResearchSnapshot(h.db,{...sample(),status:'retired'},{expectedRevision:1})
  assert.equal(conflict.error,'REVISION_CONFLICT')
  assert.equal((await h.readResearchDocument(h.db,'topics','sample')).status,'published')
  assert.equal(h.sql.prepare('SELECT status FROM content_index').get().status,'published')
  h.sql.close()
})

test('legacy archive sync cannot republish a retired Git document',async()=>{
  const h=harness();const input={...sample(),status:'retired'}
  await h.publishResearchSnapshot(h.db,input,{expectedRevision:0})
  const {prepareUpsertContentEntry}=load('lib/contentIndex.js',{getD1:()=>h.db},['prepareUpsertContentEntry'])
  const entry=researchSnapshotIndex(normalizeResearchSnapshot(sample()).document)
  await prepareUpsertContentEntry(h.db,{...entry,source:'sync',status:'published',title:'Stale archive'}).run()
  const row=h.sql.prepare('SELECT source,status,title FROM content_index').get()
  assert.equal(row.source,'git');assert.equal(row.status,'retired');assert.equal(row.title,'调研标题')
  h.sql.close()
})

test('repository export validates all research snapshots and preserves source hashes',async()=>{
  const {mkdtempSync,rmSync}=await import('node:fs')
  const {tmpdir}=await import('node:os')
  const {join}=await import('node:path')
  const {fileURLToPath}=await import('node:url')
  const {spawnSync}=await import('node:child_process')
  const {createHash}=await import('node:crypto')
  const directory=mkdtempSync(join(tmpdir(),'research-snapshot-test-'))
  try{
    const output=join(directory,'bundle.json')
    const result=spawnSync(process.execPath,['scripts/export-research-content.mjs','--output',output],{cwd:fileURLToPath(new URL('../../',import.meta.url)),encoding:'utf8'})
    assert.equal(result.status,0,result.stderr)
    const bundle=JSON.parse(fs.readFileSync(output,'utf8'))
    assert.equal(bundle.version,1)
    assert.ok(bundle.documents.length>200)
    let encrypted=0,multivariant=0
    for(const item of bundle.documents){
      const normalized=normalizeResearchSnapshot(item)
      assert.equal(normalized.error,undefined,item.sourcePath)
      assert.equal(item.entry.raw,undefined)
      const source=fs.readFileSync(new URL(`../../${item.sourcePath}`,import.meta.url))
      assert.equal(item.sourceHash,createHash('sha256').update(source).digest('hex'))
      if(item.entry.encrypted){encrypted++;assert.equal(item.entry.content,'');assert.deepEqual(item.entry.variants,[]);assert.ok(item.entry.encryptedPayload.data)}
      if(item.entry.variants.length>1)multivariant++
    }
    assert.ok(encrypted>0)
    assert.ok(multivariant>0)
  }finally{rmSync(directory,{recursive:true,force:true})}
})

test('a new source filename retains the previously published dated alias',async()=>{
  const h=harness();await h.publishResearchSnapshot(h.db,sample(),{expectedRevision:0})
  const next=sample();next.entry.filename='2026-09-11-sample.md';next.sourcePath='research/topics/2026-09-11-sample.md';next.sourceHash='b'.repeat(64)
  assert.equal((await h.publishResearchSnapshot(h.db,next,{expectedRevision:1})).ok,true)
  for(const path of ['/articles/2026-09-10-sample','/articles/2026-09-11-sample']){
    const route=await h.readResearchRoute(h.db,path)
    assert.equal(route.contentKey,'research:topics:sample');assert.equal(route.status,'published')
  }
  assert.equal((await h.readResearchDocument(h.db,'topics','sample')).sourcePath,next.sourcePath)
  h.sql.close()
})

test('shared article routes cannot be claimed by competing research or ordinary drafts',async()=>{
  const h=harness()
  const insert=h.sql.prepare("INSERT INTO article_posts(id,slug,title,content_json,content_text,tags_json,status,revision,created_at,updated_at) VALUES (?,?,'draft','{}','','[]','draft',1,1,1)")
  insert.run('ordinary','ordinary')
  const conflict=await h.publishResearchSnapshot(h.db,sample('ordinary'),{expectedRevision:0})
  assert.equal(conflict.error,'ROUTE_CONFLICT')
  assert.equal((await h.readResearchDocument(h.db,'topics','ordinary')).found,false)
  await h.publishResearchSnapshot(h.db,sample(),{expectedRevision:0})
  assert.throws(()=>insert.run('conflict','sample'),/CONTENT_ROUTE_CONFLICT/)
  assert.throws(()=>h.sql.prepare("UPDATE article_posts SET slug='sample' WHERE id='ordinary'").run(),/CONTENT_ROUTE_CONFLICT/)
  h.sql.close()
})

test('Owner import API enforces authentication, reserved routes and revision checks',async()=>{
  const h=harness()
  let authorized=false,reserved=false
  const api=load('app/api/admin/research-documents/route.js',{
    getOwnerOrReject:async()=>authorized?{ok:true}:{ok:false,response:Response.json({error:'NOT_OWNER'},{status:403})},
    getD1:()=>h.db,normalizeResearchSnapshot,publishResearchSnapshot:h.publishResearchSnapshot,
    resolveReservedArticleSlug:async()=>({reserved}),
  },['GET','POST'])
  const request=(revision=0)=>new Request('https://example.com/api/admin/research-documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({snapshot:sample(),expectedRevision:revision})})
  assert.equal((await api.POST(request())).status,403)
  authorized=true;reserved=true
  assert.equal((await api.POST(request())).status,409)
  reserved=false
  assert.equal((await api.POST(request())).status,200)
  assert.equal((await api.POST(request())).status,409)
  const response=await api.GET(new Request('https://example.com/api/admin/research-documents?key=research:topics:sample'))
  const body=await response.json()
  assert.equal(body.document.revision,1)
  assert.equal(body.document.body_json,undefined)
  assert.equal(response.headers.get('cache-control'),'no-store')
  h.sql.close()
})
