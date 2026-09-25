import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

import { diaryContentFromMarkdown, legacyArticleToMarkdown } from '../../lib/legacyArticleMigration.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))

function legacyArticles() {
  const filename = path.join(root, 'app/(site)/articles/articlesData.js')
  const source = fs.readFileSync(filename, 'utf8').replace(
    /^import (\w+) from '([^']+\.json)'\s*$/gm,
    (_, name, relative) => `const ${name} = ${fs.readFileSync(path.resolve(path.dirname(filename), relative), 'utf8')};`,
  ).replace('export const articles =', 'const articles =')
  return JSON.parse(vm.runInNewContext(`${source}\nJSON.stringify(articles)`))
}

test('legacy article migration inserts every article and its public index', () => {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(fs.readFileSync(path.join(root, 'migrations/0024_article_posts.sql'), 'utf8'))
  sqlite.exec(fs.readFileSync(path.join(root, 'migrations/0035_content_index.sql'), 'utf8'))
  sqlite.exec(fs.readFileSync(path.join(root, 'migrations/0097_unify_legacy_articles.sql'), 'utf8'))

  const articles = legacyArticles()
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM article_posts').get().count, articles.length)
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM content_index').get().count, articles.length)
  assert.equal(sqlite.prepare("SELECT href FROM content_index WHERE slug = 'diary-self-reflection'").get().href, '/diary')

  for (const article of articles) {
    const row = sqlite.prepare('SELECT * FROM article_posts WHERE slug = ?').get(article.slug)
    assert.equal(row.status, 'published')
    assert.equal(JSON.parse(row.content_json).markdown, legacyArticleToMarkdown(article))
    assert.equal(row.published_at, Date.parse(`${article.date}T00:00:00Z`))
  }
  sqlite.close()
})

test('diary Markdown round-trips dated entries, labels and categories', () => {
  const diary = legacyArticles().find((article) => article.slug === 'diary-self-reflection')
  assert.deepEqual(diaryContentFromMarkdown(legacyArticleToMarkdown(diary)), diary.content)
})
