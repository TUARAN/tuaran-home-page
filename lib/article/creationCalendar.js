export const CREATION_CALENDAR_PAGE_SIZE = 24

export const CREATION_START = {
  date: '2019-03-11',
  kind: 'juejin',
  title: '创作起点 · NVIDIA GPU 矩阵运算',
  summary: '掘金快照记录当日发布 1 篇文章。原文链接留在这里，作为 30 年内容创作计划的起点。',
  href: 'https://juejin.cn/post/6844903794283642887',
}

export function isCalendarDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function selectCreationCalendarItems(items, { year, month = 'all', date = '' } = {}) {
  const datedItems = [...items.filter((item) => isCalendarDate(item.date)), CREATION_START]
  return datedItems
    .filter((item) => !year || item.date.startsWith(year))
    .filter((item) => month === 'all' || item.date.slice(5, 7) === month)
    .filter((item) => !date || item.date === date)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function calendarPage(items, page) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1
  const start = (currentPage - 1) * CREATION_CALENDAR_PAGE_SIZE
  return items.slice(start, start + CREATION_CALENDAR_PAGE_SIZE)
}

export function calendarRecord({ date, kind, title, summary, href, tagLabel }) {
  return { date, kind, title, summary, href, tagLabel }
}
