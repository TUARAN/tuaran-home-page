import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [
  headerActionsSource,
  researchBodySource,
  researchPageSource,
  articlePageSource,
  publishedArticleSource,
  readAloudSource,
] = await Promise.all([
  readFile(new URL('../../app/(site)/components/ArticleHeaderActions.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/research/[category]/[slug]/ResearchBody.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/research/[category]/[slug]/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/[slug]/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/[slug]/PublishedArticle.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/ReadAloudButton.jsx', import.meta.url), 'utf8'),
])

test('read-aloud sits in the article header next to share', () => {
  assert.match(headerActionsSource, /ReadAloudButton/)
  assert.match(headerActionsSource, /data-article-read-aloud-slot/)
  assert.match(headerActionsSource, /article-reader-actions[\s\S]*ReadAloudButton/)
  assert.match(readAloudSource, /朗读正文/)
  assert.match(readAloudSource, /createPortal/)
})

test('research body portals read-aloud into the header so the paywall still wraps it', () => {
  assert.match(researchBodySource, /<ReadAloudButton markdown=\{active\.content\} portal \/>/)
  assert.doesNotMatch(researchBodySource, /朗读正文/)
  assert.doesNotMatch(researchPageSource, /speechMarkdown=/)
  assert.doesNotMatch(researchPageSource, /speechVariants=/)
})

test('article pages without a research paywall pass speech source into the header', () => {
  assert.match(articlePageSource, /speechMarkdown=\{articleMarkdown\}/)
  assert.match(publishedArticleSource, /speechMarkdown=\{article\.contentText\}/)
})
