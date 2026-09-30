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

test('project portfolio and AI planning are embedded in the unified project center', async () => {
  const planningCenter = await readFile(
    new URL('../../app/(admin)/admin/planning/PlanningCenter.jsx', import.meta.url),
    'utf8'
  )

  assert.match(projectWorkspace, /getWorkspaceHubProps\('\/admin\/projects'\)/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/model-dispatch'/)
  assert.match(planningCenter, /ModelDispatchConsole/)
  assert.match(planningCenter, /<ModelDispatchConsole embedded \/>/)
  assert.match(planningCenter, /<ProjectPortfolioConsole embedded \/>/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/ops'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/deepseek-tasks'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/ai-workspace'/)

  const automation = ADMIN_CONSOLE_ITEMS.find((item) => item.href === '/admin/automation')
  assert.deepEqual(listWorkspaceChildren(automation).slice(0, 1).map((item) => [item.href, item.label]), [
    ['/admin/ops', '任务中心'],
  ])
  assert.equal(getWorkspaceHubProps('/admin/automation').title, '自动化')
  assert.equal(getWorkspaceHubProps('/admin/projects').title, '工程与运维')
})
