import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { isRevertDraftApi, revertDraftCorsHeaders, revertDraftCorsOrigin } from '../../lib/adminRoutes.js'
import { adminSiteUrl } from '../../lib/publicAdminOrigin.js'

const [
  buttonSource,
  researchPageSource,
  publishedArticleSource,
  archiveArticleSource,
  middlewareSource,
] = await Promise.all([
  readFile(new URL('../../app/(site)/components/RevertToDraftButton.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/research/[category]/[slug]/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/[slug]/PublishedArticle.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/[slug]/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../middleware.js', import.meta.url), 'utf8'),
])

test('research pages send the Git source path to the existing draft API', () => {
  assert.match(researchPageSource, /parseResearchSourcePath\(`research\/\$\{entry\.category\}\/\$\{entry\.filename/)
  assert.match(researchPageSource, /<RevertToDraftButton sourcePath=\{sourcePath\} \/>/)
  assert.match(buttonSource, /\/api\/admin\/research-documents/)
  assert.match(buttonSource, /status: 'draft'/)
  assert.match(buttonSource, /退回为草稿/)
  assert.doesNotMatch(archiveArticleSource, /RevertToDraftButton/)
})

test('database articles reuse the admin article update as a draft', () => {
  assert.match(publishedArticleSource, /<RevertToDraftButton articleId=\{article\.id\} \/>/)
  assert.match(buttonSource, /\/api\/admin\/articles\//)
  assert.match(buttonSource, /method: 'PUT'/)
  assert.match(buttonSource, /status: 'draft'/)
})

test('public site calls the admin host, and only those draft routes allow that origin', () => {
  assert.equal(
    adminSiteUrl('/api/admin/research-documents', '2aran.com'),
    'https://admin.2aran.com/api/admin/research-documents',
  )
  assert.equal(adminSiteUrl('/api/admin/articles/abc', 'localhost'), '/api/admin/articles/abc')
  assert.equal(revertDraftCorsOrigin('https://2aran.com'), 'https://2aran.com')
  assert.equal(revertDraftCorsOrigin('https://evil.example'), '')
  assert.equal(isRevertDraftApi('/api/admin/research-documents', 'POST'), true)
  assert.equal(isRevertDraftApi('/api/admin/research-documents', 'GET'), false)
  assert.equal(isRevertDraftApi('/api/admin/articles/post-1', 'PUT'), true)
  assert.equal(isRevertDraftApi('/api/admin/articles', 'PUT'), false)
  assert.equal(revertDraftCorsHeaders('https://2aran.com')['Access-Control-Allow-Credentials'], 'true')
  assert.match(middlewareSource, /isRevertDraftApi/)
  assert.match(middlewareSource, /revertDraftCorsHeaders/)
})
