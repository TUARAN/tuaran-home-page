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
