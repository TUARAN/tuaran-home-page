// 「ego」按钮复制的分发任务：只携带本次任务，规则和平台手册在 `2aran-distributor` skill 里。
// 任务台模式（buildDistributionClaimPrompt）只给任务地址和 token，文章由智能体从接口领取；
// 任务表不可用时退回离线任务（buildDistributionTaskPrompt），整篇 Markdown 随提示词复制。

import {
  DISTRIBUTOR_SKILL_NAME,
  GUEST_EGO_BROWSER_PROFILE,
  HARNESS_VERSION,
  PUBLIC_SKILL_DOWNLOAD_PATH,
  PUBLIC_SKILL_PAGE_PATH,
  SITE_ORIGIN,
} from './harness.js'
import { prepareDistributionMarkdown } from './markdownPrep.js'
import { getAuthorIntroHtml } from '../site/authorIntroMarkdown.js'
import { DISTRIBUTION_AGENT_PLATFORM_IDS } from './playbooks.js'
import { getDistributionPlatform } from './platforms.js'

export function absolutizeMarkdownUrls(markdown) {
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

function skillCheckLines(action, { audience = 'owner' } = {}) {
  const install =
    audience === 'guest'
      ? `如果没有这个 skill，或版本不是 ${HARNESS_VERSION}，先停下告诉我：打开 ${SITE_ORIGIN}${PUBLIC_SKILL_PAGE_PATH} 安装，或下载 ${SITE_ORIGIN}${PUBLIC_SKILL_DOWNLOAD_PATH}。`
      : `如果没有这个 skill，或版本不是 ${HARNESS_VERSION}，先停下告诉我：在 tuaran-home-page 仓库运行 \`npm run distributor:skill:install\`。`
  return [`用 \`${DISTRIBUTOR_SKILL_NAME}\` skill ${action}（harness ${HARNESS_VERSION}）。`, install]
}

export function distributionAgentJobUrl(jobId, origin = SITE_ORIGIN) {
  return `${String(origin || SITE_ORIGIN).replace(/\/+$/, '')}/api/distribution/agent/jobs/${jobId}`
}

export function buildDistributionClaimPrompt({ jobId, token, title = '', origin = SITE_ORIGIN } = {}) {
  return [
    ...skillCheckLines('领取并执行 2aran 分发任务'),
    '',
    '按 skill 的「任务台模式」领取任务、逐平台回报、最后收尾。',
    '',
    title ? `- 文章：${cleanLine(title)}` : null,
    `- 任务地址：${distributionAgentJobUrl(jobId, origin)}`,
    `- token：${token}`,
    '- token 24 小时内有效，任务收尾或取消后失效；不要写进文件或发到别处。',
    '',
  ].filter((line) => line !== null).join('\n')
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
  const body = absolutizeMarkdownUrls(prepareDistributionMarkdown(markdown, { title })).trim()
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(body) + 1))
  const tagList = (Array.isArray(tags) ? tags : []).map(cleanLine).filter(Boolean)

  const lines = [
    ...skillCheckLines('执行下面的 2aran 分发任务'),
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
    '## 作者介绍 HTML（富文本平台先粘这段，再粘站内正文）',
    '',
    '```html',
    getAuthorIntroHtml(),
    '```',
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

export function buildGuestDistributionTaskPrompt({
  title,
  url,
  summary = '',
  tags = [],
  platformIds = DISTRIBUTION_AGENT_PLATFORM_IDS,
  profileId = GUEST_EGO_BROWSER_PROFILE.profileId,
} = {}) {
  const platforms = (Array.isArray(platformIds) ? platformIds : [])
    .map(getDistributionPlatform)
    .filter(Boolean)
  const tagList = (Array.isArray(tags) ? tags : []).map(cleanLine).filter(Boolean)
  const excerpt = cleanLine(summary).slice(0, 600)

  const lines = [
    ...skillCheckLines('执行下面的 2aran 分发任务（自备账号）', { audience: 'guest' }),
    '',
    '- 模式：自备账号（guest）',
    `- ego profileId：\`${String(profileId || GUEST_EGO_BROWSER_PROFILE.profileId).trim() || GUEST_EGO_BROWSER_PROFILE.profileId}\``,
    '- 不要带 Bearer token，不要请求站长任务台接口。',
    '',
    '按 skill 的「自备账号模式」处理；平台手册与站长任务台共用，但浏览器 profile 与登录 handOff 对象以本节为准。',
    '',
    '## 目标平台',
    ...platforms.map((platform) => `- ${platform.shortLabel}（\`${platform.id}\`）`),
    '',
    '## 文章信息',
    `- 标题：${cleanLine(title)}`,
    `- 站内原文：${url}`,
    excerpt ? `- 摘要（可作各平台摘要，不编造）：${excerpt}` : null,
    tagList.length ? `- 站内标签：${tagList.join('、')}` : null,
    '',
    '## 正文获取（默认防全文镜像）',
    `- 打开站内原文 URL，按 skill「内容处理」从 \`article.prose-tuaran\` 或 \`main article\` 获取正文 HTML/Markdown，不要从本提示词复制全文。`,
    '- 发布时文首或文末保留原文链接；转载/翻译填写该 URL；「原创」仅在你本人撰写或已获授权时使用。',
    '',
  ]

  return lines.filter((line) => line !== null).join('\n')
}
