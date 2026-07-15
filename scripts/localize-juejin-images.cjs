const fs = require('node:fs/promises')
const path = require('node:path')

async function main() {
  const articleId = process.argv[2]
  if (!articleId) throw new Error('Usage: node scripts/localize-juejin-images.cjs <article-id>')

  const root = process.cwd()
  const sourcePath = path.join(root, 'content', 'articles', `juejin-${articleId}.json`)
  const imageDir = path.join(root, 'public', 'images', 'articles', articleId)
  const article = JSON.parse(await fs.readFile(sourcePath, 'utf8'))
  const imagePattern = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g
  const matches = [...article.markdown.matchAll(imagePattern)]

  await fs.mkdir(imageDir, { recursive: true })

  let markdown = article.markdown
  for (const [index, match] of matches.entries()) {
    const response = await fetch(match[2], {
      headers: { 'user-agent': 'Mozilla/5.0' },
      redirect: 'follow',
    })
    if (!response.ok) throw new Error(`Image ${index + 1} failed: ${response.status} ${match[2]}`)
    const extension = response.headers.get('content-type')?.includes('png') ? 'png' : 'webp'
    const filename = `image-${String(index + 1).padStart(2, '0')}.${extension}`
    await fs.writeFile(path.join(imageDir, filename), Buffer.from(await response.arrayBuffer()))
    markdown = markdown.replace(match[2], `/images/articles/${articleId}/${filename}`)
  }

  await fs.writeFile(sourcePath, `${JSON.stringify({ ...article, markdown }, null, 2)}\n`)
  console.log(`Localized ${matches.length} images for ${articleId}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
