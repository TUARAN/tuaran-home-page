// 公开导航。首页三栏用锚点展开；长文仍打开原来的短地址。
export const WORKBENCH_MENU_GROUPS = [
  {
    id: 'observe',
    label: '观察',
    items: [
      { id: 'market', label: '市场流量', href: '/x-workbench#market' },
      { id: 'agents', label: '智能体表现', href: '/x-workbench#agents' },
      { id: 'basis', label: '理论基础', href: '/x-workbench#basis' },
    ],
  },
  {
    id: 'library',
    label: '资料',
    items: [
      { id: 'green', label: '绿皮书', href: '/theory' },
      { id: 'yellowbook', label: '黄皮书', href: '/docs' },
      { id: 'calendar', label: '大互动日历', href: '/calendar' },
      { id: 'roundtable', label: '大互动圆桌', href: '/roundtable' },
    ],
  },
  {
    id: 'distribute',
    label: '分发',
    items: [
      { id: 'distributor', label: 'AI分发大师', href: 'https://syncblog.cn/', external: true, beta: true },
    ],
  },
]

export const WORKBENCH_MENU_ITEMS = WORKBENCH_MENU_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
