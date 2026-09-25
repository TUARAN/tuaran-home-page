import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workflowSource = await readFile(
  new URL('../../.github/workflows/a-share-research.yml', import.meta.url),
  'utf8',
)
const cronSource = await readFile(
  new URL('../../app/api/cron/a-share-research/route.js', import.meta.url),
  'utf8',
)

test('A 股定时任务用本次 Actions 令牌发布，发布失败时不能静默成功', () => {
  assert.match(cronSource, /x-github-publish-token/)
  assert.match(cronSource, /A_SHARE_PUBLISH_TOKEN/)
  assert.match(workflowSource, /contents:\s*write/)
  assert.match(workflowSource, /x-github-publish-token: \$GITHUB_TOKEN/)
  assert.match(workflowSource, /autoPublish\.ok/)
})
