import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const input = process.argv[2]
if (!input) throw new Error('用法: node scripts/import-big-interaction-archive-images.mjs <带图片的归档 JSON>')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'lib/interaction/bigInteractionArchive.json')
const archive = JSON.parse(await readFile(dataPath, 'utf8'))
const supplied = JSON.parse(await readFile(input, 'utf8'))
if (supplied.account !== archive.account) throw new Error('账号不匹配')
const outputDir = path.join(root, 'public/resources/big-interaction-whitepaper/archive')
await mkdir(outputDir, { recursive: true })

const PUBLIC_PREFIX = '/resources/big-interaction-whitepaper/archive/'

function remoteUrl(image) {
  if (typeof image === 'string') return image
  if (image && typeof image === 'object' && typeof image.url === 'string') return image.url
  return ''
}

function relativeLocalPath(image) {
  if (!image || typeof image !== 'object' || typeof image.localPath !== 'string') return ''
  const localPath = image.localPath.trim()
  if (!localPath || localPath.startsWith('/') || localPath.includes('..')) return ''
  return localPath
}

function stillRemote(post) {
  return (post.images || []).some((image) => {
    const localPath = image && typeof image === 'object' ? image.localPath : ''
    const hasPublicFile = typeof localPath === 'string' && localPath.startsWith(PUBLIC_PREFIX)
    return remoteUrl(image).startsWith('https://') && !hasPublicFile
  })
}

const inputDir = path.dirname(path.resolve(input))
const usesLocalFiles = (supplied.posts || []).some((post) => (post.images || []).some((image) => relativeLocalPath(image)))
// 相对 localPath 表示这份 JSON 自带图片目录。用它的帖子列表替换归档，并把图片复制到 public。

if (usesLocalFiles) {
  let saved = 0
  const posts = []
  for (const post of supplied.posts || []) {
    const images = []
    for (const image of post.images || []) {
      const relativePath = relativeLocalPath(image)
      if (!relativePath) {
        if (typeof image === 'string' && image) images.push(image)
        else if (remoteUrl(image)) images.push(image)
        continue
      }
      const filename = path.basename(relativePath)
      const suffix = filename.slice(String(post.id).length)
      if (!filename.startsWith(`${post.id}-`) || !/^-\d+\.(jpg|jpeg|png|webp|gif)$/.test(suffix)) {
        throw new Error(`图片文件名无效：${post.id} ${relativePath}`)
      }
      const sourceFile = path.resolve(inputDir, relativePath)
      if (!sourceFile.startsWith(`${inputDir}${path.sep}`)) throw new Error(`图片路径越界：${post.id}`)
      await copyFile(sourceFile, path.join(outputDir, filename))
      images.push({
        url: remoteUrl(image),
        localPath: `${PUBLIC_PREFIX}${filename}`,
      })
      saved++
    }
    posts.push({ ...post, images })
  }
  const next = {
    account: supplied.account,
    checked: supplied.checked,
    capturedAt: supplied.capturedAt,
    posts,
  }
  await writeFile(dataPath, `${JSON.stringify(next, null, 2)}\n`)
  const remotePosts = next.posts.filter(stillRemote).length
  console.log(`已写入 ${posts.length} 条帖子，复制 ${saved} 张图片；${remotePosts} 条帖子仍只有外链`)
} else {
  const sourceById = new Map((supplied.posts || []).map((post) => [post.id, post]))
  let saved = 0
  for (const post of archive.posts) {
    const source = sourceById.get(post.id)
    if (!source) continue
    const localImages = []
    for (let index = 0; index < (post.images || []).length; index++) {
      const original = remoteUrl(post.images[index])
      const embedded = (source.imageData || []).find((item) => item.url === original)
      if (!embedded) continue
      const match = String(embedded.dataUrl || '').match(/^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/u)
      if (!match) throw new Error(`图片数据无效：${post.id}`)
      const ext = { jpeg: 'jpg', png: 'png', webp: 'webp', gif: 'gif' }[match[1]]
      const bytes = Buffer.from(match[2], 'base64')
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error(`图片大小无效：${post.id}`)
      const filename = `${post.id}-${index + 1}.${ext}`
      await writeFile(path.join(outputDir, filename), bytes)
      localImages.push(`${PUBLIC_PREFIX}${filename}`)
      saved++
    }
    if (localImages.length && localImages.length === post.images.length) {
      post.images = post.images.map((image, index) => ({
        url: remoteUrl(image),
        localPath: localImages[index],
      }))
    }
  }
  await writeFile(dataPath, `${JSON.stringify(archive, null, 2)}\n`)
  console.log(`已保存 ${saved} 张图片；${archive.posts.filter(stillRemote).length} 条帖子仍只有外链`)
}
