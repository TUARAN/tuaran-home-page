import { readFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'content', 'frontend-weekly')

function readFallback() {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, 'fallback.json'), 'utf8'))
  } catch {
    return {}
  }
}

export function getFrontendWeeklyData() {
  const fallback = readFallback()
  return {
    weekly: fallback.weekly || { updatedAt: null, issues: [] },
    daily: fallback.daily || { latest: '', list: [] },
    live: fallback.live || { updatedAt: null, items: [] },
    dailyEntries: fallback.dailyEntries || {},
  }
}
