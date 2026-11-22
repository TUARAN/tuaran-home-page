// X大互动顶部菜单。工具在本页切换；内容标签打开现有页面，不复制正文。
export const WORKBENCH_MENU_GROUPS = [
  {
    id: 'work',
    label: '工作',
    items: [
      { id: 'radar', label: '推文榜' },
      { id: 'board', label: '账号榜' },
      { id: 'agent', label: '智能体' },
    ],
  },
  {
    id: 'theory',
    label: '理论',
    items: [
      { id: 'theory', label: '大互动理论', href: '/theory' },
      { id: 'yellowbook', label: '黄皮书', href: '/docs' },
      { id: 'calendar', label: '大互动日历', href: '/calendar' },
      { id: 'roundtable', label: '圆桌大会', href: '/roundtable' },
    ],
  },
  {
    id: 'distribute',
    label: '分发',
    items: [
      { id: 'distributor', label: 'AI分发大师', href: 'https://syncblog.cn/', external: true },
    ],
  },
]

export const WORKBENCH_MENU_ITEMS = WORKBENCH_MENU_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
