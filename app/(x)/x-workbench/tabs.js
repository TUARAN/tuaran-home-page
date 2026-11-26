// 公开导航：产品入口 + 读本。运营工具在登录后的 /x-workbench/ops。
export const WORKBENCH_MENU_GROUPS = [
  {
    id: 'product',
    label: '产品',
    items: [
      { id: 'agents', label: '大互动智能体', href: '/x-workbench#agents' },
      { id: 'docs', label: '大互动智能体手册', href: '/docs' },
    ],
  },
  {
    id: 'reading',
    label: '读本',
    items: [
      { id: 'theory', label: '大互动理论', href: '/theory' },
      { id: 'calendar', label: '大互动日历', href: '/calendar' },
      { id: 'roundtable', label: '大互动圆桌', href: '/roundtable' },
      { id: 'grokbot', label: 'Grokbot 秘籍', href: '/grokbot' },
    ],
  },
]

export const WORKBENCH_MENU_ITEMS = WORKBENCH_MENU_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
// 当前页在顶栏里的分组，以及按顶栏顺序的上一页 / 下一页。智能体页的 active 是 /x-workbench。
export function xPageNeighbors(active) {
  const key = active === '/x-workbench' ? '/x-workbench#agents' : active
  const index = WORKBENCH_MENU_ITEMS.findIndex((item) => item.href === key)
  if (index < 0) return { group: null, prev: null, next: null }
  const group = WORKBENCH_MENU_GROUPS.find((entry) => entry.items.some((item) => item.href === key)) || null
  return {
    group,
    prev: WORKBENCH_MENU_ITEMS[index - 1] || null,
    next: WORKBENCH_MENU_ITEMS[index + 1] || null,
  }
}
