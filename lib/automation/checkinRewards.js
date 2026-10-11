const DAY_MS = 24 * 60 * 60 * 1000

export const CHECKIN_TIMEZONE_OFFSET_MINUTES = 8 * 60
export const CHECKIN_BONUSES = Object.freeze({ 3: 5, 7: 15 })

/** Sign-in days follow China Standard Time so the public copy and ledger agree. */
export function checkinDayKey(now = Date.now()) {
  const shifted = Number(now) + CHECKIN_TIMEZONE_OFFSET_MINUTES * 60 * 1000
  return new Date(shifted).toISOString().slice(0, 10)
}

export function shiftDayKey(dayKey, amount) {
  const base = Date.parse(`${dayKey}T00:00:00Z`)
  if (!Number.isFinite(base)) return ''
  return new Date(base + Number(amount || 0) * DAY_MS).toISOString().slice(0, 10)
}

/** 补签只开放近七日视图里的过去六天；当天仍应走正常签到。 */
export function canMakeupCheckin(dayKey, today = checkinDayKey()) {
  const target = String(dayKey || '')
  const currentKey = String(today || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(target) || !/^\d{4}-\d{2}-\d{2}$/.test(currentKey)) return false
  const day = Date.parse(`${target}T00:00:00Z`)
  const current = Date.parse(`${currentKey}T00:00:00Z`)
  if (!Number.isFinite(day) || !Number.isFinite(current)) return false
  if (new Date(day).toISOString().slice(0, 10) !== target) return false
  const daysAgo = Math.round((current - day) / DAY_MS)
  return daysAgo >= 1 && daysAgo <= 6
}

export function calculateCheckinStreak(dayKeys, today = checkinDayKey()) {
  const days = new Set((dayKeys || []).map((value) => String(value || '').trim()).filter(Boolean))
  let streak = 0
  while (days.has(shiftDayKey(today, -streak))) streak += 1
  return streak
}

export function rewardForStreak(streak) {
  const n = Math.max(0, Math.trunc(Number(streak) || 0))
  if (!n) return { cycleDay: 0, bonus: 0 }
  const cycleDay = ((n - 1) % 7) + 1
  return { cycleDay, bonus: CHECKIN_BONUSES[cycleDay] || 0 }
}

export function nextCheckinMilestone(streak) {
  const n = Math.max(0, Math.trunc(Number(streak) || 0))
  const cycleDay = n ? ((n - 1) % 7) + 1 : 0
  if (cycleDay < 3) return { day: 3, remaining: 3 - cycleDay, bonus: CHECKIN_BONUSES[3] }
  if (cycleDay < 7) return { day: 7, remaining: 7 - cycleDay, bonus: CHECKIN_BONUSES[7] }
  return { day: 3, remaining: 3, bonus: CHECKIN_BONUSES[3] }
}

export function buildCheckinWeek(dayKeys, today = checkinDayKey()) {
  const checked = new Set((dayKeys || []).map(String))
  return Array.from({ length: 7 }, (_, index) => {
    const day = shiftDayKey(today, index - 6)
    return { day, checked: checked.has(day), today: day === today }
  })
}
