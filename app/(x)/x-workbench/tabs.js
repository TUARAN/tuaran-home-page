// 公开导航：产品入口 + 读本。运营工具在登录后的 /x-workbench/ops。
export const WORKBENCH_MENU_GROUPS = [
  {
    id: 'product',
    label: '产品',
    items: [
      { id: 'agents', label: '大互动智能体', href: '/x-workbench#agents' },
      { id: 'grokbot', label: 'GrokBot 秘籍', href: '/grokbot' },
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