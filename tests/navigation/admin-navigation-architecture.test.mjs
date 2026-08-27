import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ADMIN_CONSOLE_ITEMS,
  ADMIN_LEGACY_REDIRECTS,
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
  assert.deepEqual(resolveAdminTrail('/admin/quotes').map((item) => item.label), ['自动化', '名言生成'])
  assert.deepEqual(resolveAdminTrail('/admin/engagement-bots').map((item) => item.label), ['自动化', '路过互动'])
  assert.deepEqual(resolveAdminTrail('/admin/points').map((item) => item.label), ['用户与权限', '燃币与权益'])
  assert.deepEqual(resolveAdminTrail('/admin/access/grants').map((item) => item.label), ['用户与权限', '授权管理'])
  assert.deepEqual(resolveAdminTrail('/admin/security-self-check').map((item) => item.label), ['站点运维', '涉密自检'])
  assert.deepEqual(resolveAdminTrail('/admin/share').map((item) => item.label), ['私密数据', '加密分享'])
  assert.deepEqual(resolveAdminTrail('/admin/self-regulation').map((item) => item.label), ['私密数据'])
  assert.deepEqual(resolveAdminTrail('/admin/person-strawberry').map((item) => item.label), ['私密数据'])
  assert.deepEqual(resolveAdminTrail('/admin/nsfw').map((item) => item.label), ['私密数据', '私密媒体'])
})

test('private data navigation titles use four Chinese characters', () => {
  const privateData = ADMIN_CONSOLE_ITEMS.find((item) => item.href === '/admin/private-data')
  const titles = privateData.sections.flatMap((section) => section.items.map((item) => item.label))

  assert.deepEqual(titles, ['信息金库', '软贴空间', '加密分享', '交易分析', '私密媒体'])
  assert.ok(titles.every((title) => Array.from(title).length === 4))
})

test('project navigation titles use four Chinese characters', () => {
  const projects = ADMIN_CONSOLE_ITEMS.find((item) => item.href === '/admin/projects')
  const titles = projects.sections.flatMap((section) => section.items.map((item) => item.label))

  assert.deepEqual(titles, ['规划中心', '项目总览', '开发发布', '集成密钥', '站点架构', '上下文库'])
  assert.ok(titles.every((title) => Array.from(title).length === 4))
})

test('previously hidden admin routes have explicit child entries', () => {
  const hrefs = new Set(ADMIN_NAV_CHILD_ITEMS.map((item) => item.matchPath || item.href))
  for (const href of ['/admin/content-index', '/admin/research-style', '/admin/share', '/admin/wallpapers']) {
    assert.ok(hrefs.has(href), `${href} should be present in the admin navigation registry`)
  }
})

test('merged admin tools redirect in middleware without dedicated edge pages', async () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(ADMIN_LEGACY_REDIRECTS).filter(([path]) => path.startsWith('/admin/'))),
    {
      '/admin/ai-workspace': '/admin/automation',
      '/admin/model-dispatch': '/admin/planning?tab=dispatch',
      '/admin/person-strawberry': '/admin/soft-sticker?tab=strawberry',
      '/admin/self-regulation': '/admin/soft-sticker?tab=self-regulation',
      '/admin/long-compass': '/admin/soft-sticker?tab=long-compass',
    }
  )
  const middlewareSource = await readFile(new URL('../../middleware.js', import.meta.url), 'utf8')
  assert.match(middlewareSource, /legacyAdminTarget\.split\('\?'\)/)
  assert.match(middlewareSource, /url\.search = targetSearch/)
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
