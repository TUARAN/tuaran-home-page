import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const adminPageDir = new URL('../../app/(admin)/admin/quotes/', import.meta.url)
const adminApiDir = new URL('../../app/api/admin/quotes/', import.meta.url)
const adminRoutesSource = await readFile(
  new URL('../../lib/admin/adminRoutes.js', import.meta.url),
  'utf8',
)
const contentCenterSource = await readFile(
  new URL('../../app/(admin)/admin/content/ContentCenter.jsx', import.meta.url),
  'utf8',
)
const automationCenterSource = await readFile(
  new URL('../../app/(admin)/admin/automation/AutomationWorkspace.jsx', import.meta.url),
  'utf8',
)
const migrationSource = await readFile(new URL('../../migrations/0057_famous_quotes.sql', import.meta.url), 'utf8')
const singleQuoteMigrationSource = await readFile(new URL('../../migrations/0079_single_generated_quote.sql', import.meta.url), 'utf8')
const poolMigrationSource = await readFile(new URL('../../migrations/0080_quote_automation_pool.sql', import.meta.url), 'utf8')
const cronSource = await readFile(new URL('../../app/api/cron/quotes/route.js', import.meta.url), 'utf8')
const workflowSource = await readFile(new URL('../../.github/workflows/quote-generation.yml', import.meta.url), 'utf8')

async function doesNotExist(target) {
  try {
    await access(target)
    return false
  } catch {
    return true
  }
}

test('quotes admin page and its owner-only api are retired', async () => {
  assert.ok(await doesNotExist(adminPageDir), 'admin quotes page directory should be removed')
  assert.ok(await doesNotExist(adminApiDir), 'admin quotes api directory should be removed')
  const mentions = adminRoutesSource.match(/\/admin\/quotes/g) || []
  assert.equal(mentions.length, 1, 'only the legacy redirect should mention /admin/quotes')
  assert.match(adminRoutesSource, /'\/admin\/quotes': '\/admin\/archives'/)
  assert.doesNotMatch(contentCenterSource, /href: '\/admin\/quotes'/)
  assert.match(automationCenterSource, /getWorkspaceHubProps\('\/admin\/automation'\)/)
})

test('quote table retains generated history with automation metadata', () => {
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS famous_quotes/)
  assert.match(migrationSource, /source_url TEXT/)
  assert.match(migrationSource, /enabled INTEGER NOT NULL DEFAULT 1/)
  assert.match(singleQuoteMigrationSource, /DELETE FROM famous_quotes/)
  assert.match(poolMigrationSource, /generation_prompt TEXT/)
  assert.match(poolMigrationSource, /generation_trigger TEXT/)
  assert.match(poolMigrationSource, /generation_model TEXT/)
})

test('quote automation is authenticated and paused without a schedule', () => {
  assert.match(cronSource, /x-quote-generation-secret/)
  assert.match(cronSource, /runQuoteAutomation/)
  assert.match(cronSource, /QUOTE_GENERATION_PAUSED/)
  assert.doesNotMatch(workflowSource, /cron:/)
  assert.match(workflowSource, /POST \/api\/cron\/quotes/)
})
