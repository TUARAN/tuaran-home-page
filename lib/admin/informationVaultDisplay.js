const TYPE_ORDER = ['apple-id', 'account']

function lineValue(line, prefixes) {
  for (const prefix of prefixes) {
    if (line.startsWith(prefix)) return line.slice(prefix.length).trim()
  }
  const split = line.split(/[:：]/)
  if (split.length > 1) return split.slice(1).join(':').trim()
  return line.trim()
}

/** 从备注行拆出常用人字段，其余并入摘要列。 */
export function parseVaultNotes(notes) {
  const result = {
    recoveryEmail: '',
    emailPassword: '',
    twoFa: '',
    extra: [],
  }
  for (const raw of String(notes || '').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (/^2FA|2fa|秘钥/i.test(line) && /秘钥|2fa/i.test(line)) {
      result.twoFa = lineValue(line, ['2FA 秘钥:', '2FA:', '2fa:'])
      continue
    }
    if (/^(辅助邮箱|注册\/绑定邮箱|注册邮箱)[:：]/.test(line)) {
      result.recoveryEmail = lineValue(line, ['辅助邮箱:', '注册/绑定邮箱:', '注册邮箱:'])
      continue
    }
    if (/^邮箱密码[:：]/.test(line)) {
      result.emailPassword = lineValue(line, ['邮箱密码:'])
      continue
    }
    if (/^提示[:：]/.test(line)) {
      result.extra.push(line.replace(/^提示[:：]\s*/, '提示 · '))
      continue
    }
    result.extra.push(line)
  }
  return result
}

export function securitySummary(answers, revealed) {
  const items = [
    answers.friend ? `朋友 ${answers.friend}` : '',
    answers.work ? `工作 ${answers.work}` : '',
    answers.parents ? `父母 ${answers.parents}` : '',
  ].filter(Boolean)
  if (items.length === 0) return '—'
  if (!revealed) return '••••••'
  return items.join(' · ')
}

export function maskSecret(value, revealed) {
  if (!value) return '—'
  return revealed ? value : '••••••'
}

export const VAULT_TYPE_LABEL = {
  'apple-id': 'Apple ID',
  account: '账号凭证',
}

export function groupVaultRecords(records) {
  const buckets = new Map(TYPE_ORDER.map((type) => [type, []]))
  for (const record of records) {
    const type = record.plain.type === 'apple-id' ? 'apple-id' : 'account'
    if (!buckets.has(type)) buckets.set(type, [])
    buckets.get(type).push(record)
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => {
      const left = (a.plain.label || a.plain.account).localeCompare(b.plain.label || b.plain.account, 'zh-CN')
      if (left !== 0) return left
      return (a.plain.account || '').localeCompare(b.plain.account || '', 'zh-CN')
    })
  }
  return TYPE_ORDER.map((type) => ({ type, records: buckets.get(type) || [] })).filter((group) => group.records.length > 0)
}