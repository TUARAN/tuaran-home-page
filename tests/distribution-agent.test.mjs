import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { AGENT_JOB_MODE_RULES, DISTRIBUTOR_SKILL_NAME, HARNESS_RULES, HARNESS_VERSION, SITE_ORIGIN } from '../lib/distribution/harness.js'
import { DISTRIBUTION_AGENT_PLATFORM_IDS, DISTRIBUTION_PLAYBOOKS } from '../lib/distribution/playbooks.js'
import { DISTRIBUTION_PLATFORMS, distributionPlatformShortLabel, getDistributionPlatform } from '../lib/distribution/platforms.js'
import { buildDistributorSkill } from '../lib/distribution/skill.js'
import { buildDistributionTaskPrompt } from '../lib/distribution/taskPrompt.js'

test('平台注册表 id 唯一，手册只覆盖已登记平台', () => {
  const ids = DISTRIBUTION_PLATFORMS.map((platform) => platform.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const id of DISTRIBUTION_AGENT_PLATFORM_IDS) assert.ok(getDistributionPlatform(id), id)
  assert.equal(distributionPlatformShortLabel('JUEJIN'), '掘金')
  assert.equal(getDistributionPlatform('unknown'), null)
})

test('每条手册字段完整', () => {
  assert.deepEqual(DISTRIBUTION_AGENT_PLATFORM_IDS, ['juejin', 'csdn'])
  for (const [id, playbook] of Object.entries(DISTRIBUTION_PLAYBOOKS)) {
    assert.match(playbook.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, id)
    for (const key of ['entry', 'login', 'verify', 'success']) assert.ok(playbook[key], `${id}.${key}`)
    assert.ok(playbook.steps.length > 0, id)
    assert.ok(Array.isArray(playbook.snippets), id)
  }
})

test('skill 带版本、全部规则和手册', () => {
  const skill = buildDistributorSkill()
  assert.match(skill, new RegExp(`^---\\nname: ${DISTRIBUTOR_SKILL_NAME}\\n`))
  assert.ok(skill.includes(`version: "${HARNESS_VERSION}"`))
  assert.ok(skill.includes('profileId: "Profile 1"'))
  for (const section of HARNESS_RULES) {
    assert.ok(skill.includes(`## ${section.title}`))
    for (const rule of section.rules) assert.ok(skill.includes(rule), rule)
  }
  assert.ok(skill.includes("document.querySelector('.CodeMirror').CodeMirror.setValue(markdown)"))
  assert.ok(skill.includes('button.btn-b-red'))
  assert.ok(skill.includes('## 任务台模式'))
  for (const rule of AGENT_JOB_MODE_RULES) assert.ok(skill.includes(rule), rule)
})

test('提交的 SKILL.md 与生成结果一致（改了规则或手册要运行 npm run distributor:skill）', async () => {
  const committed = await readFile(new URL(`../codex-skills/${DISTRIBUTOR_SKILL_NAME}/SKILL.md`, import.meta.url), 'utf8')
  assert.equal(committed, buildDistributorSkill())
})

test('任务提示词只带任务：版本、平台、绝对链接、安全的代码围栏', () => {
  const prompt = buildDistributionTaskPrompt({
    title: '  标题\n测试 ',
    url: `${SITE_ORIGIN}/articles/demo`,
    summary: '摘要',
    tags: ['AI', ' ', 'Cloudflare'],
    markdown: '![图](/images/a.png)\n\n[外链](https://example.com)\n\n````js\ncode\n````',
    platformIds: ['csdn', 'unknown'],
  })
  assert.ok(prompt.startsWith(`用 \`${DISTRIBUTOR_SKILL_NAME}\` skill`))
  assert.ok(prompt.includes(`harness ${HARNESS_VERSION}`))
  assert.ok(prompt.includes('npm run distributor:skill:install'))
  assert.ok(prompt.includes('- CSDN（`csdn`）'))
  assert.ok(!prompt.includes('unknown'))
  assert.ok(!prompt.includes('掘金'))
  assert.ok(prompt.includes('- 标题：标题 测试'))
  assert.ok(prompt.includes('- 站内标签：AI、Cloudflare'))
  assert.ok(prompt.includes(`](${SITE_ORIGIN}/images/a.png)`))
  assert.ok(prompt.includes('](https://example.com)'))
  assert.ok(prompt.includes('`````markdown\n'))
  assert.ok(!prompt.includes('安全规则'), '规则在 skill 里，任务不重复')
})

test('任务提示词默认覆盖全部有手册的平台', () => {
  const prompt = buildDistributionTaskPrompt({ title: 't', url: 'u', markdown: 'body' })
  assert.ok(prompt.includes('- 掘金（`juejin`）'))
  assert.ok(prompt.includes('- CSDN（`csdn`）'))
  assert.ok(prompt.includes('```markdown\nbody\n```'))
})

test('离线任务去掉与标题重复的首条 H1', () => {
  const prompt = buildDistributionTaskPrompt({
    title: 't',
    url: `${SITE_ORIGIN}/articles/x`,
    markdown: '# t\n\nbody',
  })
  assert.ok(prompt.includes('```markdown\nbody\n```'))
})
