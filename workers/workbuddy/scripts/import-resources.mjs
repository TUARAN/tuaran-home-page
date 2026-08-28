// Upload immutable originals, read every object back, then generate catalog SQL.
// The SQL is applied separately, only after all objects have passed verification.
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const [sourceRoot, manifestPath, outputDir] = process.argv.slice(2)
if (!sourceRoot || !manifestPath || !outputDir) throw new Error('Usage: node import-resources.mjs <source-directory> <manifest.json> <output-directory>')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
if (manifest.bucket !== 'workbuddy-private') throw new Error('Only the private WorkBuddy bucket is allowed')
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const sources = new Map()
for (const file of manifest.files) {
  const source = path.resolve(sourceRoot, file.source)
  if (!source.startsWith(path.resolve(sourceRoot) + path.sep)) throw new Error('Source outside import directory')
  if (!file.objectKey.startsWith('workbuddy/') || !file.objectKey.includes(file.sha256.slice(0, 16))) throw new Error('Object key must be content addressed')
  const bytes = await readFile(source)
  if (bytes.length !== file.sizeBytes || hash(bytes) !== file.sha256) throw new Error(`Source changed: ${file.id}`)
  sources.set(file.id, source)
}
await mkdir(outputDir, { recursive: true })
const scratch = await mkdtemp(path.join(tmpdir(), 'workbuddy-readback-'))
const run = (args) => new Promise((resolve, reject) => {
  const child = spawn('pnpm', ['dlx', 'wrangler@4.126.0', ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let logs = ''
  child.stdout.on('data', (chunk) => { logs = (logs + chunk).slice(-2500) })
  child.stderr.on('data', (chunk) => { logs = (logs + chunk).slice(-2500) })
  child.on('error', reject)
  child.on('close', (code) => code === 0 ? resolve() : reject(new Error(logs)))
})
const receiptPath = path.join(outputDir, 'verified.json')
let receipts = []
try { receipts = JSON.parse(await readFile(receiptPath, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
let next = 0
// Bounded concurrency, with serialized receipt writes and no catalog mutation here.
let receiptWrite = Promise.resolve()
async function uploadNext() {
  while (next < manifest.files.length) {
    const file = manifest.files[next++]
    const object = `${manifest.bucket}/${file.objectKey}`
    const destination = path.join(scratch, file.id)
    let complete = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (!receipts.some((r) => r.objectKey === file.objectKey && r.sha256 === file.sha256)) {
          await run(['r2', 'object', 'put', object, '--file', sources.get(file.id), '--remote', '--content-type', file.contentType, '--cache-control', 'private, no-store'])
        }
        await run(['r2', 'object', 'get', object, '--file', destination, '--remote'])
        const bytes = await readFile(destination)
        if (bytes.length !== file.sizeBytes || hash(bytes) !== file.sha256) throw new Error(`Read-back mismatch: ${file.id}`)
        await rm(destination)
        receipts = receipts.filter((r) => r.objectKey !== file.objectKey)
        receipts.push({ id: file.id, objectKey: file.objectKey, sha256: file.sha256, sizeBytes: file.sizeBytes })
        const snapshot = JSON.stringify(receipts, null, 2) + '\n'
        receiptWrite = receiptWrite.then(() => writeFile(receiptPath, snapshot))
        await receiptWrite
        console.log(JSON.stringify({ verified: receipts.length, total: manifest.files.length, id: file.id }))
        complete = true
        break
      } catch (error) {
        if (attempt === 3) throw error
        console.error(`Retry ${attempt}: ${file.id}`)
      }
    }
    if (!complete) throw new Error(`Incomplete upload: ${file.id}`)
  }
}
const outcomes = await Promise.allSettled(Array.from({ length: 3 }, uploadNext))
await rm(scratch, { recursive: true, force: true })
const failure = outcomes.find((r) => r.status === 'rejected')
if (failure) throw failure.reason
if (manifest.files.some((f) => !receipts.some((r) => r.objectKey === f.objectKey && r.sha256 === f.sha256))) throw new Error('Incomplete verification')
const quote = (value) => value == null ? 'NULL' : typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`
const now = Date.now()
const sql = []
for (const resource of manifest.resources) {
  const columns = ['id', 'slug', 'resource_key', 'title', 'eyebrow', 'summary', 'description', 'category', 'format', 'tags_json', 'highlights_json', 'color', 'cost_points', 'page_count', 'duration_minutes', 'featured', 'status', 'sort_order', 'published_at', 'updated_at']
  const values = [resource.id, resource.slug, resource.resourceKey, resource.title, resource.eyebrow, resource.summary, resource.description, resource.category, resource.format, JSON.stringify(resource.tags), JSON.stringify(resource.highlights), resource.color, resource.costPoints, resource.pageCount, resource.durationMinutes, Number(resource.featured), 'published', resource.sortOrder, now, now]
  // Preserve existing identity, price, visibility and publication date on re-import.
  const updates = columns.filter((c) => !['id', 'slug', 'resource_key', 'cost_points', 'status', 'published_at'].includes(c))
  sql.push(`INSERT INTO workbuddy_resources (${columns.join(',')}) VALUES (${values.map(quote).join(',')}) ON CONFLICT(id) DO UPDATE SET ${updates.map((c) => `${c}=excluded.${c}`).join(',')};`)
  sql.push(`INSERT OR IGNORE INTO gated_resources (resource_key,cost_points,min_role,created_at) VALUES (${[resource.resourceKey, resource.costPoints, 'guest', now].map(quote).join(',')});`)
}
for (const file of manifest.files) {
  const columns = ['id', 'resource_id', 'label', 'object_key', 'file_name', 'content_type', 'size_bytes', 'delivery', 'sort_order', 'created_at']
  const values = [file.id, file.resourceId, file.label, file.objectKey, file.fileName, file.contentType, file.sizeBytes, file.delivery, file.sortOrder, now]
  sql.push(`INSERT INTO workbuddy_files (${columns.join(',')}) VALUES (${values.map(quote).join(',')}) ON CONFLICT(id) DO UPDATE SET ${columns.filter((c) => !['id', 'created_at'].includes(c)).map((c) => `${c}=excluded.${c}`).join(',')};`)
}
await writeFile(path.join(outputDir, 'catalog.sql'), sql.join('\n') + '\n')
console.log(`Verified ${manifest.files.length} files. Ready: ${path.join(outputDir, 'catalog.sql')}`)
