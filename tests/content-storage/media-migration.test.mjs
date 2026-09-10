import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { sha256, prepareMediaPlan, verifyMedia, activateMedia, pruneMedia, rollbackMedia, mediaRouteExclusions } from '../../scripts/lib/content-media-migration.mjs'

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'content-media-'))
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}))
  fs.mkdirSync(path.join(root,'public/feed'),{recursive:true})
  fs.writeFileSync(path.join(root,'public/_redirects'),'/existing /kept 302\n')
  const data = Buffer.from('0123456789abcdef0123456789abcdef')
  const entry = {path:'public/feed/sample.mp4',url:'/feed/sample.mp4',bytes:data.length,sha256:sha256(data),visibility:'public',migrationStatus:'approved'}
  fs.writeFileSync(path.join(root,entry.path),data)
  const plan = prepareMediaPlan(root,{files:[entry]},{baseUrl:'https://media.example.com',bucket:'tuaran-media'})
  const remote = async (url,options={}) => {
    if (String(url).startsWith('https://2aran.com/')) return new Response(null,{status:302,headers:{Location:plan.entries[0].url}})
    if (options.headers?.Range) return new Response(data.subarray(0,16),{status:206})
    return new Response(data,{headers:{'Content-Type':'video/mp4','Access-Control-Allow-Origin':'*'}})
  }
  return {root,data,entry,plan,remote,backup:path.join(root,'backup')}
}

test('preparation requires public classification, rejects paths/hashes and creates immutable keys',t=>{
  const h=fixture(t)
  assert.match(h.plan.entries[0].objectKey,new RegExp(`^content-media/${h.entry.sha256}/`))
  assert.throws(()=>prepareMediaPlan(h.root,{files:[{...h.entry,visibility:'private'}]},{baseUrl:'https://media.example.com',bucket:'tuaran-media'}),/No media/)
  assert.throws(()=>prepareMediaPlan(h.root,{files:[{...h.entry,path:'public/feed/../../secret.mp4'}]},{baseUrl:'https://media.example.com',bucket:'tuaran-media'}),/Invalid media path/)
  fs.writeFileSync(path.join(h.root,h.entry.path),'changed')
  assert.throws(()=>prepareMediaPlan(h.root,{files:[h.entry]},{baseUrl:'https://media.example.com',bucket:'tuaran-media'}),/changed/)
})

test('migration verifies bytes/CORS/ranges, preserves unrelated redirects and can restore pruned files',async t=>{
  const h=fixture(t)
  await verifyMedia(h.root,h.plan,h.remote)
  await activateMedia(h.root,h.plan,h.remote)
  assert.ok(fs.existsSync(path.join(h.root,h.entry.path)))
  const redirects=fs.readFileSync(path.join(h.root,'public/_redirects'),'utf8')
  assert.match(redirects,/sample\.mp4 https:\/\/media\.example\.com\//)
  assert.match(redirects,/\/existing \/kept 302/)
  await pruneMedia(h.root,h.plan,h.backup,{fetcher:h.remote})
  assert.equal(fs.existsSync(path.join(h.root,h.entry.path)),false)
  rollbackMedia(h.root,h.plan,h.backup)
  assert.deepEqual(fs.readFileSync(path.join(h.root,h.entry.path)),h.data)
  assert.equal(fs.readFileSync(path.join(h.root,'public/_redirects'),'utf8'),'/existing /kept 302\n')
  assert.equal(fs.existsSync(path.join(h.root,'data/media-redirects.json')),false)
})

test('bad remote bytes or old URLs not yet deployed prevent local removal',async t=>{
  const h=fixture(t)
  await assert.rejects(verifyMedia(h.root,h.plan,async()=>new Response('bad',{headers:{'Content-Type':'video/mp4','Access-Control-Allow-Origin':'*'}})),/hash mismatch/)
  await activateMedia(h.root,h.plan,h.remote)
  const unswitched=(url,options)=>String(url).startsWith('https://2aran.com/') ? Promise.resolve(new Response(h.data)) : h.remote(url,options)
  await assert.rejects(pruneMedia(h.root,h.plan,h.backup,{fetcher:unswitched}),/not switched/)
  assert.ok(fs.existsSync(path.join(h.root,h.entry.path)))
})

test('build routes keep dynamic feed pages and exclude migrated media for Pages redirects',async t=>{
  const h=fixture(t)
  await activateMedia(h.root,h.plan,h.remote)
  const output=path.join(h.root,'.vercel/output/static')
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:['/_next/static/*']}))
  const script=fileURLToPath(new URL('../../scripts/patch-pages-routes.cjs',import.meta.url))
  const result=spawnSync(process.execPath,[script],{cwd:h.root,encoding:'utf8'})
  assert.equal(result.status,0,result.stderr)
  const routes=JSON.parse(fs.readFileSync(path.join(output,'_routes.json'),'utf8'))
  assert.ok(routes.exclude.includes('/feed/sample.mp4'))
  assert.ok(!routes.exclude.includes('/feed/*'))
  assert.deepEqual(mediaRouteExclusions([{oldUrl:'/images/a.png'},{oldUrl:'/images/b.png'}]),['/images/*'])
})

test('upload CLI invokes the configured public bucket with immutable keys and verifies before reuse',t=>{
  const h=fixture(t)
  for(const directory of ['scripts/lib','node_modules/wrangler/bin']) fs.mkdirSync(path.join(h.root,directory),{recursive:true})
  for(const relative of ['scripts/migrate-content-media.mjs','scripts/lib/content-media-migration.mjs']) fs.copyFileSync(new URL(`../../${relative}`,import.meta.url),path.join(h.root,relative))
  fs.writeFileSync(path.join(h.root,'wrangler.toml'),'[[r2_buckets]]\nbinding = "MEDIA"\nbucket_name = "tuaran-media"\n')
  const stored=path.join(h.root,'fake-r2-object')
  const calls=path.join(h.root,'fake-wrangler-calls')
  fs.writeFileSync(path.join(h.root,'node_modules/wrangler/bin/wrangler.js'),`const fs=require('node:fs'); const args=process.argv.slice(2); fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify(args)+'\\n'); fs.copyFileSync(args[args.indexOf('--file')+1],${JSON.stringify(stored)});`)
  const mock=path.join(h.root,'mock-network.mjs')
  fs.writeFileSync(mock,`import fs from 'node:fs';globalThis.fetch=async(url,options={})=>{if(!fs.existsSync(${JSON.stringify(stored)}))return new Response('',{status:404});const body=fs.readFileSync(${JSON.stringify(stored)});if(options.headers?.Range)return new Response(body.subarray(0,16),{status:206});return new Response(body,{headers:{'Content-Type':'video/mp4','Access-Control-Allow-Origin':'*'}})};`)
  const planFile=path.join(h.root,'plan.json');fs.writeFileSync(planFile,JSON.stringify(h.plan))
  const run=()=>spawnSync(process.execPath,['--import',mock,path.join(h.root,'scripts/migrate-content-media.mjs'),'upload','--plan',planFile],{cwd:h.root,encoding:'utf8'})
  const first=run();assert.equal(first.status,0,first.stderr)
  const args=JSON.parse(fs.readFileSync(calls,'utf8').trim())
  assert.equal(args[3],`tuaran-media/${h.plan.entries[0].objectKey}`)
  assert.ok(args.includes('--remote'));assert.ok(args.includes('video/mp4'))
  const second=run();assert.equal(second.status,0,second.stderr)
  assert.equal(fs.readFileSync(calls,'utf8').trim().split('\n').length,1)
})
