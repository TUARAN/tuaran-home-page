/**
 * 茉莉奶爸待办：清单结构（与 D1 校验共用）
 *
 * Item id 一旦写入 D1（dad_todo_completions.item_id）就是历史打卡的真身。
 * 拆分/合并 section 可以随便改，但已经出现过的 item id 必须保持不变，
 * 否则用户之前打的勾会因为 isValidDadTodoItemId 失败而被丢弃。
 */
export const DAD_TODO_SECTIONS = [
  {
    id: 'daily',
    title: '小茉莉日常',
    short: '日常',
    description: '把吃饭和动线一起捋顺，少临时起意，让琐碎生活少点折磨。',
    items: [
      // 原 focus:* —— 吃饭节奏
      { id: 'focus:breakfast', label: '早餐备餐' },
      { id: 'focus:lunch', label: '午餐备餐' },
      { id: 'focus:usual-prep', label: '平常备菜' },
      { id: 'focus:parents-eat', label: '父母跟着宝宝吃' },
      // 原 habit:* —— 习惯动线
      { id: 'habit:shower-clothes', label: '洗完澡，衣服不妨卫生间，内裤顺手洗' },
      { id: 'habit:trash-bag', label: '垃圾袋拿去丢的时候，先套袋，不要专门等时间来套' },
      { id: 'habit:milk-water', label: '冲奶接水，冲完的时候就观察水还多不多' },
      { id: 'habit:rice-pot', label: '盛饭完成就接水泡锅，多的米倒掉，吃完就洗' },
      { id: 'habit:sort-wash', label: '衣服归类放；宝宝衣服每天换完及时洗，当天洗' },
    ],
  },
  {
    id: 'mom-fitness',
    title: '妈妈锻炼',
    short: '妈妈',
    description: '茉莉妈妈的每日锻炼打卡。',
    items: [
      { id: 'mom:exercise', label: '锻炼 ≥ 20 分钟' },
    ],
  },
  {
    id: 'baby-poop',
    title: '茉莉拉屎',
    short: '拉屎',
    description: '按时间段记录今天的次数。',
    items: [
      { id: 'poop:morning', label: '上午' },
      { id: 'poop:afternoon', label: '下午' },
      { id: 'poop:evening', label: '晚上' },
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
