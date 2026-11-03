export const TOPIC_HUB_GROUPS = [
  { id: 'entry', title: '入口' },
  { id: 'essay', title: '文章' },
  { id: 'record', title: '记录' },
]

export const TOPIC_HUBS = {
  'ai-agents': {
    slug: 'ai-agents',
    path: '/topics/ai-agents',
    title: 'AI 智能体',
    kicker: '主线',
    description: '涂阿燃（TUARAN）写 AI 智能体的工程实践：记忆、工具协议、OpenClaw 贡献，以及能在真实环境里跑起来的接入方式。',
    leads: [
      { href: '/articles?subject=ai_dev', label: 'AI 与开发目录', note: '模型、Agent、AI 编程与工具', group: 'entry' },
      { href: '/articles/research/topics/agent-memory-mechanisms', label: '编码与办公智能体的记忆机制', note: 'Codex、WorkBuddy 与本地优先的记忆边界', group: 'essay' },
      { href: '/articles/research/topics/vibe-coding-judgment-structure', label: 'Vibe Coding 的判断结构', note: '产能放大之后，系统责任仍在人这边', group: 'essay' },
      { href: '/articles/research/topics/openclaw-repo-snapshot-pr-guide', label: 'OpenClaw 仓库快照与提 PR', note: '外部贡献者如何把改动送到 main', group: 'essay' },
      { href: '/articles/openclaw-pr-anthropic-image-normalization', label: 'OpenClaw 图片兼容修复', note: '已合并到主分支的一次贡献记录', group: 'essay' },
      { href: '/about#openclaw-contributions', label: 'OpenClaw 合并记录', note: '每条记录链到公开 PR', group: 'record' },
      { href: '/publications', label: '著作', note: '《AI大模型的底层逻辑》《AI Bots 通关指南》等', group: 'record' },
    ],
  },
  'frontend-cloud': {
    slug: 'frontend-cloud',
    path: '/topics/frontend-cloud',
    title: '前端与云工程',
    kicker: '主线',
    description: '前端工程、Next.js 与 Cloudflare 部署实践，包括这台站点自己的架构、缓存、额度和发布复盘。',
    leads: [
      { href: '/articles?subject=web_cloud', label: 'Web 与云目录', note: '前端、架构、网络与平台', group: 'entry' },
      { href: '/articles?subject=site_engineering', label: '站点工程目录', note: '2aran.com 的架构、发布与运维', group: 'entry' },
      { href: '/articles/research/topics/nextjs-cloudflare-performance-optimization', label: 'Next.js 首屏与 Cloudflare 部署', note: '主站和 /web-llm 的加载与缓存复盘', group: 'essay' },
      { href: '/articles/research/topics/cloudflare-edge-agents-practice', label: 'Cloudflare 边缘智能体', note: 'Workers、Durable Objects 与 Agents SDK', group: 'essay' },
      { href: '/articles/research/topics/cloudflare-d1-free-tier-limit-enforcement', label: 'D1 免费层限额', note: '读写额度从预算变成可用性边界', group: 'essay' },
      { href: '/frontend-weekly', label: '前端周看', note: '前端、AI Agent 与工程情报', group: 'entry' },
      { href: '/topics/ai-agents', label: 'AI 智能体', note: '同一条主线里的智能体实践', group: 'entry' },
    ],
  },
}

export const TOPIC_HUB_LIST = Object.values(TOPIC_HUBS)

export function getTopicHub(slug) {
  return TOPIC_HUBS[slug] || null
}
