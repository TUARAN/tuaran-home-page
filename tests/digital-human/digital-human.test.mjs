import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const originalEmitWarning = process.emitWarning
process.emitWarning = function filteredEmitWarning(warning, ...args) {
  if (args.some((value) => value === 'ExperimentalWarning')) return
  return originalEmitWarning.call(process, warning, ...args)
}
const { DatabaseSync } = await import('node:sqlite')

const migration = await readFile(
  new URL('../../migrations/0056_digital_human_jobs.sql', import.meta.url),
  'utf8'
)
const jobsRoute = await readFile(
  new URL('../../app/api/digital-human/jobs/route.js', import.meta.url),
  'utf8'
)
const jobRoute = await readFile(
  new URL('../../app/api/digital-human/jobs/[id]/route.js', import.meta.url),
  'utf8'
)
const assetRoute = await readFile(
  new URL('../../app/api/digital-human/assets/[id]/[kind]/route.js', import.meta.url),
  'utf8'
)
const webhookRoute = await readFile(
  new URL('../../app/api/digital-human/webhooks/replicate/route.js', import.meta.url),
  'utf8'
)
const pageSource = await readFile(
  new URL('../../app/(site)/tools/digital-human/DigitalHumanTool.jsx', import.meta.url),
  'utf8'
)
const toolItems = await readFile(
  new URL('../../lib/toolItems.js', import.meta.url),
  'utf8'
)
const wrangler = await readFile(
  new URL('../../wrangler.toml', import.meta.url),
  'utf8'
)

test('digital human migration enforces lifecycle states and useful indexes', () => {
  const db = new DatabaseSync(':memory:')
  db.exec(migration)
  const columns = db.prepare('PRAGMA table_info(digital_human_jobs)').all()
  assert.ok(columns.some((column) => column.name === 'provider_job_id'))
  assert.ok(columns.some((column) => column.name === 'expires_at'))

  const now = Date.now()
  db.prepare(`INSERT INTO digital_human_jobs
    (id, user_id, status, script_text, consent_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('job-1', 'acct-1', 'queued', '测试口播', now, now, now)
  assert.throws(() => {
    db.prepare(`INSERT INTO digital_human_jobs
      (id, user_id, status, script_text, consent_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('job-2', 'acct-1', 'unknown', '测试口播', now, now, now)
  })
})

test('digital human API keeps long work asynchronous and private', () => {
  assert.match(jobsRoute, /submitSadTalkerJob/)
  assert.match(jobsRoute, /status:\s*202/)
  assert.match(jobsRoute, /createSignedDigitalHumanUrl/)
  assert.match(jobsRoute, /MAX_DIGITAL_HUMAN_SCRIPT_CHARS/)
  assert.match(jobsRoute, /hasActiveDigitalHumanJob/)
  assert.match(jobRoute, /getReplicatePrediction/)
  assert.match(jobRoute, /applyReplicatePrediction/)
  assert.match(assetRoute, /getAvatarR2/)
  assert.match(assetRoute, /verifyDigitalHumanSignature/)
  assert.match(assetRoute, /NOT_AUTHORIZED/)
  assert.match(webhookRoute, /PROVIDER_JOB_MISMATCH/)
  assert.match(webhookRoute, /applyReplicatePrediction/)
})

test('digital human tool is discoverable and includes consent and job polling', () => {
  assert.match(toolItems, /id: 'digital-human'/)
  assert.match(toolItems, /href: '\/tools\/digital-human'/)
  assert.match(pageSource, /我确认拥有该人物肖像和文案的使用权/)
  assert.match(pageSource, /window\.setInterval/)
  assert.match(pageSource, /下载 MP4/)
  assert.match(pageSource, /MAX_SCRIPT_CHARS = 200/)
})

test('digital human bindings stay separate from public media storage', () => {
  assert.match(wrangler, /binding = "AVATAR_MEDIA"/)
  assert.match(wrangler, /bucket_name = "tuaran-avatar-private"/)
  assert.match(wrangler, /\[ai\][\s\S]*binding = "AI"/)
})
