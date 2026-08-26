import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../../app/api/admin/quotes/route.js', import.meta.url), 'utf8')
const consoleSource = await readFile(
  new URL('../../app/(admin)/admin/quotes/QuotesConsole.jsx', import.meta.url),
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

test('quote generation is owner-only and publishes immediately from one prompt', () => {
  assert.match(apiSource, /getOwnerOrReject/)
  for (const method of ['GET', 'POST']) {
    assert.match(apiSource, new RegExp(`export async function ${method}`))
  }
  assert.doesNotMatch(apiSource, /export async function (PATCH|DELETE)/)
  assert.match(consoleSource, /名言生成/)
  assert.match(consoleSource, /生成并展示/)
  assert.match(consoleSource, /JSON\.stringify\(\{ prompt: value \}\)/)
  assert.doesNotMatch(consoleSource, /候选|新增名言|编辑名言|核验来源/)
  assert.match(automationCenterSource, /href: '\/admin\/quotes'/)
  assert.doesNotMatch(contentCenterSource, /href: '\/admin\/quotes'/)
})

test('quote table stores the one generated public result', () => {
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS famous_quotes/)
  assert.match(migrationSource, /source_url TEXT/)
  assert.match(migrationSource, /enabled INTEGER NOT NULL DEFAULT 1/)
  assert.match(singleQuoteMigrationSource, /DELETE FROM famous_quotes/)
  assert.match(apiSource, /db\.batch/)
  assert.match(apiSource, /DELETE FROM famous_quotes/)
  assert.match(apiSource, /publishGeneratedQuote/)
})

test('quote generation has a finite local-first fallback chain', () => {
  assert.match(apiSource, /QUOTE_GENERATION_MODELS\.primary/)
  assert.match(apiSource, /QUOTE_GENERATION_MODELS\.secondary/)
  assert.match(apiSource, /callDeepSeek/)
  assert.match(apiSource, /maxAttempts: 3/)
  assert.match(apiSource, /publishImmediately: true/)
  assert.doesNotMatch(apiSource, /manualReviewRequired/)
})
