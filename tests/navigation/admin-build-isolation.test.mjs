import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const adminBuildSource = await readFile(
  new URL('../../scripts/build-admin-pages.cjs', import.meta.url),
  'utf8'
)
const [middlewareSource, adminGateSource, adminVerifierSource, publicVerifierSource] = await Promise.all([
  readFile(new URL('../../middleware.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(admin)/components/AdminPageGate.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../scripts/verify-admin-pages-build.cjs', import.meta.url), 'utf8'),
  readFile(new URL('../../scripts/verify-public-pages-build.cjs', import.meta.url), 'utf8'),
])

test('admin build keeps the notifications API without its public scheduled child route', () => {
  assert.match(adminBuildSource, /KEPT_API_DIRECTORY_ENTRIES/)
  assert.match(adminBuildSource, /\['notifications', new Set\(\['route\.js'\]\)\]/)
  assert.match(adminBuildSource, /for \(const \[directory, keptEntries\] of KEPT_API_DIRECTORY_ENTRIES\)/)
})

test('admin page authorization runs in middleware for HTML and direct RSC requests', () => {
  assert.match(middlewareSource, /getUserFromRequest\(request\)/)
  assert.match(middlewareSource, /isOwnerUser\(user\)/)
  assert.match(middlewareSource, /pathname === '\/admin\.rsc'/)
  assert.match(middlewareSource, /NextResponse\.redirect\(adminLoginUrl\(request\), 307\)/)
  assert.match(middlewareSource, /host !== CANONICAL_HOST && host !== ADMIN_HOST && isAdminPageRequest\(pathname\)/)
  assert.doesNotMatch(adminGateSource, /import .*next\/headers|getOwnerPageState\(/)
})

test('build verification keeps both Workers below repository safety budgets', () => {
  assert.match(adminVerifierSource, /ADMIN_WORKER_BUDGET = 2\.5 \* MIB/)
  assert.match(adminVerifierSource, /unexpectedly entered the Worker/)
  assert.match(publicVerifierSource, /PUBLIC_WORKER_BUDGET = 2\.75 \* MIB/)
  assert.match(publicVerifierSource, /unexpectedly contains Admin routes/)
})

test('admin build verification follows the merged long compass entry point', () => {
  assert.match(adminVerifierSource, /ALLOWED_DYNAMIC_ADMIN_PAGES[\s\S]*['"]\/admin\/soft-sticker['"]/)
  assert.doesNotMatch(adminVerifierSource, /REQUIRED_PRERENDERED_ROUTES[\s\S]*['"]\/admin\/long-compass['"]/)
})

test('admin build verification excludes loopback companion APIs from Worker routes', () => {
  assert.match(adminVerifierSource, /EXTERNAL_SERVICE_API_REFERENCES/)
  for (const route of ['/api/health', '/api/ip', '/api/visit', '/api/91http/extract', '/api/91http/extract-visit']) {
    assert.match(adminVerifierSource, new RegExp(`['"]${route}['"]`))
  }
  assert.match(adminVerifierSource, /!EXTERNAL_SERVICE_API_REFERENCES\.has\(apiPath\)/)
})

test('admin build verification permits documented public scheduler APIs', () => {
  assert.match(adminVerifierSource, /NON_RUNTIME_API_REFERENCES/)
  assert.match(adminVerifierSource, /['"]\/api\/site-status\/monitor['"]/)
  assert.match(adminVerifierSource, /!NON_RUNTIME_API_REFERENCES\.has\(apiPath\)/)
})
