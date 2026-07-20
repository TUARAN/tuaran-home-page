export const COMMUNITY_TOPICS = [
  {
    id: 'x-mutual-aid-circle',
    href: '/x-mutual-aid-circle',
    label: 'X 互帮互助圈子',
    labelEn: 'X Mutual Aid Circle',
    eyebrow: 'X / Twitter',
    desc: '真实互动、账号增长、互关清理与发帖时段工具。',
    descEn: 'Real engagement, account growth, cleanup and timing tools.',
    tag: '已开放',
    customPage: true,
  },
  {
    id: 'xiaohongshu-creator-circle',
    slug: 'xiaohongshu',
    href: '/circles/xiaohongshu',
    label: '小红书创作互助圈',
    labelEn: 'Xiaohongshu Creator Circle',
    eyebrow: 'Xiaohongshu',
    desc: '选题共创、封面与标题互评，交流真实的内容增长经验。',
    descEn: 'Topic co-creation, cover reviews and practical content growth.',
    tag: '发起中',
    accent: '#e94b68',
    positioning: '给认真做内容的人一个小范围、可持续的互评场。少追热点套路，多看真实反馈。',
    audience: ['正在稳定更新小红书的创作者', '愿意展示过程数据和复盘的人', '擅长图文、视频、设计或垂直内容的人'],
    activities: ['选题、标题和封面发布前互评', '笔记结构与账号定位复盘', '平台规则、工具和案例共享'],
  },
  {
    id: 'juejin-creator-circle',
    slug: 'juejin',
    href: '/circles/juejin',
    label: '掘金技术创作圈',
    labelEn: 'Juejin Tech Writers Circle',
    eyebrow: 'Juejin',
    desc: '技术文章互审、选题共建，把工程经验写得更准确、更好读。',
    descEn: 'Peer review and topic building for clearer technical writing.',
    tag: '发起中',
    accent: '#1677ff',
    positioning: '面向技术作者的写作搭子圈。互相找漏洞、补上下文，也分享真正做过的工程实践。',
    audience: ['前端、AI、服务端与产品工程作者', '想把项目经验沉淀成文章的开发者', '愿意认真审稿和给具体建议的人'],
    activities: ['技术事实、代码和表达互审', '系列选题与联合创作', '发布节奏、数据表现与分发复盘'],
  },
  {
    id: 'jike-builder-circle',
    slug: 'jike',
    href: '/circles/jike',
    label: '即刻独立创造圈',
    labelEn: 'Jike Indie Builders Circle',
    eyebrow: 'Jike',
    desc: '独立开发、Build in Public、产品冷启动与真实用户反馈。',
    descEn: 'Indie building, public progress and early product feedback.',
    tag: '发起中',
    accent: '#f2b705',
    positioning: '给正在做东西的人留一张长期更新的桌子。可以晒半成品，也可以直接问冷启动难题。',
    audience: ['独立开发者与一人公司实践者', '正在验证产品想法的设计师和产品人', '愿意公开过程、接受直接反馈的人'],
    activities: ['每周进度、失败与数据复盘', '产品体验和落地页互测', '冷启动渠道与首批用户经验交流'],
  },
  {
    id: 'zhihu-writing-circle',
    slug: 'zhihu',
    href: '/circles/zhihu',
    label: '知乎深度创作圈',
    labelEn: 'Zhihu Long-form Circle',
    eyebrow: 'Zhihu',
    desc: '问题筛选、资料核验与长回答互评，积累经得住回看的内容。',
    descEn: 'Question selection, fact checking and long-form peer review.',
    tag: '发起中',
    accent: '#0b75df',
    positioning: '围绕“把一个问题讲清楚”组织协作。重视来源、论证与长期价值，不追求批量灌水。',
    audience: ['写专业回答、经验回答和长文的人', '有行业知识但还不熟悉内容表达的人', '愿意核对来源、讨论论证边界的人'],
    activities: ['问题价值与回答角度讨论', '资料来源、事实和逻辑互查', '长回答结构、标题与开头互评'],
  },
  {
    id: 'wechat-writers-circle',
    slug: 'wechat',
    href: '/circles/wechat',
    label: '公众号长期写作圈',
    labelEn: 'WeChat Writers Circle',
    eyebrow: 'WeChat Official Accounts',
    desc: '长期选题、文章互审、排版分发与读者关系经营。',
    descEn: 'Long-term editorial planning, review and reader relationships.',
    tag: '发起中',
    accent: '#19a974',
    positioning: '服务还想继续写下去的人。一起维持更新节奏，也讨论订阅关系、栏目和内容资产。',
    audience: ['个人公众号与小团队内容负责人', '经营技术、商业或个人成长主题的作者', '重视订阅读者而非短期爆款的人'],
    activities: ['月度选题表与更新节奏共建', '文章结构、标题和排版互审', '订阅增长、内容归档与多平台分发复盘'],
  },
]

const DISCUSSION_TOPIC_COPY = {
  'x-mutual-aid-circle': { shortLabel: 'X', shortDesc: '真实互动，互助增长。' },
  'xiaohongshu-creator-circle': { shortLabel: '小红书', shortDesc: '选题、标题与封面互评。' },
  'juejin-creator-circle': { shortLabel: '掘金', shortDesc: '技术文章互审共创。' },
}

export const DISCUSSION_COMMUNITY_TOPICS = COMMUNITY_TOPICS
  .filter((topic) => DISCUSSION_TOPIC_COPY[topic.id])
  .map((topic) => ({ ...topic, ...DISCUSSION_TOPIC_COPY[topic.id] }))

export const TEMPLATE_COMMUNITY_TOPICS = COMMUNITY_TOPICS.filter((topic) => topic.slug)

export function getCommunityTopicBySlug(slug) {
  return TEMPLATE_COMMUNITY_TOPICS.find((topic) => topic.slug === slug) || null
}
