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
  const normalizedDate = normalizeResearchDate(date)
  if (!normalizedDate) return undefined
  const normalized = normalizeResearchTime(time)
  if (!normalized) return normalizedDate
  return `${normalizedDate}T${normalized}+08:00`
}

export function compareSortKeyDesc(aKey, bKey, aTie = '', bTie = '') {
  if (!aKey) return 1
  if (!bKey) return -1
  if (aKey < bKey) return 1
  if (aKey > bKey) return -1
  return String(aTie).localeCompare(String(bTie))
}
/** 严格校验日历日期，拒绝 Date.parse 会自动进位的 2 月 30 日等值。 */
export function normalizeResearchDate(value) {
  if (typeof value !== 'string') return ''
  const date = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return ''
  const parsed = Date.parse(`${date}T00:00:00Z`)
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === date ? date : ''
}

/** updated 接受日期或带显式时区的 ISO 时间；不接受依赖构建机器时区的值。 */
export function normalizeResearchUpdated(value) {
  if (typeof value !== 'string') return ''
  const updated = value.trim()
  if (normalizeResearchDate(updated)) return updated
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(updated)
  if (!match || !normalizeResearchDate(match[1]) || !normalizeResearchTime(match[2])) return ''
  if (match[3] !== 'Z') {
    const [hour, minute] = match[3].slice(1).split(':').map(Number)
    if (hour > 14 || minute > 59 || (hour === 14 && minute !== 0)) return ''
  }
  return Number.isFinite(Date.parse(updated)) ? updated : ''
}

/** 所有调研消费端共用的时间字段；结果仅由内容决定，不读取时钟或文件 mtime。 */
export function resolveResearchDates(data = {}, filenameDate = '') {
  const date = normalizeResearchDate(data.date) || normalizeResearchDate(filenameDate)
  const time = normalizeResearchTime(data.time)
  const dateTimeIso = researchDateTimeIso(date, time)
  const publishedTime = dateTimeIso ? new Date(dateTimeIso).toISOString() : undefined
  const candidate = normalizeResearchUpdated(data.updated)
  const candidateTime = candidate ? new Date(candidate).toISOString() : undefined
  // 修改时间不能早于发布。同日只有日期时，回退到已知的发布时间。
  const updated = candidateTime && (!publishedTime || Date.parse(candidateTime) >= Date.parse(publishedTime)) ? candidate : ''
  const modifiedTime = updated ? candidateTime : publishedTime
  return { date, time, dateTimeIso, publishedTime, updated, modifiedTime }
}
