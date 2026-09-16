#!/usr/bin/env node
// Upload only pre-generated files listed in a local manifest. No generation or posting.
import { readFile, writeFile, stat, unlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2]
const output = process.argv[3]
if (!input || !output) throw new Error('Usage: node scripts/upload-x-image-pool.mjs <local-manifest.json> <verified-manifest.json>')
const items = JSON.parse(await readFile(input, 'utf8'))
const types = new Set(['greeting', 'community-image', 'culture-story', 'crypto-insight', 'us-english'])
const base = 'https://pub-09012f26768b4d39908a8a574af8fde1.r2.dev'
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`
const verified = []

async function uploadAndVerify({ source, bytes, key, contentType, id }) {
  await new Promise((resolve, reject) => {
    const child = spawn(path.join(root, 'node_modules/.bin/wrangler'), ['r2', 'object', 'put', `tuaran-media/${key}`, '--file', source, '--remote', '--content-type', contentType, '--cache-control', 'public, max-age=31536000, immutable'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let logs = ''
    child.stdout.on('data', (chunk) => { logs = (logs + chunk).slice(-3000) })
    child.stderr.on('data', (chunk) => { logs = (logs + chunk).slice(-3000) })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Upload failed for ${id}: ${logs}`)))
  })
  const response = await fetch(`${base}/${key}`, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Public read-back failed: ${id} HTTP ${response.status}`)
  const remote = Buffer.from(await response.arrayBuffer())
  if (!remote.equals(bytes)) throw new Error(`R2 hash mismatch: ${id}`)
}

for (const item of items) {
  if (!/^[a-z0-9-]+$/.test(item.id) || !types.has(item.type)) throw new Error('Invalid asset identity')
  const source = path.resolve(item.sourcePath)
  if (source.startsWith(`${root}${path.sep}`)) throw new Error('Image originals must remain outside the repository')
  const bytes = await readFile(source)
  if (bytes.length > 5 * 1024 * 1024 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error(`Invalid or oversized PNG: ${item.id}`)
  const hash = createHash('sha256').update(bytes).digest('hex')
  const key = `images/x-posts/pool/2026-08-28/${item.id}-${hash.slice(0, 12)}.png`
  const thumbnailBytes = await sharp(bytes).resize(240, 240, { fit: 'cover' }).webp({ quality: 72 }).toBuffer()
  const thumbnailHash = createHash('sha256').update(thumbnailBytes).digest('hex')
  const thumbnailKey = `images/x-posts/pool/thumbs/2026-08-28/${item.id}-${thumbnailHash.slice(0, 12)}.webp`
  const thumbnailSource = `${output}.${item.id}.thumb.webp`
  await writeFile(thumbnailSource, thumbnailBytes)
  try {
    await uploadAndVerify({ source, bytes, key, contentType: 'image/png', id: item.id })
    await uploadAndVerify({ source: thumbnailSource, bytes: thumbnailBytes, key: thumbnailKey, contentType: 'image/webp', id: `${item.id} thumbnail` })
  } finally {
    await unlink(thumbnailSource).catch(() => {})
  }
  const entry = { ...item, objectKey: key, thumbnailObjectKey: thumbnailKey, sha256: hash, thumbnailSha256: thumbnailHash, sizeBytes: (await stat(source)).size, thumbnailSizeBytes: thumbnailBytes.length, model: 'Codex imagegen', publicUrl: `${base}/${key}` }
  verified.push(entry)
  await writeFile(output, `${JSON.stringify(verified, null, 2)}\n`)
  const sql = verified.map((row) => `INSERT INTO x_image_pool (id,content_type,title,object_key,thumbnail_object_key,mime_type,size_bytes,image_model,prompt,created_at) VALUES (${[row.id, row.type, row.title, row.objectKey, row.thumbnailObjectKey, 'image/png'].map(quote).join(',')},${row.sizeBytes},${quote(row.model)},${quote(row.prompt)},${Date.now()}) ON CONFLICT(id) DO UPDATE SET object_key=excluded.object_key,thumbnail_object_key=excluded.thumbnail_object_key,size_bytes=excluded.size_bytes,image_model=excluded.image_model,prompt=excluded.prompt;`).join('\n')
  await writeFile(`${output}.sql`, `${sql}\n`)
  console.log(JSON.stringify({ uploaded: verified.length, total: items.length, id: item.id, bytes: bytes.length, sha256: hash }))
}
