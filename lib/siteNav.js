/**
 * 站点导航分类（4 频道两级菜单 + /map 站点地图共享数据源）
 *
 * 一级频道：内容 / 项目 / 服务 / 关于
 * 每个 channel 含 sections（折叠分组）和扁平 routes 列表（/map 用）
 *
 * external: true 表示外链；hot/new 用于在菜单里加角标
 */
export const SITE_CHANNELS = [
  {
    key: 'content',
    label: '内容',
    href: '/articles',
    match: (p) =>
      p?.startsWith('/articles') ||
      p?.startsWith('/reading') ||
      p?.startsWith('/bookmarks') ||
      p?.startsWith('/history') ||
      p?.startsWith('/poetry') ||
      p?.startsWith('/people') ||
      p?.startsWith('/ru-shi-dao') ||
      p?.startsWith('/china-politics') ||
      p?.startsWith('/sun-moon-motion') ||
      p?.startsWith('/writing-monetization-2026'),
    sections: [
      {
        title: '写作 / 调研',
        items: [
          { href: '/articles', label: '知识库', desc: '原创长文 + 调研专题' },
          { href: '/sun-moon-motion', label: '日月运行可视化', desc: '太阳轨迹 · 月相循环', tag: 'New' },
          { href: '/reading', label: '书库', desc: '正在读 / 想读 / 笔记' },
          { href: '/bookmarks', label: '资源库', desc: '收藏 · 教程 · 工具' },
          { href: '/writing-monetization-2026', label: '写作变现 2026', desc: '执行手册', tag: 'New' },
        ],
      },
      {
        title: '人文 / 古典',
        items: [
          { href: '/poetry', label: '诗词', desc: '原创与摘录' },
          { href: '/people', label: '人物志', desc: 'AI 先驱 · 苏东坡 · 马斯克 …' },
          { href: '/history/ming-qing', label: '明清史', desc: '长篇阅读笔记' },
          { href: '/history/three-kingdoms', label: '三国', desc: '群像 · 人物 · 战役' },
          { href: '/ru-shi-dao', label: '儒释道', desc: '思想体系笔记' },
          { href: '/china-politics', label: '当代中国研究', desc: '政经长文' },
        ],
      },
    ],
  },
  {
    key: 'projects',
    label: '项目',
    href: '/ai-projects',
    match: (p) =>
      p === '/ai-projects' ||
      p?.startsWith('/web-llm') ||
      p?.startsWith('/eatwhat') ||
      p?.startsWith('/xiaomoli-dad-todo') ||
      p?.startsWith('/voice-tasks') ||
      p?.startsWith('/context-memory'),
    sections: [
      {
        title: 'AI / 工程',
        items: [
          { href: '/ai-projects', label: 'AI 项目', desc: '数字员工 / Agent / 工具' },
          { href: '/web-llm', label: '端侧大模型', desc: 'WebGPU · Ollama · 边缘' },
          { href: '/context-memory', label: '上下文记忆', desc: '我的工作记忆架构' },
        ],
      },
      {
        title: '生活 / 工具',
        items: [
          { href: '/eatwhat', label: '吃什么', desc: '今天点什么的小工具' },
          { href: '/xiaomoli-dad-todo', label: '茉莉奶爸待办', desc: '日常 / 习惯 / 家庭节奏' },
          { href: '/voice-tasks', label: '语音记事', desc: '随手说一段，落到文字' },
        ],
      },
    ],
  },
  {
    key: 'services',
    label: '服务',
    href: '/services',
    match: (p) =>
      p?.startsWith('/services') ||
      p?.startsWith('/publications') ||
      p?.startsWith('/community') ||
      p?.startsWith('/project-manager'),
    sections: [
      {
        title: '商业 · 矩联出品',
        items: [
          { href: 'https://blogger-alliance.cn/', label: '博主联盟', desc: 'AI 产品方 ↔ 技术博主', external: true, tag: 'Hot' },
          { href: 'https://frontendnext.com/', label: '前端周看', desc: '前端 / AI Agent 情报站', external: true },
        ],
      },
      {
        title: '个人服务',
        items: [
          { href: '/services', label: '服务与报价', desc: '咨询 / 写作 / 推广' },
          { href: '/publications', label: '出版作品', desc: '《程序员成长手记》等' },
          { href: '/community', label: '社群', desc: '线上 / 线下圈子' },
          { href: '/project-manager', label: '项目经理视角', desc: '团队 / 协作 / 交付' },
        ],
      },
    ],
  },
  {
    key: 'about',
    label: '关于',
    href: '/about',
    match: (p) =>
      p?.startsWith('/about') ||
      p?.startsWith('/diary') ||
      p?.startsWith('/messages') ||
      p?.startsWith('/donate') ||
      p?.startsWith('/traffic') ||
      p?.startsWith('/map'),
    sections: [
      {
        title: '了解我',
        items: [
          { href: '/about', label: '关于', desc: '自我介绍 / 履历' },
          { href: '/diary', label: '日志', desc: '近期想法与片段' },
          { href: '/messages', label: '留言板', desc: '给我留言' },
        ],
      },
      {
        title: '站点',
        items: [
          { href: '/map', label: '站点地图', desc: '所有页面一览', tag: 'New' },
          { href: '/traffic', label: '流量', desc: '本站访问数据' },
          { href: '/donate', label: '请喝咖啡', desc: '支持我继续写' },
        ],
      },
    ],
  },
]

/** 扁平展开所有路由，供 /map 等使用 */
export function flattenChannelRoutes() {
  return SITE_CHANNELS.flatMap((channel) =>
    channel.sections.flatMap((section) =>
      section.items.map((item) => ({
        channel: channel.label,
        section: section.title,
        ...item,
      }))
    )
  )
}
