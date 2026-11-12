export const DIARY_SLUG = 'diary-self-reflection'
export const DIARY_SERIES_TITLE = '浮生日记'
export const DIARY_SERIES_STARTED_ON = '2026-01-05'
export const DIARY_SERIES_COUPLET = '人生碌碌，竞短论长，却不道枯荣有数，得失难量。'
export const DIARY_ORAL_SOURCE_NOTE = '站长口述，Bots 整理'
const RETIRED_SERIES_NOTE = '记录主要是站长口述，由机器人整理后公开。'

const IMAGE_LINE = /^!\[[^\]]*\]\([^)]+\)\s*$/

export function findDiaryArticle(articles) {
  return (articles || []).find((item) => item?.slug === DIARY_SLUG) || null
}

function normalizeDiaryLabel(label) {
  if (typeof label !== 'string') return ''
  const trimmed = label.trim()
  if (!trimmed || /^感悟\s*\d+$/i.test(trimmed)) return ''
  return trimmed
}

function isDateObject(value) {
  return Boolean(value) && typeof value === 'object' && value.date
}

export function buildDiaryEntries(content) {
  const entries = []
  let current = null

  ;(content || []).forEach((paragraph, idx) => {
    const dated = typeof paragraph === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paragraph.trim())
    if (dated || isDateObject(paragraph)) {
      const date = isDateObject(paragraph) ? paragraph.date : paragraph.trim()
      const dateStart = isDateObject(paragraph) && paragraph.dateStart && paragraph.dateStart !== date
        ? paragraph.dateStart
        : ''
      const label = isDateObject(paragraph) ? normalizeDiaryLabel(paragraph.label) : ''
      current = {
        id: `diary-${date}-${idx}`,
        kind: 'diary',
        date,
        ...(dateStart ? { dateStart } : {}),
        label: label || date,
        category: isDateObject(paragraph) ? paragraph.category || '日记' : '日记',
        ...(isDateObject(paragraph) && paragraph.sourceNote ? { sourceNote: paragraph.sourceNote } : {}),
        blocks: [],
        index: idx,
      }
      entries.push(current)
      return
    }

    if (!current) {
      current = {
        id: `diary-untitled-${idx}`,
        kind: 'diary',
        date: '',
        label: DIARY_SERIES_TITLE,
        category: '日记',
        blocks: [],
        index: idx,
      }
      entries.push(current)
    }

    current.blocks.push(paragraph)
  })

  return entries
}

export function buildDiaryTimelineEntries(diary) {
  return buildDiaryEntries(diary?.content).sort((a, b) => {
    const byDate = (b.date || '').localeCompare(a.date || '')
    if (byDate !== 0) return byDate
    return a.index - b.index
  })
}

export function latestDiaryDate(diary) {
  return buildDiaryEntries(diary?.content).reduce((latest, entry) => (
    entry.date && entry.date > latest ? entry.date : latest
  ), '')
}

export function earliestDiaryDate(diary) {
  return buildDiaryEntries(diary?.content).reduce((earliest, entry) => {
    const date = entry.dateStart || entry.date
    if (!date) return earliest
    return !earliest || date < earliest ? date : earliest
  }, '')
}

// The repository series is the public diary. A published snapshot wins only when
// it already contains a later record, so an older seeded copy cannot hide a newer entry.
export function selectDiarySeries(archived, published) {
  if (!archived) return published || null
  if (!published) return archived
  if (latestDiaryDate(archived) > latestDiaryDate(published)) return archived
  return published
}

export function formatDiarySpan(entry) {
  if (entry?.dateStart && entry.dateStart !== entry.date) return `${entry.dateStart}～${entry.date}`
  return entry?.date || ''
}

export function formatDiaryTocDate(entry) {
  if (!entry?.date) return ''
  if (entry.dateStart && entry.dateStart !== entry.date) {
    const [, startMonth, startDay] = entry.dateStart.split('-')
    const [, endMonth, endDay] = entry.date.split('-')
    if (startMonth === endMonth) return `${startMonth}/${startDay}–${endDay}`
    return `${startMonth}/${startDay}–${endMonth}/${endDay}`
  }
  const [, month, day] = entry.date.split('-')
  return `${month}/${day}`
}

function textBlocks(blocks) {
  return (blocks || []).filter((block) => typeof block === 'string' && !IMAGE_LINE.test(block.trim()))
}

function clip(text, limit) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim()
  if (compact.length <= limit) return compact
  return `${compact.slice(0, limit)}…`
}

export function diaryDescription(summary) {
  return String(summary || '').replace(RETIRED_SERIES_NOTE, '').replace(/\s{2,}/g, ' ').trim()
}

function entryNoteKey(entry) {
  return [entry?.dateStart || '', entry?.date || '', entry?.label || ''].join('|')
}

export function withArchivedSourceNotes(entries, archived) {
  const notes = new Map()
  for (const entry of buildDiaryEntries(archived?.content)) {
    if (entry.sourceNote) notes.set(entryNoteKey(entry), entry.sourceNote)
  }
  if (!notes.size) return entries
  return entries.map((entry) => {
    if (entry.sourceNote) return entry
    const sourceNote = notes.get(entryNoteKey(entry))
    return sourceNote ? { ...entry, sourceNote } : entry
  })
}

export function previewFromDiary(diary, limit = 4) {
  const entries = buildDiaryTimelineEntries(diary).slice(0, limit).map((entry, index) => {
    const texts = textBlocks(entry.blocks)
    const lead = clip(texts[0] || '', index === 0 ? 96 : 46)
    const closingSource = index === 0 && texts.length > 1 ? texts[texts.length - 1] : ''
    const closing = clip(closingSource, 80)
    return {
      id: entry.id,
      date: entry.date,
      dateStart: entry.dateStart || '',
      label: entry.label,
      category: entry.category,
      span: formatDiarySpan(entry),
      lead,
      closing: closing && closing !== lead ? closing : '',
      sourceNote: entry.sourceNote || '',
      href: `/diary#${entry.id}`,
    }
  })

  return {
    title: DIARY_SERIES_TITLE,
    startedOn: DIARY_SERIES_STARTED_ON,
    couplet: DIARY_SERIES_COUPLET,
    entries,
  }
}
