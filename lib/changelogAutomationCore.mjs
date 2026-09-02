function escapeJsString(value) {
  return `'${String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n')}'`
}

function findMatchingBrace(source, openIndex) {
  let depth = 0
  let quote = ''
  let escaped = false

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  throw new Error('找不到匹配的对象结束位置')
}

function objectRangeAfter(source, marker, fromIndex = 0) {
  const markerIndex = source.indexOf(marker, fromIndex)
  if (markerIndex < 0) throw new Error(`找不到源码标记：${marker}`)
  const openIndex = source.indexOf('{', markerIndex + marker.length)
  if (openIndex < 0) throw new Error(`标记后没有对象：${marker}`)
  return { start: openIndex, end: findMatchingBrace(source, openIndex) + 1 }
}

export function isoWeek(dateValue) {
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) throw new Error(`无效日期：${dateValue}`)
  const weekday = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function groupCommitsByIsoWeek(commits) {
  const groups = []
  for (const commit of commits || []) {
    const week = isoWeek(commit.date)
    const last = groups.at(-1)
    if (last?.week === week) last.commits.push(commit)
    else groups.push({ week, commits: [commit] })
  }
  return groups
}

export function entryDateRange(entry) {
  return [...String(entry?.range || '').matchAll(/\d{4}-\d{2}-\d{2}/g)].map((match) => match[0])
}

export function periodKeys(dateValue) {
  const date = String(dateValue).slice(0, 10)
  const year = date.slice(0, 4)
  const month = Number.parseInt(date.slice(5, 7), 10)
  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    quarter: `${year}-Q${Math.ceil(month / 3)}`,
    year,
  }
}

function renderList(items, indent = 4) {
  const spaces = ' '.repeat(indent)
  return `[
${items.map((item) => `${spaces}  ${escapeJsString(item)},`).join('\n')}
${spaces}]`
}

export function renderChangelogEntry(entry) {
  return `{
    version: ${escapeJsString(entry.version)},
    week: ${escapeJsString(entry.week)},
    range: ${escapeJsString(entry.range)},
    commits: ${Number(entry.commits) || 0},
    lastCommit: ${escapeJsString(entry.lastCommit)},
    title: ${escapeJsString(entry.title)},
    summary:
      ${escapeJsString(entry.summary)},
    planned: ${renderList(entry.planned)},
    done: ${renderList(entry.done)},
  }`
}

export function renderPeriodSummary(summary) {
  return `{
    title: ${escapeJsString(summary.title)},
    summary: ${escapeJsString(summary.summary)},
    highlights: ${renderList(summary.highlights)},
    signal: ${escapeJsString(summary.signal)},
  }`
}

export function replaceLatestChangelogEntry(source, entry) {
  const range = objectRangeAfter(source, 'export const CHANGELOG = [')
  return `${source.slice(0, range.start)}${renderChangelogEntry(entry)}${source.slice(range.end)}`
}

export function prependChangelogEntry(source, entry) {
  const marker = 'export const CHANGELOG = ['
  const index = source.indexOf(marker)
  if (index < 0) throw new Error('找不到 CHANGELOG 数组')
  const insertAt = index + marker.length
  return `${source.slice(0, insertAt)}\n  ${renderChangelogEntry(entry)},${source.slice(insertAt)}`
}

export function upsertPeriodSummary(source, constantName, key, summary) {
  const marker = `const ${constantName} = {`
  const constantIndex = source.indexOf(marker)
  if (constantIndex < 0) throw new Error(`找不到 ${constantName}`)
  const nextConstant = source.indexOf('\nconst ', constantIndex + marker.length)
  const blockEnd = nextConstant < 0 ? source.length : nextConstant
  const quotedKey = `  '${key}': `
  const numericKey = `  ${key}: `
  let keyIndex = source.indexOf(quotedKey, constantIndex)
  let keyMarker = quotedKey
  if (keyIndex < 0 || keyIndex >= blockEnd) {
    keyIndex = source.indexOf(numericKey, constantIndex)
    keyMarker = numericKey
  }
  const rendered = renderPeriodSummary(summary)
  if (keyIndex >= 0 && keyIndex < blockEnd) {
    const range = objectRangeAfter(source, keyMarker, keyIndex)
    return `${source.slice(0, range.start)}${rendered}${source.slice(range.end)}`
  }
  const insertAt = constantIndex + marker.length
  return `${source.slice(0, insertAt)}\n  '${key}': ${rendered},${source.slice(insertAt)}`
}

function requireText(value, label, min = 4) {
  const text = String(value || '').trim()
  if (text.length < min) throw new Error(`DeepSeek 输出的 ${label} 过短或缺失`)
  return text
}

function requireList(value, label, minimum) {
  if (!Array.isArray(value) || value.length < minimum) {
    throw new Error(`DeepSeek 输出的 ${label} 至少需要 ${minimum} 项`)
  }
  return value.map((item, index) => requireText(item, `${label}[${index}]`, 6))
}

export function validateGeneratedSummary(value) {
  const entry = value?.entry || {}
  const periods = value?.periods || {}
  const normalized = {
    entry: {
      title: requireText(entry.title, 'entry.title', 8),
      summary: requireText(entry.summary, 'entry.summary', 30),
      planned: requireList(entry.planned, 'entry.planned', 2),
      done: requireList(entry.done, 'entry.done', 3),
    },
    periods: {},
  }
  for (const view of ['month', 'quarter', 'year']) {
    const period = periods[view] || {}
    normalized.periods[view] = {
      title: requireText(period.title, `periods.${view}.title`, 8),
      summary: requireText(period.summary, `periods.${view}.summary`, 30),
      highlights: requireList(period.highlights, `periods.${view}.highlights`, 3),
      signal: requireText(period.signal, `periods.${view}.signal`, 20),
    }
  }
  return normalized
}
