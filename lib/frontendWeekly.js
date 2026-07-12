import { readFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'content', 'frontend-weekly')

function readJson(name, fallback) {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8'))
  } catch {
    return fallback
  }
}

export function getFrontendWeeklyData() {
  return {
    weekly: readJson('weekly-index.json', { updatedAt: null, issues: [] }),
    daily: readJson('daily-manifest.json', { latest: '', list: [] }),
    live: readJson('live.json', { updatedAt: null, items: [] }),
  }
}
