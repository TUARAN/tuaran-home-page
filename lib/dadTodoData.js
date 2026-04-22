/**
 * 茉莉奶爸待办：清单结构（与 D1 校验共用）
 */
export const DAD_TODO_STORAGE_KEY = 'xiaomoli-dad-todo-v1'

export const DAD_TODO_SECTIONS = [
  {
    id: 'focus',
    title: '当前重点',
    dateNote: '2026-04-20',
    description: '用日常节奏把吃饭这件事前置，少临时起意。',
    items: [
      { id: 'focus:breakfast', label: '早餐备餐' },
      { id: 'focus:lunch', label: '午餐备餐' },
      { id: 'focus:usual-prep', label: '平常备菜' },
      { id: 'focus:parents-eat', label: '父母跟着宝宝吃' },
    ],
  },
  {
    id: 'habits',
    title: '习惯动线',
    dateNote: '自 2026-03-03 起，至少验证 1 个月',
    description: '增强动线，让琐碎生活少点折磨。',
    items: [
      { id: 'habit:shower-clothes', label: '洗完澡，衣服不妨卫生间，内裤顺手洗' },
      { id: 'habit:trash-bag', label: '垃圾袋拿去丢的时候，先套袋，不要专门等时间来套' },
      { id: 'habit:milk-water', label: '冲奶接水，冲完的时候就观察水还多不多' },
      { id: 'habit:rice-pot', label: '盛饭完成就接水泡锅，多的米倒掉，吃完就洗' },
      { id: 'habit:sort-wash', label: '衣服归类放；宝宝衣服每天换完及时洗，当天洗' },
    ],
  },
]

export const DAD_TODO_TOTAL = DAD_TODO_SECTIONS.reduce((n, s) => n + s.items.length, 0)

const _valid = new Set(DAD_TODO_SECTIONS.flatMap((s) => s.items.map((i) => i.id)))

export function isValidDadTodoItemId(id) {
  return typeof id === 'string' && _valid.has(id)
}

export function getValidDadTodoItemIds() {
  return [..._valid]
}
