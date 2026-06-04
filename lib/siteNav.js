/**
 * 站点导航分类（4 频道两级菜单 + /map 站点地图共享数据源）
 *
 * 一级频道：内容 / 项目 / 商业 / 关于
 * 每个 channel 含 sections（折叠分组）和扁平 routes 列表（/map 用）
 *
 * external: true 表示外链；hot/new 用于在菜单里加角标
 * nav: false 表示不出现在主导航，但仍保留在 /map 站点地图
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
      p?.startsWith('/classical-masterpieces') ||
      p?.startsWith('/people') ||
      p?.startsWith('/ru-shi-dao') ||
      p?.startsWith('/china-politics'),
    sections: [
      {
        title: '专栏',
        items: [
          { href: '/articles?tab=posts', label: '精选文章', desc: '个人判断 / 原创长文' },
          { href: '/articles/creation-calendar', label: '创作日历', desc: '写作节奏与产出记录', nav: false },
        ],
      },
      {
        title: '调研',
        items: [
          { href: '/articles?tab=companies', label: '公司调研', desc: '公司画像 / 商业分析' },
          { href: '/articles?tab=topics', label: '事项调研', desc: '技术 / 行业 / 市场 / 写作' },
        ],
      },
      {
        title: '资料',
        items: [
          { href: '/articles?tab=resources', label: '站内资料', desc: '原文 / 谱系 / 索引' },
          { href: '/classical-masterpieces', label: '古典名篇', desc: '单篇封神作品谱系', tag: 'New' },
          { href: '/china-politics', label: '政经资料', desc: '当代中国研究' },
          { href: '/reading', label: '书目索引', desc: '正在读 / 想读 / 笔记' },
          { href: '/bookmarks', label: '资源收藏', desc: '外部材料 / 教程 / 工具' },
          { href: '/history/ming-qing', label: '历史', desc: '明清 / 三国 / 长篇笔记', nav: false },
          { href: '/ru-shi-dao', label: '儒释道', desc: '思想体系笔记', nav: false },
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
      p?.startsWith('/works') ||
      p?.startsWith('/cancers-overview') ||
      p?.startsWith('/sun-moon-motion') ||
      p?.startsWith('/ai-token-usage-research') ||
      p?.startsWith('/zhang-juzheng-book') ||
      p?.startsWith('/skill-center') ||
      p?.startsWith('/web-llm') ||
      p?.startsWith('/eatwhat') ||
      p?.startsWith('/xiaomoli-dad-todo') ||
      p?.startsWith('/voice-tasks') ||
      p?.startsWith('/context-memory'),
    sections: [
      {
        title: 'AI 系统',
        items: [
          { href: '/ai-projects', label: 'AI 项目', desc: '数字员工 / Agent / 工具' },
          { href: '/skill-center', label: 'Skill 中心', desc: '模型 / 智能体能力货架', tag: 'New' },
          { href: '/web-llm', label: '端侧大模型', desc: 'WebGPU · Ollama · 边缘' },
          { href: '/context-memory', label: '上下文记忆', desc: '我的工作记忆架构' },
        ],
      },
      {
        title: '工程作品',
        items: [
          { href: '/works', label: '工程作品', desc: '富数据可视化 / 实测 / 长期工程 · 5% 原创层', tag: 'New' },
          { href: '/cancers-overview', label: '癌症全景', desc: '10 种主要癌症 · 多维可视化', tag: 'New', nav: false },
          { href: '/ai-token-usage-research', label: 'AI Token 用量调研', desc: '日耗 1 亿 / 4.5 亿 双账户对照', nav: false },
          { href: '/sun-moon-motion', label: '日月运行可视化', desc: '太阳轨迹 · 月相循环', nav: false },
          { href: '/zhang-juzheng-book', label: '《张居正》写作工程', desc: '长期富页面项目', nav: false },
        ],
      },
      {
        title: '生活 / 工具',
        items: [
          { href: '/eatwhat', label: '吃什么', desc: '今天点什么的小工具', nav: false },
          { href: '/xiaomoli-dad-todo', label: '茉莉奶爸待办', desc: '日常 / 习惯 / 家庭节奏', tag: 'Owner' },
          { href: '/voice-tasks', label: '语音记事', desc: '随手说一段，落到文字', tag: 'Owner' },
        ],
      },
    ],
  },
  {
    key: 'services',
    label: '商业',
    href: '/services',
    match: (p) =>
      p?.startsWith('/services') ||
      p?.startsWith('/publications') ||
      p?.startsWith('/community') ||
      p?.startsWith('/project-manager') ||
      p?.startsWith('/writing-monetization-2026'),
    sections: [
      {
        title: '产品',
        items: [
          { href: 'https://blogger-alliance.cn/', label: '博主联盟', desc: 'AI 产品方 ↔ 技术博主', external: true, tag: 'Hot' },
          { href: 'https://frontendnext.com/', label: '前端周看', desc: '前端 / AI Agent 情报站', external: true, tag: 'Hot' },
        ],
      },
      {
        title: '服务',
        items: [
          { href: '/services', label: '服务与报价', desc: '咨询 / 写作 / 推广' },
          { href: '/writing-monetization-2026', label: '写作变现 2026', desc: '执行手册', tag: 'New' },
          { href: '/project-manager', label: '项目经理视角', desc: '团队 / 协作 / 交付', nav: false },
          { href: '/community', label: '社群', desc: '线上 / 线下圈子', nav: false },
        ],
      },
      {
        title: '作品',
        items: [
          { href: '/publications', label: '出版作品', desc: '《程序员成长手记》等', nav: false },
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
      p?.startsWith('/changelog') ||
      p?.startsWith('/map'),
    sections: [
      {
        title: '个人档案',
        items: [
          { href: '/about', label: '关于', desc: '自我介绍 / 履历' },
          { href: '/diary', label: '日志', desc: '近期想法与片段' },
          { href: '/long-compass', label: '长期罗盘', desc: '加密私域 · 资产 / 复盘 / 行动框架', tag: 'Owner' },
          { href: '/messages', label: '留言板', desc: '给我留言', tag: 'Login', nav: false },
        ],
      },
      {
        title: '站点',
        items: [
          { href: '/changelog', label: '站点更新记录', desc: '按周梳理本站演进', tag: 'New' },
          { href: '/map', label: '索引', desc: '全站结构化入口', tag: 'New' },
          { href: '/traffic', label: '流量', desc: '本站访问数据', nav: false },
        ],
      },
      {
        title: '支持',
        items: [
          { href: '/donate', label: '请喝咖啡', desc: '支持我继续写', nav: false },
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

/** 主导航只展示精选入口；/map 继续展示完整入口。 */
export function getChannelNavSections(channel) {
  return channel.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.nav !== false),
    }))
    .filter((section) => section.items.length > 0)
}
