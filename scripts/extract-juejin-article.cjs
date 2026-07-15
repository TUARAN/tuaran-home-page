const fs = require('node:fs')

const articleId = process.argv[2]
const inputPath = process.argv[3]
const outputPath = process.argv[4]

if (!articleId || !inputPath || !outputPath) {
  throw new Error('Usage: node scripts/extract-juejin-article.cjs <article-id> <input-html> <output-json>')
}

const html = fs.readFileSync(inputPath, 'utf8')
const match = html.match(/mark_content:("(?:\\.|[^"\\])*")/)

if (!match) throw new Error(`Cannot find mark_content for ${articleId}`)

const markdown = JSON.parse(match[1])
const titleMatch = html.match(/<title>(.*?)\s*-\s*掘金<\/title>/s)
const descriptionMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/)

fs.writeFileSync(
  outputPath,
  `${JSON.stringify({
    articleId,
    title: titleMatch?.[1]?.trim() || '',
    description: descriptionMatch?.[1]?.trim() || '',
    markdown,
    sourceUrl: `https://juejin.cn/post/${articleId}`,
  }, null, 2)}\n`,
)
