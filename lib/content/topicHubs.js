import { getContactChannel } from '../site/contactChannels.js'

const wechatId = getContactChannel('wechat').value

export const TOPIC_HUB_GROUPS = [
  { id: 'essay', title: '文章', note: '可以直接读完的篇目。' },
  { id: 'record', title: '记录', note: '合并、出版和规则的落点。' },
  { id: 'entry', title: '入口', note: '目录和相邻页面，用来继续找。' },
]

export const TOPIC_HUBS = {
  'ai-agents': {
    slug: 'ai-agents',
    path: '/topics/ai-agents',
    title: 'AI 智能体',
    kicker: '主线',
    description: '涂阿燃（TUARAN）写 AI 智能体的工程实践：记忆、工具协议、OpenClaw 贡献，以及能在真实环境里跑起来的接入方式。',
    standing: 'OpenClaw 改动已合并进主分支，书目在著作。',
    leads: [
      { href: '/articles?subject=ai_dev', label: 'AI 与开发目录', note: '模型、Agent、AI 编程与工具', group: 'entry' },
      { href: '/articles/research/topics/agent-memory-mechanisms', label: '编码与办公智能体的记忆机制', note: 'Codex、WorkBuddy 与本地优先的记忆边界', group: 'essay' },
      { href: '/articles/research/topics/vibe-coding-judgment-structure', label: 'Vibe Coding 的判断结构', note: '产能放大之后，系统责任仍在人这边', group: 'essay' },
      { href: '/articles/research/topics/openclaw-repo-snapshot-pr-guide', label: 'OpenClaw 仓库快照与提 PR', note: '外部贡献者如何把改动送到 main', group: 'essay' },
      { href: '/articles/openclaw-pr-anthropic-image-normalization', label: 'OpenClaw 图片兼容修复', note: '已合并到主分支的一次贡献记录', group: 'essay' },
      { href: '/topics/openclaw', label: 'OpenClaw', note: '已合并到主分支的贡献，和提交流程', group: 'record' },
      { href: '/topics/books', label: '著作', note: '《AI大模型的底层逻辑》《AI Bots 通关指南》等', group: 'record' },
    ],
  },
  'frontend-cloud': {
    slug: 'frontend-cloud',
    path: '/topics/frontend-cloud',
    title: '前端与云工程',
    kicker: '主线',
    description: '前端工程、Next.js 与 Cloudflare 部署实践，包括这台站点自己的架构、缓存、额度和发布复盘。',
    standing: '这台站点跑在 Next.js 与 Cloudflare 上。',
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
  books: {
    slug: 'books',
    path: '/topics/books',
    title: '著作',
    kicker: '主线',
    description: '已经出版和发布的书、电子小册，以及站内可读的书籍资源。每本书有自己的页面，馆藏集中在图书馆。',
    standing: '已出版图书、电子小册和站内可读资源，目录在图书馆。',
    leads: [
      { href: '/books/seedance-guide', label: '《Seedance：电影级AI视频创作指南》', note: '涂阿燃（笔名涂智研）、李谊林联合编著。中国水利水电出版社，2026', group: 'record' },
      { href: '/books/llm-underlying-logic', label: '《AI大模型的底层逻辑》', note: '中国水利水电出版社，2026。模型原理、RAG、MCP 与智能体', group: 'record' },
      { href: '/books/programmer-growth-notes', label: '《程序员成长手记》', note: '机械工业出版社，2023。工程实践与职业发展', group: 'record' },
      { href: '/books/ai-bots-guide', label: '《AI Bots 通关指南》', note: '掘金电子小册，2024。AI Bot 与智能体实践', group: 'record' },
      { href: '/resources/books', label: '图书馆', note: '已出版作品与站内可读资源集中陈列', group: 'entry' },
    ],
  },
  openclaw: {
    slug: 'openclaw',
    path: '/topics/openclaw',
    title: 'OpenClaw',
    kicker: '主线',
    description: '涂阿燃合并进 OpenClaw 主分支的改动，以及外部贡献者把补丁送到 main 的做法。',
    standing: '只收已经合并进 OpenClaw 主分支的改动。',
    leads: [
      { href: '/about#openclaw-contributions', label: '合并记录', note: '每条记录链到公开 PR', group: 'record' },
      { href: '/articles/openclaw-pr-anthropic-image-normalization', label: '图片兼容修复', note: '已合并到主分支的一次贡献', group: 'essay' },
      { href: '/articles/research/topics/openclaw-repo-snapshot-pr-guide', label: '仓库快照与提 PR', note: '外部贡献者如何把改动送到 main', group: 'essay' },
      { href: '/topics/ai-agents', label: 'AI 智能体', note: '记忆、工具协议和接入方式', group: 'entry' },
    ],
  },
  editorial: {
    slug: 'editorial',
    path: '/topics/editorial',
    title: '内容说明',
    kicker: '主线',
    description: '作者、选题、核对、更正和 AI 协助。完整规则在内容说明页，作者介绍和更正入口并列。',
    standing: '作者、选题、核对、更正和 AI 协助。',
    leads: [
      { href: '/editorial', label: '完整说明', note: '作者责任、选题范围、核对、修订和 AI 协助', group: 'entry' },
      { href: '/about', label: '关于涂阿燃', note: `履历、微信 ${wechatId} 和 OpenClaw 贡献`, group: 'entry' },
      { href: '/help#editorial', label: '帮助里的规则摘要', note: '和完整说明使用同一套边界', group: 'record' },
      { href: '/contact', label: '提交更正', note: '附上页面网址、段落和可核验来源', group: 'record' },
    ],
  },
}

export const TOPIC_HUB_LIST = Object.values(TOPIC_HUBS)

export function getTopicHub(slug) {
  return TOPIC_HUBS[slug] || null
}
