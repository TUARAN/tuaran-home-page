import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { STATIC_PAGE_REGISTRY } from '../../lib/site/staticPageRegistry.mjs'
import { TOOL_ITEMS } from '../../lib/site/toolItems.js'

const root = new URL('../../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('工具库收录 2FA 在线验证器并指向 /tools/2fa', () => {
  const item = TOOL_ITEMS.find((entry) => entry.id === 'two-factor-auth')
  assert.ok(item, 'toolItems 缺少 two-factor-auth 条目')
  assert.equal(item.href, '/tools/2fa')
  assert.equal(item.type, 'utility')
  assert.equal(item.status, 'live')
  assert.match(item.summary, /TOTP/)
  assert.ok(item.tags.includes('本地处理'))
})

test('静态注册表登记 /tools/2fa 且可索引', () => {
  const entry = STATIC_PAGE_REGISTRY.find((page) => page.path === '/tools/2fa')
  assert.ok(entry, 'staticPageRegistry 缺少 /tools/2fa')
  assert.equal(entry.indexable, true)
  assert.equal(entry.sitemap, true)
  assert.equal(entry.canonical, '/tools/2fa')
})

test('页面元数据声明 canonical、Open Graph 与 JSON-LD', () => {
  const page = read('app/(site)/tools/2fa/page.jsx')
  assert.match(page, /export const dynamic = 'force-static'/)
  assert.match(page, /canonical: '\/tools\/2fa'/)
  assert.match(page, /openGraph:\s*\{[\s\S]*url: '\/tools\/2fa'/)
  assert.match(page, /application\/ld\+json/)
})

test('客户端组件不落盘、不外发请求，密钥只留在内存', () => {
  const component = read('app/(site)/tools/2fa/TwoFactorTool.jsx')
  assert.doesNotMatch(component, /localStorage\.(get|set|remove)Item|sessionStorage\.(get|set|remove)Item|indexedDB\.(open|delete)|document\.cookie\s*=/)
  assert.doesNotMatch(component, /\bfetch\s*\(/)
  assert.match(component, /use client/)
  // 验证码与原理计算都走 lib/tools/totp，不引入其他网络依赖
  assert.match(component, /from '\.\.\/\.\.\/\.\.\/\.\.\/lib\/tools\/totp'/)
  assert.doesNotMatch(component, /axios|XMLHttpRequest|WebSocket/)
})
