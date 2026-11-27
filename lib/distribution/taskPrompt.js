// 「ego」按钮复制的分发任务：只携带本次任务，规则和平台手册在 `2aran-distributor` skill 里。

import { DISTRIBUTOR_SKILL_NAME, HARNESS_VERSION, SITE_ORIGIN } from './harness.js'
import { DISTRIBUTION_AGENT_PLATFORM_IDS } from './playbooks.js'
import { getDistributionPlatform } from './platforms.js'

function absolutizeMarkdownUrls(markdown) {
  return String(markdown || '').replace(/(\]\()(\/[^)\s]*)/g, (_, open, path) => `${open}${SITE_ORIGIN}${path}`)
}

function longestBacktickRun(text) {
  let longest = 0
  for (const match of String(text || '').matchAll(/`+/g)) longest = Math.max(longest, match[0].length)
  return longest
}

function cleanLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function buildDistributionTaskPrompt({
  title,
  url,
  summary = '',
  tags = [],
  markdown = '',
  platformIds = DISTRIBUTION_AGENT_PLATFORM_IDS,
} = {}) {
  const platforms = (Array.isArray(platformIds) ? platformIds : [])
    .map(getDistributionPlatform)
    .filter(Boolean)
  const body = absolutizeMarkdownUrls(markdown).trim()
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(body) + 1))
  const tagList = (Array.isArray(tags) ? tags : []).map(cleanLine).filter(Boolean)

  const lines = [
    `用 \`${DISTRIBUTOR_SKILL_NAME}\` skill 执行下面的 2aran 分发任务（harness ${HARNESS_VERSION}）。`,
    `如果没有这个 skill，或版本不是 ${HARNESS_VERSION}，先停下告诉我：在 tuaran-home-page 仓库运行 \`npm run distributor:skill:install\`。`,
    '',
    '## 目标平台',
    ...platforms.map((platform) => `- ${platform.shortLabel}（\`${platform.id}\`）`),
    '',
    '## 文章信息',
    `- 标题：${cleanLine(title)}`,
    `- 站内原文：${url}`,
    summary ? `- 摘要：${cleanLine(summary)}` : null,
    tagList.length ? `- 站内标签：${tagList.join('、')}` : null,
    '',
    '## Markdown 原文',
    '',
    `${fence}markdown`,
    body,
    fence,
    '',
  ]

  return lines.filter((line) => line !== null).join('\n')
}
