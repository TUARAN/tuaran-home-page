export const OPENCLAW_ACHIEVEMENTS = [
  {
    order: 6,
    number: '120104',
    url: 'https://github.com/openclaw/openclaw/pull/120104',
    image: '/images/openclaw/pr-120104-merged.png',
    imageWidth: 1980,
    imageHeight: 1450,
    title: 'OpenClaw PR #120104 · 限制错误入站消息的重试次数',
    summary:
      '修复 Channel 入站消息在接管回复通道前发生真实处理错误时，被错误归类为普通放弃并无限重试的问题；错误现在进入已有的失败与死信策略，达到上限后不再阻塞同一通道中的后续消息。该 PR 于 2026 年 8 月合并至 openclaw:main，并关联 issue #108865。',
    commits: 1,
    additions: 76,
    deletions: 7,
    changedFiles: 3,
    tags: ['Channels', 'Ingress'],
    mergedBy: 'steipete',
  },
  {
    order: 5,
    number: '113200',
    url: 'https://github.com/openclaw/openclaw/pull/113200',
    image: '/images/openclaw/pr-113200-merged.png',
    imageWidth: 2310,
    imageHeight: 1506,
    title: 'OpenClaw PR #113200 · Doctor 尊重自定义插件加载路径',
    summary:
      '修复 Doctor 在 plugins.load.paths 已发现插件、但不存在托管安装记录时仍尝试通过 npm 重装的问题；同时保留缺失或损坏的托管安装记录原有修复路径。该 PR 于 2026 年 7 月合并至 openclaw:main，同时关闭 issue #113143。',
    commits: 1,
    additions: 89,
    deletions: 14,
    changedFiles: 3,
    tags: ['Doctor', 'plugins.load.paths'],
    issue: { number: '113143', url: 'https://github.com/openclaw/openclaw/issues/113143' },
    mergedBy: 'steipete',
  },
  {
    order: 4,
    number: '102537',
    url: 'https://github.com/openclaw/openclaw/pull/102537',
    image: '/images/openclaw/pr-102537-merged.png',
    imageWidth: 2388,
    imageHeight: 1360,
    title: 'OpenClaw PR #102537 · Anthropic 内联图片格式规范化',
    summary:
      '修复 HEIC、TIFF、BMP 等图片格式直接传给 Anthropic 时导致整轮请求失败的问题：在两条 Anthropic payload 构建路径统一规范化图片，并加入单图与请求级安全预算。该 PR 于 2026 年 7 月合并至 openclaw:main，同时关闭 issue #102323。',
    commits: 1,
    additions: 728,
    deletions: 41,
    changedFiles: 11,
    tags: ['Anthropic'],
    issue: { number: '102323', url: 'https://github.com/openclaw/openclaw/issues/102323' },
    mergedBy: 'steipete',
  },
  {
    order: 3,
    number: '91553',
    url: 'https://github.com/openclaw/openclaw/pull/91553',
    image: '/images/openclaw/pr-91553-merged.png',
    imageWidth: 1982,
    imageHeight: 1418,
    title: 'OpenClaw PR #91553 · Tailscale Serve 启动状态重试',
    summary:
      '修复 Gateway 配置 Tailscale Serve 后，首次 status --json 探测可能撞上 daemon 或 macOS 服务启动竞态的问题；只在本进程刚完成 Serve 配置后对可恢复错误进行有限重试。该 PR 于 2026 年 7 月合并至 openclaw:main，同时关闭 issue #42798。',
    commits: 6,
    additions: 147,
    deletions: 21,
    changedFiles: 4,
    tags: ['Tailscale'],
    issue: { number: '42798', url: 'https://github.com/openclaw/openclaw/issues/42798' },
    mergedBy: 'steipete',
  },
  {
    order: 2,
    number: '98320',
    url: 'https://github.com/openclaw/openclaw/pull/98320',
    image: '/images/openclaw/pr-98320-merged.png',
    imageWidth: 1880,
    imageHeight: 1466,
    title: 'OpenClaw PR #98320 · Feishu 媒体回复回退',
    summary:
      '修复 Feishu 图片和文件回复在引用消息被撤回或删除后无法送达的问题，让受安全条件保护的回退逻辑把媒体恢复为顶层消息。该 PR 于 2026 年 7 月合并至 openclaw:main。',
    commits: 3,
    additions: 168,
    deletions: 35,
    changedFiles: 5,
    tags: ['Feishu'],
    issue: { number: '98311', url: 'https://github.com/openclaw/openclaw/issues/98311' },
    mergedBy: 'steipete',
  },
  {
    order: 1,
    number: '90517',
    url: 'https://github.com/openclaw/openclaw/pull/90517',
    image: '/images/openclaw/pr-90517-merged.png',
    imageWidth: 2624,
    imageHeight: 1456,
    title: 'OpenClaw PR #90517 · Web Login 插件缺失提示',
    summary:
      '修复 Gateway 侧 Web Login 缺少外部插件时的提示路径：复用官方 external plugin repair hint，在 provider 不可用时返回可执行的安装或 openclaw doctor --fix 指引。该 PR 于 2026 年 7 月合并至 openclaw:main。',
    commits: 2,
    additions: 153,
    deletions: 5,
    tags: ['gateway', 'web login'],
    issue: { number: '83277', url: 'https://github.com/openclaw/openclaw/issues/83277' },
  },
]

export const OPENCLAW_ACHIEVEMENT_COUNT = OPENCLAW_ACHIEVEMENTS.length
export const OPENCLAW_RESOLVED_ISSUES = OPENCLAW_ACHIEVEMENTS
  .map((achievement) => achievement.issue)
  .filter(Boolean)

export function getOpenClawAchievementFacts(achievement) {
  return [
    `${achievement.commits} ${achievement.commits === 1 ? 'commit' : 'commits'}`,
    `+${achievement.additions} -${achievement.deletions}`,
    achievement.changedFiles ? `${achievement.changedFiles} files` : null,
    ...achievement.tags,
    achievement.issue ? `解决 issue #${achievement.issue.number}` : null,
    achievement.mergedBy ? `${achievement.mergedBy} merged` : null,
    'main',
  ].filter(Boolean)
}
