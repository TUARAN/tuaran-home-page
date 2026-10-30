export const PROMPT_FEEDBACK_TYPES = Object.freeze({
  replyTimelinePrompt: '评论首页',
  replyCommentPrompt: '评论回复',
  postNormalPrompt: '普通发帖',
  postPremiumPrompt: '精品发帖',
})

export function normalizePromptFeedback(input) {
  const kind = input?.kind === 'good' || input?.kind === 'bad' ? input.kind : ''
  const promptKey = Object.hasOwn(PROMPT_FEEDBACK_TYPES, input?.promptKey) ? input.promptKey : ''
  const content = String(input?.content || '').trim()
  const assessment = String(input?.assessment || '').trim()
  const expected = String(input?.expected || '').trim()
  const context = String(input?.context || '').trim()
  const sourceUrl = String(input?.sourceUrl || '').trim()
  if (!kind || !promptKey || !content || !assessment) {
    return { ok: false, error: '请选择正反例和任务类型，并填写原文与具体评价。' }
  }
  if (content.length > 5000 || assessment.length > 2000 || expected.length > 2000 || context.length > 3000 || sourceUrl.length > 500) {
    return { ok: false, error: '内容太长，请缩短后再保存。' }
  }
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
    return { ok: false, error: '来源链接须以 http:// 或 https:// 开头。' }
  }
  return { ok: true, value: { kind, promptKey, content, assessment, expected, context, sourceUrl } }
}

function quote(text) {
  return String(text || '').split(/\r?\n/).map((line) => `> ${line}`).join('\n')
}

export function promptFeedbackMarkdown(rows) {
  const sections = [
    '# X 扩展提示词反馈待汇总条目',
    '',
    '这些条目用于人工综合分析；单条反馈不触发默认提示词更新。',
  ]
  for (const row of rows) {
    sections.push('', `## ${row.kind === 'good' ? '正例' : '反例'} · ${PROMPT_FEEDBACK_TYPES[row.promptKey] || row.promptKey} · ${row.id}`, '')
    sections.push(`- 记录时间：${new Date(row.createdAt).toISOString()}`)
    if (row.sourceUrl) sections.push(`- 来源：${row.sourceUrl}`)
    if (row.context) sections.push('- 原帖语境：', quote(row.context))
    sections.push('- 原文：', quote(row.content))
    sections.push(`- ${row.kind === 'good' ? '好在哪' : '问题'}：`, quote(row.assessment))
    if (row.expected) sections.push('- 期望：', quote(row.expected))
  }
  return `${sections.join('\n')}\n`
}

export function appendPromptFeedbackToLedger(ledger, rows) {
  const fresh = rows.filter((row) => !String(ledger).includes(`### ${row.id}\n`))
  if (!fresh.length) return { content: ledger, appended: [] }
  const lines = [String(ledger).trimEnd(), '']
  if (!String(ledger).includes('## 站内反馈记录')) lines.push('## 站内反馈记录', '')
  for (const row of fresh) {
    lines.push(`### ${row.id}`, `- 类型：${row.kind === 'good' ? '正例' : '反例'} · ${PROMPT_FEEDBACK_TYPES[row.promptKey] || row.promptKey}`)
    lines.push(`- 时间：${new Date(row.createdAt).toISOString()}`)
    if (row.sourceUrl) lines.push(`- 来源：${row.sourceUrl}`)
    if (row.context) lines.push('- 原帖语境：', quote(row.context))
    lines.push('- 原文：', quote(row.content))
    lines.push(`- ${row.kind === 'good' ? '好在哪' : '问题'}：`, quote(row.assessment))
    if (row.expected) lines.push('- 期望：', quote(row.expected))
    lines.push('')
  }
  return { content: `${lines.join('\n').trimEnd()}\n`, appended: fresh.map((row) => row.id) }
}
