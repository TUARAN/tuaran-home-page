// 公开导航。今天的两栏在首页展开；两本读本打开原来的短地址。
export const WORKBENCH_MENU_GROUPS = [
  {
    id: 'today',
    label: '今天',
    items: [
      { id: 'market', label: '流量', href: '/x-workbench#market' },
      { id: 'agents', label: '智能体', href: '/x-workbench#agents' },
    ],
  },
  {
    id: 'reading',
    label: '读本',
    items: [
      { id: 'theory', label: '互动理论', href: '/theory' },
      { id: 'manual', label: '智能体手册', href: '/docs' },
    ],
  },
]

export const WORKBENCH_MENU_ITEMS = WORKBENCH_MENU_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
