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
