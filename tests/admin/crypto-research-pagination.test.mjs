import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const clientSource = await readFile(
  new URL('../../app/(admin)/admin/crypto-research/CryptoResearchClient.jsx', import.meta.url),
  'utf8',
)
const routeSource = await readFile(
  new URL('../../app/api/admin/crypto-research/logs/route.js', import.meta.url),
  'utf8',
)

test('加密调研运行日志复用后台分页组件并按 offset 加载', () => {
  assert.match(clientSource, /AdminPagination/)
  assert.match(clientSource, /limit: String\(LOG_PAGE_SIZE\), offset: String\(nextOffset\)/)
  assert.match(clientSource, /onOffsetChange=\{loadLogs\}/)
  assert.match(clientSource, /total=\{logTotal\}/)
})

test('加密调研日志 API 执行服务端分页并返回分页元数据', () => {
  assert.match(routeSource, /LIMIT \? OFFSET \?/)
  assert.match(routeSource, /total: Number\(count\?\.total\) \|\| 0/)
  assert.match(routeSource, /offset, limit, total:/)
})
