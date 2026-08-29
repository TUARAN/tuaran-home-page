import { parseMarkdownTables } from './finance.js'

// Deliberately separate from the historical whole-yuan parser. Loan balances
// retain cents and require the explicit table contract documented in README.
export function parseLoanNumber(raw, percent = false) {
  const value = String(raw ?? '').trim().replace(/[，,]/g, '')
  const match = (percent ? /^(?:≈|约)?(\d+(?:\.\d+)?)%$/ : /^(?:¥|￥)?(\d+(?:\.\d{1,2})?)(?:元)?$/).exec(value)
  if (!match) return null
  const number = Number(match[1])
  if (!Number.isFinite(number)) return null
  if (percent) return number
  const cents = Math.round(number * 100)
  return Number.isSafeInteger(cents) ? cents : null
}

function isoDate(raw) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw || '')) return null
  const at = Date.parse(`${raw}T00:00:00Z`)
  return Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === raw ? raw : null
}

function objects(table) {
  return table.rows.map((row) => Object.fromEntries(table.header.map((key, i) => [key, row[i]])))
}

export function extractLoanSnapshots(records) {
  const snapshots = []
  for (const record of Array.isArray(records) ? records : []) {
    if (record.kind !== 'snapshot') continue
    const tables = parseMarkdownTables(record.plain?.content)
    const meta = tables.find((table) => table.header.includes('快照日期'))
    const details = tables.filter((table) => ['机构/产品', '原始本金(元)', '待还本金(元)', '年化估算', '状态'].every((key) => table.header.includes(key)))
    if (!meta || meta.rows.length !== 1 || details.length !== 1) continue
    const info = objects(meta)[0]
    const date = isoDate(info['快照日期'])
    if (!date) continue
    const warnings = []
    const loans = objects(details[0]).filter((row) => !/^(合计|总计|小计)$/.test(row['机构/产品'])).map((row, index) => {
      const originalCents = parseLoanNumber(row['原始本金(元)'])
      const remainingCents = parseLoanNumber(row['待还本金(元)'])
      const rate = parseLoanNumber(row['年化估算'], true)
      const label = row['机构/产品']
      if (!label || originalCents === null || remainingCents === null || remainingCents > originalCents) {
        warnings.push(`第 ${index + 1} 笔本金格式或金额关系异常，汇总暂停。`)
      }
      if (rate === null) warnings.push(`第 ${index + 1} 笔年化估算缺失，无法完整比较利率。`)
      if ((row['状态'] === '已结清' && remainingCents !== 0) || (row['状态'] === '在还' && remainingCents === 0) || !['在还', '已结清'].includes(row['状态'])) {
        warnings.push(`第 ${index + 1} 笔状态与本金需核对。`)
      }
      return { id: index, label, originalCents, remainingCents, rate, rateLabel: row['年化估算'], status: row['状态'], borrowedAt: row['借款日期'] || '未提供', method: row['还款方式'] || '未提供', remainingPeriods: row['剩余期数'] || '未提供', note: row['备注'] || '' }
    })
    if (!loans.length) continue
    const validBalances = loans.every((loan) => loan.label && loan.originalCents !== null && loan.remainingCents !== null && loan.remainingCents <= loan.originalCents)
    const originalCents = validBalances ? loans.reduce((sum, loan) => sum + loan.originalCents, 0) : null
    const remainingCents = validBalances ? loans.reduce((sum, loan) => sum + loan.remainingCents, 0) : null
    const active = loans.filter((loan) => loan.remainingCents > 0)
    const weightedRate = validBalances && remainingCents > 0 && active.every((loan) => loan.rate !== null)
      ? active.reduce((sum, loan) => sum + loan.remainingCents * loan.rate, 0) / remainingCents : null
    const reportedRate = parseLoanNumber(info['原图加权年化'], true)
    if (reportedRate !== null && weightedRate !== null && Math.abs(reportedRate - weightedRate) > 0.01) warnings.push('原图加权年化与明细复算不一致，请核对统计口径。')
    const schedules = tables.filter((table) => ['计划月份', '原图计划金额(元)', '原图项目'].every((key) => table.header.includes(key)))
      .flatMap(objects).map((row) => ({ month: row['计划月份'], amountCents: parseLoanNumber(row['原图计划金额(元)']), label: row['原图项目'] }))
    snapshots.push({
      id: String(record.id ?? `${date}-${snapshots.length}`), date, title: record.plain?.title || '贷款快照',
      content: record.plain?.content || '', loans, warnings, schedules,
      originalCents, remainingCents, repaidCents: validBalances ? originalCents - remainingCents : null,
      weightedRate, reportedRate, monthlyCents: parseLoanNumber(info['原图预计月供(元)']),
      activeCount: active.length, settledCount: loans.filter((loan) => loan.remainingCents === 0 && loan.status === '已结清').length,
    })
  }
  return snapshots.sort((a, b) => b.date.localeCompare(a.date))
}

export function formatLoanMoney(cents) {
  return cents === null || cents === undefined ? '未提供' : `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function buildLoanAnalysisBrief(snapshot, { anonymize = true } = {}) {
  if (!snapshot) return ''
  const money = formatLoanMoney
  return [
    '# 负债管理 · 待分析材料',
    `历史快照日期：${snapshot.date}。这不是实时余额，也不是完整资产负债表。`,
    '请只根据这些资料核对数据、列出缺失信息与有条件的方案；不要编造现金流、合同条款、到期日、节息金额或净资产。不要把估算年化当作已验证的综合资金成本。',
    '先区分事实、计算、假设和待确认项。信息不足时先问问题；最终还款决定由本人结合实际账单确认。',
    '',
    `历史本金：${money(snapshot.originalCents)}；剩余本金：${money(snapshot.remainingCents)}；已还本金：${money(snapshot.repaidCents)}。`,
    `按余额加权的年化估算：${snapshot.weightedRate === null ? '无法计算' : `${snapshot.weightedRate.toFixed(2)}%`}；原图标注：${snapshot.reportedRate === null ? '未提供' : `${snapshot.reportedRate}%`}。`,
    `原图预计月供（未核实）：${money(snapshot.monthlyCents)}。不能据此认定月度现金流。`,
    ...snapshot.warnings.map((warning) => `待核对：${warning}`),
    '',
    '| 借款 | 原始本金 | 待还本金 | 年化估算 | 状态 | 还款方式 | 剩余期数 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...snapshot.loans.map((loan, i) => `| ${anonymize ? `借款 ${i + 1}` : loan.label} | ${money(loan.originalCents)} | ${money(loan.remainingCents)} | ${loan.rateLabel} | ${loan.status} | ${loan.method} | ${loan.remainingPeriods} |`),
    '',
    '需要补齐：可用现金、应急储备底线、月度稳定收入、必要支出、逐笔账单与应还日、提前还款手续费和规则。',
    '请输出：1. 数据核对；2. 必须补充的问题；3. 不同现金条件下的比较框架；4. 下次复盘清单。',
    '不要调用交易、借款、还款工具，不要申请新增借款。原图月份计划未经核实，未作为可靠还款日历提供。',
  ].join('\n')
}
