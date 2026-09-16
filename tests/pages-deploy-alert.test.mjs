import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workflowSource = await readFile(
  new URL('../.github/workflows/pages-deploy-alert.yml', import.meta.url),
  'utf8',
)
const checkerSource = await readFile(
  new URL('../scripts/check-public-asset-size.mjs', import.meta.url),
  'utf8',
)
const prebuild = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
).scripts.prebuild

test('Pages deploy failures notify the owner instead of relying on site probes', () => {
  assert.match(workflowSource, /deployment_status/)
  assert.match(workflowSource, /check_run/)
  assert.match(workflowSource, /contains\(github\.event\.check_run\.name, 'Cloudflare'\)/)
  assert.match(workflowSource, /github\.event\.check_run\.app\.slug == 'cloudflare-pages'/)
  assert.doesNotMatch(workflowSource, /contains\(github\.event\.check_run\.name, 'Pages'\)/)
  assert.match(workflowSource, /\/api\/automation\/alert/)
  assert.match(workflowSource, /x-automation-alert-secret/)
  assert.match(workflowSource, /workflow": "pages-deploy-alert"/)
  assert.doesNotMatch(workflowSource, /cron:/)
})

test('public asset preflight now counts files before Pages upload', () => {
  assert.match(prebuild, /check-public-asset-size\.mjs/)
  assert.match(checkerSource, /evaluatePublicAssets/)
  assert.match(checkerSource, /fileCount/)
})
