import {
  GROKBOT_PLAYBOOK_VERSION,
  grokbotGrayRules,
  grokbotQualityChecks,
  grokbotRetainRules,
  grokbotUnfollowRules,
} from './grokbotPlaybook.js'

/** @typedef {{ uf: string[], rt: string[], gz: string[], qc: string[] }} GrokbotRuleSelection */

/** @type {GrokbotRuleSelection} */
export const GROKBOT_DEFAULT_SELECTION = {
  uf: ['UF-01', 'UF-02', 'UF-03', 'UF-04'],
  rt: ['RT-01', 'RT-02', 'RT-03', 'RT-05'],
  gz: ['GZ-03', 'GZ-04'],
  qc: ['QC-01', 'QC-02', 'QC-03'],
}

export function grokbotSelectionKey(group, id) {
  return `${group}:${id}`
}

export function selectionSetFromGroups(selection) {
  const set = new Set()
  for (const id of selection.uf || []) set.add(grokbotSelectionKey('uf', id))
  for (const id of selection.rt || []) set.add(grokbotSelectionKey('rt', id))
  for (const id of selection.gz || []) set.add(grokbotSelectionKey('gz', id))
  for (const id of selection.qc || []) set.add(grokbotSelectionKey('qc', id))
  return set
}

export function selectionFromSet(set) {
  /** @type {GrokbotRuleSelection} */
  const next = { uf: [], rt: [], gz: [], qc: [] }
  for (const key of set) {
    const [group, id] = key.split(':')
    if (group && id && Object.prototype.hasOwnProperty.call(next, group)) next[group].push(id)
  }
  for (const group of Object.keys(next)) next[group].sort()
  return next
}

function linesForRules(rows, selectedIds, formatter) {
  const wanted = new Set(selectedIds)
  return rows.filter((row) => wanted.has(row.id)).map(formatter)
}

/**
 * @param {{
 *   selection?: GrokbotRuleSelection,
 *   batchLimit?: number,
 *   whitelist?: string,
 *   listOnly?: boolean,
 * }} options
 */
export function buildGrokbotFollowingPrompt(options = {}) {
  const selection = options.selection || GROKBOT_DEFAULT_SELECTION
  const batchLimit = Number.isFinite(options.batchLimit) ? options.batchLimit : 50
  const whitelist = String(options.whitelist || '').trim()
  const listOnly = options.listOnly !== false

  const retain = linesForRules(
    grokbotRetainRules,
    selection.rt,
    (r) => `- ${r.id} ${r.signal}：${r.threshold}。${r.action}`,
  )
  const unfollow = linesForRules(
    grokbotUnfollowRules,
    selection.uf,
    (r) => `- ${r.id} ${r.signal}：${r.threshold}。${r.action}`,
  )
  const gray = linesForRules(
    grokbotGrayRules,
    selection.gz,
    (r) => `- ${r.id} ${r.cue}：${r.condition} → ${r.resolution}`,
  )
  const qc = linesForRules(
    grokbotQualityChecks,
    selection.qc,
    (r) => `- ${r.id} ${r.item}：${r.pass}`,
  )

  const parts = [
    '@grokbot 请治理我的 X following 列表。',
    '',
    '【红线】',
    '- 仅处理 following，不动 followers。',
    listOnly ? '- 本轮只出候选名单与表格，我确认前不要执行取关，不要代发帖。' : `- 仅对我已确认的 handle 执行取关，单批上限 ${batchLimit}。`,
    '',
    '【保留规则 · 优先于取关】',
    retain.length ? retain.join('\n') : '-（未勾选保留规则，请先在页上勾选 RT）',
    '',
    '【取关规则】',
    unfollow.length ? unfollow.join('\n') : '-（未勾选取关规则）',
  ]

  if (gray.length) {
    parts.push('', '【灰区】', ...gray)
  }

  if (whitelist) {
    parts.push('', '【白名单 · 永不取关】', whitelist.split(/[\s,，、]+/).filter(Boolean).map((h) => `- @${h.replace(/^@+/, '')}`).join('\n'))
  }

  parts.push(
    '',
    '【输出格式】',
    '- 表格列：handle | 规则编号 | 理由 | 证据（链接或日期）',
    '- 保留规则命中的账号不要进候选；证据不足的标灰区不出候选。',
    `- 本批扫描节奏：首场景候选不超过 ${batchLimit} 个。`,
  )

  if (qc.length) {
    parts.push('', '【质检要求】', ...qc)
  }

  parts.push('', `（规则包版本 ${GROKBOT_PLAYBOOK_VERSION}，来源 x.2aran.com/grokbot）`)

  return parts.join('\n')
}