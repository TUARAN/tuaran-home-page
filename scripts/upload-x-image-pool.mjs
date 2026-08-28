#!/usr/bin/env node
// Upload only pre-generated files listed in a local manifest. No generation or posting.
import { readFile, writeFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2]
const output = process.argv[3]
if (!input || !output) throw new Error('Usage: node scripts/upload-x-image-pool.mjs <local-manifest.json> <verified-manifest.json>')
const items = JSON.parse(await readFile(input, 'utf8'))
const types = new Set(['greeting', 'community-image', 'culture-story', 'crypto-insight', 'us-english'])
const base = 'https://pub-09012f26768b4d39908a8a574af8fde1.r2.dev'
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`
const verified = []
for (const item of items) {
  if (!/^[a-z0-9-]+$/.test(item.id) || !types.has(item.type)) throw new Error('Invalid asset identity')
  const source = path.resolve(item.sourcePath)
  if (source.startsWith(`${root}${path.sep}`)) throw new Error('Image originals must remain outside the repository')
  const bytes = await readFile(source)
  if (bytes.length > 5 * 1024 * 1024 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error(`Invalid or oversized PNG: ${item.id}`)
  const hash = createHash('sha256').update(bytes).digest('hex')
  const key = `images/x-posts/pool/2026-08-28/${item.id}-${hash.slice(0, 12)}.png`
  await new Promise((resolve, reject) => {
    const child = spawn(path.join(root, 'node_modules/.bin/wrangler'), ['r2', 'object', 'put', `tuaran-media/${key}`, '--file', source, '--remote', '--content-type', 'image/png', '--cache-control', 'public, max-age=31536000, immutable'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let logs = ''
    child.stdout.on('data', (chunk) => { logs = (logs + chunk).slice(-3000) })
    child.stderr.on('data', (chunk) => { logs = (logs + chunk).slice(-3000) })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Upload failed for ${item.id}: ${logs}`)))
  })
  const response = await fetch(`${base}/${key}`, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Public read-back failed: ${item.id} HTTP ${response.status}`)
  const remoteHash = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')
  if (remoteHash !== hash) throw new Error(`R2 hash mismatch: ${item.id}`)
  const entry = { ...item, objectKey: key, sha256: hash, sizeBytes: (await stat(source)).size, model: 'Codex imagegen', publicUrl: `${base}/${key}` }
  verified.push(entry)
  await writeFile(output, `${JSON.stringify(verified, null, 2)}\n`)
  const sql = verified.map((row) => `INSERT INTO x_image_pool (id,content_type,title,object_key,mime_type,size_bytes,image_model,prompt,created_at) VALUES (${[row.id, row.type, row.title, row.objectKey, 'image/png'].map(quote).join(',')},${row.sizeBytes},${quote(row.model)},${quote(row.prompt)},${Date.now()}) ON CONFLICT(id) DO UPDATE SET object_key=excluded.object_key,size_bytes=excluded.size_bytes,image_model=excluded.image_model,prompt=excluded.prompt;`).join('\n')
  await writeFile(`${output}.sql`, `${sql}\n`)
  console.log(JSON.stringify({ uploaded: verified.length, total: items.length, id: item.id, bytes: bytes.length, sha256: hash }))
}
