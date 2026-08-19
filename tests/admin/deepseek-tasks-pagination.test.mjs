import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const clientSource = await readFile(
  new URL('../../app/(admin)/admin/deepseek-tasks/DeepSeekTasksClient.jsx', import.meta.url),
  'utf8',
)
const routeSource = await readFile(
  new URL('../../app/api/admin/deepseek-tasks/route.js', import.meta.url),
  'utf8',
)

test('调用记录复用后台分页组件并按 offset 加载', () => {
  assert.match(clientSource, /AdminPagination/)
  assert.match(clientSource, /limit: String\(PAGE_SIZE\), offset: String\(nextOffset\)/)
  assert.match(clientSource, /onOffsetChange=\{refresh\}/)
  assert.match(clientSource, /onClick=\{\(\) => refresh\(offset\)\}/)
})

test('调用记录 API 执行服务端分页并返回分页元数据', () => {
  assert.match(routeSource, /LIMIT \? OFFSET \?/)
  assert.match(routeSource, /total: Number\(totalRow\?\.total\) \|\| 0/)
  assert.match(routeSource, /\n      offset,\n      limit,/)
})
