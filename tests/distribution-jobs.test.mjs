import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'

import { HARNESS_VERSION, SITE_ORIGIN } from '../lib/distribution/harness.js'
import {
  cancelDistributionJob,
  claimDistributionJob,
  createDistributionJob,
  DISTRIBUTION_JOB_TOKEN_TTL_MS,
  finishDistributionJob,
  hashDistributionToken,
  listDistributionJobs,
  reissueDistributionJobToken,
  reportDistributionResult,
  summarizeJobStatus,
} from '../lib/distribution/jobs.js'
import { buildDistributionClaimPrompt } from '../lib/distribution/taskPrompt.js'

// 用 node:sqlite 模拟 D1 的 prepare().bind().run/all/first 接口。
async function createD1() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(await readFile(new URL('../migrations/0139_distribution_agent_jobs.sql', import.meta.url), 'utf8'))
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql)
      let params = []
      const api = {
        bind(...values) {
          params = values
          return api
        },
        async run() {
          return { meta: { changes: Number(statement.run(...params).changes) } }
        },
        async all() {
          return { results: statement.all(...params).map((row) => ({ ...row })) }
        },
        async first() {
          const row = statement.get(...params)
          return row ? { ...row } : null
        },
      }
      return api
    },
  }
}

const ARTICLE = {
  title: '  Cloudflare\n文章 ',
  url: `${SITE_ORIGIN}/articles/demo`,
  summary: '摘要',
  tags: ['AI', ' '],
  markdown: '正文 ![图](/images/a.png)',
}

test('建任务只存 token 哈希，入参校验', async () => {
  const db = await createD1()
  const now = 1_000
  const job = await createDistributionJob(db, { ...ARTICLE, platformIds: ['csdn', 'unknown'] }, { createdBy: 'tuaran', now })
  assert.match(job.token, /^[0-9a-f]{64}$/)
  assert.equal(job.tokenExpiresAt, now + DISTRIBUTION_JOB_TOKEN_TTL_MS)
  assert.deepEqual(job.platformIds, ['csdn'])
  const row = db.sqlite.prepare('SELECT * FROM distribution_jobs WHERE id = ?').get(job.id)
  assert.equal(row.token_hash, await hashDistributionToken(job.token))
  assert.ok(!JSON.stringify(row).includes(job.token))
  assert.equal(row.title, 'Cloudflare 文章')
  assert.equal(row.harness_version, HARNESS_VERSION)
  assert.equal(row.tags_json, '["AI"]')

  await assert.rejects(createDistributionJob(db, { ...ARTICLE, markdown: '' }), /MARKDOWN_REQUIRED/)
  await assert.rejects(createDistributionJob(db, { ...ARTICLE, url: 'javascript:alert(1)' }), /INVALID_URL/)
  await assert.rejects(createDistributionJob(db, { ...ARTICLE, platformIds: ['unknown'] }), /PLATFORMS_REQUIRED/)
})

test('智能体领取、逐平台回报、收尾后 token 失效', async () => {
  const db = await createD1()
  const { id, token } = await createDistributionJob(db, ARTICLE, { now: 1_000 })

  assert.equal(await claimDistributionJob(db, id, 'f'.repeat(64), 2_000), null)
  const claimed = await claimDistributionJob(db, id, token, 2_000)
  assert.equal(claimed.status, 'claimed')
  assert.deepEqual(claimed.platformIds, ['juejin', 'csdn'])
  assert.ok(claimed.markdown.includes(`](${SITE_ORIGIN}/images/a.png)`))

  await assert.rejects(reportDistributionResult(db, id, token, { platformId: 'zhihu', status: 'published' }, 3_000), /PLATFORM_NOT_IN_JOB/)
  await assert.rejects(reportDistributionResult(db, id, token, { platformId: 'juejin', status: 'done' }, 3_000), /INVALID_RESULT_STATUS/)
  await reportDistributionResult(db, id, token, { platformId: 'juejin', status: 'failed', notes: '超时' }, 3_000)
  await reportDistributionResult(db, id, token, { platformId: 'juejin', status: 'reviewing', articleUrl: 'https://juejin.cn/post/1', playbookDeviation: '按钮改名' }, 4_000)

  const [listed] = await listDistributionJobs(db)
  assert.equal(listed.results.length, 1)
  assert.equal(listed.results[0].status, 'reviewing')
  assert.equal(listed.results[0].playbookDeviation, '按钮改名')
  assert.equal(listed.markdown, undefined, '列表不带正文')

  assert.deepEqual(await finishDistributionJob(db, id, token, 5_000), { ok: true, status: 'partial' })
  assert.equal(await claimDistributionJob(db, id, token, 6_000), null)
  assert.equal(await reportDistributionResult(db, id, token, { platformId: 'csdn', status: 'published' }, 6_000), null)
  const [finished] = await listDistributionJobs(db)
  assert.equal(finished.status, 'partial')
  assert.equal(finished.tokenExpiresAt, 0)
})

test('token 过期、取消和重新签发', async () => {
  const db = await createD1()
  const { id, token } = await createDistributionJob(db, ARTICLE, { now: 1_000 })
  assert.equal(await claimDistributionJob(db, id, token, 1_000 + DISTRIBUTION_JOB_TOKEN_TTL_MS), null)

  const reissued = await reissueDistributionJobToken(db, id, 2_000)
  assert.notEqual(reissued.token, token)
  assert.equal(await claimDistributionJob(db, id, token, 3_000), null, '旧 token 作废')
  assert.ok(await claimDistributionJob(db, id, reissued.token, 3_000))

  await cancelDistributionJob(db, id, 4_000)
  assert.equal(await claimDistributionJob(db, id, reissued.token, 5_000), null)
  await assert.rejects(cancelDistributionJob(db, id, 5_000), /JOB_NOT_ACTIVE/)
  await assert.rejects(reissueDistributionJobToken(db, id, 5_000), /JOB_NOT_ACTIVE/)
  await assert.rejects(cancelDistributionJob(db, 'not-an-id'), /INVALID_JOB_ID/)
})

test('收尾状态按目标平台的成功结果计算', () => {
  const targets = ['juejin', 'csdn']
  assert.equal(summarizeJobStatus(targets, [{ platformId: 'juejin', status: 'published' }, { platformId: 'csdn', status: 'draft' }]), 'done')
  assert.equal(summarizeJobStatus(targets, [{ platformId: 'juejin', status: 'published' }, { platformId: 'csdn', status: 'skipped' }]), 'partial')
  assert.equal(summarizeJobStatus(targets, [{ platformId: 'juejin', status: 'failed' }]), 'failed')
  assert.equal(summarizeJobStatus(targets, []), 'failed')
})

test('领取指令只带任务地址和 token，不带正文', () => {
  const prompt = buildDistributionClaimPrompt({ jobId: 'abc', token: 'tok', title: 'T\n1', origin: 'http://localhost:3000/' })
  assert.ok(prompt.includes(`harness ${HARNESS_VERSION}`))
  assert.ok(prompt.includes('「任务台模式」'))
  assert.ok(prompt.includes('- 任务地址：http://localhost:3000/api/distribution/agent/jobs/abc'))
  assert.ok(prompt.includes('- token：tok'))
  assert.ok(prompt.includes('- 文章：T 1'))
  assert.ok(!prompt.includes('markdown'))
  assert.ok(buildDistributionClaimPrompt({ jobId: 'abc', token: 't' }).includes(`${SITE_ORIGIN}/api/distribution/agent/jobs/abc`))
})
