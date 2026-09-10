#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { prepareMediaPlan, verifyMedia, activateMedia, pruneMedia, rollbackMedia } from './lib/content-media-migration.mjs'

const root = fileURLToPath(new URL('../',import.meta.url))
const args = process.argv.slice(2)
const mode = args[0]
const value = (name) => { const index=args.indexOf(name); return index<0 ? '' : args[index+1] || '' }
if (!['prepare','upload','verify','activate','prune','rollback'].includes(mode)) throw new Error('Usage: migrate-content-media.mjs prepare --inventory FILE --base-url HTTPS_URL --bucket MEDIA_BUCKET --plan FILE | upload/verify/activate --plan FILE | prune/rollback --plan FILE --backup DIRECTORY')
const planPath = value('--plan')
if (!planPath) throw new Error('--plan is required')
if (mode === 'prepare') {
  const inventory = JSON.parse(fs.readFileSync(value('--inventory'),'utf8'))
  const plan = prepareMediaPlan(root,inventory,{baseUrl:value('--base-url'),bucket:value('--bucket')})
  fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n')
  console.log(`[media-migration] prepared ${plan.entries.length} files; no network requests or source edits`)
} else {
  const plan = JSON.parse(fs.readFileSync(planPath,'utf8'))
  if (plan.version !== 1 || !Array.isArray(plan.entries) || !plan.entries.length) throw new Error('Invalid migration plan')
  if (mode === 'upload') {
    const config = fs.readFileSync(path.join(root,'wrangler.toml'),'utf8')
    const block = config.split('[[r2_buckets]]').find((part)=>/^binding\s*=\s*"MEDIA"\s*$/m.test(part))
    const mediaBucket = block?.match(/^bucket_name\s*=\s*"([^"]+)"/m)?.[1]
    if (!mediaBucket || plan.bucket !== mediaBucket) throw new Error('Uploads must target the configured public MEDIA bucket')
    for (const entry of plan.entries) {
      // Recreate the plan entry to validate paths, source hashes and object key before a write.
      const baseUrl = entry.url.slice(0,entry.url.indexOf('/content-media/'))
      const validated = prepareMediaPlan(root,{files:[{...entry,visibility:'public',migrationStatus:'approved'}]},{baseUrl,bucket:plan.bucket}).entries[0]
      if (JSON.stringify(validated) !== JSON.stringify(entry)) throw new Error('Plan entry was changed; prepare it again')
      const response = await fetch(entry.url,{redirect:'error',cache:'no-store'})
      if (response.status === 200) { await verifyMedia(root,{entries:[entry]}); continue }
      if (response.status !== 404) throw new Error(`Unexpected R2 response: ${response.status}`)
      const result = spawnSync(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'r2','object','put',`${plan.bucket}/${entry.objectKey}`,'--remote','--file',path.join(root,entry.path),'--content-type',entry.contentType,'--cache-control','public, max-age=31536000, immutable'],{cwd:root,stdio:'inherit'})
      if (result.status !== 0) throw new Error(`R2 upload failed: ${entry.path}`)
      await verifyMedia(root,{entries:[entry]})
    }
  } else if (mode === 'verify') await verifyMedia(root,plan)
  else if (mode === 'activate') await activateMedia(root,plan)
  else {
    const backup = value('--backup')
    if (!backup) throw new Error('--backup is required')
    if (mode === 'prune') await pruneMedia(root,plan,backup)
    else rollbackMedia(root,plan,backup)
  }
  console.log(`[media-migration] ${mode} complete; no commit or deployment performed`)
}
