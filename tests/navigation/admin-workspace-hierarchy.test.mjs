import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const projectWorkspace = await readFile(
  new URL('../../app/(admin)/admin/projects/ProjectWorkspace.jsx', import.meta.url),
  'utf8'
)
const automationWorkspace = await readFile(
  new URL('../../app/(admin)/admin/automation/AutomationWorkspace.jsx', import.meta.url),
  'utf8'
)

test('AI planning belongs to planning center instead of project workspace', async () => {
  const planningCenter = await readFile(
    new URL('../../app/(admin)/admin/planning/PlanningCenter.jsx', import.meta.url),
    'utf8'
  )

  assert.match(projectWorkspace, /href: '\/admin\/planning', title: '规划中心'/)
  assert.match(projectWorkspace, /href: '\/admin\/model-dispatch'/)
  assert.match(planningCenter, /AI 参与规划与分派/)
  assert.match(planningCenter, /href="\/admin\/model-dispatch"/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/ops'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/deepseek-tasks'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/ai-workspace'/)
  assert.match(automationWorkspace, /href: '\/admin\/ops', title: '自动化台账'/)
  assert.match(automationWorkspace, /href: '\/admin\/deepseek-tasks', title: '模型服务'/)
})
