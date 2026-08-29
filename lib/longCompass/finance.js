// 从长期罗盘已解锁的 Markdown 中提取「财务总览」需要的结构化数据。
//
// 它只识别有明确表头的表格，不从叙述段落猜金额；无法识别的数字仍保留在原始记录里，
// 因此财务总览是辅助阅读层，而不是会计账本或自动记账。

function cleanCell(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim()
}

function parseTableRow(line) {
  const value = String(line || '').trim()
  if (!value.startsWith('|') || !value.endsWith('|')) return null
  const cells = value
    .slice(1, -1)
    .split('|')
    .map(cleanCell)
  return cells.length ? cells : null
}

function isDividerRow(cells) {
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')))
}

export function parseMarkdownTables(markdown) {
  const lines = String(markdown || '').split(/\r?\n/)
  const tables = []

  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = parseTableRow(lines[index])
    const divider = parseTableRow(lines[index + 1])
    if (!header || !divider || header.length !== divider.length || !isDividerRow(divider)) continue

    const rows = []
    let cursor = index + 2
    while (cursor < lines.length) {
      const row = parseTableRow(lines[cursor])
      if (!row || row.length !== header.length) break
      rows.push(row)
      cursor += 1
    }
    if (rows.length) tables.push({ header, rows })
    index = cursor - 1
  }

  return tables
}

function headerIndex(header, matcher) {
  return header.findIndex((cell) => matcher.test(cleanCell(cell)))
}

function isAggregateLabel(value) {
  return /^(?:合计|小计|总计|沉淀)$/u.test(cleanCell(value))
}

export function parseFinancialAmount(raw, { defaultUnit = '' } = {}) {
  const value = cleanCell(raw).replace(/[，,\s]/g, '')
  const match = /([+-]?\d+(?:\.\d+)?)\s*(万元|万|w|千|k|元)?/iu.exec(value)
  if (!match) return null

  const number = Number(match[1])
  if (!Number.isFinite(number)) return null
  const unit = (match[2] || defaultUnit).toLowerCase()
  if (unit === '万元' || unit === '万' || unit === 'w') return Math.round(number * 10000)
  if (unit === '千' || unit === 'k') return Math.round(number * 1000)
  return Math.round(number)
}

export function parseFinancialDate(raw) {
  const value = cleanCell(raw)
  const match = /(20\d{2})(?:[.\-/年](\d{1,2}))?/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Math.min(12, Math.max(1, Number(match[2] || 1)))
  return {
    at: Date.UTC(year, month - 1, 1),
    label: value,
  }
}

function toSeriesPoint({ row, dateIndex, amountIndex, amountUnit, record, series }) {
  const date = parseFinancialDate(row[dateIndex])
  const amount = parseFinancialAmount(row[amountIndex], { defaultUnit: amountUnit })
  if (!date || amount === null) return null
  return {
    ...date,
    value: amount,
    series,
    sourceTitle: record.plain?.title || '未命名记录',
    note: row.filter((_, index) => index !== dateIndex && index !== amountIndex).join(' · '),
  }
}

function recordTables(record) {
  return parseMarkdownTables(record.plain?.content).map((table) => ({ ...table, record }))
}

function extractTimeline(records, { series, dateHeader, amountHeader, recordPattern = /.*/ }) {
  const points = []
  for (const record of records) {
    if (!recordPattern.test(record.plain?.title || '')) continue
    for (const table of recordTables(record)) {
      const dateIndex = headerIndex(table.header, dateHeader)
      const amountIndex = headerIndex(table.header, amountHeader)
      if (dateIndex < 0 || amountIndex < 0) continue
      const amountUnit = /万/.test(table.header[amountIndex]) ? '万' : ''
      for (const row of table.rows) {
        if (isAggregateLabel(row[dateIndex])) continue
        const point = toSeriesPoint({ row, dateIndex, amountIndex, amountUnit, record, series })
        if (point) points.push(point)
      }
    }
  }
  return points.sort((a, b) => a.at - b.at)
}

function extractAmountTable(records, { titlePattern, valueHeader, itemHeader, includeTotals = false }) {
  const items = []
  for (const record of records) {
    for (const table of recordTables(record)) {
      if (titlePattern && !titlePattern.test(record.plain?.content || '')) continue
      const itemIndex = headerIndex(table.header, itemHeader)
      const valueIndex = headerIndex(table.header, valueHeader)
      if (itemIndex < 0 || valueIndex < 0) continue
      const defaultUnit = /万/.test(table.header[valueIndex]) ? '万' : ''
      for (const row of table.rows) {
        const label = cleanCell(row[itemIndex])
        if (!includeTotals && isAggregateLabel(label)) continue
        const value = parseFinancialAmount(row[valueIndex], { defaultUnit })
        if (value === null) continue
        items.push({
          label,
          value,
          detail: row.filter((_, index) => index !== itemIndex && index !== valueIndex).join(' · '),
          sourceTitle: record.plain?.title || '未命名记录',
        })
      }
    }
  }
  return items
}

export function extractFinancialView(records) {
  const safeRecords = Array.isArray(records) ? records : []
  const householdAssets = extractTimeline(safeRecords, {
    series: '家庭账户资产',
    dateHeader: /时点|时间|日期/,
    amountHeader: /估算资产/,
    recordPattern: /家庭账户|资产规模/,
  })
  const debt = extractTimeline(safeRecords, {
    series: '债务总额',
    dateHeader: /时点|时间|日期/,
    amountHeader: /总额|负债/,
    recordPattern: /债务/,
  })
  const bonus = extractTimeline(safeRecords, {
    series: '年终奖',
    dateHeader: /年份|年度/,
    amountHeader: /年终金额|年终奖/,
    recordPattern: /收入|年终奖/,
  })

  const liquidity = extractAmountTable(safeRecords, {
    titlePattern: /流动性梯队/,
    itemHeader: /资产/,
    valueHeader: /金额/,
  })
  const householdFlows = extractAmountTable(safeRecords, {
    titlePattern: /资金来源四象限/,
    itemHeader: /类型/,
    valueHeader: /估算/,
  })

  return {
    series: [
      { id: 'householdAssets', label: '家庭账户资产', points: householdAssets },
      { id: 'debt', label: '债务总额', points: debt },
      { id: 'bonus', label: '年终奖', points: bonus },
    ].filter((series) => series.points.length > 0),
    householdAssets,
    debt,
    bonus,
    liquidity,
    householdFlows,
  }
}
