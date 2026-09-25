#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

import { legacyArticleToMarkdown } from '../lib/legacyArticleMigration.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sourcePath = path.join(root, 'app/(site)/articles/articlesData.js')
const source = fs.readFileSync(sourcePath, 'utf8').replace(
  /^import (\w+) from '([^']+\.json)'\s*$/gm,
  (_, name, relative) => `const ${name} = ${fs.readFileSync(path.resolve(path.dirname(sourcePath), relative), 'utf8')};`,
).replace('export const articles =', 'const articles =')
const articles = vm.runInNewContext(`${source}\nJSON.parse(JSON.stringify(articles))`, {}, { timeout: 5000 })

function literal(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`
}

const slugs = articles.map((article) => article.slug)
const inserts = articles.map((article) => {
  const markdown = legacyArticleToMarkdown(article)
  const timestamp = Date.parse(`${article.date}T00:00:00Z`)
  return `WITH payload(markdown) AS (VALUES (${literal(markdown)}))
INSERT INTO article_posts (
  id, slug, title, summary, cover_url, content_json, content_text, tags_json,
  status, revision, created_at, updated_at, published_at
)
SELECT
  ${literal(`legacy-${article.slug}`)}, ${literal(article.slug)}, ${literal(article.title)},
  ${literal(article.summary || '')}, ${literal(article.cover || '')},
  json_object('type', 'markdown', 'markdown', markdown), markdown,
  ${literal(JSON.stringify(article.tags || []))}, 'published', 1,
  ${timestamp}, ${timestamp}, ${timestamp}
FROM payload
WHERE 1
ON CONFLICT(slug) DO NOTHING;`
})

const slugList = slugs.map(literal).join(', ')
const sql = `-- 将构建期历史普通文章迁入 article_posts，使后台编辑器成为唯一可编辑正本。
-- 旧的静态 metadata / archive 仍可作为迁移期回退，运行时优先读取 D1。
${inserts.join('\n\n')}

INSERT INTO content_index (
  content_key, content_type, category, slug, title, summary, tags_json, href,
  date, status, source, created_at, updated_at
)
SELECT
  'article:' || slug,
  'article',
  'posts',
  slug,
  title,
  CASE WHEN TRIM(COALESCE(summary, '')) <> '' THEN summary ELSE SUBSTR(content_text, 1, 160) END,
  COALESCE(tags_json, '[]'),
  CASE WHEN slug = 'diary-self-reflection' THEN '/diary' ELSE '/articles/' || slug END,
  STRFTIME('%Y-%m-%d', COALESCE(published_at, updated_at, created_at) / 1000, 'unixepoch'),
  'published',
  'manual',
  created_at,
  updated_at
FROM article_posts
WHERE slug IN (${slugList})
ON CONFLICT(content_key) DO UPDATE SET
  content_type = excluded.content_type,
  category = excluded.category,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  tags_json = excluded.tags_json,
  href = excluded.href,
  date = excluded.date,
  status = excluded.status,
  source = excluded.source,
  updated_at = excluded.updated_at;
`

const output = path.join(root, 'migrations/0097_unify_legacy_articles.sql')
fs.writeFileSync(output, sql)
console.log(`[article-migration] ${articles.length} articles -> ${path.relative(root, output)}`)
