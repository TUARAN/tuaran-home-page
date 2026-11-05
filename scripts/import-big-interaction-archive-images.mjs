import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const input = process.argv[2]
if (!input) throw new Error('用法: node scripts/import-big-interaction-archive-images.mjs <带图片的归档 JSON>')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'lib/interaction/bigInteractionArchive.json')
const archive = JSON.parse(await readFile(dataPath, 'utf8'))
const supplied = JSON.parse(await readFile(input, 'utf8'))
if (supplied.account !== archive.account) throw new Error('账号不匹配')
const sourceById = new Map((supplied.posts || []).map((post) => [post.id, post]))
const outputDir = path.join(root, 'public/resources/big-interaction-whitepaper/archive')
await mkdir(outputDir, { recursive: true })
let saved = 0
for (const post of archive.posts) {
  const source = sourceById.get(post.id)
  if (!source) continue
  const localImages = []
  for (let index = 0; index < (post.images || []).length; index++) {
    const original = post.images[index]
    const embedded = (source.imageData || []).find((item) => item.url === original)
    if (!embedded) continue
    const match = String(embedded.dataUrl || '').match(/^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/u)
    if (!match) throw new Error(`图片数据无效：${post.id}`)
    const ext = { jpeg: 'jpg', png: 'png', webp: 'webp', gif: 'gif' }[match[1]]
    const bytes = Buffer.from(match[2], 'base64')
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error(`图片大小无效：${post.id}`)
    const filename = `${post.id}-${index + 1}.${ext}`
    await writeFile(path.join(outputDir, filename), bytes)
    localImages.push(`/resources/big-interaction-whitepaper/archive/${filename}`)
    saved++
  }
  if (localImages.length === post.images.length) post.images = localImages
}
await writeFile(dataPath, `${JSON.stringify(archive, null, 2)}\n`)
console.log(`已保存 ${saved} 张图片；${archive.posts.filter((post) => post.images.some((src) => src.startsWith('https://'))).length} 条帖子仍有外链`)
