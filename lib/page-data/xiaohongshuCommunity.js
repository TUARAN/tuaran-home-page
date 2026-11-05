/**
 * 小红书社群群公告页。
 * 真实链接指向站内已公开页面；占位条目不放链接，文案标明「陆续补充」。
 * 封面文案按笔记口吻写，喜欢和收藏只在页面上做装饰，不写互动数字。
 */

export const XIAOHONGSHU_COMMUNITY_SLUG = 'xiaohongshu-community'
export const XIAOHONGSHU_COMMUNITY_PATH = '/resources/xiaohongshu-community'
export const XIAOHONGSHU_COMMUNITY_URL = `https://2aran.com${XIAOHONGSHU_COMMUNITY_PATH}`

export const XIAOHONGSHU_COMMUNITY = {
  slug: XIAOHONGSHU_COMMUNITY_SLUG,
  path: XIAOHONGSHU_COMMUNITY_PATH,
  url: XIAOHONGSHU_COMMUNITY_URL,
  title: '专供小红书社群',
  description: '专供小红书社群的种草笔记页。群公告可直接使用：今日想安利、上手小抄、一起慢慢学。',
  purpose: '群公告贴这里。几张笔记封面，点开就能看。',
  honesty: '封面上写着「陆续补充」的，还在整理。',
  date: '2026-11-05',
  sections: [
    {
      id: 'anli',
      title: '今日想安利',
      note: '最近想丢进群里的几篇。',
      items: [
        {
          id: 'ai-agents',
          kicker: '小帮手',
          cover: '自己去跑',
          emoji: '✨',
          title: '让它自己去跑一趟',
          note: '记性、小工具，接到真实环境里。',
          href: '/topics/ai-agents',
          status: 'live',
        },
        {
          id: 'frontend-weekly',
          kicker: '周更',
          cover: '本周在看',
          emoji: '👀',
          title: '这周眼睛停在哪',
          note: '做页面的人，这周值得看一眼的更新。',
          href: '/frontend-weekly',
          status: 'live',
        },
        {
          id: 'dev-resources',
          kicker: '收藏',
          cover: '顺手工具',
          emoji: '📎',
          title: '抽屉里常打开的',
          note: '做东西时会顺手点开的那些。',
          href: '/bookmarks/dev-resources',
          status: 'live',
        },
        {
          id: 'matrixlink',
          kicker: '博主',
          cover: '博主一桌',
          emoji: '🌿',
          title: '一群博主凑一起',
          note: '广州矩联：写作者怎么一起做内容和牌子。',
          href: '/articles/research/companies/matrixlink-blogger-alliance',
          status: 'live',
        },
      ],
    },
    {
      id: 'xiaochao',
      title: '上手小抄',
      note: '能抄走的短句和说法。',
      items: [
        {
          id: 'prompt-center',
          kicker: '模板',
          cover: '直接抄',
          emoji: '✏️',
          title: '可以直接抄的说话稿',
          note: '挑一个任务，复制，填上你自己的目标。',
          href: '/prompt-center',
          status: 'live',
        },
        {
          id: 'task-brief',
          kicker: '小抄',
          cover: '说清楚',
          emoji: '💬',
          title: '把一件事说清楚',
          note: '目标、背景、限制、想要的样子、怎样算做完。',
          href: '/prompt-center#task-brief',
          status: 'live',
        },
        {
          id: 'constraint-rewrite',
          kicker: '小抄',
          cover: '别改丢',
          emoji: '✂️',
          title: '改文案别改丢事实',
          note: '标题和段落可以换，数字和链接留着。',
          href: '/prompt-center#rewrite',
          status: 'live',
        },
        {
          id: 'group-prompts',
          kicker: '群内',
          cover: '好句子',
          emoji: '💌',
          title: '群里攒的好句子',
          note: '小红书笔记向的说法，陆续补充。',
          status: 'placeholder',
        },
      ],
    },
    {
      id: 'manman',
      title: '一起慢慢学',
      note: '想学就按这个顺序翻，不赶。',
      items: [
        {
          id: 'ai-learning-library',
          kicker: '入门',
          cover: '先翻书',
          emoji: '📚',
          title: '想入门，先翻这摞书',
          note: '按方向收好的书单，从这里开始翻。',
          href: '/resources/ai-learning-library',
          status: 'live',
        },
        {
          id: 'edge-agent-development',
          kicker: '动手',
          cover: '做出来',
          emoji: '🪄',
          title: '把想法做成能打开的页面',
          note: '从试一试到放上网，让别人打开。',
          href: '/resources/edge-agent-development',
          status: 'live',
        },
        {
          id: 'note-checklist',
          kicker: '清单',
          cover: '发之前',
          emoji: '📝',
          title: '发笔记前看一眼',
          note: '标题、封面、正文和什么时候发，陆续补充。',
          status: 'placeholder',
        },
        {
          id: 'starter-path',
          kicker: '起步',
          cover: '第一篇',
          emoji: '🌱',
          title: '从围观到发出第一篇',
          note: '群友怎么开始，陆续补充。',
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
