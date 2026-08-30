import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const clientSource = await readFile(
  new URL('../../app/(admin)/admin/crypto-research/CryptoResearchClient.jsx', import.meta.url),
  'utf8',
)
const routeSource = await readFile(
  new URL('../../app/api/admin/crypto-research/route.js', import.meta.url),
  'utf8',
)
const workflowSource = await readFile(
  new URL('../../.github/workflows/crypto-research.yml', import.meta.url),
  'utf8',
)

test('失败草稿提供重新生成入口并仅重置 failed 草稿', () => {
  assert.match(clientSource, /draft\.status === 'failed'.*mutate\(draft, 'retry'\).*重新生成/)
  assert.match(routeSource, /status !== 'retry'/)
  assert.match(routeSource, /attempt_count = 0, status = 'failed'/)
  assert.match(routeSource, /WHERE id = \? AND status = 'failed'/)
})

test('失败通知携带告警接口要求的 runId', () => {
  assert.match(workflowSource, /GITHUB_RUN_ID: \$\{\{ github\.run_id \}\}/)
  assert.match(workflowSource, /runId:\$runId/)
})

test('CoinGecko 限流由外层循环退避，curl 不在短间隔内重复请求', () => {
  assert.doesNotMatch(workflowSource, /code=\$\(curl -sS --retry/)
  assert.match(workflowSource, /\[ "\$code" = "429" \]/)
  assert.match(workflowSource, /\.retryAfterMs \/\/ 60000/)
})
