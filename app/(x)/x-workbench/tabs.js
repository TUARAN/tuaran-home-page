// 公开导航。今日看板两栏在首页展开；读本打开短地址。智能体手册在登录后的智能体后台。
export const WORKBENCH_MENU_GROUPS = [
  {
    id: 'today',
    label: '今日看板',
    items: [
      { id: 'hot', label: '热榜', href: '/x-workbench#hot' },
      { id: 'agents', label: '大互动智能体', href: '/x-workbench#agents' },
    ],
  },
  {
    id: 'reading',
    label: '读本',
    items: [
      { id: 'theory', label: '大互动理论', href: '/theory' },
      { id: 'calendar', label: '大互动日历', href: '/calendar' },
      { id: 'roundtable', label: '大互动圆桌', href: '/roundtable' },
    ],
  },
]

export const WORKBENCH_MENU_ITEMS = WORKBENCH_MENU_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))