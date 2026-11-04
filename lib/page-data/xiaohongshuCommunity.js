/**
 * 小红书社群群公告资源页。
 * 真实链接指向站内已公开页面；占位条目不放链接，文案标明「陆续补充」。
 */

export const XIAOHONGSHU_COMMUNITY_SLUG = 'xiaohongshu-community'
export const XIAOHONGSHU_COMMUNITY_PATH = '/resources/xiaohongshu-community'
export const XIAOHONGSHU_COMMUNITY_URL = `https://2aran.com${XIAOHONGSHU_COMMUNITY_PATH}`

export const XIAOHONGSHU_COMMUNITY = {
  slug: XIAOHONGSHU_COMMUNITY_SLUG,
  path: XIAOHONGSHU_COMMUNITY_PATH,
  url: XIAOHONGSHU_COMMUNITY_URL,
  title: '专供小红书社群',
  description: '专供小红书社群的公开资源页。群公告可直接使用：资讯精选、提示词技巧、实用清单与入门路径。',
  purpose: '给小红书群公告用的资源入口：资讯、提示词和入门清单。',
  honesty: '标成「占位」的条目还在整理，其余链接可以直接打开。',
  date: '2026-11-04',
  sections: [
    {
      id: 'news',
      title: '资讯精选',
      note: 'AI、开发者工具和矩联的公开入口。',
      items: [
        {
          id: 'ai-agents',
          kicker: 'AI',
          title: 'AI 智能体',
          note: '智能体工程实践：记忆、工具协议和真实环境接入。',
          href: '/topics/ai-agents',
          status: 'live',
        },
        {
          id: 'frontend-weekly',
          kicker: '开发者工具',
          title: '前端周看',
          note: '前端与 AI 工程的周刊、每日精选和持续更新。',
          href: '/frontend-weekly',
          status: 'live',
        },
        {
          id: 'dev-resources',
          kicker: '开发者工具',
          title: '开发资源',
          note: '前端、后端和 DevOps 的工具链收藏。',
          href: '/bookmarks/dev-resources',
          status: 'live',
        },
        {
          id: 'matrixlink',
          kicker: '矩联',
          title: '矩联科技（博主联盟）',
          note: '广州矩联科技的公司调研：技术博主协作与品牌增长。',
          href: '/articles/research/companies/matrixlink-blogger-alliance',
          status: 'live',
        },
      ],
    },
    {
      id: 'prompts',
      title: '提示词 / Prompt 技巧',
      note: '可复制的任务模板，以及还在整理的群内合集。',
      items: [
        {
          id: 'prompt-center',
          kicker: '模板',
          title: 'Prompt 中心',
          note: '按任务挑选模板，复制后填入自己的目标。',
          href: '/prompt-center',
          status: 'live',
        },
        {
          id: 'task-brief',
          kicker: '技巧',
          title: '五段式任务简报',
          note: '用目标、背景、约束、输出和验收把请求说清楚。',
          href: '/prompt-center#task-brief',
          status: 'live',
        },
        {
          id: 'constraint-rewrite',
          kicker: '技巧',
          title: '保留事实的内容改写',
          note: '改标题和段落时，保住数字、链接和因果关系。',
          href: '/prompt-center#rewrite',
          status: 'live',
        },
        {
          id: 'group-prompts',
          kicker: '群内',
          title: '群内精选提示词',
          note: '小红书笔记向的精选提示词，陆续补充。',
          status: 'placeholder',
        },
      ],
    },
    {
      id: 'paths',
      title: '实用清单与入门路径',
      note: '已经公开的学习路径，以及给群友准备的清单。',
      items: [
        {
          id: 'ai-learning-library',
          kicker: '入门',
          title: '安东尼学 AI',
          note: '按机器学习、NLP、计算机视觉等方向整理的经典书目。',
          href: '/resources/ai-learning-library',
          status: 'live',
        },
        {
          id: 'edge-agent-development',
          kicker: '路径',
          title: '边缘智能体开发实战',
          note: '从原型到 Cloudflare 边缘部署的课程目录。',
          href: '/resources/edge-agent-development',
          status: 'live',
        },
        {
          id: 'note-checklist',
          kicker: '清单',
          title: '小红书技术笔记发布清单',
          note: '标题、封面、正文结构和发布时间，陆续补充。',
          status: 'placeholder',
        },
        {
          id: 'starter-path',
          kicker: '路径',
          title: '群友入门路径',
          note: '从关注主题到发出第一篇笔记，陆续补充。',
          status: 'placeholder',
        },
      ],
    },
  ],
}

export function xiaohongshuCommunityItems(page = XIAOHONGSHU_COMMUNITY) {
  return page.sections.flatMap((section) => section.items.map((item) => ({ ...item, sectionId: section.id })))
}

export function xiaohongshuCommunityJsonLd(page = XIAOHONGSHU_COMMUNITY) {
  const linked = xiaohongshuCommunityItems(page).filter((item) => item.status === 'live' && item.href)
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
    description: page.description,
    url: page.url,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: '2aran.com',
      url: 'https://2aran.com',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: linked.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: item.href.startsWith('http') ? item.href : `https://2aran.com${item.href.split('#')[0]}`,
      })),
    },
  }
}
