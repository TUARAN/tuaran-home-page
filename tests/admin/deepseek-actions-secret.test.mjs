import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const panelSource = await readFile(
  new URL('../../app/(admin)/admin/deepseek-tasks/DeepSeekKeysPanel.jsx', import.meta.url),
  'utf8',
)

const workflows = [
  ['design-scan.yml', 'design'],
  ['perf-scan.yml', 'performance'],
  ['security-scan.yml', 'security'],
]

test('DeepSeek key panel records every GitHub Actions workflow that directly injects the repository secret', async () => {
  assert.match(panelSource, /GitHub Actions 仓库密钥/)
  assert.match(panelSource, /仓库配置已核验/)

  for (const [file, taskType] of workflows) {
    const workflowSource = await readFile(new URL(`../../.github/workflows/${file}`, import.meta.url), 'utf8')
    assert.match(workflowSource, /DEEPSEEK_API_KEY: \$\{\{ secrets\.DEEPSEEK_API_KEY \}\}/)
    assert.match(workflowSource, new RegExp(`scan-analyze\\.mjs ${taskType}`))
    assert.match(panelSource, new RegExp(file.replace('.', '\\.')))
    assert.match(panelSource, new RegExp(`taskType: '${taskType}'`))
  }
})

test('changelog workflow injects the shared DeepSeek secret and is listed as an Actions consumer', async () => {
  const workflowSource = await readFile(new URL('../../.github/workflows/changelog-update.yml', import.meta.url), 'utf8')
  assert.match(workflowSource, /DEEPSEEK_API_KEY: \$\{\{ secrets\.DEEPSEEK_API_KEY \}\}/)
  assert.match(workflowSource, /update-changelog\.mjs/)
  assert.match(workflowSource, /if: always\(\)/)
  assert.match(panelSource, /changelog-update\.yml/)
  assert.match(panelSource, /taskType: 'changelog'/)
})

test('GitHub-triggered site tasks are grouped with Actions while preserving the site execution boundary', () => {
  assert.match(panelSource, /DEEPSEEK_GITHUB_TRIGGERED_USES/)
  assert.match(panelSource, /Actions 定时触发，DeepSeek 在公开站执行/)
  assert.match(panelSource, /模型密钥由公开站读取/)
  assert.match(panelSource, /D1 全局兜底，最后才是公开站 Cloudflare Secret/)
  assert.match(panelSource, /全局兜底命中/)

  for (const [name, workflow] of [
    ['A 股研究自动化', 'a-share-research.yml'],
    ['站内互动评论', 'engagement-bot.yml'],
    ['X 每日问候文案', 'morning-greeting.yml'],
  ]) {
    assert.match(panelSource, new RegExp(`name: '${name}'[\\s\\S]*?workflow: '${workflow.replace('.', '\\.')}'`))
  }
})

test('Admin key summary does not identify the first database row as the public site key', () => {
  assert.match(panelSource, /当前 Admin 运行环境/)
  assert.match(panelSource, /实际调用请到模型调用记录核对密钥与错误/)
  assert.doesNotMatch(panelSource, /const siteKey = activeKeys\[0\]/)
  assert.doesNotMatch(panelSource, /实际调用 \{DEEPSEEK_SITE_MODEL\}/)
  assert.match(panelSource, /站内任务/)
  assert.match(panelSource, /站外互动插件/)
})
