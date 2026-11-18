import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8')

function load(name, scope, exports) {
  const source = read(name).replace(/^import .*\n/gm, '').replace(/export /g, '')
  return new Function(...Object.keys(scope), `${source}\nreturn {${exports.join(',')}}`)(...Object.values(scope))
}

test('readArchivedArticle loads a matching archive JSON and rejects invalid slugs', async () => {
  const requests = []
  const article = { slug: 'diary-self-reflection', title: '浮生日记（连载中）📓', content: ['ok'] }
  const { readArchivedArticle } = load('lib/article/articleArchiveRuntime.js', {
    readContentAsset: async (pathname) => {
      requests.push(pathname)
      return article
    },
  }, ['readArchivedArticle'])

  assert.equal(await readArchivedArticle('Diary-Self-Reflection'), null)
  assert.equal(await readArchivedArticle('../secret'), null)
  assert.equal(await readArchivedArticle('diary_self_reflection'), null)
  assert.deepEqual(await readArchivedArticle('diary-self-reflection'), article)
  assert.deepEqual(requests, ['/data/article-archive/diary-self-reflection.json'])
})

test('readArchivedArticle returns null when the asset is missing or the slug does not match', async () => {
  const { readArchivedArticle: missing } = load('lib/article/articleArchiveRuntime.js', {
    readContentAsset: async () => {
      throw new Error('Content catalog unavailable')
    },
  }, ['readArchivedArticle'])
  assert.equal(await missing('diary-self-reflection'), null)

  const { readArchivedArticle: mismatch } = load('lib/article/articleArchiveRuntime.js', {
    readContentAsset: async () => ({ slug: 'other-article', content: ['nope'] }),
  }, ['readArchivedArticle'])
  assert.equal(await mismatch('diary-self-reflection'), null)
})

test('public diary and home routes do not import full archived article bodies', () => {
  const diaryPage = read('app/(site)/diary/page.jsx')
  const homePage = read('app/(site)/page.jsx')
  assert.equal(diaryPage.includes("articles/articlesData"), false)
  assert.equal(homePage.includes("articles/articlesData"), false)
  assert.match(diaryPage, /readArchivedArticle/)
  assert.match(homePage, /public\/data\/article-archive\/diary-self-reflection\.json/)
  assert.ok(fs.existsSync(path.join(root, 'public/data/article-archive/diary-self-reflection.json')))
})
