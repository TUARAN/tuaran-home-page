import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../../app/api/admin/engagement-bots/route.js', import.meta.url), 'utf8')
const runApiSource = await readFile(new URL('../../app/api/admin/engagement-bots/run/route.js', import.meta.url), 'utf8')
const cronSource = await readFile(new URL('../../app/api/cron/engagement-bot/route.js', import.meta.url), 'utf8')
const consoleSource = await readFile(
  new URL('../../app/(admin)/admin/engagement-bots/EngagementBotsClient.jsx', import.meta.url),
  'utf8',
)
const commentsSource = await readFile(
  new URL('../../app/(site)/components/ArticleComments.jsx', import.meta.url),
  'utf8',
)
const hubSource = await readFile(
  new URL('../../app/(site)/community/DiscussionHubClient.jsx', import.meta.url),
  'utf8',
)
const centerSource = await readFile(
  new URL('../../app/(admin)/admin/content/ContentCenter.jsx', import.meta.url),
  'utf8',
)
const migrationSource = await readFile(new URL('../../migrations/0074_engagement_bots.sql', import.meta.url), 'utf8')
const runLibSource = await readFile(new URL('../../lib/engagementBotRun.js', import.meta.url), 'utf8')
const workflowSource = await readFile(
  new URL('../../.github/workflows/engagement-bot.yml', import.meta.url),
  'utf8',
)
const keysPanelSource = await readFile(
  new URL('../../app/(admin)/admin/deepseek-tasks/DeepSeekKeysPanel.jsx', import.meta.url),
  'utf8',
)

test('engagement bot admin is owner-only and can run plus CRUD', () => {
  assert.match(apiSource, /getOwnerOrReject/)
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    assert.match(apiSource, new RegExp(`export async function ${method}`))
  }
  assert.match(runApiSource, /getOwnerOrReject/)
  assert.match(runApiSource, /runEngagementBot/)
  assert.match(consoleSource, /路过互动/)
  assert.match(consoleSource, /立即运行/)
  assert.match(centerSource, /href: '\/admin\/engagement-bots'/)
})

test('cron uses shared secret header and DeepSeek comment source', () => {
  assert.match(cronSource, /x-engagement-bot-secret/)
  assert.match(cronSource, /ENGAGEMENT_BOT_SECRET/)
  assert.match(runLibSource, /callDeepSeek/)
  assert.match(runLibSource, /source: ENGAGEMENT_BOT_SOURCE/)
  assert.match(runLibSource, /taskDefaultModel: 'deepseek-v4-flash'/)
  assert.equal(runLibSource.includes('notifyOwner'), false)
  assert.equal(runLibSource.includes('awardComment'), false)
  assert.match(workflowSource, /api\/cron\/engagement-bot/)
  assert.match(keysPanelSource, /'engagement-bot'/)
  assert.match(keysPanelSource, /路过互动评论/)
})

test('public comments label readers as 路过 without saying 机器人', () => {
  assert.match(commentsSource, /commentProviderLabel/)
  assert.match(hubSource, /commentProviderLabel/)
  assert.equal(commentsSource.includes('机器人'), false)
  assert.equal(hubSource.includes('机器人'), false)
})

test('migration stores personas, runs and action ledger', () => {
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS engagement_bots/)
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS engagement_bot_runs/)
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS engagement_bot_actions/)
  assert.match(migrationSource, /deepseek_task_id/)
})
