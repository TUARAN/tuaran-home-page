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

test('GitHub-triggered site tasks are grouped with Actions while preserving the site execution boundary', () => {
  assert.match(panelSource, /DEEPSEEK_GITHUB_TRIGGERED_USES/)
  assert.match(panelSource, /Actions 定时触发，DeepSeek 在站点执行/)
  assert.match(panelSource, /DeepSeek 密钥仍由站点运行环境读取/)

  for (const [name, workflow] of [
    ['A 股研究自动化', 'a-share-research.yml'],
    ['路过互动评论', 'engagement-bot.yml'],
    ['X 每日问候文案', 'morning-greeting.yml'],
  ]) {
    assert.match(panelSource, new RegExp(`name: '${name}'[\\s\\S]*?workflow: '${workflow.replace('.', '\\.')}'`))
  }
})
