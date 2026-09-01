import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  build91HttpUrl,
  isValidBloggerEyeTarget,
  normalizeBloggerEyeProxy,
  parse91HttpResponse,
} from '../lib/bloggerEyeCore.mjs'
import { ADMIN_NAV_GROUPS, resolveAdminTrail } from '../lib/adminRoutes.js'

test('blogger eye normalizes proxies and accepts only web targets', () => {
  assert.equal(normalizeBloggerEyeProxy('user:pass@1.2.3.4:8080'), 'http://user:pass@1.2.3.4:8080')
  assert.equal(normalizeBloggerEyeProxy('socks5://127.0.0.1:9050'), 'socks5://127.0.0.1:9050')
  assert.equal(isValidBloggerEyeTarget('https://2aran.com/articles'), true)
  assert.equal(isValidBloggerEyeTarget('file:///etc/passwd'), false)
  assert.equal(isValidBloggerEyeTarget('javascript:alert(1)'), false)
})

test('91HTTP URLs preserve account fields and reject lookalike hosts', () => {
  const generated = new URL(build91HttpUrl({ tradeNo: 'order', secret: 'secret', num: 3, protocol: 2 }))
  assert.equal(generated.hostname, 'api.91http.com')
  assert.equal(generated.searchParams.get('trade_no'), 'order')
  assert.equal(generated.searchParams.get('secret'), 'secret')
  assert.equal(generated.searchParams.get('num'), '3')
  assert.throws(() => build91HttpUrl({ apiUrl: 'https://evil91http.com/get' }), /只允许/)
  assert.throws(() => build91HttpUrl({ apiUrl: 'https://91http.com.evil.test/get' }), /只允许/)
})

test('91HTTP responses support text, nested JSON and de-duplicate proxies', () => {
  assert.deepEqual(parse91HttpResponse('1.2.3.4:8080\n1.2.3.4:8080').proxies, ['http://1.2.3.4:8080'])
  const parsed = parse91HttpResponse(JSON.stringify({ code: 1, data: [{ ip: '5.6.7.8', port: 9000 }] }))
  assert.equal(parsed.ok, true)
  assert.deepEqual(parsed.proxies, ['http://5.6.7.8:9000'])
})

test('admin exposes blogger eye inside site operations and local service stays loopback-only', async () => {
  const system = ADMIN_NAV_GROUPS.flatMap((group) => group.items).find((item) => item.href === '/admin/system')
  assert.ok(system.activePaths.includes('/admin/blogger-eye'))
  assert.ok(system.sections.flatMap((section) => section.items).some((item) => item.href === '/admin/blogger-eye'))
  assert.deepEqual(resolveAdminTrail('/admin/blogger-eye').map((item) => item.label), ['站点运维', '小眼睛'])
  const [page, server, service, packageJson] = await Promise.all([
    readFile(new URL('../app/(admin)/admin/blogger-eye/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/blogger-eye-server.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/blogger-eye-service.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ])
  assert.match(page, /<AdminPageGate/)
  assert.match(page, /index: false/)
  assert.match(server, /const host = '127\.0\.0\.1'/)
  assert.match(server, /allowedOrigins\.has/)
  assert.doesNotMatch(server, /0\.0\.0\.0/)
  assert.match(service, /RunAtLoad/)
  assert.match(service, /KeepAlive/)
  assert.match(service, /launchctl/)
  assert.match(packageJson, /blogger-eye:service:install/)
})
