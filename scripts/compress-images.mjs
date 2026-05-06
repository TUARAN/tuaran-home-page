// One-shot image cleanup + compression.
// 用法：node scripts/compress-images.mjs
//
// 1) 删除 public 下确认零引用的废弃资源（banner、images/thumbnails）。
// 2) 把 public/reading/*.png（书架预览缩略图）转成 480px 宽的 WebP，
//    并删除原 PNG。配套修改：app/components/ReadingPyramid.jsx:237 的
//    后缀必须从 .png 改成 .webp。
//
// 幂等：再次运行时已删除/已转换的文件会被跳过。

import { readdir, stat, unlink, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..')
const publicDir = path.join(repoRoot, 'public')

const ORPHAN_DIRS = [
  path.join(publicDir, 'banner'),
  path.join(publicDir, 'images', 'thumbnails'),
]

const READING_DIR = path.join(publicDir, 'reading')
const READING_TARGET_WIDTH = 480
const READING_WEBP_QUALITY = 82

function fmtBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

async function dirSize(dir) {
  if (!existsSync(dir)) return 0
  const entries = await readdir(dir, { withFileTypes: true })
  let total = 0
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      total += await dirSize(full)
    } else {
      const s = await stat(full)
      total += s.size
    }
  }
  return total
}

async function rmDirRecursive(dir) {
  if (!existsSync(dir)) return 0
  const before = await dirSize(dir)
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await rmDirRecursive(full)
    } else {
      await unlink(full)
    }
  }
  // 用 rmdir 通过 fs/promises
  const { rmdir } = await import('node:fs/promises')
  await rmdir(dir)
  return before
}

async function step1DropOrphans() {
  console.log('\n=== Step 1: drop unreferenced assets ===')
  let saved = 0
  for (const dir of ORPHAN_DIRS) {
    if (!existsSync(dir)) {
      console.log(`  skip ${path.relative(repoRoot, dir)} (already gone)`)
      continue
    }
    const before = await rmDirRecursive(dir)
    saved += before
    console.log(`  removed ${path.relative(repoRoot, dir)} — ${fmtBytes(before)}`)
  }
  console.log(`  total saved: ${fmtBytes(saved)}`)
  return saved
}

async function step2CompressReading() {
  console.log('\n=== Step 2: convert reading/*.png → reading/*.webp ===')
  if (!existsSync(READING_DIR)) {
    console.log('  skip — reading dir not found')
    return 0
  }
  const entries = await readdir(READING_DIR)
  let savedTotal = 0
  let convertedCount = 0
  for (const name of entries) {
    if (!name.endsWith('.png')) continue
    const pngPath = path.join(READING_DIR, name)
    const webpPath = path.join(READING_DIR, name.replace(/\.png$/, '.webp'))

    if (existsSync(webpPath)) {
      // 已转换 + 旧 PNG 还在 → 删旧 PNG；否则跳过
      const pngExists = existsSync(pngPath)
      if (pngExists) {
        const beforeSize = (await stat(pngPath)).size
        await unlink(pngPath)
        savedTotal += beforeSize
        console.log(`  drop stale ${name} — ${fmtBytes(beforeSize)}`)
      }
      continue
    }

    const beforeSize = (await stat(pngPath)).size
    await sharp(pngPath)
      .resize({ width: READING_TARGET_WIDTH, withoutEnlargement: true })
      .webp({ quality: READING_WEBP_QUALITY })
      .toFile(webpPath)
    const afterSize = (await stat(webpPath)).size
    await unlink(pngPath)
    savedTotal += beforeSize - afterSize
    convertedCount += 1
    console.log(
      `  ${name} → ${path.basename(webpPath)} : ${fmtBytes(beforeSize)} → ${fmtBytes(afterSize)} (-${fmtBytes(beforeSize - afterSize)})`
    )
  }
  console.log(`  converted: ${convertedCount}, total saved: ${fmtBytes(savedTotal)}`)
  return savedTotal
}

async function main() {
  const beforePublic = await dirSize(publicDir)
  console.log(`public/ before: ${fmtBytes(beforePublic)}`)

  const a = await step1DropOrphans()
  const b = await step2CompressReading()

  const afterPublic = await dirSize(publicDir)
  console.log(`\npublic/ after: ${fmtBytes(afterPublic)}`)
  console.log(`net delta: ${fmtBytes(beforePublic - afterPublic)} (orphan ${fmtBytes(a)} + compress ${fmtBytes(b)})`)
  console.log('\n⚠️  Manual follow-up: update ReadingPyramid.jsx to use `.webp` extension.')
}

main().catch((error) => {
  console.error('compress-images failed:', error)
  process.exit(1)
})
