import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [
  detailHeaderSource,
  headerActionsSource,
  ownerMetaSource,
  globalsSource,
  articlePageSource,
  publishedArticleSource,
  researchPageSource,
] = await Promise.all([
  readFile(new URL('../../app/(site)/components/ArticleDetailHeader.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/ArticleHeaderActions.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/OwnerOnlyArticleMeta.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/[slug]/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/[slug]/PublishedArticle.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/research/[category]/[slug]/page.jsx', import.meta.url), 'utf8'),
])

test('owner article records live inside the 站长 menu, not a separate header pill', () => {
  assert.doesNotMatch(detailHeaderSource, /OwnerOnlyArticleMeta/)
  assert.doesNotMatch(detailHeaderSource, /ownerMeta/)
  assert.match(headerActionsSource, /ownerMeta/)
  assert.match(headerActionsSource, /OwnerOnlyArticleMeta/)
  assert.match(headerActionsSource, /article-owner-actions-popover[\s\S]*hasMeta \? <OwnerOnlyArticleMeta/)
  assert.match(ownerMetaSource, /label: '作者'/)
  assert.match(ownerMetaSource, /label: '协助'/)
  assert.match(ownerMetaSource, /label: '模型'/)
  assert.match(globalsSource, /\.article-owner-meta\s*\{/)
  assert.doesNotMatch(globalsSource, /\.owner-only-pill\s*\{/)
})

test('every article page passes owner records into ArticleHeaderActions', () => {
  for (const source of [articlePageSource, publishedArticleSource, researchPageSource]) {
    assert.match(source, /<ArticleHeaderActions[\s\S]*ownerMeta=\{/)
  }
  assert.match(researchPageSource, /assistance: entry\.assistance/)
  assert.match(researchPageSource, /model: entry\.model/)
  assert.match(researchPageSource, /revision: entry\.revision/)
  assert.match(researchPageSource, /editCount: entry\.editCount/)
  assert.match(publishedArticleSource, /revision: article\.revision/)
  assert.match(ownerMetaSource, /ownerAuthorValue\(author, revision, editCount\)/)
})
