export const PROMPT_VOTE_KEYS = Object.freeze([
  'postNormalPrompt',
  'postPremiumPrompt',
  'postXPrompt',
])

export const PROMPT_VOTE_LABELS = Object.freeze({
  postNormalPrompt: '普通发帖',
  postPremiumPrompt: '精品发帖',
  postXPrompt: 'X主题发帖',
})

const KIND_SET = new Set(['good', 'bad'])
const KEY_SET = new Set(PROMPT_VOTE_KEYS)
const HTTP_URL = /^https?:\/\//u

function cleanLine(value, max) {
  return String(value || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, max)
}

function cleanHandle(value) {
  return String(value || '').replace(/[\u0000-\u001f]/g, '').trim().replace(/^@+/u, '').replace(/\s+/g, '').slice(0, 40)
}

export function voteAccountKey({ accountHandle = '', deviceId = '' } = {}) {
  const handle = cleanHandle(accountHandle)
  if (handle && handle.toLowerCase() !== 'default') return handle
  const device = cleanLine(deviceId, 80)
  return device ? `device:${device}` : ''
}

export function normalizePromptVote(raw) {
  const promptKey = String(raw?.promptKey || '')
  const kind = String(raw?.kind || '')
  const content = cleanLine(raw?.content, 4000)
  const sourceId = cleanLine(raw?.sourceId, 120)
  const accountKey = voteAccountKey(raw)
  const sourceUrl = HTTP_URL.test(String(raw?.sourceUrl || '')) ? cleanLine(raw.sourceUrl, 500) : ''
  if (!KEY_SET.has(promptKey) || !KIND_SET.has(kind) || !content || !sourceId || !accountKey) {
    return { ok: false, error: 'INVALID_VOTE' }
  }
  return {
    ok: true,
    value: {
      accountKey,
      sourceId,
      promptKey,
      kind,
      content,
      topic: cleanLine(raw?.topic, 200),
      sourceLabel: cleanLine(raw?.sourceLabel, 40),
      sourceUrl,
    },
  }
}

export async function recordPromptVote(db, raw, now = Date.now()) {
  const normalized = normalizePromptVote(raw)
  if (!normalized.ok) return normalized
  const vote = normalized.value
  const id = `${vote.accountKey}:${vote.sourceId}`.slice(0, 180)
  await db.prepare(
    `INSERT INTO x_extension_prompt_votes (
       id, account_handle, source_id, prompt_key, kind, content, topic, source_label, source_url, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_handle, source_id) DO UPDATE SET
       prompt_key = excluded.prompt_key,
       kind = excluded.kind,
       content = excluded.content,
       topic = excluded.topic,
       source_label = excluded.source_label,
       source_url = excluded.source_url,
       updated_at = excluded.updated_at`,
  ).bind(
    id,
    vote.accountKey,
    vote.sourceId,
    vote.promptKey,
    vote.kind,
    vote.content,
    vote.topic,
    vote.sourceLabel,
    vote.sourceUrl,
    now,
    now,
  ).run()
  return { ok: true, id, kind: vote.kind, promptKey: vote.promptKey }
}

export async function readPublicPromptVotes(db, { limit = 8 } = {}) {
  const perKind = Math.min(12, Math.max(1, Number(limit) || 8))
  const counts = await db.prepare(
    `SELECT prompt_key AS promptKey, kind, COUNT(*) AS total
       FROM x_extension_prompt_votes
      GROUP BY prompt_key, kind`,
  ).all()
  const recent = await db.prepare(
    `SELECT prompt_key AS promptKey, kind, content, topic, source_label AS sourceLabel, updated_at AS updatedAt
       FROM x_extension_prompt_votes
      ORDER BY updated_at DESC
      LIMIT 80`,
  ).all()
  const groups = {}
  for (const key of PROMPT_VOTE_KEYS) {
    groups[key] = { label: PROMPT_VOTE_LABELS[key], good: 0, bad: 0, items: [] }
  }
  for (const row of counts.results || []) {
    const group = groups[row.promptKey]
    if (!group) continue
    if (row.kind === 'good') group.good = Number(row.total) || 0
    if (row.kind === 'bad') group.bad = Number(row.total) || 0
  }
  for (const row of recent.results || []) {
    const group = groups[row.promptKey]
    if (!group || group.items.length >= perKind) continue
    group.items.push({
      kind: row.kind,
      content: String(row.content || ''),
      topic: String(row.topic || ''),
      sourceLabel: String(row.sourceLabel || ''),
      updatedAt: Number(row.updatedAt) || 0,
    })
  }
  return { ok: true, groups }
}
