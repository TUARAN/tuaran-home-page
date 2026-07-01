import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_BYTES = 25 * 1024 * 1024
const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

const files = await walk(PUBLIC_DIR)
const oversized = []

for (const file of files) {
  const info = await stat(file)
  if (info.size > MAX_BYTES) {
    oversized.push({
      file: path.relative(PUBLIC_DIR, file),
      size: info.size,
    })
  }
}

if (oversized.length) {
  console.error('[asset-size] Cloudflare Pages only supports files up to 25 MiB.')
  console.error('[asset-size] Move these files to R2 and reference them with R2_PUBLIC_BASE/feedMediaUrl:')
  for (const item of oversized) {
    console.error(`  - public/${item.file} (${formatMiB(item.size)})`)
  }
  process.exit(1)
}

console.log(`[asset-size] public/ assets ok: every file is <= ${formatMiB(MAX_BYTES)}.`)
