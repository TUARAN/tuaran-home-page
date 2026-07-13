import { execFileSync } from 'node:child_process'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const sourceRoot = path.resolve(
  process.env.AWESOME_NANO_BANANA_DIR || path.join(projectRoot, '..', 'Awesome-Nano-Banana-images'),
)
const galleryRoot = path.join(sourceRoot, 'banana-gallery')
const imagesRoot = path.join(galleryRoot, 'public', 'images')
const outputPath = path.join(projectRoot, 'lib', 'nanoBananaCases.js')

const readme = await readFile(path.join(sourceRoot, 'README.md'), 'utf8')
const sourceCommit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim()

const imageBaseUrl = `https://raw.githubusercontent.com/TUARAN/Awesome-Nano-Banana-images/${sourceCommit}/banana-gallery/public/images`

function sectionBetween(startHeading, endHeading) {
  const start = readme.indexOf(startHeading)
  const end = readme.indexOf(endHeading, start + startHeading.length)
  if (start < 0) throw new Error(`Missing README section: ${startHeading}`)
  return readme.slice(start, end < 0 ? readme.length : end)
}

function parseHeading(raw) {
  const link = raw.match(/^\[([^\]]+)\]\((.+?)\)(?=（|\s*$)/)
  const title = link
    ? link[1]
    : raw.replace(/（by[\s\S]*$/i, '').replace(/\(by[\s\S]*$/i, '').trim()
  const sourceUrl = link?.[2]?.replace(/\*\*/g, '') || ''
  const authorMatch = raw.match(/[（(]by\s+\[(@[^\]]+)\]\(([^)]+)\)/i)
  return {
    title,
    sourceUrl,
    author: authorMatch?.[1] || '',
    authorUrl: authorMatch?.[2] || '',
  }
}

function parseCases(section, prefix, edition) {
  const headings = [...section.matchAll(/^###\s*例\s*(\d+)\s*[:：]\s*(.+)$/gm)]
  return headings.map((heading, index) => {
    const number = Number(heading[1])
    const start = heading.index + heading[0].length
    const end = headings[index + 1]?.index ?? section.length
    const body = section.slice(start, end)
    const prompt = body.match(/\*\*提示词:?\*\*[\s\S]*?```[^\n]*\n([\s\S]*?)```/)?.[1]?.trim() || ''
    return {
      id: `${prefix}${number}`,
      number,
      edition,
      ...parseHeading(heading[2].trim()),
      prompt,
    }
  })
}

const parsedCases = [
  ...parseCases(
    sectionBetween('## 🍌 Nano Banana Pro 例子', '## 🖼️ Nano Banana 例子'),
    'pro_case',
    'pro',
  ),
  ...parseCases(
    sectionBetween('## 🖼️ Nano Banana 例子', '## 🙏 Acknowledge'),
    'case',
    'nano',
  ),
]

const caseById = new Map(parsedCases.map((item) => [item.id, item]))
const directoryNames = await readdir(imagesRoot)

for (const directoryName of directoryNames) {
  const directoryPath = path.join(imagesRoot, directoryName)
  if (!(await stat(directoryPath)).isDirectory()) continue
  const item = caseById.get(directoryName)
  if (!item) continue
  const fileNames = (await readdir(directoryPath))
    .filter((name) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
  item.images = fileNames.map((name) => ({
    name,
    label: /^input/i.test(name) ? '输入' : /^output/i.test(name) ? '输出' : '案例图',
    url: `${imageBaseUrl}/${directoryName}/${encodeURIComponent(name)}`,
  }))
}

const cases = parsedCases
  .filter((item) => item.images?.length)
  .sort((a, b) => (a.edition === b.edition ? a.number - b.number : a.edition.localeCompare(b.edition)))

const output = `/**
 * 由 scripts/generate-nano-banana-gallery.mjs 从本地 Awesome-Nano-Banana-images 生成。
 * 不要手工编辑；更新源项目后运行 npm run gallery:sync。
 */
export const NANO_BANANA_GALLERY_META = ${JSON.stringify({
  sourceRepo: 'https://github.com/TUARAN/Awesome-Nano-Banana-images',
  sourceCommit,
  generatedAt: new Date().toISOString(),
  imageBaseUrl,
}, null, 2)}

export const NANO_BANANA_CASES = ${JSON.stringify(cases, null, 2)}
`

await writeFile(outputPath, output)
console.log(`[nano-banana] generated ${cases.length} cases at ${path.relative(projectRoot, outputPath)}`)
