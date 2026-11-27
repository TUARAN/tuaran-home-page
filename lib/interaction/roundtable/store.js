import {
  canonicalDailyTopSubject,
  dailyTopSubjectKey,
  DAILY_TOP_SUBJECT,
} from '../dailyTop/model.js'

/** 早期快照，仅矿工阿三；新收录走 by-subject。 */
export const ROUNDTABLE_LEGACY_OBJECT_KEY = 'interaction/roundtable-2026-11-01.json'
export const ROUNDTABLE_BY_SUBJECT_PREFIX = 'interaction/roundtable/by-subject/'

export function roundtableObjectKey(subject = DAILY_TOP_SUBJECT) {
  const canonical = canonicalDailyTopSubject(subject)
  return `${ROUNDTABLE_BY_SUBJECT_PREFIX}${dailyTopSubjectKey(canonical)}/snapshot.json`
}

const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/

export function normalizeRoundtablePerson(person) {
  const handle = String(person?.handle || '').trim()
  const name = typeof person?.name === 'string' ? person.name.trim() : ''
  if (!HANDLE_RE.test(handle) || !name) return null
  const avatar = typeof person?.avatar === 'string' && person.avatar.startsWith('https://') ? person.avatar : null
  return { handle, name, avatar }
}

export function parseRoundtableSnapshot(raw, expectedSubject) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const owner = canonicalDailyTopSubject(raw.owner || expectedSubject)
  const expectedKey = dailyTopSubjectKey(expectedSubject)
  if (dailyTopSubjectKey(owner) !== expectedKey) return null
  const people = (Array.isArray(raw.people) ? raw.people : [])
    .map(normalizeRoundtablePerson)
    .filter(Boolean)
  return {
    capturedAt: raw.capturedAt || null,
    complete: Boolean(raw.complete),
    owner,
    source: raw.source || null,
    sourceType: raw.sourceType || null,
    updatedAt: raw.updatedAt || raw.capturedAt || null,
    count: typeof raw.count === 'number' ? raw.count : people.length,
    avatarCount: typeof raw.avatarCount === 'number' ? raw.avatarCount : null,
    people,
  }
}

export async function readRoundtableSnapshot(mediaBucket, subject) {
  if (!mediaBucket) return null
  const canonical = canonicalDailyTopSubject(subject)
  const primaryKey = roundtableObjectKey(canonical)
  let object = await mediaBucket.get(primaryKey)
  if (!object && dailyTopSubjectKey(canonical) === dailyTopSubjectKey(DAILY_TOP_SUBJECT)) {
    object = await mediaBucket.get(ROUNDTABLE_LEGACY_OBJECT_KEY)
  }
  if (!object) return null
  let parsed
  try {
    parsed = JSON.parse(await object.text())
  } catch {
    return null
  }
  return parseRoundtableSnapshot(parsed, canonical)
}