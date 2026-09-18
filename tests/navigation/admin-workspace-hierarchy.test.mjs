import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ADMIN_CONSOLE_ITEMS,
  getWorkspaceHubProps,
  listWorkspaceChildren,
} from '../../lib/adminRoutes.js'

const projectWorkspace = await readFile(
  new URL('../../app/(admin)/admin/projects/ProjectWorkspace.jsx', import.meta.url),
  'utf8'
)

test('AI planning is embedded in planning center instead of a separate project workspace entry', async () => {
  const planningCenter = await readFile(
    new URL('../../app/(admin)/admin/planning/PlanningCenter.jsx', import.meta.url),
    'utf8'
  )

  assert.match(projectWorkspace, /href: '\/admin\/planning', title: '规划中心'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/model-dispatch'/)
  assert.match(planningCenter, /ModelDispatchConsole/)
  assert.match(planningCenter, /<ModelDispatchConsole embedded \/>/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/ops'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/deepseek-tasks'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/ai-workspace'/)

  const automation = ADMIN_CONSOLE_ITEMS.find((item) => item.href === '/admin/automation')
  assert.deepEqual(
    listWorkspaceChildren(automation).slice(0, 3).map((item) => [item.href, item.label]),
    [
      ['/admin/ops', '自动化台账'],
      ['/admin/deepseek-tasks', '模型服务'],
      ['/admin/logs', '日志记录'],
    ]
  )
  assert.equal(getWorkspaceHubProps('/admin/automation').title, '自动化')
})
