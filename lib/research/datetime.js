/** 解析 frontmatter 中的 time（HH:MM 或 HH:MM:SS，北京时间）。无效则返回空字符串。 */
export function normalizeResearchTime(value) {
  if (!value || typeof value !== 'string') return ''
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim())
  if (!match) return ''
  const hour = Number(match[1])
  const minute = Number(match[2])
  const second = match[3] != null ? Number(match[3]) : 0
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return ''
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

/** 列表 / 详情展示：有 time 则 `YYYY-MM-DD HH:MM`，否则仅日期。 */
export function formatResearchDateLabel(date, time) {
  if (!date) return ''
  const normalized = normalizeResearchTime(time)
  if (!normalized) return date
  const [hour, minute, second] = normalized.split(':')
  const displayTime = second === '00' ? `${hour}:${minute}` : `${hour}:${minute}:${second}`
  return `${date} ${displayTime}`
}

/** 排序键：无 time 的旧条目按当日 00:00:00 处理。 */
export function researchSortKey(date, time) {
  if (!date) return ''
  return `${date}T${normalizeResearchTime(time) || '00:00:00'}`
}

/** 结构化数据 / RSS：有 time 时带 +08:00，无 time 时仅日期。 */
export function researchDateTimeIso(date, time) {
  if (!date) return undefined
  const normalized = normalizeResearchTime(time)
  if (!normalized) return date
  return `${date}T${normalized}+08:00`
}

export function compareSortKeyDesc(aKey, bKey, aTie = '', bTie = '') {
  if (!aKey) return 1
  if (!bKey) return -1
  if (aKey < bKey) return 1
  if (aKey > bKey) return -1
  return String(aTie).localeCompare(String(bTie))
}
