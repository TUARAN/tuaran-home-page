import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { parseChromeBookmarks, summarizeBookmarks } from '../lib/bookmarkNavigation.mjs'

const sourcePath = process.argv[2]
if (!sourcePath) {
  console.error('用法：node scripts/audit-chrome-bookmarks.mjs <Chrome 导出的 bookmarks.html>')
  process.exit(1)
}

const html = await readFile(sourcePath, 'utf8')
const entries = parseChromeBookmarks(html)
const summary = summarizeBookmarks(entries)
const checksum = createHash('sha256').update(html).digest('hex')
const sourceFolderCount = (html.match(/<DT><H3\b/gi) || []).length

if (!entries.length) throw new Error('没有从导出文件中解析到书签。')
if (entries.some((entry) => !entry.url || !entry.title || !entry.category)) throw new Error('存在字段不完整的书签。')
if (new Set(entries.map((entry) => entry.id)).size !== entries.length) throw new Error('书签 ID 不唯一。')
if (Object.values(summary.categoryCounts).reduce((sum, count) => sum + count, 0) !== entries.length) {
  throw new Error('分类计数与书签总数不一致。')
}

console.log(JSON.stringify({
  source: path.basename(sourcePath),
  sha256: checksum,
  sourceFolderCount,
  ...summary,
}, null, 2))
