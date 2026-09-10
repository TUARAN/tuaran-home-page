#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { markdownFileToDraft } from '../lib/articleDocument.mjs'

const file = process.argv[2]
if (!file || process.argv.length !== 3) {
  console.error('Usage: node scripts/prepare-markdown-article.mjs article.md > draft.json\n仅生成草稿请求；后台「写文章 → 导入 Markdown」可直接读取原 .md 文件。')
  process.exit(1)
}
const draft = markdownFileToDraft(await readFile(file, 'utf8'), path.basename(file))
console.log(JSON.stringify({ ...draft, status: 'draft' }, null, 2))
