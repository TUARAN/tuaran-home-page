import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const projectWorkspace = await readFile(
  new URL('../../app/(admin)/admin/projects/ProjectWorkspace.jsx', import.meta.url),
  'utf8'
)

test('AI collaboration tools are direct project workspace entries', () => {
  assert.match(projectWorkspace, /title: 'AI 协同'/)
  assert.match(projectWorkspace, /href: '\/admin\/model-dispatch', title: '规划与分派'/)
  assert.match(projectWorkspace, /href: '\/admin\/ops', title: '自动化运行'/)
  assert.match(projectWorkspace, /href: '\/admin\/deepseek-tasks', title: '调用记录与审计'/)
  assert.doesNotMatch(projectWorkspace, /href: '\/admin\/ai-workspace'/)
})
