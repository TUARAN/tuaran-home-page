import { normalizeAgentHandle } from '../agentPool.js'
import { filterDailyTopDays } from '../dailyTop/store.js'

export function aggregateInteractionCounts(dailyTopDays, subject) {
  const totals = new Map()
  for (const day of filterDailyTopDays(dailyTopDays, subject)) {
    for (const row of day.top || []) {
      const key = normalizeAgentHandle(row?.handle).toLowerCase()
      if (!key) continue
      const count = Number(row?.count) || 0
      totals.set(key, (totals.get(key) || 0) + count)
    }
  }
  return totals
}

export function sortRoundtablePeople(people, interactionTotals) {
  const totals = interactionTotals || new Map()
  return [...people].sort((left, right) => {
    const leftCount = totals.get(left.handle.toLowerCase()) || 0
    const rightCount = totals.get(right.handle.toLowerCase()) || 0
    if (rightCount !== leftCount) return rightCount - leftCount
    const byName = left.name.localeCompare(right.name, 'zh-CN')
    if (byName !== 0) return byName
    return left.handle.localeCompare(right.handle)
  }).map((person) => ({
    ...person,
    interactionCount: totals.get(person.handle.toLowerCase()) || 0,
  }))
}