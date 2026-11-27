// 由 harness 规则和平台手册生成 `2aran-distributor` skill（SKILL.md）。
// 生成结果提交在 codex-skills/2aran-distributor/SKILL.md，测试会核对两者一致。

import { AGENT_JOB_MODE_RULES, DISTRIBUTOR_SKILL_NAME, HARNESS_RULES, HARNESS_VERSION, REPORT_FIELDS } from './harness.js'
import { DISTRIBUTION_PLAYBOOKS } from './playbooks.js'
import { getDistributionPlatform } from './platforms.js'

function bullet(lines) {
  return lines.map((line) => `- ${line}`)
}

function playbookSection(id, playbook) {
  const platform = getDistributionPlatform(id)
  const lines = [
    `### ${platform?.shortLabel || id}（\`${id}\`，${playbook.verifiedAt} 实测）`,
    '',
    `- 入口：${playbook.entry}`,
    `- 登录判断：${playbook.login}`,
    '- 步骤：',
    ...playbook.steps.map((step, index) => `  ${index + 1}. ${step}`),
  ]
  for (const snippet of playbook.snippets) {
    lines.push(`- ${snippet.label}：`, '', '  ```js', `  ${snippet.code}`, '  ```', '')
  }
  lines.push(`- 核对：${playbook.verify}`, `- 成功标志：${playbook.success}`, '')
  return lines
}

export function buildDistributorSkill() {
  const lines = [
    '---',
    `name: ${DISTRIBUTOR_SKILL_NAME}`,
    'description: >',
    '  2aran 分发智能体。把 2aran.com 的文章用 ego lite 浏览器发布到掘金、CSDN 等外部平台。',
    '  Use when: 用户粘贴「2aran 分发任务」，或要求把站内文章分发、同步、发布到外部内容平台。',
    'metadata:',
    `  version: "${HARNESS_VERSION}"`,
    '---',
    '',
    `# ${DISTRIBUTOR_SKILL_NAME}`,
    '',
    '由 tuaran-home-page 仓库的 `lib/distribution/` 生成，不要直接修改本文件。更新方式：在仓库里运行 `npm run distributor:skill:install`。',
    '',
    '## 开工前',
    '',
    `- 任务里写明了 harness 版本。本 skill 的版本是 \`${HARNESS_VERSION}\`；两者不一致时先停下，请站长运行 \`npm run distributor:skill:install\` 更新 skill。`,
    '- 任务列出的平台在下方没有手册时，先问站长：跳过，还是边探索边发布。探索发布时同样遵守全部安全规则，并在回报里给出这个平台的手册草稿（入口、登录判断、步骤、核对、成功标志）。',
    '- 按任务里的平台顺序逐个处理：一个平台发布并核对完，再开始下一个。',
    '',
  ]

  for (const section of HARNESS_RULES) {
    lines.push(`## ${section.title}`, '', ...bullet(section.rules), '')
  }

  lines.push('## 平台手册', '', '手册里的选择器和代码片段优先使用；失效时自己看页面处理，并记进回报的「手册偏差」。', '')
  for (const [id, playbook] of Object.entries(DISTRIBUTION_PLAYBOOKS)) {
    lines.push(...playbookSection(id, playbook))
  }

  lines.push('## 任务台模式', '', ...bullet(AGENT_JOB_MODE_RULES), '')
  lines.push('## 回报', '', '全部平台处理完后，在对话里按平台逐条回报（任务台模式也要）：', '', ...bullet(REPORT_FIELDS), '')

  return lines.join('\n')
}
