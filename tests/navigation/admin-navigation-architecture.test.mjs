import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ADMIN_CONSOLE_ITEMS,
  ADMIN_NAV_CHILD_ITEMS,
  resolveAdminTrail,
} from '../../lib/adminRoutes.js'

test('admin navigation exposes seven stable workspaces without duplicate dashboard entries', () => {
  assert.deepEqual(
    ADMIN_CONSOLE_ITEMS.map((item) => item.label),
    ['内容', '自动化', '项目与工程', '站点运维', '用户与权限', '私密数据']
  )
  assert.equal(new Set(ADMIN_CONSOLE_ITEMS.map((item) => item.href)).size, ADMIN_CONSOLE_ITEMS.length)
})

test('admin trails retain workspace context for deep routes', () => {
  assert.deepEqual(resolveAdminTrail('/admin/content-taxonomy').map((item) => item.label), ['内容', '分类管理'])
  assert.deepEqual(resolveAdminTrail('/admin/deepseek-tasks').map((item) => item.label), ['自动化', '模型服务'])
  assert.deepEqual(resolveAdminTrail('/admin/model-dispatch').map((item) => item.label), ['项目与工程', 'AI 规划与分派'])
  assert.deepEqual(resolveAdminTrail('/admin/points').map((item) => item.label), ['用户与权限', '燃币与权益'])
  assert.deepEqual(resolveAdminTrail('/admin/access/grants').map((item) => item.label), ['用户与权限', '授权管理'])
  assert.deepEqual(resolveAdminTrail('/admin/share').map((item) => item.label), ['私密数据', '密码保护分享'])
  assert.deepEqual(resolveAdminTrail('/admin/self-regulation').map((item) => item.label), ['私密数据'])
  assert.deepEqual(resolveAdminTrail('/admin/person-strawberry').map((item) => item.label), ['私密数据'])
  assert.deepEqual(resolveAdminTrail('/admin/nsfw').map((item) => item.label), ['私密数据', '私有媒体库'])
})

test('previously hidden admin routes have explicit child entries', () => {
  const hrefs = new Set(ADMIN_NAV_CHILD_ITEMS.map((item) => item.matchPath || item.href))
  for (const href of ['/admin/content-index', '/admin/research-style', '/admin/model-dispatch', '/admin/share', '/admin/wallpapers']) {
    assert.ok(hrefs.has(href), `${href} should be present in the admin navigation registry`)
  }
})

test('sidebar expands only the active workspace and restores the current item into view', async () => {
  const source = await readFile(
    new URL('../../app/(admin)/components/AdminSidebar.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /!collapsed && active && children\.length/)
  assert.match(source, /scrollIntoView\(\{ block: 'nearest' \}\)/)
  assert.doesNotMatch(source, /expandableSectionIds/)
  assert.doesNotMatch(source, /openSections/)
})
