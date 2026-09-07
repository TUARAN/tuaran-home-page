import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourcePath = path.join(root, 'data', 'a-shares', 'companies.json')
const outputDir = path.join(root, 'public', 'generated', 'a-shares')
const pageSize = 100

const snapshot = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const companies = Array.isArray(snapshot.companies) ? snapshot.companies : []
const total = companies.length
const totalPages = Math.max(1, Math.ceil(total / pageSize))

fs.rmSync(outputDir, { recursive: true, force: true })
fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify({ pageSize, total, totalPages }),
)

for (let page = 1; page <= totalPages; page += 1) {
  const start = (page - 1) * pageSize
  fs.writeFileSync(
    path.join(outputDir, `page-${page}.json`),
    JSON.stringify({
      page,
      pageSize,
      total,
      totalPages,
      companies: companies.slice(start, start + pageSize),
    }),
  )
}

console.log(`[a-share-pages] generated ${totalPages} pages for ${total} companies`)
