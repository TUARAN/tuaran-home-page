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
const selfHostedWebhookRoute = await readFile(
  new URL('../../app/api/digital-human/webhooks/sadtalker/route.js', import.meta.url),
  'utf8'
)
const pageSource = await readFile(
  new URL('../../app/(site)/tools/digital-human/DigitalHumanTool.jsx', import.meta.url),
  'utf8'
)
const providerSource = await readFile(
  new URL('../../lib/digitalHuman/providers.js', import.meta.url),
  'utf8'
)
const copySource = await readFile(
  new URL('../../lib/digitalHuman/copy.js', import.meta.url),
  'utf8'
)
const selfHostedService = await readFile(
  new URL('../../services/sadtalker-api/app/main.py', import.meta.url),
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
const {
  digitalHumanErrorMessage,
  normalizeDigitalHumanProviderError,
} = await import('../../lib/digitalHuman/errors.js')

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
  assert.match(jobsRoute, /submitDigitalHumanProviderJob/)
  assert.match(jobsRoute, /status:\s*202/)
  assert.match(jobsRoute, /createSignedDigitalHumanUrl/)
  assert.match(jobsRoute, /MAX_DIGITAL_HUMAN_SCRIPT_CHARS/)
  assert.match(jobsRoute, /hasActiveDigitalHumanJob/)
  assert.match(jobRoute, /getDigitalHumanProviderJob/)
  assert.match(jobRoute, /applyDigitalHumanProviderUpdate/)
  assert.match(assetRoute, /getAvatarR2/)
  assert.match(assetRoute, /verifyDigitalHumanSignature/)
  assert.match(assetRoute, /NOT_AUTHORIZED/)
  assert.match(webhookRoute, /PROVIDER_JOB_MISMATCH/)
  assert.match(webhookRoute, /applyDigitalHumanProviderUpdate/)
  assert.match(selfHostedWebhookRoute, /kind:\s*'sadtalker'/)
  assert.match(selfHostedWebhookRoute, /PROVIDER_JOB_MISMATCH/)
})

test('digital human supports Replicate and self-hosted SadTalker through one contract', () => {
  assert.match(providerSource, /replicate-sadtalker|DIGITAL_HUMAN_REPLICATE_PROVIDER/)
  assert.match(providerSource, /self-hosted-sadtalker|DIGITAL_HUMAN_SELF_HOSTED_PROVIDER/)
  assert.match(providerSource, /submitSelfHostedSadTalkerJob/)
  assert.match(providerSource, /cancelDigitalHumanProviderJob/)
  assert.match(jobsRoute, /form\.get\('provider'\)/)
  assert.match(jobsRoute, /getDigitalHumanProviderAvailability/)
  assert.match(pageSource, /role="tablist"/)
  assert.match(pageSource, /ProviderTabs/)
})

test('self-hosted SadTalker service is asynchronous, authenticated, and allowlists inputs', () => {
  assert.match(selfHostedService, /ThreadPoolExecutor\(max_workers=1/)
  assert.match(selfHostedService, /Depends\(require_token\)/)
  assert.match(selfHostedService, /ALLOWED_INPUT_HOSTS/)
  assert.match(selfHostedService, /subprocess\.Popen/)
  assert.match(selfHostedService, /notify_webhook/)
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

test('digital human provider errors never expose upstream HTML', () => {
  assert.deepEqual(
    normalizeDigitalHumanProviderError({
      status: 402,
      detail: 'You have insufficient credit to run this model.',
    }),
    {
      code: 'PROVIDER_CREDIT_REQUIRED',
      detail: 'Replicate 余额不足，请充值后重试，或切换到自建 SadTalker。',
    }
  )

  const htmlFailure = normalizeDigitalHumanProviderError({
    status: 0,
    detail: '<!DOCTYPE html><html><body>proxy failure</body></html>',
  })
  assert.equal(htmlFailure.code, 'PROVIDER_INVALID_RESPONSE')
  assert.doesNotMatch(htmlFailure.detail, /doctype|html/i)
  assert.equal(
    digitalHumanErrorMessage(
      'PROVIDER_SUBMIT_FAILED',
      'REPLICATE_402: You have insufficient credit'
    ),
    'Replicate 余额不足，请充值后重试，或切换到自建 SadTalker。'
  )
})

test('digital human waiting UI uses staged progress instead of a spinning refresh icon', () => {
  assert.match(pageSource, /DIGITAL_HUMAN_GENERATION_STAGES/)
  assert.match(pageSource, /GenerationProgress/)
  assert.match(copySource, /上传素材/)
  assert.match(copySource, /生成语音/)
  assert.match(copySource, /进入队列/)
  assert.match(copySource, /合成视频/)
  assert.doesNotMatch(pageSource, /IconRefresh size=\{30\} className="animate-spin"/)
})
