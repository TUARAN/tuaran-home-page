/**
 * 茉莉奶爸待办：清单结构（与 D1 校验共用）
 *
 * Item id 一旦写入 D1（dad_todo_completions.item_id）就是历史打卡的真身。
 * 拆分/合并 section、调整顺序、改标题都可以；但已经出现过的 item id
 * 必须保持不变，否则用户之前打的勾会因为 isValidDadTodoItemId 失败而被丢弃。
 *
 * 三个 section 的主体不同：爸爸 / 妈妈 / 宝宝。前端按 tab 分开展示，
 * 各自维护自己的 X/N。`groups` 字段（如果存在）让一个 section 内部
 * 进一步分组渲染，但完成度仍按 section 维度算。
 */
export const DAD_TODO_SECTIONS = [
  {
    id: 'daily',
    title: '爸爸 · 日常',
    short: '爸爸',
    audience: 'dad',
    description: '吃饭节奏 + 家务动线，少临时起意，让琐碎生活少点折磨。',
    groups: [
      {
        id: 'eating',
        title: '吃饭节奏',
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
        items: [
          { id: 'habit:shower-clothes', label: '洗完澡，衣服不放卫生间，内裤顺手洗' },
          { id: 'habit:trash-bag', label: '垃圾袋拿去丢的时候，先套袋，不要专门等时间来套' },
          { id: 'habit:milk-water', label: '冲奶接水，冲完的时候就观察水还多不多' },
          { id: 'habit:rice-pot', label: '盛饭完成就接水泡锅，多的米倒掉，吃完就洗' },
          { id: 'habit:sort-wash', label: '衣服归类放；宝宝衣服每天换完及时洗，当天洗' },
        ],
      },
    ],
    // items 是 groups 的扁平镜像；保留供向后兼容（DAD_TODO_TOTAL / API 路由仍按它算）
    get items() {
      return this.groups.flatMap((g) => g.items)
    },
  },
  {
    id: 'mom-fitness',
    title: '妈妈 · 锻炼',
    short: '妈妈',
    audience: 'mom',
    description: '茉莉妈妈的每日锻炼打卡。',
    items: [
      { id: 'mom:exercise', label: '锻炼 ≥ 20 分钟' },
    ],
  },
  {
    id: 'baby-poop',
    title: '宝宝 · 便便',
    short: '宝宝',
    audience: 'baby',
    description: '按时间段记录今天的次数。',
    items: [
      { id: 'poop:morning', label: '上午' },
      { id: 'poop:afternoon', label: '下午' },
      { id: 'poop:evening', label: '晚上' },
    ],
  },
]

/** 一个 section 内的全部 item（无论是否有 groups）。 */
export function getSectionItems(section) {
  return section?.items || []
}

export const DAD_TODO_TOTAL = DAD_TODO_SECTIONS.reduce((n, s) => n + getSectionItems(s).length, 0)

const _valid = new Set(DAD_TODO_SECTIONS.flatMap((s) => getSectionItems(s).map((i) => i.id)))

export function isValidDadTodoItemId(id) {
  return typeof id === 'string' && _valid.has(id)
}

export function getValidDadTodoItemIds() {
  return [..._valid]
}
